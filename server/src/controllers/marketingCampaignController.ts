import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import { MarketingCampaign } from '../models/MarketingCampaign.js';
import { ShowroomVisit } from '../models/ShowroomVisit.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listCampaigns: RequestHandler = asyncHandler(async (req, res) => { const storeId = String(req.query.storeId || ''); if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED'); res.json({ data: await MarketingCampaign.find({ dealerAccountId: req.auth!.dealerAccountId, storeId }).sort({ updatedAt: -1 }).lean() }); });
export const createCampaign: RequestHandler = asyncHandler(async (req, res) => {
  const media = (req.body.media || []) as Array<{ visitId?: string; eventId?: string; url?: string; alt?: string }>;
  for (const item of media) {
    if (!item.visitId || !item.eventId) throw new AppError(400, 'Campaign media must reference a showroom visit event.', 'CAMPAIGN_MEDIA_INVALID');
    const visit = await ShowroomVisit.findOne({ _id: item.visitId, dealerAccountId: req.auth!.dealerAccountId, storeId: req.body.storeId }).select('events').lean();
    if (!visit || !visit.events.some((event) => event._id.toString() === item.eventId && event.media)) throw new AppError(400, 'Campaign media must belong to a media event in this store.', 'CAMPAIGN_MEDIA_INVALID');
  }
  const row = await MarketingCampaign.create({ ...req.body, dealerAccountId: req.auth!.dealerAccountId, createdByUserId: req.auth!.userId }); res.status(201).json({ data: row });
});
export const updateCampaignStatus: RequestHandler = asyncHandler(async (req, res) => {
  const status = req.body.status as string;
  if (status === 'approved' && req.auth!.role !== 'owner' && req.auth!.role !== 'manager') throw new AppError(403, 'Only an owner or manager can approve a campaign.', 'FORBIDDEN');
  const id = String(req.params.id); if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Campaign not found.', 'CAMPAIGN_NOT_FOUND');
  const campaign = await MarketingCampaign.findOne({ _id: id, dealerAccountId: req.auth!.dealerAccountId }); if (!campaign) throw new AppError(404, 'Campaign not found.', 'CAMPAIGN_NOT_FOUND');
  const allowed = campaign.status === 'draft' ? ['pending_approval'] : campaign.status === 'pending_approval' ? ['draft', 'approved'] : ['draft'];
  if (status !== campaign.status && !allowed.includes(status)) throw new AppError(409, 'This campaign approval transition is not allowed.', 'CAMPAIGN_TRANSITION_INVALID');
  campaign.status = status as typeof campaign.status;
  if (status === 'approved') { campaign.approvedByUserId = new Types.ObjectId(req.auth!.userId); campaign.approvedAt = new Date(); }
  else { campaign.approvedByUserId = null; campaign.approvedAt = null; }
  await campaign.save(); res.json({ data: campaign });
});
