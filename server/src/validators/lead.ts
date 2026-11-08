import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export const createLeadSchema = z.object({
  storeId: objectId,
  customerId: objectId.optional(),
  customerNameSnapshot: z.string().trim().min(1).max(160),
  phoneSnapshot: z.string().trim().max(40).optional(),
  emailSnapshot: z.email().trim().toLowerCase().optional().or(z.literal('')),
  vehicleOfInterest: z.string().trim().max(180).optional(),
  inventoryVehicleId: objectId.optional(),
  source: z.string().trim().max(120).optional(),
  assignedPlatformUserId: objectId.optional(),
  assignedStoreUserId: objectId.optional(),
  notes: z.string().trim().max(4000).optional(),
});
