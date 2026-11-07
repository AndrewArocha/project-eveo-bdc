import { z } from 'zod';

const storeFields = {
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(16).regex(/^[a-zA-Z0-9-]+$/).transform((value) => value.toUpperCase()),
  website: z.url().trim().max(2048).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
};

export const createStoreSchema = z.object({
  name: storeFields.name,
  code: storeFields.code,
  website: storeFields.website,
  phone: storeFields.phone,
  timezone: storeFields.timezone,
});

export const updateStoreSchema = z.object({
  name: storeFields.name.optional(),
  code: storeFields.code.optional(),
  website: storeFields.website,
  phone: storeFields.phone,
  timezone: storeFields.timezone,
}).refine((value) => Object.values(value).some((item) => item !== undefined), {
  message: 'Provide at least one store field to update.',
});
