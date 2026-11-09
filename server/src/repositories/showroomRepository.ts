import { Types } from 'mongoose';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { Appointment } from '../models/Appointment.js';
import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { ShowroomVisit } from '../models/ShowroomVisit.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

async function assertStore(storeId: string, dealerAccountId: string) {
  if (!Types.ObjectId.isValid(storeId) || !(await Store.exists({ _id: storeId, dealerAccountId, active: true }))) {
    throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  }
}

async function findVisit(id: string, dealerAccountId: string, storeId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Showroom visit not found.', 'SHOWROOM_VISIT_NOT_FOUND');
  const visit = await ShowroomVisit.findOne({ _id: id, dealerAccountId, storeId });
  if (!visit) throw new AppError(404, 'Showroom visit not found.', 'SHOWROOM_VISIT_NOT_FOUND');
  return visit;
}

async function resolveAssignedUser(userId: string, dealerAccountId: string, storeId: string) {
  if (!Types.ObjectId.isValid(userId)) throw new AppError(400, 'Assigned employee is invalid.', 'INVALID_ASSIGNED_USER');
  const user = await User.findOne({
    _id: userId, dealerAccountId, active: true,
    $or: [{ role: 'owner' }, { storeIds: storeId }],
  }).select('name role').lean();
  if (!user) throw new AppError(400, 'Assigned employee must belong to this dealership.', 'INVALID_ASSIGNED_USER');
  return user;
}

export async function listShowroomVisits(dealerAccountId: string, storeId: string) {
  await assertStore(storeId, dealerAccountId);
  return ShowroomVisit.find({ dealerAccountId, storeId }).sort({ updatedAt: -1 }).lean();
}

export async function getShowroomVisit(id: string, dealerAccountId: string, storeId: string) {
  await assertStore(storeId, dealerAccountId);
  return (await findVisit(id, dealerAccountId, storeId)).toObject();
}

export async function createShowroomVisit(input: Record<string, unknown>, userId: string, dealerAccountId: string) {
  const storeId = String(input.storeId);
  await assertStore(storeId, dealerAccountId);
  const customerName = String(input.customerName).trim();
  const phone = String(input.customerPhone || '').trim();
  const assignedUser = await resolveAssignedUser(String(input.assignedUserId), dealerAccountId, storeId);
  const actor = await User.findById(userId).select('name').lean();
  if (!actor) throw new AppError(401, 'User session is no longer valid.', 'UNAUTHORIZED');

  const lead = input.leadId
    ? await Lead.findOne({ _id: input.leadId, dealerAccountId, storeId }).select('customerId').lean()
    : null;
  if (input.leadId && !lead) throw new AppError(400, 'Lead must belong to the selected store.', 'INVALID_LEAD');
  const appointment = input.appointmentId
    ? await Appointment.findOne({ _id: input.appointmentId, dealerAccountId, storeId }).select('customerId leadId').lean()
    : null;
  if (input.appointmentId && !appointment) throw new AppError(400, 'Appointment must belong to the selected store.', 'INVALID_APPOINTMENT');
  if (input.leadId && appointment?.leadId && appointment.leadId.toString() !== String(input.leadId)) throw new AppError(400, 'Appointment and lead links must match.', 'LEAD_APPOINTMENT_MISMATCH');

  const linkedCustomerId = input.customerId || lead?.customerId || appointment?.customerId;
  let customer;
  if (linkedCustomerId) {
    customer = await Customer.findOne({ _id: linkedCustomerId, dealerAccountId, storeId });
    if (!customer) throw new AppError(400, 'Customer must belong to the selected store.', 'INVALID_CUSTOMER');
  } else if (phone) {
    customer = await Customer.findOne({ dealerAccountId, storeId, phone });
  }
  if (!customer) customer = await Customer.create({ dealerAccountId, storeId, ownerId: userId, name: customerName, phone });
  if (input.leadId) {
    if (lead?.customerId && lead.customerId.toString() !== customer.id) throw new AppError(400, 'Visit customer must match its linked lead.', 'CUSTOMER_LEAD_MISMATCH');
  }
  if (input.appointmentId) {
    if (appointment?.customerId && appointment.customerId.toString() !== customer.id) throw new AppError(400, 'Visit customer must match its linked appointment.', 'CUSTOMER_APPOINTMENT_MISMATCH');
  }

  const visit = await ShowroomVisit.create({
    dealerAccountId, storeId, customerId: customer.id, leadId: input.leadId || null, appointmentId: input.appointmentId || null,
    assignedUserId: assignedUser._id, assignedRepName: assignedUser.name, checkedInByUserId: userId, checkedInByName: actor.name,
    customerNameSnapshot: customerName, greetedPerson: String(input.greetedPerson), phoneSnapshot: phone || customer.phone, notes: input.notes || '',
    vehicleOfInterest: input.vehicleOfInterest || null, tradeIn: input.tradeIn || null,
    events: [{ type: 'customer_greeted', actorUserId: userId, actorName: actor.name, occurredAt: new Date(), message: `Greeted ${String(input.greetedPerson)}.`, media: input.greetingMedia }],
  });
  await ActivityEvent.create({ dealerAccountId, storeId, actorUserId: userId, actorName: actor.name, category: 'showroom', title: `Customer checked in • ${customerName}`, description: 'Showroom visit started.', entityType: 'showroom_visit', entityId: visit.id });
  return visit;
}

export async function appendShowroomEvent(id: string, dealerAccountId: string, storeId: string, userId: string, input: Record<string, unknown>) {
  const visit = await findVisit(id, dealerAccountId, storeId);
  const actor = await User.findById(userId).select('name role').lean();
  if (!actor) throw new AppError(401, 'User session is no longer valid.', 'UNAUTHORIZED');
  const type = String(input.type);
  const isFollowUp = type === 'note_added' || type === 'media_added';
  if (visit.status === 'cancelled' || (visit.status === 'completed' && !isFollowUp)) throw new AppError(409, 'This showroom visit is closed. Add a note or reply to continue the conversation.', 'SHOWROOM_VISIT_CLOSED');
  if (visit.status === 'completed' && isFollowUp && visit.assignedUserId.toString() !== userId && !['bdc', 'bdc_manager', 'manager', 'owner'].includes(actor.role)) {
    throw new AppError(403, 'Only the assigned salesperson or store leadership can add follow-up notes to a completed visit.', 'SHOWROOM_VISIT_NOT_OWNED');
  }
  if (type === 'visit_claimed') throw new AppError(400, 'Use the assignment route to claim a visit.', 'USE_ASSIGNMENT_ROUTE');
  if (type === 'deal_desked' && (!input.media || typeof input.media !== 'object' || (input.media as { kind?: string }).kind !== 'image')) {
    throw new AppError(422, 'Attach a photo of the deal screen or printed desk before saving the desk step.', 'DESKING_PHOTO_REQUIRED');
  }
  if (type === 'handoff_requested' && (!input.media || typeof input.media !== 'object' || (input.media as { kind?: string }).kind !== 'image')) {
    throw new AppError(422, 'Attach a photo of the deal screen or printed desk before requesting BDC handoff.', 'DESKING_PHOTO_REQUIRED');
  }
  const replyToEventId = typeof input.replyToEventId === 'string' ? input.replyToEventId : null;
  if (replyToEventId && !visit.events.some((event) => event._id.toString() === replyToEventId)) throw new AppError(404, 'The visit update you are replying to was not found.', 'SHOWROOM_EVENT_NOT_FOUND');
  visit.events.push({ type: type as never, actorUserId: new Types.ObjectId(userId), actorName: actor.name, occurredAt: new Date(), message: String(input.message), ...(input.media ? { media: input.media } : {}), ...(replyToEventId ? { replyToEventId: new Types.ObjectId(replyToEventId) } : {}) } as never);
  if (type === 'handoff_requested') visit.status = 'handoff_requested';
  if (type === 'visit_completed') visit.status = 'completed';
  await visit.save();
  await ActivityEvent.create({ dealerAccountId, storeId, actorUserId: userId, actorName: actor.name, category: 'showroom', title: `${type.replaceAll('_', ' ')} • ${visit.customerNameSnapshot}`, description: String(input.message), entityType: 'showroom_visit', entityId: visit.id });
  return visit;
}

export async function assignShowroomVisit(id: string, dealerAccountId: string, storeId: string, userId: string, assignedUserId: string) {
  const visit = await findVisit(id, dealerAccountId, storeId);
  if (visit.status === 'completed' || visit.status === 'cancelled') throw new AppError(409, 'This showroom visit is closed.', 'SHOWROOM_VISIT_CLOSED');
  const assignedUser = await resolveAssignedUser(assignedUserId, dealerAccountId, storeId);
  const actor = await User.findById(userId).select('name').lean();
  if (!actor) throw new AppError(401, 'User session is no longer valid.', 'UNAUTHORIZED');
  visit.assignedUserId = assignedUser._id;
  visit.assignedRepName = assignedUser.name;
  visit.events.push({ type: 'visit_claimed', actorUserId: new Types.ObjectId(userId), actorName: actor.name, occurredAt: new Date(), message: `${assignedUser.name} accepted the visit.` } as never);
  if (visit.status === 'handoff_requested') visit.status = 'active';
  await visit.save();
  await ActivityEvent.create({ dealerAccountId, storeId, actorUserId: userId, actorName: actor.name, category: 'showroom', title: `Showroom visit assigned • ${visit.customerNameSnapshot}`, description: `${assignedUser.name} accepted the visit.`, entityType: 'showroom_visit', entityId: visit.id });
  return visit;
}

export async function listActivityEvents(dealerAccountId: string, storeId: string, limit = 50) {
  await assertStore(storeId, dealerAccountId);
  return ActivityEvent.find({ dealerAccountId, storeId }).sort({ occurredAt: -1 }).limit(Math.max(1, Math.min(limit, 100))).lean();
}

export async function createActivityEvent(input: Record<string, unknown>, userId: string, dealerAccountId: string) {
  const storeId = String(input.storeId);
  await assertStore(storeId, dealerAccountId);
  const actor = await User.findById(userId).select('name').lean();
  if (!actor) throw new AppError(401, 'User session is no longer valid.', 'UNAUTHORIZED');
  return ActivityEvent.create({ ...input, dealerAccountId, actorUserId: userId, actorName: actor.name });
}
