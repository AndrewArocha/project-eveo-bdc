import { z } from 'zod';
const id = z.string().regex(/^[a-f\d]{24}$/i);
export const createDealSchema = z.object({ storeId: id, customerId: id, leadId: id.optional(), appointmentId: id.optional(), showroomVisitId: id.optional(), inventoryVehicleId: id.optional(), assignedStoreUserId: id, vehicleSnapshot: z.string().trim().min(1).max(180), stockNumberSnapshot: z.string().trim().max(40).optional(), salePrice: z.number().nonnegative(), frontGross: z.number().optional(), backGross: z.number().optional(), notes: z.string().max(4000).optional() });
export const updateDealStatusSchema = z.object({ status: z.enum(['pending', 'negotiation', 'sold', 'delivered', 'cancelled', 'reversed']), note: z.string().trim().max(500).optional() });
