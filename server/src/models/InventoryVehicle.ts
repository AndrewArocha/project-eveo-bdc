import { model, Schema, type InferSchemaType } from 'mongoose';

const sourceObservationSchema = new Schema(
  {
    source: { type: String, required: true, trim: true, maxlength: 120 },
    observedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    observedAt: { type: Date, default: Date.now, required: true },
    values: { type: Schema.Types.Mixed, required: true },
  },
  { _id: true },
);

const discrepancySchema = new Schema(
  {
    field: {
      type: String,
      enum: ['stockNumber', 'vehicle', 'make', 'model', 'trim', 'modelYear', 'mileage', 'price', 'condition', 'status'],
      required: true,
    },
    currentValue: { type: Schema.Types.Mixed, default: null },
    observedValue: { type: Schema.Types.Mixed, required: true },
    source: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', required: true },
    resolution: { type: String, enum: ['accepted_source', 'kept_current', 'custom'], default: undefined },
    resolvedValue: { type: Schema.Types.Mixed, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const inventoryVehicleSchema = new Schema(
  {
    dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    vin: { type: String, required: true, trim: true, uppercase: true, minlength: 11, maxlength: 17 },
    stockNumber: { type: String, trim: true, default: '', maxlength: 40 },
    vehicle: { type: String, required: true, trim: true, maxlength: 180 },
    make: { type: String, trim: true, default: '', maxlength: 60 },
    model: { type: String, trim: true, default: '', maxlength: 80 },
    trim: { type: String, trim: true, default: '', maxlength: 80 },
    modelYear: { type: Number, min: 1886, max: 2100, default: null },
    mileage: { type: Number, min: 0, default: null },
    price: { type: Number, min: 0, default: 0, required: true },
    condition: { type: String, enum: ['NEW', 'USED', 'CERTIFIED_PRE_OWNED'], default: 'USED', required: true },
    status: { type: String, enum: ['READY_FOR_SALE', 'PENDING', 'DELIVERED'], default: 'READY_FOR_SALE', required: true },
    photos: { type: [String], default: [] },
    sourceObservations: { type: [sourceObservationSchema], default: [] },
    discrepancies: { type: [discrepancySchema], default: [] },
  },
  { timestamps: true },
);

inventoryVehicleSchema.index({ dealerAccountId: 1, vin: 1 }, { unique: true });
inventoryVehicleSchema.index({ dealerAccountId: 1, storeId: 1, status: 1, updatedAt: -1 });

export type IInventoryVehicle = InferSchemaType<typeof inventoryVehicleSchema>;
export const InventoryVehicle = model('InventoryVehicle', inventoryVehicleSchema);
