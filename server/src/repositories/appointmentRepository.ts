import { Types } from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Customer } from '../models/Customer.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { recordActivityEventSafely } from '../services/activityEventService.js';
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

async function assertRepAvailable(input: {
  dealerAccountId: string;
  storeId: string;
  scheduledAt: Date | null;
  durationMinutes: number;
  assignedUserId?: string | null;
  excludeId?: string;
}) {
  if (!input.scheduledAt || !input.assignedUserId) return;
  const proposedStart = input.scheduledAt.getTime();
  const proposedEnd = proposedStart + input.durationMinutes * 60_000;
  const earliestCandidate = new Date(proposedStart - 60 * 60_000);
  const candidates = await Appointment.find({
    dealerAccountId: input.dealerAccountId,
    storeId: input.storeId,
    scheduledAt: { $gte: earliestCandidate, $lt: new Date(proposedEnd) },
    status: { $nin: ['cancelled', 'sold', 'no_show'] },
    ...(input.excludeId ? { _id: { $ne: input.excludeId } } : {}),
    $or: [
      { assignedStoreUserId: input.assignedUserId },
      { assignedPlatformUserId: input.assignedUserId },
    ],
  }).select('scheduledAt durationMinutes').lean();
  const conflict = candidates.some((appointment) => {
    if (!appointment.scheduledAt) return false;
    const start = new Date(appointment.scheduledAt).getTime();
    const end = start + (appointment.durationMinutes || 30) * 60_000;
    return proposedStart < end && proposedEnd > start;
  });
  if (conflict) {
    throw new AppError(409, 'This rep already has an appointment during that time. Choose another rep or a different 15-minute start time.', 'APPOINTMENT_SLOT_UNAVAILABLE');
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
  for (const assignedId of [input.assignedPlatformUserId, input.assignedStoreUserId].filter((value): value is string => typeof value === 'string')) {
    if (!await User.exists({ _id: assignedId, dealerAccountId, active: true, storeIds: storeId })) throw new AppError(400, 'Assigned employee must be active and belong to this store.', 'INVALID_ASSIGNMENT');
  }
  if (input.inventoryVehicleId) {
    const vehicle = await InventoryVehicle.findOne({ _id: input.inventoryVehicleId, dealerAccountId, storeId }).select('status').lean();
    if (vehicle?.status === 'SOLD' || vehicle?.status === 'DELIVERED') throw new AppError(409, 'Appointments cannot be booked against sold or delivered inventory.', 'VEHICLE_UNAVAILABLE');
  }
  if (input.leadId && input.customerId) {
    const lead = await Lead.findOne({ _id: input.leadId, dealerAccountId, storeId }).select('customerId').lean();
    if (lead?.customerId && lead.customerId.toString() !== input.customerId) {
      throw new AppError(400, 'The appointment customer must match the linked lead customer.', 'CUSTOMER_LEAD_MISMATCH');
    }
  }
  const scheduledAt = typeof input.scheduledAt === 'string' ? new Date(input.scheduledAt) : null;
  const durationMinutes = typeof input.durationMinutes === 'number' ? input.durationMinutes : 30;
  const assignedUserId = typeof input.assignedStoreUserId === 'string' ? input.assignedStoreUserId
    : typeof input.assignedPlatformUserId === 'string' ? input.assignedPlatformUserId : null;
  await assertRepAvailable({ dealerAccountId, storeId, scheduledAt, durationMinutes, assignedUserId });
  const appointment = await Appointment.create({ ...input, dealerAccountId, createdByUserId: userId });
  appointment.statusHistory.push({ kind: 'status', previousValue: '', nextValue: appointment.status, changedByUserId: userId, changedAt: new Date() });
  if (appointment.scheduledAt) appointment.statusHistory.push({ kind: 'schedule', previousValue: '', nextValue: appointment.scheduledAt.toISOString(), changedByUserId: userId, changedAt: new Date() });
  await appointment.save();
  await recordActivityEventSafely({
    dealerAccountId, storeId, userId, category: 'appointment', title: `Appointment booked • ${appointment.customerNameSnapshot}`,
    description: [appointment.vehicleSnapshot, appointment.scheduledAt?.toLocaleString()].filter(Boolean).join(' · '), entityType: 'appointment', entityId: appointment.id,
  });
  return appointment;
}

export async function updateAppointmentDetails(id: string, dealerAccountId: string, storeId: string, input: Record<string, unknown>, userId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Appointment not found.', 'APPOINTMENT_NOT_FOUND');
  const appointment = await Appointment.findOne({ _id: id, dealerAccountId, storeId });
  if (!appointment) throw new AppError(404, 'Appointment not found.', 'APPOINTMENT_NOT_FOUND');
  if (['cancelled', 'sold', 'no_show'].includes(appointment.status)) throw new AppError(409, 'A closed appointment cannot be rescheduled.', 'APPOINTMENT_CLOSED');
  if (typeof input.scheduledAt === 'string') {
    const next = new Date(input.scheduledAt);
    appointment.statusHistory.push({ kind: 'schedule', previousValue: appointment.scheduledAt?.toISOString() || '', nextValue: next.toISOString(), changedByUserId: new Types.ObjectId(userId), changedAt: new Date() });
    appointment.scheduledAt = next;
  }
  if (typeof input.durationMinutes === 'number') appointment.durationMinutes = input.durationMinutes;
  for (const field of ['assignedPlatformUserId', 'assignedStoreUserId'] as const) {
    if (field in input && input[field] && !await User.exists({ _id: input[field], dealerAccountId, active: true, storeIds: storeId })) throw new AppError(400, 'Assigned employee must be active and belong to this store.', 'INVALID_ASSIGNMENT');
    if (field in input && String(appointment[field] ?? '') !== String(input[field] ?? '')) {
      appointment.statusHistory.push({ kind: 'assignment', previousValue: String(appointment[field] ?? ''), nextValue: String(input[field] ?? ''), changedByUserId: new Types.ObjectId(userId), changedAt: new Date() });
      appointment[field] = input[field] as typeof appointment[typeof field];
    }
  }
  const assignedUserId = appointment.assignedStoreUserId?.toString() || appointment.assignedPlatformUserId?.toString() || null;
  await assertRepAvailable({
    dealerAccountId, storeId, scheduledAt: appointment.scheduledAt || null,
    durationMinutes: appointment.durationMinutes || 30, assignedUserId, excludeId: id,
  });
  await appointment.save();
  await recordActivityEventSafely({
    dealerAccountId, storeId, userId, category: 'appointment', title: `Appointment updated • ${appointment.customerNameSnapshot}`,
    description: 'Schedule or assignment updated.', entityType: 'appointment', entityId: appointment.id,
  });
  return appointment;
}

export async function updateAppointmentStatus(id: string, dealerAccountId: string, storeId: string, status: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Appointment not found.', 'APPOINTMENT_NOT_FOUND');
  const appointment = await Appointment.findOne({ _id: id, dealerAccountId, storeId });
  if (!appointment) throw new AppError(404, 'Appointment not found.', 'APPOINTMENT_NOT_FOUND');
  if (appointment.status === 'cancelled') throw new AppError(409, 'A cancelled appointment cannot be changed.', 'APPOINTMENT_CANCELLED');
  const allowed: Record<string, string[]> = { pending_confirmation: ['confirmed', 'cancelled'], confirmed: ['arrived', 'showed', 'no_show', 'cancelled'], arrived: ['showed', 'sold', 'cancelled'], showed: ['sold', 'cancelled'], no_show: ['confirmed', 'cancelled'], sold: [], cancelled: [], };
  if (status !== appointment.status && !allowed[appointment.status]?.includes(status)) throw new AppError(409, 'This appointment status transition is not allowed.', 'APPOINTMENT_TRANSITION_INVALID');
  const previous = appointment.status;
  appointment.status = status as typeof appointment.status;
  if (previous !== appointment.status) appointment.statusHistory.push({ kind: 'status', previousValue: previous, nextValue: status, changedByUserId: new Types.ObjectId(userId), changedAt: new Date() });
  await appointment.save();
  if (previous !== status) await recordActivityEventSafely({
    dealerAccountId, storeId, userId, category: 'appointment', title: `Appointment ${status.replaceAll('_', ' ')} • ${appointment.customerNameSnapshot}`,
    description: appointment.vehicleSnapshot, entityType: 'appointment', entityId: appointment.id,
  });
  return appointment;
}
