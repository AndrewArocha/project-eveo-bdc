import { Types } from 'mongoose';
import { Customer } from '../models/Customer.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';

async function assertStore(storeId: string, dealerAccountId: string) {
  if (!Types.ObjectId.isValid(storeId) || !(await Store.exists({ _id: storeId, dealerAccountId }))) {
    throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  }
}

async function assertStoreRecord(model: typeof Customer | typeof InventoryVehicle, id: unknown, storeId: string, dealerAccountId: string, label: string) {
  if (id === undefined) return;
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id) || !(await model.exists({ _id: id, storeId, dealerAccountId }))) {
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
  return Lead.create({ ...input, dealerAccountId, createdByUserId: userId });
}
