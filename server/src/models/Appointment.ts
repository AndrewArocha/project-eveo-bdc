import { model, Schema, type InferSchemaType } from 'mongoose';

const appointmentSchema = new Schema(
  {
    dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    customerNameSnapshot: { type: String, required: true, trim: true, maxlength: 160 },
    phoneSnapshot: { type: String, trim: true, default: '', maxlength: 40 },
    inventoryVehicleId: { type: Schema.Types.ObjectId, ref: 'InventoryVehicle', default: null },
    vehicleSnapshot: { type: String, trim: true, default: '', maxlength: 180 },
    scheduledAt: { type: Date, default: null },
    status: { type: String, enum: ['pending_confirmation', 'confirmed', 'arrived', 'showed', 'no_show', 'cancelled', 'sold'], default: 'pending_confirmation', required: true },
    assignedPlatformUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedStoreUserId: { type: Schema.Types.ObjectId, default: null },
    notes: { type: String, trim: true, default: '', maxlength: 4000 },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

appointmentSchema.index({ dealerAccountId: 1, storeId: 1, scheduledAt: 1 });
appointmentSchema.index({ dealerAccountId: 1, leadId: 1 });

export type IAppointment = InferSchemaType<typeof appointmentSchema>;
export const Appointment = model('Appointment', appointmentSchema);
