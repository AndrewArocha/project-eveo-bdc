import { model, Schema, type InferSchemaType } from 'mongoose';
import { USER_ROLES } from './User.js';

const userInvitationSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Store' }], required: true },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  role: { type: String, enum: USER_ROLES.filter((role) => role !== 'owner'), required: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending', required: true },
  invitedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date, default: null },
}, { timestamps: true });

userInvitationSchema.index({ dealerAccountId: 1, email: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
userInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export type IUserInvitation = InferSchemaType<typeof userInvitationSchema>;
export const UserInvitation = model('UserInvitation', userInvitationSchema);
