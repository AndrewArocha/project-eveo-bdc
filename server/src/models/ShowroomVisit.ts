import { model, Schema, type InferSchemaType } from 'mongoose';

const showroomEventSchema = new Schema({
  type: { type: String, enum: ['customer_greeted', 'visit_claimed', 'walkaround_started', 'media_added', 'test_drive_started', 'test_drive_completed', 'handoff_requested', 'handoff_accepted', 'manager_intervention', 'sla_breached', 'bdc_contact_logged', 'note_added', 'visit_completed'], required: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true, trim: true, maxlength: 100 },
  occurredAt: { type: Date, required: true, default: Date.now },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  media: { type: Schema.Types.Mixed, default: undefined },
}, { _id: true });

const showroomVisitSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
  assignedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedRepName: { type: String, required: true, trim: true, maxlength: 100 },
  checkedInByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  checkedInByName: { type: String, required: true, trim: true, maxlength: 100 },
  customerNameSnapshot: { type: String, required: true, trim: true, maxlength: 160 },
  phoneSnapshot: { type: String, trim: true, default: '', maxlength: 40 },
  notes: { type: String, trim: true, default: '', maxlength: 4000 },
  status: { type: String, enum: ['active', 'handoff_requested', 'completed', 'cancelled'], default: 'active', required: true },
  vehicleOfInterest: { type: Schema.Types.Mixed, default: null },
  tradeIn: { type: Schema.Types.Mixed, default: null },
  events: { type: [showroomEventSchema], default: [] },
}, { timestamps: true });

showroomVisitSchema.index({ dealerAccountId: 1, storeId: 1, updatedAt: -1 });
showroomVisitSchema.index({ dealerAccountId: 1, storeId: 1, createdAt: -1 });

export type IShowroomVisit = InferSchemaType<typeof showroomVisitSchema>;
export const ShowroomVisit = model('ShowroomVisit', showroomVisitSchema);
