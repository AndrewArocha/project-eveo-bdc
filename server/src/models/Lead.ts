import { model, Schema, type InferSchemaType } from 'mongoose';

const leadHistorySchema = new Schema({
  kind: { type: String, enum: ['status', 'assignment', 'note'], required: true },
  previousValue: { type: String, default: '' },
  nextValue: { type: String, default: '' },
  changedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, required: true, default: Date.now },
}, { _id: true });

const leadSchema = new Schema(
  {
    dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerNameSnapshot: { type: String, required: true, trim: true, maxlength: 160 },
    phoneSnapshot: { type: String, trim: true, default: '', maxlength: 40 },
    emailSnapshot: { type: String, trim: true, lowercase: true, default: '', maxlength: 254 },
    vehicleOfInterest: { type: String, trim: true, default: '', maxlength: 180 },
    inventoryVehicleId: { type: Schema.Types.ObjectId, ref: 'InventoryVehicle', default: null },
    source: { type: String, trim: true, default: '', maxlength: 120 },
    status: { type: String, enum: ['new', 'contacted', 'qualified', 'appointment_set', 'nurture', 'lost', 'converted'], default: 'new', required: true },
    assignedPlatformUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedStoreUserId: { type: Schema.Types.ObjectId, default: null },
    notes: { type: String, trim: true, default: '', maxlength: 4000 },
    statusHistory: { type: [leadHistorySchema], default: [] },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

leadSchema.index({ dealerAccountId: 1, storeId: 1, status: 1, createdAt: -1 });
leadSchema.index({ dealerAccountId: 1, storeId: 1, createdAt: -1 });
leadSchema.index({ dealerAccountId: 1, customerId: 1 });

export type ILead = InferSchemaType<typeof leadSchema>;
export const Lead = model('Lead', leadSchema);
