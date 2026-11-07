import { Types } from 'mongoose';
import { Customer } from '../models/Customer.js';
import { AppError } from '../utils/AppError.js';

export async function listCustomers(ownerId: string) {
  return Customer.find({ ownerId }).sort({ createdAt: -1 }).lean();
}

export async function createCustomer(input: Record<string, unknown>, ownerId: string, dealerAccountId: string) {
  return Customer.create({ ...input, ownerId, dealerAccountId });
}

export async function getCustomerByOwner(id: string, ownerId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Customer not found.');
  const customer = await Customer.findById(id);
  if (!customer) throw new AppError(404, 'Customer not found.');
  if (customer.ownerId.toString() !== ownerId) throw new AppError(403, 'You do not have access to this customer.');
  return customer;
}

export async function updateCustomer(id: string, ownerId: string, input: Record<string, unknown>) {
  const customer = await getCustomerByOwner(id, ownerId);
  Object.assign(customer, input);
  await customer.save();
  return customer;
}

export async function deleteCustomer(id: string, ownerId: string) {
  const customer = await getCustomerByOwner(id, ownerId);
  await customer.deleteOne();
}
