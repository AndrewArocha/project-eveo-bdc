import { Types } from 'mongoose';
import { Customer } from '../models/Customer.js';
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
  if (filters.storeId) query.storeId = filters.storeId;
  if (filters.search?.trim()) {
    const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(escaped, 'i');
    query.$or = [{ name: match }, { email: match }, { phone: match }];
  }
  return Customer.find(query).sort({ createdAt: -1 }).lean();
}

export async function createCustomer(
  input: Record<string, unknown>,
  ownerId: string,
  dealerAccountId: string,
) {
  await assertStoreBelongsToAccount(input.storeId, dealerAccountId);
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (email) {
    const existing = await Customer.findOne({ dealerAccountId, email });
    if (existing) {
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
      return { customer: existing, created: false };
    }
  }
  try {
    const customer = await Customer.create({ ...input, email, ownerId, dealerAccountId });
    return { customer, created: true };
  } catch (error) {
    if (email && typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      const existing = await Customer.findOne({ dealerAccountId, email });
      if (existing) return { customer: existing, created: false };
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
  await customer.deleteOne();
}
