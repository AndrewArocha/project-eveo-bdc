import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User, type UserDocument } from '../models/User.js';
import { UserInvitation } from '../models/UserInvitation.js';
import { SignupApplication } from '../models/SignupApplication.js';
import { API_MESSAGES } from '../constants/api.js';
import { AppError } from '../utils/AppError.js';
import { toSafeUser } from '../utils/safeUser.js';

const PASSWORD_SALT_ROUNDS = 12;

export async function submitSignupApplication(input: { name: string; businessName: string; phone: string; email: string }) {
  if (await User.exists({ email: input.email })) {
    throw new AppError(409, 'An account already uses this email address. Please sign in or contact EVEO support.', 'EMAIL_IN_USE');
  }
  const existing = await SignupApplication.findOne({ email: input.email });
  if (existing && existing.status !== 'closed' && existing.status !== 'converted') {
    existing.name = input.name;
    existing.businessName = input.businessName;
    existing.phone = input.phone;
    existing.status = 'submitted';
    existing.submittedAt = new Date();
    await existing.save();
    return { status: existing.status, submittedAt: existing.submittedAt };
  }
  const application = await SignupApplication.create(input);
  return { status: application.status, submittedAt: application.submittedAt };
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
