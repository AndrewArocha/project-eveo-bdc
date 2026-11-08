import { model, Schema, type InferSchemaType } from 'mongoose';

const activityEventSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, enum: ['lead', 'appointment', 'showroom', 'inventory', 'deal', 'report', 'account', 'system', 'ai'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, trim: true, default: '', maxlength: 1000 },
  entityType: { type: String, trim: true, default: '', maxlength: 40 },
  entityId: { type: String, trim: true, default: '', maxlength: 80 },
  occurredAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

activityEventSchema.index({ dealerAccountId: 1, storeId: 1, occurredAt: -1 });

export type IActivityEvent = InferSchemaType<typeof activityEventSchema>;
export const ActivityEvent = model('ActivityEvent', activityEventSchema);
