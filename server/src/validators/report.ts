import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const dateTime = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const reportPeriodSchema = z.object({
  storeId: objectId,
  startAt: dateTime,
  endAt: dateTime,
}).refine((period) => period.startAt < period.endAt, {
  message: 'The report start must be earlier than its end.',
  path: ['endAt'],
}).refine((period) => period.endAt.getTime() - period.startAt.getTime() <= 366 * 24 * 60 * 60 * 1000, {
  message: 'A report period cannot exceed 366 days.',
  path: ['endAt'],
});

export const reportPeriodQuerySchema = z.object({
  storeId: objectId,
  startAt: z.iso.datetime({ offset: true }).optional(),
  endAt: z.iso.datetime({ offset: true }).optional(),
});
