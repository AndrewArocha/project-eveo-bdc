import { Store } from '../models/Store.js';

export async function listStoresForDealerAccount(dealerAccountId: string) {
  return Store.find({ dealerAccountId }).sort({ createdAt: 1 }).lean();
}

export async function createStoreForDealerAccount(
  dealerAccountId: string,
  input: { name: string; code: string; website?: string; phone?: string; timezone?: string },
) {
  const store = await Store.create({ dealerAccountId, ...input });
  return store.toObject();
}

export async function updateStoreForDealerAccount(
  dealerAccountId: string,
  storeId: string,
  input: { name?: string; code?: string; website?: string; phone?: string; timezone?: string },
) {
  return Store.findOneAndUpdate(
    { _id: storeId, dealerAccountId },
    { $set: input },
    { new: true, runValidators: true },
  ).lean();
}
