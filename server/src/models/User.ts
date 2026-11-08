import { model, Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['owner', 'manager', 'bdc', 'sales'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'owner', required: true },
    dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
    storeIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Store' }], default: [] },
    active: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema> & { createdAt: Date };
export type UserDocument = HydratedDocument<IUser>;
export const User = model('User', userSchema);
