import { Types } from 'mongoose';
import { DealerAccount } from '../models/DealerAccount.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { UserInvitation } from '../models/UserInvitation.js';
import { AppError } from '../utils/AppError.js';

export async function listDealerUsers(dealerAccountId: string, storeId: string) {
  if (!Types.ObjectId.isValid(storeId) || !(await Store.exists({ _id: storeId, dealerAccountId, active: true }))) {
    throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  }
  return User.find({ dealerAccountId, active: true, $or: [{ role: 'owner' }, { storeIds: storeId }] })
    .sort({ role: 1, name: 1 }).lean();
}

export async function createDealerUserInvitation(input: { email: string; role: Exclude<import('../models/User.js').UserRole, 'owner'>; storeIds: string[] }, userId: string, dealerAccountId: string, tokenHash: string) {
  const dealerAccount = await DealerAccount.findById(dealerAccountId).select('multiStore').lean();
  if (!dealerAccount) throw new AppError(404, 'Dealer account not found.', 'DEALER_ACCOUNT_NOT_FOUND');
  if (!dealerAccount.multiStore && input.storeIds.length > 1) {
    throw new AppError(400, 'This dealer account is configured for one store.', 'MULTI_STORE_NOT_ENABLED');
  }

  const stores = await Store.find({ _id: { $in: input.storeIds }, dealerAccountId, active: true }).select('_id').lean();
  if (stores.length !== input.storeIds.length) throw new AppError(400, 'Every assigned store must belong to this dealer account and be active.', 'INVALID_STORE_ASSIGNMENT');
  if (await User.exists({ email: input.email })) throw new AppError(409, 'A user already uses this email address.', 'EMAIL_IN_USE');
  await UserInvitation.updateMany({ dealerAccountId, email: input.email, status: 'pending', expiresAt: { $lte: new Date() } }, { $set: { status: 'revoked' } });
  if (await UserInvitation.exists({ dealerAccountId, email: input.email, status: 'pending', expiresAt: { $gt: new Date() } })) {
    throw new AppError(409, 'A pending invitation already exists for this email.', 'INVITATION_PENDING');
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await UserInvitation.create({
    dealerAccountId, storeIds: input.storeIds, email: input.email, role: input.role, tokenHash,
    invitedByUserId: userId, expiresAt,
  });
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    storeIds: invitation.storeIds.map((storeId) => storeId.toString()),
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
  };
}

export async function listDealerUserInvitations(dealerAccountId: string, storeId: string) {
  if (!Types.ObjectId.isValid(storeId) || !(await Store.exists({ _id: storeId, dealerAccountId, active: true }))) {
    throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  }
  const invitations = await UserInvitation.find({ dealerAccountId, storeIds: storeId, status: 'pending', expiresAt: { $gt: new Date() } })
    .select('-tokenHash').sort({ createdAt: -1 }).lean();
  return invitations.map((invitation) => ({
    id: invitation._id.toString(), email: invitation.email, role: invitation.role,
    storeIds: invitation.storeIds.map((id) => id.toString()), status: invitation.status,
    expiresAt: invitation.expiresAt, createdAt: invitation.createdAt,
  }));
}

export async function revokeDealerUserInvitation(id: string, dealerAccountId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Invitation not found.', 'INVITATION_NOT_FOUND');
  const invitation = await UserInvitation.findOneAndUpdate(
    { _id: id, dealerAccountId, status: 'pending' },
    { $set: { status: 'revoked' } },
    { new: true },
  ).select('-tokenHash').lean();
  if (!invitation) throw new AppError(404, 'Pending invitation not found.', 'INVITATION_NOT_FOUND');
  return { id: invitation._id.toString(), status: invitation.status };
}
