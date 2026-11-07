import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../constants/api.js';

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
  dealershipName: z.string().trim().min(2).max(120),
  storeName: z.string().trim().min(2).max(120),
  website: z.url().trim().max(2048),
  address: z.string().trim().min(5).max(300),
  phone: z.string().trim().min(7).max(40),
  timezone: z.string().trim().min(1).max(100),
  multiStore: z.boolean().default(false),
});

export const signinSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});
