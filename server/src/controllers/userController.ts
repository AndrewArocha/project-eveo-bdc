import type { RequestHandler } from 'express';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toSafeUser } from '../utils/safeUser.js';

export const getCurrentUser: RequestHandler = asyncHandler(async (request, response) => {
  const user = await User.findOne({ _id: request.auth?.userId, active: true });
  if (!user) throw new AppError(401, 'The account is no longer active.', 'UNAUTHORIZED');
  response.json({ data: toSafeUser(user) });
});
