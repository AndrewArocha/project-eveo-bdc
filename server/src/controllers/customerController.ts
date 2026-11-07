import type { RequestHandler } from 'express';
import {
  createCustomer,
  deleteCustomer,
  getCustomerByOwner,
  listCustomers,
  updateCustomer,
} from '../repositories/customerRepository.js';
import type { Request } from 'express';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function customerId(request: Request): string {
  const id = request.params.id;
  if (typeof id !== 'string') throw new AppError(404, 'Customer not found.');
  return id;
}

export const listOwnCustomers: RequestHandler = asyncHandler(async (request, response) => {
  const customers = await listCustomers(request.auth!.userId);
  response.json({ data: customers });
});

export const createOwnCustomer: RequestHandler = asyncHandler(async (request, response) => {
  const customer = await createCustomer(request.body, request.auth!.userId, request.auth!.dealerAccountId);
  response.status(201).json({ data: customer });
});

export const getOwnCustomer: RequestHandler = asyncHandler(async (request, response) => {
  const customer = await getCustomerByOwner(customerId(request), request.auth!.userId);
  response.json({ data: customer });
});

export const updateOwnCustomer: RequestHandler = asyncHandler(async (request, response) => {
  const customer = await updateCustomer(customerId(request), request.auth!.userId, request.body);
  response.json({ data: customer });
});

export const deleteOwnCustomer: RequestHandler = asyncHandler(async (request, response) => {
  await deleteCustomer(customerId(request), request.auth!.userId);
  response.status(204).end();
});
