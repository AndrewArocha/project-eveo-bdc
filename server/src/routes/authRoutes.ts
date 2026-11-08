import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { acceptInvitation, signin, signup } from '../controllers/authController.js';
import { validateBody } from '../validators/validate.js';
import { acceptInvitationSchema, signinSchema, signupSchema } from '../validators/auth.js';

export const authRoutes = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many sign-in attempts. Please try again later.', code: 'RATE_LIMITED' } },
});

authRoutes.post('/signup', authLimiter, validateBody(signupSchema), signup);
authRoutes.post('/signin', authLimiter, validateBody(signinSchema), signin);
authRoutes.post('/accept-invitation', authLimiter, validateBody(acceptInvitationSchema), acceptInvitation);
