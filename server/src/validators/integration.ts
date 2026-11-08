import { z } from 'zod';
import { INTEGRATION_PROVIDERS } from '../models/IntegrationConnection.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const credentials = z.record(z.string().trim().min(1).max(120), z.string().min(1).max(4000)).refine((value) => Object.keys(value).length > 0, 'Provide at least one credential value.');

export const saveIntegrationSchema = z.object({
  storeId: objectId.nullable().optional(),
  provider: z.enum(INTEGRATION_PROVIDERS),
  displayName: z.string().trim().min(2).max(120),
  credentials,
  scopes: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
});

export const inventoryCsvImportSchema = z.object({
  storeId: objectId,
  fileName: z.string().trim().min(1).max(180),
  csv: z.string().min(5).max(800_000),
});
