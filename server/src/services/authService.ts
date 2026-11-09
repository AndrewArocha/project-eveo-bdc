import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
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

export async function createOwnerAccount(input: { name: string; businessName: string; phone: string; email: string; password: string; promotionalConsent?: boolean }) {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new AppError(503, 'Authentication is not configured on this server.', 'AUTH_NOT_CONFIGURED');
  }
  if (await User.exists({ email: input.email })) {
    throw new AppError(409, 'An account already uses this email address. Please sign in or reset your password.', 'EMAIL_IN_USE');
  }
  if (env.authEmailVerificationRequired && (!env.resendApiKey || !env.authEmailFrom)) {
    throw new AppError(503, 'Email verification is not configured yet. Please try again later.', 'EMAIL_NOT_CONFIGURED');
  }
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const verificationToken = randomBytes(32).toString('base64url');
  const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');
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
        emailVerifiedAt: env.authEmailVerificationRequired ? null : new Date(),
        ...(env.authEmailVerificationRequired ? {
          emailVerificationTokenHash: verificationTokenHash,
          emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        } : {}),
        promotionalConsent: input.promotionalConsent === true,
        demoMode: true,
      }], { session });
      createdUser = user as UserDocument;
    });
  } finally {
    await session.endSession();
  }
  if (!createdUser) throw new AppError(500, 'The EVEO account could not be created.', 'SIGNUP_FAILED');
  if (!env.authEmailVerificationRequired) return { verificationRequired: false, email: input.email, session: issueSession(createdUser) };
  const verifyUrl = new URL('/verify-email', env.clientOrigins[0] || 'http://localhost:3000');
  verifyUrl.searchParams.set('token', verificationToken);
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.authEmailFrom,
      to: [input.email],
      subject: 'Verify your EVEO email address',
      html: `<p>Hi ${escapeHtml(input.name)},</p><p>Verify your email to open the EVEO demo workspace.</p><p><a href="${verifyUrl.toString()}">Verify email</a></p><p>This link expires in 24 hours. If you did not request an account, you can ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!emailResponse?.ok) {
    throw new AppError(502, 'Your account request was saved, but the verification email could not be sent. Contact EVEO support to finish setup.', 'VERIFICATION_EMAIL_FAILED');
  }
  return { verificationRequired: true, email: input.email };
}

export async function verifyOwnerEmail(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: { $gt: new Date() }, active: true }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
  if (!user) throw new AppError(400, 'This verification link is invalid or expired. Request a new one to continue.', 'EMAIL_VERIFICATION_INVALID');
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  return issueSession(user);
}

export async function resendOwnerVerification(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email, active: true }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash)) || user.emailVerifiedAt) return { requested: true };
  if (!env.resendApiKey || !env.authEmailFrom) throw new AppError(503, 'Email verification is not configured yet. Please try again later.', 'EMAIL_NOT_CONFIGURED');
  const token = randomBytes(32).toString('base64url');
  user.emailVerificationTokenHash = createHash('sha256').update(token).digest('hex');
  user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  const verifyUrl = new URL('/verify-email', env.clientOrigins[0] || 'http://localhost:3000');
  verifyUrl.searchParams.set('token', token);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.authEmailFrom, to: [input.email], subject: 'Verify your EVEO email address', html: `<p>Hi ${escapeHtml(user.name)},</p><p>Use this secure link to verify your EVEO email address:</p><p><a href="${verifyUrl.toString()}">Verify email</a></p><p>This link expires in 24 hours.</p>` }),
  }).catch(() => null);
  if (!response?.ok) throw new AppError(502, 'The verification email could not be sent. Please try again later.', 'VERIFICATION_EMAIL_FAILED');
  return { requested: true };
}

export async function signIn(email: string, password: string) {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new AppError(503, 'Authentication is not configured on this server.', 'AUTH_NOT_CONFIGURED');
  }

  const user = await User.findOne({ email, active: true }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, API_MESSAGES.invalidCredentials, 'INVALID_CREDENTIALS');
  }
  if (!user.emailVerifiedAt && env.authEmailVerificationRequired) throw new AppError(403, 'Verify your email before signing in. Check your inbox for the EVEO verification link.', 'EMAIL_NOT_VERIFIED');
  if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
  }

  return issueSession(user);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
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
        emailVerifiedAt: new Date(),
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
