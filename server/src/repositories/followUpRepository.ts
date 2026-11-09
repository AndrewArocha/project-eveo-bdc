import { Types } from 'mongoose';
import { Customer } from '../models/Customer.js';
import { FollowUp } from '../models/FollowUp.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
export async function listFollowUps(account: string, storeId: string) {
  if (!Types.ObjectId.isValid(storeId) || !await Store.exists({ _id: storeId, dealerAccountId: account })) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  return FollowUp.find({ dealerAccountId: account, storeId }).sort({ status: 1, dueAt: 1 }).lean();
}
export async function createFollowUp(input: Record<string, unknown>, userId: string, account: string) {
  const storeId = String(input.storeId);
  if (!await User.exists({ _id: input.assignedStoreUserId, dealerAccountId: account, active: true, storeIds: storeId })) throw new AppError(400, 'The assigned employee must be active and belong to this store.', 'INVALID_ASSIGNMENT');
  if (!await Customer.exists({ _id: input.customerId, dealerAccountId: account, $or: [{ storeId }, { sharedStoreIds: storeId }] })) throw new AppError(400, 'Customer must be accessible from this store.', 'CUSTOMER_NOT_SHARED');
  if (input.leadId && !await Lead.exists({ _id: input.leadId, dealerAccountId: account, storeId })) throw new AppError(400, 'Lead must belong to this store.', 'LEAD_NOT_FOUND');
  return FollowUp.create({ ...input, dealerAccountId: account, createdByUserId: userId });
}
export async function setFollowUpStatus(id: string, account: string, storeId: string, status: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Follow-up not found.', 'FOLLOWUP_NOT_FOUND');
  const row = await FollowUp.findOne({ _id: id, dealerAccountId: account, storeId });
  if (!row) throw new AppError(404, 'Follow-up not found.', 'FOLLOWUP_NOT_FOUND');
  row.status = status as typeof row.status;
  row.completedAt = status === 'completed' ? new Date() : null;
  await row.save(); return row;
}
