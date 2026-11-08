import { Types, type HydratedDocument } from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Customer, type ICustomer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';

async function assertStoreBelongsToAccount(storeId: unknown, dealerAccountId: string): Promise<void> {
  if (storeId === undefined || storeId === null || storeId === '') return;
  if (typeof storeId !== 'string' || !Types.ObjectId.isValid(storeId)) {
    throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  }
  const store = await Store.exists({ _id: storeId, dealerAccountId });
  if (!store) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
}

export async function listCustomers(
  dealerAccountId: string,
  filters: { storeId?: string; search?: string } = {},
) {
  if (filters.storeId) await assertStoreBelongsToAccount(filters.storeId, dealerAccountId);
  const query: Record<string, unknown> = { dealerAccountId };
  const conditions: Record<string, unknown>[] = [];
  if (filters.storeId) conditions.push({ $or: [{ storeId: filters.storeId }, { sharedStoreIds: filters.storeId }] });
  if (filters.search?.trim()) {
    const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(escaped, 'i');
    conditions.push({ $or: [{ name: match }, { email: match }, { phone: match }] });
  }
  if (conditions.length) query.$and = conditions;
  return Customer.find(query).sort({ createdAt: -1 }).lean();
}

export async function shareCustomer(id: string, dealerAccountId: string, storeIds: string[]) {
  const customer = await getCustomerByAccount(id, dealerAccountId);
  const valid = await Store.countDocuments({ _id: { $in: storeIds }, dealerAccountId, active: true });
  if (valid !== new Set(storeIds).size) throw new AppError(400, 'Every shared store must be active and belong to this dealership.', 'INVALID_SHARED_STORE');
  customer.sharedStoreIds = storeIds.filter((storeId) => storeId !== customer.storeId?.toString()).map((storeId) => new Types.ObjectId(storeId));
  await customer.save();
  return customer;
}

export async function createCustomer(
  input: Record<string, unknown>,
  ownerId: string,
  dealerAccountId: string,
) {
  await assertStoreBelongsToAccount(input.storeId, dealerAccountId);
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const mergeMissingDetails = async (existing: HydratedDocument<ICustomer> | null) => {
    if (!existing) return null;
    if (existing.storeId && input.storeId && existing.storeId.toString() !== String(input.storeId)) {
      throw new AppError(409, 'A customer with this email already belongs to another store. Use an approved cross-store sharing workflow.', 'CUSTOMER_IN_ANOTHER_STORE');
    }
    let changed = false;
    for (const field of ['phone', 'notes', 'storeId'] as const) {
      const current = existing.get(field);
      const incoming = input[field];
      if ((current === '' || current === null || current === undefined) && incoming !== undefined && incoming !== '') {
        existing.set(field, incoming);
        changed = true;
      }
    }
    if (changed) await existing.save();
    return existing;
  };

  if (email) {
    const existing = await Customer.findOne({ dealerAccountId, email });
    if (existing) {
      return { customer: (await mergeMissingDetails(existing))!, created: false };
    }
  }
  try {
    const customer = await Customer.create({ ...input, email, ownerId, dealerAccountId });
    return { customer, created: true };
  } catch (error) {
    if (email && typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      const existing = await Customer.findOne({ dealerAccountId, email });
      if (existing) return { customer: (await mergeMissingDetails(existing))!, created: false };
    }
    throw error;
  }
}

export async function getCustomerByAccount(id: string, dealerAccountId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
  const customer = await Customer.findOne({ _id: id, dealerAccountId });
  if (!customer) throw new AppError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
  return customer;
}

export async function updateCustomer(id: string, dealerAccountId: string, input: Record<string, unknown>) {
  if (input.storeId !== undefined) await assertStoreBelongsToAccount(input.storeId, dealerAccountId);
  const customer = await getCustomerByAccount(id, dealerAccountId);
  if (input.storeId !== undefined && String(customer.storeId ?? '') !== String(input.storeId ?? '')) {
    const [hasLeads, hasAppointments] = await Promise.all([
      Lead.exists({ dealerAccountId, customerId: customer._id }),
      Appointment.exists({ dealerAccountId, customerId: customer._id }),
    ]);
    if (hasLeads || hasAppointments) {
      throw new AppError(409, 'A customer with linked leads or appointments cannot be moved to another store.', 'CUSTOMER_HAS_ACTIVITY');
    }
  }
  if (typeof input.email === 'string' && input.email.trim()) {
    const duplicate = await Customer.exists({ _id: { $ne: customer._id }, dealerAccountId, email: input.email.trim().toLowerCase() });
    if (duplicate) throw new AppError(409, 'A customer with this email already exists in your dealership account.', 'DUPLICATE_CUSTOMER');
  }
  Object.assign(customer, input);
  try {
    await customer.save();
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new AppError(409, 'A customer with this email already exists in your dealership account.', 'DUPLICATE_CUSTOMER');
    }
    throw error;
  }
  return customer;
}

export async function deleteCustomer(id: string, dealerAccountId: string) {
  const customer = await getCustomerByAccount(id, dealerAccountId);
  const [hasLeads, hasAppointments] = await Promise.all([
    Lead.exists({ dealerAccountId, customerId: customer._id }),
    Appointment.exists({ dealerAccountId, customerId: customer._id }),
  ]);
  if (hasLeads || hasAppointments) {
    throw new AppError(409, 'A customer with linked leads or appointments cannot be deleted.', 'CUSTOMER_HAS_ACTIVITY');
  }
  await customer.deleteOne();
}
