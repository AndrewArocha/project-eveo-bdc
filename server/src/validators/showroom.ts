import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const vehicle = z.record(z.string(), z.unknown()).nullable().optional();
const eventTypes = ['customer_greeted', 'visit_claimed', 'walkaround_started', 'media_added', 'test_drive_started', 'test_drive_completed', 'deal_desked', 'handoff_requested', 'handoff_accepted', 'manager_intervention', 'sla_breached', 'bdc_contact_logged', 'note_added', 'visit_completed'] as const;
const media = z.object({
  id: z.string().trim().min(1).max(120),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().max(120),
  sizeBytes: z.number().int().nonnegative().max(50_000_000),
  kind: z.enum(['image', 'video']),
  uploadedAt: z.string().datetime(),
});

export const createShowroomVisitSchema = z.object({
  storeId: objectId,
  customerId: objectId.optional(),
  customerName: z.string().trim().min(1).max(160),
  customerPhone: z.string().trim().max(40).optional(),
  greetedPerson: z.string().trim().min(1).max(80),
  greetingMedia: media.extend({ kind: z.literal('image') }),
  leadId: objectId.optional(),
  appointmentId: objectId.optional(),
  assignedUserId: objectId,
  notes: z.string().trim().max(4000).optional(),
  vehicleOfInterest: vehicle,
  tradeIn: vehicle,
});

export const appendShowroomEventSchema = z.object({
  type: z.enum(eventTypes),
  message: z.string().trim().min(1).max(2000),
  media: media.optional(),
  replyToEventId: objectId.optional(),
}).superRefine((event, context) => {
  if (event.type === 'deal_desked' && (!event.media || event.media.kind !== 'image')) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['media'], message: 'Attach a photo of the deal screen or printed desk before saving the desk step.' });
  }
});

export const assignShowroomVisitSchema = z.object({ assignedUserId: objectId });
export const createActivityEventSchema = z.object({
  storeId: objectId,
  category: z.enum(['lead', 'appointment', 'showroom', 'inventory', 'deal', 'report', 'account', 'system', 'ai']),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).optional(),
  entityType: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(80).optional(),
});
