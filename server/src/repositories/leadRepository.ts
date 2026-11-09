import { Types } from 'mongoose';
import { Customer } from '../models/Customer.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { recordActivityEventSafely } from '../services/activityEventService.js';
import { AppError } from '../utils/AppError.js';

async function assertStore(storeId: string, dealerAccountId: string) {
  if (!Types.ObjectId.isValid(storeId) || !(await Store.exists({ _id: storeId, dealerAccountId }))) {
    throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  }
}

async function assertStoreRecord(model: typeof Customer | typeof InventoryVehicle, id: unknown, storeId: string, dealerAccountId: string, label: string) {
  if (id === undefined) return;
  const filter = model === Customer ? { _id: id, dealerAccountId, $or: [{ storeId }, { sharedStoreIds: storeId }] } : { _id: id, storeId, dealerAccountId };
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id) || !(await model.exists(filter))) {
    throw new AppError(400, `${label} must belong to the selected store.`, `INVALID_${label.toUpperCase().replaceAll(' ', '_')}`);
  }
}

export async function listLeads(dealerAccountId: string, storeId: string) {
  await assertStore(storeId, dealerAccountId);
  return Lead.find({ dealerAccountId, storeId }).sort({ createdAt: -1 }).lean();
}

export async function createLead(input: Record<string, unknown>, userId: string, dealerAccountId: string) {
  const storeId = String(input.storeId);
  await assertStore(storeId, dealerAccountId);
  await assertStoreRecord(Customer, input.customerId, storeId, dealerAccountId, 'Customer');
  await assertStoreRecord(InventoryVehicle, input.inventoryVehicleId, storeId, dealerAccountId, 'Inventory vehicle');
  for (const assignedId of [input.assignedPlatformUserId, input.assignedStoreUserId].filter((value): value is string => typeof value === 'string')) {
    if (!await User.exists({ _id: assignedId, dealerAccountId, active: true, storeIds: storeId })) throw new AppError(400, 'Assigned employee must be active and belong to this store.', 'INVALID_ASSIGNMENT');
  }
  const lead = await Lead.create({ ...input, dealerAccountId, createdByUserId: userId });
  lead.statusHistory.push({ kind: 'status', previousValue: '', nextValue: 'new', changedByUserId: userId, changedAt: new Date() });
  await lead.save();
  await recordActivityEventSafely({
    dealerAccountId, storeId, userId, category: 'lead', title: `New lead added • ${lead.customerNameSnapshot}`,
    description: [lead.vehicleOfInterest, lead.source].filter(Boolean).join(' · '), entityType: 'lead', entityId: lead.id,
  });
  return lead;
}

export async function updateLead(id: string, dealerAccountId: string, storeId: string, input: Record<string, unknown>, userId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Lead not found.', 'LEAD_NOT_FOUND');
  const lead = await Lead.findOne({ _id: id, dealerAccountId, storeId });
  if (!lead) throw new AppError(404, 'Lead not found.', 'LEAD_NOT_FOUND');
  if (input.status && input.status !== lead.status) lead.statusHistory.push({ kind: 'status', previousValue: lead.status, nextValue: String(input.status), changedByUserId: userId, changedAt: new Date() });
  for (const field of ['assignedPlatformUserId', 'assignedStoreUserId'] as const) {
    if (field in input && input[field] && !await User.exists({ _id: input[field], dealerAccountId, active: true, storeIds: storeId })) throw new AppError(400, 'Assigned employee must be active and belong to this store.', 'INVALID_ASSIGNMENT');
    if (field in input && String(lead[field] ?? '') !== String(input[field] ?? '')) lead.statusHistory.push({ kind: 'assignment', previousValue: String(lead[field] ?? ''), nextValue: String(input[field] ?? ''), changedByUserId: userId, changedAt: new Date() });
  }
  if (input.status) lead.status = input.status as typeof lead.status;
  if ('assignedPlatformUserId' in input) lead.assignedPlatformUserId = input.assignedPlatformUserId as typeof lead.assignedPlatformUserId;
  if ('assignedStoreUserId' in input) lead.assignedStoreUserId = input.assignedStoreUserId as typeof lead.assignedStoreUserId;
  if (typeof input.notes === 'string') lead.notes = input.notes;
  await lead.save();
  await recordActivityEventSafely({
    dealerAccountId, storeId, userId, category: 'lead', title: `Lead updated • ${lead.customerNameSnapshot}`,
    description: input.status ? `Status changed to ${String(input.status).replaceAll('_', ' ')}.` : 'Lead assignment or notes updated.',
    entityType: 'lead', entityId: lead.id,
  });
  return lead;
}
