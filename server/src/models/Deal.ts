import { model, Schema, type InferSchemaType } from 'mongoose';

export const DEAL_STATUSES = ['pending', 'negotiation', 'sold', 'delivered', 'cancelled', 'reversed'] as const;
const dealHistorySchema = new Schema({
  fromStatus: { type: String, default: '' },
  toStatus: { type: String, enum: DEAL_STATUSES, required: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  occurredAt: { type: Date, required: true, default: Date.now },
  note: { type: String, default: '', maxlength: 500 },
}, { _id: true });

const dealSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
  showroomVisitId: { type: Schema.Types.ObjectId, ref: 'ShowroomVisit', default: null },
  inventoryVehicleId: { type: Schema.Types.ObjectId, ref: 'InventoryVehicle', default: null },
  assignedStoreUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleSnapshot: { type: String, required: true, trim: true, maxlength: 180 },
  stockNumberSnapshot: { type: String, default: '', trim: true, maxlength: 40 },
  status: { type: String, enum: DEAL_STATUSES, default: 'pending', required: true },
  salePrice: { type: Number, min: 0, default: 0, required: true },
  frontGross: { type: Number, default: null },
  backGross: { type: Number, default: null },
  soldAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  statusHistory: { type: [dealHistorySchema], default: [] },
  notes: { type: String, default: '', maxlength: 4000 },
  createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

dealSchema.index({ dealerAccountId: 1, storeId: 1, status: 1, createdAt: -1 });
dealSchema.index({ dealerAccountId: 1, inventoryVehicleId: 1, status: 1 });

export type IDeal = InferSchemaType<typeof dealSchema>;
export const Deal = model('Deal', dealSchema);
