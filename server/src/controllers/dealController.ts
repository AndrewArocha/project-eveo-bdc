import type { RequestHandler } from 'express';
import { createDeal, listDeals, setDealStatus } from '../repositories/dealRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listOwnDeals: RequestHandler = asyncHandler(async (req, res) => { const storeId = String(req.query.storeId || ''); if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED'); res.json({ data: await listDeals(req.auth!.dealerAccountId, storeId) }); });
export const createOwnDeal: RequestHandler = asyncHandler(async (req, res) => { res.status(201).json({ data: await createDeal(req.body, req.auth!.userId, req.auth!.dealerAccountId) }); });
export const updateOwnDealStatus: RequestHandler = asyncHandler(async (req, res) => { const storeId = String(req.query.storeId || ''); if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED'); res.json({ data: await setDealStatus(String(req.params.id), req.auth!.dealerAccountId, storeId, req.body.status, req.body.note || '', req.auth!.userId) }); });
