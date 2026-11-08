import { model, Schema, type InferSchemaType } from 'mongoose';

const dealerAccountSchema = new Schema(
  {
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending', required: true },
    timezone: { type: String, default: 'America/New_York', required: true },
    multiStore: { type: Boolean, default: false, required: true },
    onboardingCompletedSteps: { type: [String], enum: ['profile', 'store', 'team', 'inventory', 'integrations'], default: [] },
    subscriptionStatus: { type: String, enum: ['pending_payment', 'trial', 'active', 'past_due', 'cancelled'], default: 'pending_payment', required: true },
    trialEndsAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

export type IDealerAccount = InferSchemaType<typeof dealerAccountSchema>;
export const DealerAccount = model('DealerAccount', dealerAccountSchema);
