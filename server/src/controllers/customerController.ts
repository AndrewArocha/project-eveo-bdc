import type { RequestHandler } from 'express';
import {
  createCustomer,
  deleteCustomer,
  getCustomerByAccount,
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
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : undefined;
  const search = typeof request.query.search === 'string' ? request.query.search : undefined;
  const customers = await listCustomers(request.auth!.dealerAccountId, { storeId, search });
  response.json({ data: customers });
});

export const createOwnCustomer: RequestHandler = asyncHandler(async (request, response) => {
  const result = await createCustomer(request.body, request.auth!.userId, request.auth!.dealerAccountId);
  response.status(result.created ? 201 : 200).json({ data: { ...result.customer.toObject(), duplicate: !result.created } });
});

export const getOwnCustomer: RequestHandler = asyncHandler(async (request, response) => {
  const customer = await getCustomerByAccount(customerId(request), request.auth!.dealerAccountId);
  response.json({ data: customer });
});

export const updateOwnCustomer: RequestHandler = asyncHandler(async (request, response) => {
  const customer = await updateCustomer(customerId(request), request.auth!.dealerAccountId, request.body);
  response.json({ data: customer });
});

export const deleteOwnCustomer: RequestHandler = asyncHandler(async (request, response) => {
  await deleteCustomer(customerId(request), request.auth!.dealerAccountId);
  response.status(204).end();
});
