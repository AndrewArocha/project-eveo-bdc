import type { Request, RequestHandler } from 'express';
import { listIntegrationConnections, saveIntegrationConnection, setIntegrationStatus } from '../repositories/integrationRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function assertOwner(request: Request) {
  if (request.auth?.role !== 'owner') throw new AppError(403, 'Only the dealership owner can manage integrations.', 'FORBIDDEN');
}

export const listOwnIntegrations: RequestHandler = asyncHandler(async (request, response) => {
  assertOwner(request);
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  response.json({ data: await listIntegrationConnections(request.auth!.dealerAccountId, storeId) });
});

export const saveOwnIntegration: RequestHandler = asyncHandler(async (request, response) => {
  assertOwner(request);
  response.status(200).json({ data: await saveIntegrationConnection(request.body, request.auth!.dealerAccountId, request.auth!.userId) });
});

export const disableOwnIntegration: RequestHandler = asyncHandler(async (request, response) => {
  assertOwner(request);
  const id = request.params.id;
  if (typeof id !== 'string') throw new AppError(404, 'Integration not found.', 'INTEGRATION_NOT_FOUND');
  response.json({ data: await setIntegrationStatus(id, request.auth!.dealerAccountId, 'disabled') });
});
