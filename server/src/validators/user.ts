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
