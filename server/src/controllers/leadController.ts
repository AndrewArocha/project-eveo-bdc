import type { RequestHandler } from 'express';
import { createLead, listLeads } from '../repositories/leadRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listOwnLeads: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  response.json({ data: await listLeads(request.auth!.dealerAccountId, storeId) });
});

export const createOwnLead: RequestHandler = asyncHandler(async (request, response) => {
  const lead = await createLead(request.body, request.auth!.userId, request.auth!.dealerAccountId);
  response.status(201).json({ data: lead });
});
