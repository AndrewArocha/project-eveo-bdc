import type { RequestHandler } from 'express';
import { createFollowUp, listFollowUps, setFollowUpStatus } from '../repositories/followUpRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listOwnFollowUps: RequestHandler = asyncHandler(async (req, res) => { const storeId = String(req.query.storeId || ''); if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED'); res.json({ data: await listFollowUps(req.auth!.dealerAccountId, storeId) }); });
export const createOwnFollowUp: RequestHandler = asyncHandler(async (req, res) => { res.status(201).json({ data: await createFollowUp(req.body, req.auth!.userId, req.auth!.dealerAccountId) }); });
export const updateOwnFollowUp: RequestHandler = asyncHandler(async (req, res) => { const storeId = String(req.query.storeId || ''); if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED'); res.json({ data: await setFollowUpStatus(String(req.params.id), req.auth!.dealerAccountId, storeId, req.body.status) }); });
