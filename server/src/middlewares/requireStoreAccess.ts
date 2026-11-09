import type { RequestHandler } from 'express';
import { Types, type Model } from 'mongoose';
import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

type StoreScopedModel = Pick<Model<unknown>, 'findOne'>;

export function requireStoreAccess(model?: StoreScopedModel, personalRecord = false): RequestHandler {
  return asyncHandler(async (request, _response, next) => {
    const auth = request.auth;
    if (!auth) throw new AppError(401, 'A valid sign-in is required.', 'UNAUTHORIZED');

    const requestedStoreId = typeof request.query.storeId === 'string' ? request.query.storeId
      : typeof request.body?.storeId === 'string' ? request.body.storeId
        : '';
    let recordStoreId = '';
    if (model && typeof request.params.id === 'string') {
      if (!Types.ObjectId.isValid(request.params.id)) throw new AppError(404, 'Record not found.', 'NOT_FOUND');
      const record = await model.findOne({ _id: request.params.id, dealerAccountId: auth.dealerAccountId })
        .select('storeId sharedStoreIds ownerId').lean() as { storeId?: Types.ObjectId | string; sharedStoreIds?: Array<Types.ObjectId | string>; ownerId?: Types.ObjectId } | null;
      if (personalRecord && (record ? record.ownerId?.toString() !== auth.userId : request.method === 'DELETE')) {
        throw new AppError(403, 'You can only change customer records you own.', 'CUSTOMER_OWNERSHIP_REQUIRED');
      }
      if (personalRecord && !record) throw new AppError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
      recordStoreId = record?.storeId?.toString() || '';
      if (requestedStoreId && recordStoreId && requestedStoreId !== recordStoreId &&
        !record?.sharedStoreIds?.some((id) => id.toString() === requestedStoreId)) {
        throw new AppError(404, 'Record not found.', 'NOT_FOUND');
      }
    }
    const destinationStoreId = personalRecord && typeof request.body?.storeId === 'string' ? request.body.storeId : '';
    const storeIds = [...new Set([requestedStoreId, recordStoreId, destinationStoreId].filter(Boolean))];
    if (storeIds.length === 0) throw new AppError(400, 'A storeId is required.', 'STORE_REQUIRED');
    for (const storeId of storeIds) {
      if (!Types.ObjectId.isValid(storeId)) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
      if (!await Store.exists({ _id: storeId, dealerAccountId: auth.dealerAccountId })) {
        throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
      }
      if (auth.role !== 'owner' && !auth.storeIds.includes(storeId)) {
        throw new AppError(403, 'You do not have access to this store.', 'STORE_ACCESS_DENIED');
      }
    }
    next();
  });
}
