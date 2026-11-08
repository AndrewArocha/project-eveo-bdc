import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../constants/api.js';

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().min(7).max(40),
  businessName: z.string().trim().min(2).max(120),
});

export const signinSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(32).max(256),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
});
