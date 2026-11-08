import { Types } from 'mongoose';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';

const OBSERVABLE_FIELDS = [
  'stockNumber', 'vehicle', 'make', 'model', 'trim', 'modelYear', 'mileage', 'price', 'condition', 'status',
] as const;
type ObservableField = (typeof OBSERVABLE_FIELDS)[number];
type ObservationValues = Partial<Record<ObservableField, string | number | null>>;

async function assertStoreBelongsToAccount(storeId: string, dealerAccountId: string): Promise<void> {
  if (!Types.ObjectId.isValid(storeId)) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  const store = await Store.exists({ _id: storeId, dealerAccountId });
  if (!store) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listInventoryVehicles(
  dealerAccountId: string,
  filters: { storeId: string; status?: string; search?: string },
) {
  await assertStoreBelongsToAccount(filters.storeId, dealerAccountId);
  const query: Record<string, unknown> = { dealerAccountId, storeId: filters.storeId };
  if (filters.status) query.status = filters.status;
  if (filters.search?.trim()) {
    const match = new RegExp(escapeRegex(filters.search.trim()), 'i');
    query.$or = [{ vin: match }, { stockNumber: match }, { vehicle: match }, { make: match }, { model: match }];
  }
  return InventoryVehicle.find(query).sort({ updatedAt: -1 }).lean();
}

export async function createInventoryVehicle(
  dealerAccountId: string,
  input: Record<string, unknown> & { storeId: string; vin: string },
) {
  await assertStoreBelongsToAccount(input.storeId, dealerAccountId);
  const vin = input.vin.toUpperCase();
  const existing = await InventoryVehicle.findOne({ dealerAccountId, vin });
  if (existing) {
    if (existing.storeId.toString() !== input.storeId) {
      throw new AppError(409, 'This VIN is already registered at another store in your dealership account.', 'VIN_EXISTS_IN_ANOTHER_STORE');
    }
    return { vehicle: existing, created: false };
  }
  try {
    const vehicle = await InventoryVehicle.create({ ...input, vin, dealerAccountId });
    return { vehicle, created: true };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      const duplicate = await InventoryVehicle.findOne({ dealerAccountId, vin });
      if (duplicate) {
        if (duplicate.storeId.toString() !== input.storeId) {
          throw new AppError(409, 'This VIN is already registered at another store in your dealership account.', 'VIN_EXISTS_IN_ANOTHER_STORE');
        }
        return { vehicle: duplicate, created: false };
      }
    }
    throw error;
  }
}

export async function getInventoryVehicle(id: string, dealerAccountId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Inventory vehicle not found.', 'INVENTORY_NOT_FOUND');
  const vehicle = await InventoryVehicle.findOne({ _id: id, dealerAccountId });
  if (!vehicle) throw new AppError(404, 'Inventory vehicle not found.', 'INVENTORY_NOT_FOUND');
  return vehicle;
}

export async function updateInventoryVehicle(id: string, dealerAccountId: string, input: Record<string, unknown>) {
  const vehicle = await getInventoryVehicle(id, dealerAccountId);
  Object.assign(vehicle, input);
  await vehicle.save();
  return vehicle;
}

export async function recordInventoryObservation(
  id: string,
  dealerAccountId: string,
  userId: string,
  input: { source: string; values: ObservationValues },
) {
  const vehicle = await getInventoryVehicle(id, dealerAccountId);
  const values = input.values;
  vehicle.sourceObservations.push({ source: input.source, observedBy: new Types.ObjectId(userId), values, observedAt: new Date() });
  const mutable = vehicle as unknown as Record<string, unknown>;

  for (const field of OBSERVABLE_FIELDS) {
    const observedValue = values[field];
    if (observedValue === undefined) continue;
    const currentValue = mutable[field];
    if (currentValue === undefined || currentValue === null || currentValue === '') {
      mutable[field] = observedValue;
      continue;
    }
    if (currentValue === observedValue) continue;
    const sameOpenConflict = vehicle.discrepancies.some((item) =>
      item.status === 'open' && item.field === field && String(item.observedValue) === String(observedValue));
    if (!sameOpenConflict) {
      vehicle.discrepancies.push({ field, currentValue, observedValue, source: input.source, status: 'open' });
    }
  }

  vehicle.updatedAt = new Date();
  await vehicle.save();
  return { vehicle, observedBy: userId };
}

export async function resolveInventoryDiscrepancy(
  id: string,
  discrepancyId: string,
  dealerAccountId: string,
  userId: string,
  input: { resolution: 'accepted_source' | 'kept_current' | 'custom'; value?: string | number | null },
) {
  const vehicle = await getInventoryVehicle(id, dealerAccountId);
  const discrepancy = vehicle.discrepancies.find((item) => item.id === discrepancyId);
  if (!discrepancy || discrepancy.status !== 'open') {
    throw new AppError(404, 'Open inventory discrepancy not found.', 'DISCREPANCY_NOT_FOUND');
  }

  if (input.resolution === 'accepted_source' || input.resolution === 'custom') {
    const nextValue = input.resolution === 'accepted_source' ? discrepancy.observedValue : input.value;
    if (nextValue === undefined) throw new AppError(400, 'A resolved value is required.', 'INVALID_RESOLUTION');
    const numericFields = new Set(['modelYear', 'mileage', 'price']);
    if (input.resolution === 'custom' && (numericFields.has(discrepancy.field) ? (typeof nextValue !== 'number' && nextValue !== null) : (typeof nextValue !== 'string' && nextValue !== null))) {
      throw new AppError(400, 'The resolved value does not match the inventory field type.', 'INVALID_RESOLUTION');
    }
    if (input.resolution === 'custom' && discrepancy.field === 'status' && !['READY_FOR_SALE', 'PENDING', 'DELIVERED'].includes(String(nextValue))) {
      throw new AppError(400, 'Choose a supported inventory status.', 'INVALID_RESOLUTION');
    }
    if (input.resolution === 'custom' && discrepancy.field === 'condition' && !['NEW', 'USED', 'CERTIFIED_PRE_OWNED'].includes(String(nextValue))) {
      throw new AppError(400, 'Choose a supported vehicle condition.', 'INVALID_RESOLUTION');
    }
    (vehicle as unknown as Record<string, unknown>)[discrepancy.field] = nextValue;
    discrepancy.resolvedValue = nextValue;
  } else {
    discrepancy.resolvedValue = discrepancy.currentValue;
  }

  discrepancy.status = 'resolved';
  discrepancy.resolution = input.resolution;
  discrepancy.resolvedBy = new Types.ObjectId(userId);
  discrepancy.resolvedAt = new Date();
  vehicle.updatedAt = new Date();
  await vehicle.save();
  return vehicle;
}
