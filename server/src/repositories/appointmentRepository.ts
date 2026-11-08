import { Types } from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Customer } from '../models/Customer.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';

async function assertStore(storeId: string, dealerAccountId: string) {
  if (!Types.ObjectId.isValid(storeId) || !(await Store.exists({ _id: storeId, dealerAccountId }))) {
    throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  }
}

async function assertSameStore(model: typeof Customer | typeof Lead | typeof InventoryVehicle, id: unknown, storeId: string, dealerAccountId: string, label: string) {
  if (id === undefined) return;
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id) || !(await model.exists({ _id: id, storeId, dealerAccountId }))) {
    throw new AppError(400, `${label} must belong to the selected store.`, `INVALID_${label.toUpperCase().replaceAll(' ', '_')}`);
  }
}

export async function listAppointments(dealerAccountId: string, storeId: string) {
  await assertStore(storeId, dealerAccountId);
  return Appointment.find({ dealerAccountId, storeId }).sort({ scheduledAt: 1, createdAt: -1 }).lean();
}

export async function createAppointment(input: Record<string, unknown>, userId: string, dealerAccountId: string) {
  const storeId = String(input.storeId);
  await assertStore(storeId, dealerAccountId);
  await assertSameStore(Customer, input.customerId, storeId, dealerAccountId, 'Customer');
  await assertSameStore(Lead, input.leadId, storeId, dealerAccountId, 'Lead');
  await assertSameStore(InventoryVehicle, input.inventoryVehicleId, storeId, dealerAccountId, 'Inventory vehicle');
  if (input.leadId && input.customerId) {
    const lead = await Lead.findOne({ _id: input.leadId, dealerAccountId, storeId }).select('customerId').lean();
    if (lead?.customerId && lead.customerId.toString() !== input.customerId) {
      throw new AppError(400, 'The appointment customer must match the linked lead customer.', 'CUSTOMER_LEAD_MISMATCH');
    }
  }
  return Appointment.create({ ...input, dealerAccountId, createdByUserId: userId });
}

export async function updateAppointmentStatus(id: string, dealerAccountId: string, storeId: string, status: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Appointment not found.', 'APPOINTMENT_NOT_FOUND');
  const appointment = await Appointment.findOne({ _id: id, dealerAccountId, storeId });
  if (!appointment) throw new AppError(404, 'Appointment not found.', 'APPOINTMENT_NOT_FOUND');
  if (appointment.status === 'cancelled') throw new AppError(409, 'A cancelled appointment cannot be changed.', 'APPOINTMENT_CANCELLED');
  appointment.status = status as typeof appointment.status;
  await appointment.save();
  return appointment;
}
