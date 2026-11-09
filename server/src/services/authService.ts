import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User, type UserDocument } from '../models/User.js';
import { UserInvitation } from '../models/UserInvitation.js';
import { DealerAccount } from '../models/DealerAccount.js';
import { Store } from '../models/Store.js';
import { API_MESSAGES } from '../constants/api.js';
import { AppError } from '../utils/AppError.js';
import { toSafeUser } from '../utils/safeUser.js';

const PASSWORD_SALT_ROUNDS = 12;

export async function createOwnerAccount(input: { name: string; businessName: string; phone: string; email: string; password: string }) {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new AppError(503, 'Authentication is not configured on this server.', 'AUTH_NOT_CONFIGURED');
  }
  if (await User.exists({ email: input.email })) {
    throw new AppError(409, 'An account already uses this email address. Please sign in or reset your password.', 'EMAIL_IN_USE');
  }
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const session = await mongoose.startSession();
  let createdUser: UserDocument | null = null;
  try {
    await session.withTransaction(async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const dealerAccountId = new mongoose.Types.ObjectId();
      const storeId = new mongoose.Types.ObjectId();
      const codeBase = input.businessName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'EVEO';
      const code = `${codeBase.slice(0, 10 - 4)}${storeId.toHexString().slice(-4).toUpperCase()}`;
      await DealerAccount.create([{
        _id: dealerAccountId,
        businessName: input.businessName,
        ownerId,
        status: 'pending',
        subscriptionStatus: 'pending_payment',
      }], { session });
      await Store.create([{
        _id: storeId,
        dealerAccountId,
        name: input.businessName,
        code,
        phone: input.phone,
        timezone: 'America/New_York',
      }], { session });
      const [user] = await User.create([{
        _id: ownerId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: 'owner',
        dealerAccountId,
        storeIds: [storeId],
        active: true,
      }], { session });
      createdUser = user as UserDocument;
    });
  } finally {
    await session.endSession();
  }
  if (!createdUser) throw new AppError(500, 'The EVEO account could not be created.', 'SIGNUP_FAILED');
  return issueSession(createdUser);
}

export async function signIn(email: string, password: string) {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new AppError(503, 'Authentication is not configured on this server.', 'AUTH_NOT_CONFIGURED');
  }

  const user = await User.findOne({ email, active: true }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, API_MESSAGES.invalidCredentials, 'INVALID_CREDENTIALS');
  }

  return issueSession(user);
}

export async function acceptUserInvitation(input: { token: string; name: string; password: string }) {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new AppError(503, 'Authentication is not configured on this server.', 'AUTH_NOT_CONFIGURED');
  }
  const tokenHash = createHash('sha256').update(input.token).digest('hex');
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const session = await mongoose.startSession();
  let acceptedUser: UserDocument | null = null;
  try {
    await session.withTransaction(async () => {
      const invitation = await UserInvitation.findOne({ tokenHash, status: 'pending', expiresAt: { $gt: new Date() } })
        .select('+tokenHash').session(session);
      if (!invitation) throw new AppError(400, 'This invitation is invalid, expired, or already used.', 'INVITATION_INVALID');

      const created = await User.create([{
        name: input.name,
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        dealerAccountId: invitation.dealerAccountId,
        storeIds: invitation.storeIds,
        active: true,
      }], { session });
      acceptedUser = created[0] as UserDocument;
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      await invitation.save({ session });
    });
  } finally {
    await session.endSession();
  }
  if (!acceptedUser) throw new AppError(400, 'This invitation could not be accepted.', 'INVITATION_INVALID');
  return issueSession(acceptedUser);
}

function issueSession(user: UserDocument) {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new AppError(503, 'Authentication is not configured on this server.', 'AUTH_NOT_CONFIGURED');
  }
  const token = jwt.sign(
    {},
    env.jwtSecret,
    { subject: user.id, expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
  );
  return { token, user: toSafeUser(user) };
}
