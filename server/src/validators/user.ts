import { z } from 'zod';
import { USER_ROLES } from '../models/User.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const employeeRoles = USER_ROLES.filter((role) => role !== 'owner') as Exclude<(typeof USER_ROLES)[number], 'owner'>[];

export const createUserInvitationSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: z.enum(employeeRoles),
  storeIds: z.array(objectId).min(1).max(50).transform((ids) => [...new Set(ids)]),
});

export const revokeUserInvitationSchema = z.object({});

export const updateMyProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(40).optional(),
  workPhone: z.string().trim().max(40).optional(),
});

const shift = z.object({ start: z.string().trim().min(1).max(20), end: z.string().trim().min(1).max(20) });
export const updateMyScheduleSchema = z.object({
  schedule: z.record(z.string(), shift).refine((value) => Object.keys(value).every((day) => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)), 'Choose valid weekdays.'),
});

export const changeMyPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
});
