import type { RequestHandler } from 'express';
import { Appointment } from '../models/Appointment.js';
import { Deal } from '../models/Deal.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { Lead } from '../models/Lead.js';
import { Store } from '../models/Store.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const respondToEve: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = String(request.body.storeId || '');
  const prompt = String(request.body.prompt || '').trim().slice(0, 2000);
  if (!storeId || !prompt) throw new AppError(400, 'A storeId and prompt are required.', 'EVE_INPUT_REQUIRED');
  const store = await Store.findOne({ _id: storeId, dealerAccountId: request.auth!.dealerAccountId, active: true }).select('name timezone').lean();
  if (!store) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  const [leads, appointments, inventory, sold, dueDeals, openFollowUps] = await Promise.all([
    Lead.countDocuments({ dealerAccountId: request.auth!.dealerAccountId, storeId, createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
    Appointment.countDocuments({ dealerAccountId: request.auth!.dealerAccountId, storeId, scheduledAt: { $gte: new Date() }, status: { $in: ['confirmed', 'pending_confirmation'] } }),
    InventoryVehicle.countDocuments({ dealerAccountId: request.auth!.dealerAccountId, storeId, status: 'READY_FOR_SALE' }),
    Deal.countDocuments({ dealerAccountId: request.auth!.dealerAccountId, storeId, status: { $in: ['sold', 'delivered'] }, soldAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
    Deal.countDocuments({ dealerAccountId: request.auth!.dealerAccountId, storeId, status: { $in: ['pending', 'negotiation'] } }),
    (await import('../models/FollowUp.js')).FollowUp.countDocuments({ dealerAccountId: request.auth!.dealerAccountId, storeId, status: 'open', dueAt: { $lt: new Date() } }),
  ]);
  const evidence = { store: store.name, period: 'last 30 days/current snapshot', leadsCreated: leads, upcomingAppointments: appointments, availableInventory: inventory, dealsSold: sold, dealsInProgress: dueDeals, overdueFollowUps: openFollowUps };
  let content = `For ${store.name}, the current server records show ${leads} leads created in the last 30 days, ${appointments} upcoming appointments, ${inventory} vehicles ready for sale, ${sold} deals sold in the last 30 days, ${dueDeals} deals in progress, and ${openFollowUps} overdue follow-ups. These are live counts; ask for a narrower period or metric for a more specific view.`;
  let mode: 'live' | 'preview' = 'preview';
  if (env.openAiApiKey) {
    const aiResponse = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${env.openAiApiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: env.openAiModel, store: false, instructions: 'You are E.V.E., the dealership operations assistant. Use only the supplied evidence. State when a requested answer is not in evidence. Never claim to have changed records or contacted customers. Avoid exposing customer personal information.', input: `User request: ${prompt}\nAuthorized store evidence: ${JSON.stringify(evidence)}`, max_output_tokens: 500 }) });
    if (!aiResponse.ok) throw new AppError(502, 'The configured AI provider could not complete this request.', 'AI_PROVIDER_ERROR');
    const result = await aiResponse.json() as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
    const generated = result.output?.flatMap((item) => item.content || []).find((part) => part.type === 'output_text')?.text;
    if (generated) { content = generated; mode = 'live'; }
  }
  response.json({ data: { mode, content, evidence, capabilities: ['read_store_metrics', 'read_inventory_counts', 'read_pipeline_counts'] } });
});
