import { model, Schema, type InferSchemaType } from 'mongoose';

const customerSchema = new Schema(
  {
    dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true },
);

customerSchema.index({ ownerId: 1, email: 1 });

export type ICustomer = InferSchemaType<typeof customerSchema>;
export const Customer = model('Customer', customerSchema);
