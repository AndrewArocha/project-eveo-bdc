import { Types } from 'mongoose';
import type { RequestHandler } from 'express';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { Appointment } from '../models/Appointment.js';
import { Deal } from '../models/Deal.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const respondToEve: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = String(request.body.storeId || '');
  const prompt = String(request.body.prompt || '').trim().slice(0, 2000);
  if (!storeId || !prompt) throw new AppError(400, 'A storeId and prompt are required.', 'EVE_INPUT_REQUIRED');
  const store = await Store.findOne({ _id: storeId, dealerAccountId: request.auth!.dealerAccountId, active: true }).select('name timezone').lean();
  if (!store) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');

  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 86400000);
  const accountObjectId = new Types.ObjectId(request.auth!.dealerAccountId);
  const storeObjectId = new Types.ObjectId(storeId);
  const [leadsCreated, upcomingAppointments, readyInventory, dealsSold, dealsInProgress, overdueFollowUps, unassignedLeads, pendingAppointments, activeTeamMembers, grossRows] = await Promise.all([
    Lead.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, createdAt: { $gte: last30Days } }),
    Appointment.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, scheduledAt: { $gte: now }, status: { $in: ['confirmed', 'pending_confirmation'] } }),
    InventoryVehicle.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, status: 'READY_FOR_SALE' }),
    Deal.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, status: { $in: ['sold', 'delivered'] }, soldAt: { $gte: last30Days } }),
    Deal.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, status: { $in: ['pending', 'negotiation'] } }),
    (await import('../models/FollowUp.js')).FollowUp.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, status: 'open', dueAt: { $lt: now } }),
    Lead.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, status: { $nin: ['lost', 'converted'] }, assignedStoreUserId: null, assignedPlatformUserId: null }),
    Appointment.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, scheduledAt: { $gte: now }, status: 'pending_confirmation' }),
    User.countDocuments({ dealerAccountId: accountObjectId, active: true, role: { $ne: 'owner' }, storeIds: storeObjectId }),
    Deal.aggregate([
      { $match: { dealerAccountId: accountObjectId, storeId: storeObjectId, soldAt: { $gte: last30Days }, status: { $in: ['sold', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ['$frontGross', 0] }, { $ifNull: ['$backGross', 0] }] } } } },
    ]),
  ]);

  const grossLast30Days = Math.round((grossRows[0]?.total ?? 0) * 100) / 100;
  const evidence = {
    store: store.name,
    period: 'last 30 days/current snapshot',
    leadsCreated,
    unassignedLeads,
    upcomingAppointments,
    appointmentsNeedingConfirmation: pendingAppointments,
    availableInventory: readyInventory,
    activeTeamMembers,
    dealsSold,
    dealsInProgress,
    recordedGrossLast30Days: grossLast30Days,
    overdueFollowUps,
    activityEventsLast30Days: await ActivityEvent.countDocuments({ dealerAccountId: accountObjectId, storeId: storeObjectId, occurredAt: { $gte: last30Days } }),
  };

  const normalizedPrompt = prompt.toLowerCase();
  const identityQuery = /\b(weakest|least active|lowest activity|underperform|worst performer)\b/.test(normalizedPrompt);
  let content = `${store.name} has ${unassignedLeads} open unassigned leads, ${pendingAppointments} upcoming appointments awaiting confirmation, ${readyInventory} vehicles marked ready for sale, and ${overdueFollowUps} overdue follow-ups. These counts come from EVEO records.`;

  if (identityQuery) {
    const canReviewEmployeeActivity = ['owner', 'manager', 'bdc'].includes(request.auth!.role);
    if (!canReviewEmployeeActivity) {
      content = 'I can’t compare individual team activity for your role. I can still show store-wide lead, appointment, inventory, and follow-up priorities.';
    } else {
      const [employees, eventsByActor] = await Promise.all([
        User.find({ dealerAccountId: accountObjectId, active: true, role: { $ne: 'owner' }, storeIds: storeObjectId }).select('_id name').sort({ name: 1 }).lean(),
        ActivityEvent.aggregate([
          { $match: { dealerAccountId: accountObjectId, storeId: storeObjectId, occurredAt: { $gte: last30Days } } },
          { $group: { _id: '$actorUserId', count: { $sum: 1 } } },
        ]),
      ]);
      const eventsByUserId = new Map(eventsByActor.map((row: { _id: Types.ObjectId; count: number }) => [row._id.toString(), row.count]));
      const activityRows = employees.map((employee) => ({ name: employee.name, count: eventsByUserId.get(employee._id.toString()) ?? 0 }));
      const minimum = Math.min(...activityRows.map((row) => row.count));
      const leastActivity = activityRows.filter((row) => row.count === minimum);
      if (activityRows.length === 0) {
        content = `There are no active team members to compare in ${store.name}.`;
      } else if (minimum === 0) {
        content = `${leastActivity.map((row) => row.name).join(', ')} ${leastActivity.length === 1 ? 'has' : 'have'} no EVEO activity events recorded in the last 30 days. That is not enough to call anyone the weakest: EVEO does not yet ingest all calls, texts, emails, or sales outcomes.`;
      } else {
        content = `${leastActivity.map((row) => row.name).join(', ')} ${leastActivity.length === 1 ? 'has' : 'have'} the fewest EVEO activity events in the last 30 days (${minimum}). This is only a count of activity logged in EVEO; it does not include unconnected calls, texts, emails, or sales outcomes.`;
      }
    }
  } else if (/\b(revenue|gross|sales|sold|delivered|deal)\b/.test(normalizedPrompt)) {
    content = `${store.name} has ${dealsSold} deals marked sold or delivered in the last 30 days, with ${new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(grossLast30Days)} recorded front and back gross. ${dealsInProgress} deals are currently pending or in negotiation. Gross is only as complete as the values entered in EVEO.`;
  } else if (/\b(overdue|follow.?up|followup|waiting for a response)\b/.test(normalizedPrompt)) {
    content = overdueFollowUps
      ? `${overdueFollowUps} open follow-ups are past their due time in ${store.name}. Review those records and confirm their status with the assigned employee.`
      : `There are no open EVEO follow-ups past their due time in ${store.name}. EVEO only counts follow-ups entered in its records.`;
  } else if (/\b(what should|what do|priority|priorities|focus|next step|recommend)\b/.test(normalizedPrompt)) {
    const priorities = [
      unassignedLeads ? `${unassignedLeads} unassigned leads` : '',
      pendingAppointments ? `${pendingAppointments} appointments awaiting confirmation` : '',
      overdueFollowUps ? `${overdueFollowUps} overdue follow-ups` : '',
    ].filter(Boolean);
    content = priorities.length
      ? `Start with ${priorities.join(', then ')}. These are the current high-priority items recorded for ${store.name}.`
      : `There are no unassigned leads, unconfirmed upcoming appointments, or overdue follow-ups in ${store.name}. You can review the ${readyInventory} ready inventory records or ask for another live count.`;
  } else if (/\b(inventory|vehicle|vehicles|cars|stock|lot|available)\b/.test(normalizedPrompt)) {
    content = readyInventory === 0
      ? `There are no inventory records marked ready for sale in ${store.name} yet. Add vehicles or connect a supported inventory feed to get a live availability count.`
      : `${store.name} has ${readyInventory} vehicles marked ready for sale in its live inventory records.`;
  } else if (/\b(appointment|appointments|confirm|schedule)\b/.test(normalizedPrompt)) {
    content = pendingAppointments === 0
      ? `There are no upcoming appointments waiting for confirmation in ${store.name}. I found ${upcomingAppointments} upcoming appointments.`
      : `${pendingAppointments} upcoming appointments in ${store.name} are waiting for confirmation. Review those first; there are ${upcomingAppointments} upcoming appointments total.`;
  } else if (/\b(lead|leads|pipeline)\b/.test(normalizedPrompt)) {
    content = `${leadsCreated} leads were created in ${store.name} in the last 30 days. ${unassignedLeads} open leads currently have no assigned team member.`;
  } else if (/\b(staff|team|agent|headcount|employee|employees)\b/.test(normalizedPrompt)) {
    content = `${store.name} has ${activeTeamMembers} active team members assigned to this store and ${evidence.activityEventsLast30Days} EVEO activity events logged in the last 30 days. EVEO does not yet ingest external call, text, or email activity.`;
  }

  let mode: 'live' | 'preview' = 'live';
  if (env.openAiApiKey && !identityQuery) {
    try {
      const aiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.openAiApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: env.openAiModel,
          store: false,
          instructions: 'You are E.V.E., the dealership operations assistant. Use only the supplied numeric store evidence. State when an answer is not in evidence. Never claim to have changed records or contacted customers. Do not invent staff rankings, revenue, calls, messages, or customer information.',
          input: `User request: ${prompt}\nAuthorized store evidence: ${JSON.stringify(evidence)}`,
          max_output_tokens: 500,
        }),
      });
      if (aiResponse.ok) {
        const result = await aiResponse.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
        const generated = result.output?.flatMap((item) => item.content || []).find((part) => part.type === 'output_text')?.text;
        if (generated) content = generated;
      }
    } catch (error) {
      console.warn('Optional E.V.E. wording service failed; returning deterministic store results.', error instanceof Error ? error.name : 'UnknownError');
    }
  }

  response.json({ data: { mode, content, evidence, capabilities: ['read_store_priorities', 'read_store_metrics', 'read_inventory_counts', 'read_pipeline_counts', 'read_follow_up_counts'] } });
});
