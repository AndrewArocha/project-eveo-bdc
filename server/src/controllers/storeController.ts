import type { Request, RequestHandler } from 'express';
import { Types } from 'mongoose';
import { createStoreForDealerAccount, listStoresForDealerAccount, updateStoreForDealerAccount } from '../repositories/storeRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function dealerAccountId(request: Request): string {
  const id = request.auth?.dealerAccountId;
  if (!id) throw new AppError(401, 'A valid sign-in is required.', 'UNAUTHORIZED');
  return id;
}

function assertOwner(request: Request): void {
  if (request.auth?.role !== 'owner') {
    throw new AppError(403, 'Only the dealership owner can manage stores.', 'FORBIDDEN');
  }
}

function toStoreResponse(store: {
  _id: Types.ObjectId;
  name: string;
  code: string;
  website?: string;
  phone?: string;
  address?: string;
  timezone: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: store._id.toString(),
    name: store.name,
    code: store.code,
    website: store.website ?? '',
    phone: store.phone ?? '',
    address: store.address ?? '',
    timezone: store.timezone,
    active: store.active,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

export const listOwnStores: RequestHandler = asyncHandler(async (request, response) => {
  const stores = await listStoresForDealerAccount(dealerAccountId(request), request.auth!.role, request.auth!.storeIds);
  response.json({ data: stores.map(toStoreResponse) });
});

export const createOwnStore: RequestHandler = asyncHandler(async (request, response) => {
  assertOwner(request);
  const store = await createStoreForDealerAccount(dealerAccountId(request), request.body);
  response.status(201).json({ data: toStoreResponse(store) });
});

export const updateOwnStore: RequestHandler = asyncHandler(async (request, response) => {
  assertOwner(request);
  const storeId = request.params.id;
  if (typeof storeId !== 'string' || !Types.ObjectId.isValid(storeId)) {
    throw new AppError(404, 'Store not found.', 'NOT_FOUND');
  }

  const store = await updateStoreForDealerAccount(dealerAccountId(request), storeId, request.body);
  if (!store) throw new AppError(404, 'Store not found.', 'NOT_FOUND');
  response.json({ data: toStoreResponse(store) });
});
