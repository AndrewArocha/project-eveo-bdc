import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { env } from '../config/env.js';
import { DealerAccount } from '../models/DealerAccount.js';
import { Store } from '../models/Store.js';
import { User, type UserDocument } from '../models/User.js';
import { UserInvitation } from '../models/UserInvitation.js';
import { API_MESSAGES } from '../constants/api.js';
import { AppError } from '../utils/AppError.js';
import { toSafeUser } from '../utils/safeUser.js';

const PASSWORD_SALT_ROUNDS = 12;

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  dealershipName: string;
  storeName: string;
  website?: string;
  address?: string;
  phone?: string;
  timezone: string;
  multiStore: boolean;
}) {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new AppError(503, 'Set a JWT_SECRET of at least 32 characters before enabling account creation.', 'AUTH_NOT_CONFIGURED');
  }

  const existingUser = await User.exists({ email: input.email });
  if (existingUser) throw new AppError(409, 'An account already uses this email address.', 'EMAIL_IN_USE');

  const userId = new Types.ObjectId();
  const dealerAccountId = new Types.ObjectId();
  let accountCreated = false;
  let userCreated = false;

  try {
    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const user = await User.create({
      _id: userId,
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'owner',
      dealerAccountId,
    });
    userCreated = true;

    const account = await DealerAccount.create({
      _id: dealerAccountId,
      businessName: input.dealershipName,
      ownerId: userId,
      status: 'pending',
      multiStore: input.multiStore,
    });
    accountCreated = true;

    const storeCode = input.storeName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'STORE';
    await Store.create({
      dealerAccountId: account.id,
      name: input.storeName,
      code: storeCode,
      website: input.website ?? '',
      address: input.address ?? '',
      phone: input.phone ?? '',
      timezone: input.timezone,
    });

    return issueSession(user);
  } catch (error) {
    if (accountCreated) await DealerAccount.deleteOne({ _id: dealerAccountId });
    if (userCreated) await User.deleteOne({ _id: userId });
    throw error;
  }
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
