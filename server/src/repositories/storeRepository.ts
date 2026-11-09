import { DealerAccount } from '../models/DealerAccount.js';
import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';

export async function listStoresForDealerAccount(dealerAccountId: string, role: string, storeIds: string[]) {
  const filter = role === 'owner' ? { dealerAccountId } : { dealerAccountId, _id: { $in: storeIds } };
  return Store.find(filter).sort({ createdAt: 1 }).lean();
}

export async function createStoreForDealerAccount(
  dealerAccountId: string,
  input: { name: string; code: string; website?: string; phone?: string; address?: string; timezone: string },
) {
  const dealerAccount = await DealerAccount.findById(dealerAccountId).select('multiStore').lean();
  if (!dealerAccount) throw new AppError(404, 'Dealer account not found.', 'DEALER_ACCOUNT_NOT_FOUND');
  if (!dealerAccount.multiStore) throw new AppError(403, 'This dealer account is configured for one store.', 'MULTI_STORE_NOT_ENABLED');
  const store = await Store.create({ dealerAccountId, ...input });
  return store.toObject();
}

export async function updateStoreForDealerAccount(
  dealerAccountId: string,
  storeId: string,
  input: { name?: string; code?: string; website?: string; phone?: string; address?: string; timezone?: string },
) {
  return Store.findOneAndUpdate(
    { _id: storeId, dealerAccountId },
    { $set: input },
    { new: true, runValidators: true },
  ).lean();
}
