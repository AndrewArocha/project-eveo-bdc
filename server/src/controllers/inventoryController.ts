import type { Request, RequestHandler } from 'express';
import {
  createInventoryVehicle,
  getInventoryVehicle,
  listInventoryVehicles,
  recordInventoryObservation,
  resolveInventoryDiscrepancy,
  updateInventoryVehicle,
} from '../repositories/inventoryRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function routeId(request: Request, key: string): string {
  const value = request.params[key];
  if (typeof value !== 'string') throw new AppError(404, 'Inventory vehicle not found.', 'INVENTORY_NOT_FOUND');
  return value;
}

export const listOwnInventory: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  const status = typeof request.query.status === 'string' ? request.query.status : undefined;
  if (status && !['READY_FOR_SALE', 'PENDING', 'SOLD', 'DELIVERED'].includes(status)) {
    throw new AppError(400, 'Choose a supported inventory status.', 'INVALID_STATUS');
  }
  const search = typeof request.query.search === 'string' ? request.query.search : undefined;
  const vehicles = await listInventoryVehicles(request.auth!.dealerAccountId, { storeId, status, search });
  response.json({ data: vehicles });
});

export const createOwnInventoryVehicle: RequestHandler = asyncHandler(async (request, response) => {
  const result = await createInventoryVehicle(request.auth!.dealerAccountId, request.body);
  response.status(result.created ? 201 : 200).json({ data: { ...result.vehicle.toObject(), duplicate: !result.created } });
});

export const getOwnInventoryVehicle: RequestHandler = asyncHandler(async (request, response) => {
  const vehicle = await getInventoryVehicle(routeId(request, 'id'), request.auth!.dealerAccountId);
  response.json({ data: vehicle });
});

export const updateOwnInventoryVehicle: RequestHandler = asyncHandler(async (request, response) => {
  const vehicle = await updateInventoryVehicle(routeId(request, 'id'), request.auth!.dealerAccountId, request.body);
  response.json({ data: vehicle });
});

export const observeOwnInventoryVehicle: RequestHandler = asyncHandler(async (request, response) => {
  const result = await recordInventoryObservation(
    routeId(request, 'id'),
    request.auth!.dealerAccountId,
    request.auth!.userId,
    request.body,
  );
  response.status(201).json({ data: result.vehicle });
});

export const resolveOwnInventoryDiscrepancy: RequestHandler = asyncHandler(async (request, response) => {
  const vehicle = await resolveInventoryDiscrepancy(
    routeId(request, 'id'),
    routeId(request, 'discrepancyId'),
    request.auth!.dealerAccountId,
    request.auth!.userId,
    request.body,
  );
  response.json({ data: vehicle });
});
