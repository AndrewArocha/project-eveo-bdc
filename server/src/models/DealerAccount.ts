import { model, Schema, type InferSchemaType } from 'mongoose';

const dealerAccountSchema = new Schema(
  {
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending', required: true },
    timezone: { type: String, default: 'America/New_York', required: true },
  },
  { timestamps: true },
);

export type IDealerAccount = InferSchemaType<typeof dealerAccountSchema>;
export const DealerAccount = model('DealerAccount', dealerAccountSchema);
