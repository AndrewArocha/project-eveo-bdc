import { model, Schema, type InferSchemaType } from 'mongoose';

export const INTEGRATION_PROVIDERS = ['net2phone', 'dealercenter', 'gohighlevel', 'website_inventory', 'custom_api'] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

const encryptedSecretSchema = new Schema({
  version: { type: Number, required: true, default: 1 },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  ciphertext: { type: String, required: true },
}, { _id: false });

const integrationConnectionSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
  provider: { type: String, enum: INTEGRATION_PROVIDERS, required: true },
  displayName: { type: String, required: true, trim: true, maxlength: 120 },
  status: { type: String, enum: ['pending_configuration', 'connected', 'error', 'disabled'], default: 'pending_configuration', required: true },
  encryptedCredentials: { type: encryptedSecretSchema, required: true, select: false },
  scopes: { type: [String], default: [] },
  lastSyncedAt: { type: Date, default: null },
  lastError: { type: String, default: '', maxlength: 500 },
  createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

integrationConnectionSchema.index({ dealerAccountId: 1, storeId: 1, provider: 1 }, { unique: true });

export type IIntegrationConnection = InferSchemaType<typeof integrationConnectionSchema>;
export const IntegrationConnection = model('IntegrationConnection', integrationConnectionSchema);
