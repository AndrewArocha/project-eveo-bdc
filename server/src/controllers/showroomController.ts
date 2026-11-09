import type { Request, RequestHandler } from 'express';
import { appendShowroomEvent, assignShowroomVisit, createActivityEvent, createShowroomVisit, getShowroomVisit, listActivityEvents, listShowroomVisits } from '../repositories/showroomRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function visitId(request: Request) {
  const id = request.params.id;
  if (typeof id !== 'string') throw new AppError(404, 'Showroom visit not found.', 'SHOWROOM_VISIT_NOT_FOUND');
  return id;
}
function requiredStoreId(request: Request) {
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  return storeId;
}

export const listOwnShowroomVisits: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : String(request.body?.storeId || '');
  if (!storeId) throw new AppError(400, 'A storeId is required.', 'STORE_REQUIRED');
  response.json({ data: await listShowroomVisits(request.auth!.dealerAccountId, storeId) });
});
export const getOwnShowroomVisit: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: await getShowroomVisit(visitId(request), request.auth!.dealerAccountId, requiredStoreId(request)) });
});
export const createOwnShowroomVisit: RequestHandler = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await createShowroomVisit(request.body, request.auth!.userId, request.auth!.dealerAccountId) });
});
export const appendOwnShowroomEvent: RequestHandler = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await appendShowroomEvent(visitId(request), request.auth!.dealerAccountId, requiredStoreId(request), request.auth!.userId, request.body) });
});
export const assignOwnShowroomVisit: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: await assignShowroomVisit(visitId(request), request.auth!.dealerAccountId, requiredStoreId(request), request.auth!.userId, request.body.assignedUserId) });
});
export const listOwnActivityEvents: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: await listActivityEvents(request.auth!.dealerAccountId, requiredStoreId(request)) });
});
export const createOwnActivityEvent: RequestHandler = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await createActivityEvent(request.body, request.auth!.userId, request.auth!.dealerAccountId) });
});
