import { model, Schema, type InferSchemaType } from 'mongoose';

const signupApplicationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  businessName: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  status: { type: String, enum: ['submitted', 'contacted', 'converted', 'closed'], default: 'submitted', required: true },
  submittedAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });

signupApplicationSchema.index({ email: 1 }, { unique: true });

export type ISignupApplication = InferSchemaType<typeof signupApplicationSchema>;
export const SignupApplication = model('SignupApplication', signupApplicationSchema);
