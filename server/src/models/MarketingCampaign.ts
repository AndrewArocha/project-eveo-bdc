import { model, Schema, type InferSchemaType } from 'mongoose';
const marketingCampaignSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  channel: { type: String, enum: ['facebook', 'instagram', 'tiktok', 'linkedin', 'email', 'whatsapp'], required: true },
  caption: { type: String, required: true, trim: true, maxlength: 5000 },
  media: [{ visitId: { type: Schema.Types.ObjectId, ref: 'ShowroomVisit' }, eventId: { type: Schema.Types.ObjectId }, url: { type: String, maxlength: 2000 }, alt: { type: String, maxlength: 300 } }],
  status: { type: String, enum: ['draft', 'pending_approval', 'approved'], default: 'draft', required: true },
  createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
}, { timestamps: true });
marketingCampaignSchema.index({ dealerAccountId: 1, storeId: 1, status: 1, updatedAt: -1 });
export type IMarketingCampaign = InferSchemaType<typeof marketingCampaignSchema>;
export const MarketingCampaign = model('MarketingCampaign', marketingCampaignSchema);
