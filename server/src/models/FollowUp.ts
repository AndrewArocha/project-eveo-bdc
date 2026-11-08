import { model, Schema, type InferSchemaType } from 'mongoose';

const followUpSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
  assignedStoreUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  notes: { type: String, default: '', maxlength: 2000 },
  dueAt: { type: Date, required: true },
  status: { type: String, enum: ['open', 'completed', 'cancelled'], default: 'open', required: true },
  completedAt: { type: Date, default: null },
  createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

followUpSchema.index({ dealerAccountId: 1, storeId: 1, status: 1, dueAt: 1 });

export type IFollowUp = InferSchemaType<typeof followUpSchema>;
export const FollowUp = model('FollowUp', followUpSchema);
