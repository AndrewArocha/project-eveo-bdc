import { z } from 'zod';
const id = z.string().regex(/^[a-f\d]{24}$/i);
export const createFollowUpSchema = z.object({ storeId: id, customerId: id, leadId: id.optional(), appointmentId: id.optional(), assignedStoreUserId: id, title: z.string().trim().min(1).max(160), notes: z.string().max(2000).optional(), dueAt: z.iso.datetime() });
export const updateFollowUpSchema = z.object({ status: z.enum(['open', 'completed', 'cancelled']) });
