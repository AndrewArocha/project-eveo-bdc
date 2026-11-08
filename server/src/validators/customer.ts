import { z } from 'zod';

export const createCustomerSchema = z.object({
  storeId: z.string().regex(/^[a-f\d]{24}$/i),
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase().optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();
