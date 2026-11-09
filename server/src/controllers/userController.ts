import type { RequestHandler } from 'express';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toSafeUser } from '../utils/safeUser.js';
import { randomBytes, createHash } from 'crypto';
import { Types } from 'mongoose';
import { createDealerUserInvitation, listDealerUserInvitations, listDealerUsers, revokeDealerUserInvitation } from '../repositories/userRepository.js';
import bcrypt from 'bcryptjs';

function requireOwner(request: Parameters<RequestHandler>[0]) {
  if (request.auth?.role !== 'owner') throw new AppError(403, 'Only the dealership owner can manage employee invitations.', 'FORBIDDEN');
}

export const getCurrentUser: RequestHandler = asyncHandler(async (request, response) => {
  const user = await User.findOne({ _id: request.auth?.userId, active: true });
  if (!user) throw new AppError(401, 'The account is no longer active.', 'UNAUTHORIZED');
  response.json({ data: toSafeUser(user) });
});

export const updateCurrentUser: RequestHandler = asyncHandler(async (request, response) => {
  const user = await User.findOneAndUpdate(
    { _id: request.auth?.userId, active: true },
    { $set: { name: request.body.name, phone: request.body.phone ?? '' } },
    { new: true, runValidators: true },
  );
  if (!user) throw new AppError(401, 'The account is no longer active.', 'UNAUTHORIZED');
  response.json({ data: toSafeUser(user) });
});

export const updateCurrentUserSchedule: RequestHandler = asyncHandler(async (request, response) => {
  const user = await User.findOneAndUpdate(
    { _id: request.auth?.userId, active: true },
    { $set: { weeklySchedule: request.body.schedule } },
    { new: true, runValidators: true },
  );
  if (!user) throw new AppError(401, 'The account is no longer active.', 'UNAUTHORIZED');
  response.json({ data: toSafeUser(user) });
});

export const changeCurrentUserPassword: RequestHandler = asyncHandler(async (request, response) => {
  const user = await User.findOne({ _id: request.auth?.userId, active: true }).select('+passwordHash');
  if (!user) throw new AppError(401, 'The account is no longer active.', 'UNAUTHORIZED');
  if (!await bcrypt.compare(request.body.currentPassword, user.passwordHash)) {
    throw new AppError(400, 'Current password is incorrect.', 'CURRENT_PASSWORD_INVALID');
  }
  user.passwordHash = await bcrypt.hash(request.body.newPassword, 12);
  await user.save();
  response.json({ data: { updated: true } });
});

export const listOwnStoreUsers: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  response.json({ data: (await listDealerUsers(request.auth!.dealerAccountId, storeId)).map((user) => ({
    id: user._id.toString(), name: user.name, email: user.email, role: user.role,
    dealerAccountId: user.dealerAccountId.toString(), storeIds: user.storeIds.map((id) => id.toString()), createdAt: user.createdAt,
  })) });
});

export const createOwnUserInvitation: RequestHandler = asyncHandler(async (request, response) => {
  requireOwner(request);
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const invitation = await createDealerUserInvitation(request.body, request.auth!.userId, request.auth!.dealerAccountId, tokenHash);
  response.status(201).json({ data: { ...invitation, token } });
});

export const listOwnUserInvitations: RequestHandler = asyncHandler(async (request, response) => {
  requireOwner(request);
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  response.json({ data: await listDealerUserInvitations(request.auth!.dealerAccountId, storeId) });
});

export const revokeOwnUserInvitation: RequestHandler = asyncHandler(async (request, response) => {
  requireOwner(request);
  const id = request.params.id;
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) throw new AppError(404, 'Invitation not found.', 'INVITATION_NOT_FOUND');
  response.json({ data: await revokeDealerUserInvitation(id, request.auth!.dealerAccountId) });
});
