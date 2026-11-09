import type { Request, RequestHandler } from 'express';
import { createAppointment, listAppointments, updateAppointmentDetails, updateAppointmentStatus } from '../repositories/appointmentRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function routeId(request: Request): string {
  const id = request.params.id;
  if (typeof id !== 'string') throw new AppError(404, 'Appointment not found.', 'APPOINTMENT_NOT_FOUND');
  return id;
}

export const listOwnAppointments: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  response.json({ data: await listAppointments(request.auth!.dealerAccountId, storeId) });
});

export const createOwnAppointment: RequestHandler = asyncHandler(async (request, response) => {
  const appointment = await createAppointment(request.body, request.auth!.userId, request.auth!.dealerAccountId);
  response.status(201).json({ data: appointment });
});

export const updateOwnAppointmentStatus: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  const appointment = await updateAppointmentStatus(routeId(request), request.auth!.dealerAccountId, storeId, request.body.status, request.auth!.userId);
  response.json({ data: appointment });
});

export const updateOwnAppointmentDetails: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  const appointment = await updateAppointmentDetails(routeId(request), request.auth!.dealerAccountId, storeId, request.body, request.auth!.userId);
  response.json({ data: appointment });
});
