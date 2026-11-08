import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const statuses = ['pending_confirmation', 'confirmed', 'arrived', 'showed', 'no_show', 'cancelled', 'sold'] as const;

export const createAppointmentSchema = z.object({
  storeId: objectId,
  customerId: objectId.optional(),
  leadId: objectId.optional(),
  customerNameSnapshot: z.string().trim().min(1).max(160),
  phoneSnapshot: z.string().trim().max(40).optional(),
  inventoryVehicleId: objectId.optional(),
  vehicleSnapshot: z.string().trim().max(180).optional(),
  scheduledAt: z.iso.datetime().optional(),
  status: z.enum(statuses).optional(),
  assignedPlatformUserId: objectId.optional(),
  assignedStoreUserId: objectId.optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const updateAppointmentStatusSchema = z.object({ status: z.enum(statuses) });
export const updateAppointmentDetailsSchema = z.object({ scheduledAt: z.iso.datetime().optional(), assignedPlatformUserId: objectId.nullable().optional(), assignedStoreUserId: objectId.nullable().optional() }).refine((value) => Object.keys(value).length > 0);
