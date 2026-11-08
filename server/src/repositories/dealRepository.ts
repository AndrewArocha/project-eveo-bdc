import { Types } from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function listDeals(account: string, store: string) {
  if (!Types.ObjectId.isValid(store) || !await Store.exists({ _id: store, dealerAccountId: account })) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  return Deal.find({ dealerAccountId: account, storeId: store }).sort({ createdAt: -1 }).lean();
}
export async function createDeal(input: Record<string, unknown>, userId: string, account: string) {
  const storeId = String(input.storeId);
  if (!Types.ObjectId.isValid(storeId) || !await Store.exists({ _id: storeId, dealerAccountId: account })) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  if (!await User.exists({ _id: input.assignedStoreUserId, dealerAccountId: account, active: true, storeIds: storeId })) throw new AppError(400, 'The assigned employee must be active and belong to this store.', 'INVALID_ASSIGNMENT');
  for (const [model, id, label] of [[Customer, input.customerId, 'Customer'], [Lead, input.leadId, 'Lead'], [Appointment, input.appointmentId, 'Appointment'], [InventoryVehicle, input.inventoryVehicleId, 'Inventory vehicle']] as const) {
    if (id && !await model.exists({ _id: id, dealerAccountId: account, storeId })) throw new AppError(400, `${label} must belong to this store.`, 'DEAL_LINK_INVALID');
  }
  return Deal.create({ ...input, dealerAccountId: account, createdByUserId: userId, statusHistory: [{ fromStatus: '', toStatus: 'pending', actorUserId: userId }] });
}
export async function setDealStatus(id: string, account: string, storeId: string, status: string, note: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Deal not found.', 'DEAL_NOT_FOUND');
  const deal = await Deal.findOne({ _id: id, dealerAccountId: account, storeId });
  if (!deal) throw new AppError(404, 'Deal not found.', 'DEAL_NOT_FOUND');
  const transitions: Record<string, string[]> = { pending: ['negotiation', 'sold', 'cancelled'], negotiation: ['sold', 'cancelled'], sold: ['delivered', 'reversed'], delivered: ['reversed'], cancelled: [], reversed: [] };
  if (status !== deal.status && !transitions[deal.status]?.includes(status)) throw new AppError(409, 'This deal status transition is not allowed.', 'DEAL_TRANSITION_INVALID');
  const current = deal.status;
  deal.status = status as typeof deal.status;
  if (status === 'sold' && !deal.soldAt) deal.soldAt = new Date();
  if (status === 'delivered' && !deal.deliveredAt) { deal.deliveredAt = new Date(); if (!deal.soldAt) deal.soldAt = new Date(); }
  deal.statusHistory.push({ fromStatus: current, toStatus: status as typeof deal.status, actorUserId: userId, note });
  await deal.save();
  if (deal.inventoryVehicleId) {
    const inventoryStatus = status === 'sold' ? 'SOLD' : status === 'delivered' ? 'DELIVERED' : ['cancelled', 'reversed'].includes(status) ? 'PENDING' : undefined;
    if (inventoryStatus) await InventoryVehicle.updateOne({ _id: deal.inventoryVehicleId, dealerAccountId: account, storeId }, { $set: { status: inventoryStatus } });
  }
  if (status === 'sold' || status === 'delivered') {
    if (deal.leadId) await Lead.updateOne({ _id: deal.leadId, dealerAccountId: account, storeId }, { $set: { status: 'converted' }, $push: { statusHistory: { kind: 'status', nextValue: 'converted', changedByUserId: userId } } });
    if (deal.appointmentId) await Appointment.updateOne({ _id: deal.appointmentId, dealerAccountId: account, storeId }, { $set: { status: 'sold' }, $push: { statusHistory: { kind: 'status', nextValue: 'sold', changedByUserId: userId } } });
  }
  return deal;
}
