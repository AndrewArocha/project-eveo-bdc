import { Types } from 'mongoose';
import { IntegrationConnection, type IntegrationProvider } from '../models/IntegrationConnection.js';
import { Store } from '../models/Store.js';
import { encryptCredentials } from '../utils/credentialVault.js';
import { AppError } from '../utils/AppError.js';

function safeConnection(connection: { _id: Types.ObjectId; storeId?: Types.ObjectId | null; provider: string; displayName: string; status: string; scopes: string[]; lastSyncedAt?: Date | null; lastError?: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: connection._id.toString(), storeId: connection.storeId?.toString() ?? null,
    provider: connection.provider, displayName: connection.displayName, status: connection.status,
    credentialsConfigured: true, scopes: connection.scopes,
    lastSyncedAt: connection.lastSyncedAt, lastError: connection.lastError,
    createdAt: connection.createdAt, updatedAt: connection.updatedAt,
  };
}

export async function listIntegrationConnections(dealerAccountId: string, storeId?: string) {
  const filter: Record<string, unknown> = { dealerAccountId };
  if (storeId) filter.$or = [{ storeId }, { storeId: null }];
  return (await IntegrationConnection.find(filter).sort({ provider: 1, displayName: 1 }).lean()).map(safeConnection);
}

export async function saveIntegrationConnection(
  input: { storeId?: string | null; provider: IntegrationProvider; displayName: string; credentials: Record<string, string>; scopes: string[] },
  dealerAccountId: string,
  userId: string,
) {
  if (input.storeId && !(await Store.exists({ _id: input.storeId, dealerAccountId, active: true }))) {
    throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  }
  const secret = encryptCredentials(input.credentials);
  const connection = await IntegrationConnection.findOneAndUpdate(
    { dealerAccountId, storeId: input.storeId ?? null, provider: input.provider },
    { $set: {
      displayName: input.displayName, encryptedCredentials: secret, scopes: input.scopes,
      status: 'pending_configuration', lastError: '', lastSyncedAt: null,
    }, $setOnInsert: { dealerAccountId, storeId: input.storeId ?? null, provider: input.provider, createdByUserId: userId } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  return safeConnection(connection);
}

export async function setIntegrationStatus(id: string, dealerAccountId: string, status: 'disabled') {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Integration not found.', 'INTEGRATION_NOT_FOUND');
  const connection = await IntegrationConnection.findOneAndUpdate({ _id: id, dealerAccountId }, { $set: { status } }, { new: true }).lean();
  if (!connection) throw new AppError(404, 'Integration not found.', 'INTEGRATION_NOT_FOUND');
  return safeConnection(connection);
}
