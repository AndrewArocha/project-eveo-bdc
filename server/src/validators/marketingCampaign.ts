import { z } from 'zod';
const id = z.string().regex(/^[a-f\d]{24}$/i);
export const createCampaignSchema = z.object({ storeId: id, title: z.string().trim().min(1).max(160), channel: z.enum(['facebook', 'instagram', 'tiktok', 'linkedin', 'email', 'whatsapp']), caption: z.string().trim().min(1).max(5000), media: z.array(z.object({ visitId: id.optional(), eventId: id.optional(), url: z.url().max(2000).optional(), alt: z.string().max(300).optional() })).max(10).optional() });
export const campaignStatusSchema = z.object({ status: z.enum(['draft', 'pending_approval', 'approved']) });
