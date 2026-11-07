import { model, Schema, type InferSchemaType } from 'mongoose';

const storeSchema = new Schema(
  {
    dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 16 },
    website: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    timezone: { type: String, default: 'America/New_York', required: true },
    active: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

storeSchema.index({ dealerAccountId: 1, code: 1 }, { unique: true });

export type IStore = InferSchemaType<typeof storeSchema>;
export const Store = model('Store', storeSchema);
