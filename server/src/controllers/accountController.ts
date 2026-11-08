import type { RequestHandler } from 'express';
import { DealerAccount } from '../models/DealerAccount.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const getOnboarding: RequestHandler = asyncHandler(async (req, res) => {
  const account = await DealerAccount.findById(req.auth!.dealerAccountId).select('businessName status multiStore onboardingCompletedSteps subscriptionStatus trialEndsAt').lean();
  if (!account) throw new AppError(404, 'Dealership account not found.', 'ACCOUNT_NOT_FOUND');
  res.json({ data: account });
});
export const completeOnboardingStep: RequestHandler = asyncHandler(async (req, res) => {
  if (req.auth!.role !== 'owner') throw new AppError(403, 'Only the owner can update onboarding.', 'FORBIDDEN');
  const step = String(req.body.step);
  const account = await DealerAccount.findOneAndUpdate({ _id: req.auth!.dealerAccountId }, { $addToSet: { onboardingCompletedSteps: step } }, { new: true }).select('businessName status onboardingCompletedSteps subscriptionStatus trialEndsAt');
  if (!account) throw new AppError(404, 'Dealership account not found.', 'ACCOUNT_NOT_FOUND');
  res.json({ data: account });
});
async function requirePlatformAdmin(userId: string) {
  const user = await User.findById(userId).select('email').lean();
  if (!user || !env.platformAdminEmails.includes(user.email.toLowerCase())) throw new AppError(403, 'This account is not configured as an EVEO platform administrator.', 'FORBIDDEN');
}
export const listPlatformAccounts: RequestHandler = asyncHandler(async (req, res) => {
  await requirePlatformAdmin(req.auth!.userId);
  const accounts = await DealerAccount.find().sort({ createdAt: -1 }).limit(200).populate('ownerId', 'name email').lean();
  res.json({ data: accounts });
});
export const updatePlatformAccount: RequestHandler = asyncHandler(async (req, res) => {
  await requirePlatformAdmin(req.auth!.userId);
  const account = await DealerAccount.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
  if (!account) throw new AppError(404, 'Dealership account not found.', 'ACCOUNT_NOT_FOUND');
  res.json({ data: account });
});
export const updateStoreOnboarding: RequestHandler = asyncHandler(async (req, res) => {
  if (req.auth!.role !== 'owner') throw new AppError(403, 'Only the owner can update store setup.', 'FORBIDDEN');
  const store = await Store.findOneAndUpdate({ _id: req.body.storeId, dealerAccountId: req.auth!.dealerAccountId }, { $set: { name: req.body.name, timezone: req.body.timezone, website: req.body.website, phone: req.body.phone, address: req.body.address } }, { new: true, runValidators: true });
  if (!store) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  res.json({ data: store });
});
