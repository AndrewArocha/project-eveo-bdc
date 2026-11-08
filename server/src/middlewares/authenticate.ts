import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { API_MESSAGES } from '../constants/api.js';
import { DealerAccount } from '../models/DealerAccount.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate: RequestHandler = asyncHandler(async (request, _response, next) => {
  const token = request.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !env.jwtSecret) {
    next(new AppError(401, API_MESSAGES.unauthorized, 'UNAUTHORIZED'));
    return;
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    next(new AppError(401, API_MESSAGES.unauthorized, 'UNAUTHORIZED'));
    return;
  }

  const { sub } = payload;
  if (typeof sub !== 'string') {
    next(new AppError(401, API_MESSAGES.unauthorized, 'UNAUTHORIZED'));
    return;
  }

  const user = await User.findOne({ _id: sub, active: true });
  if (!user) throw new AppError(401, API_MESSAGES.unauthorized, 'UNAUTHORIZED');
  const account = await DealerAccount.findById(user.dealerAccountId).select('status');
  if (!account || account.status === 'suspended') {
    throw new AppError(403, API_MESSAGES.forbidden, 'ACCOUNT_SUSPENDED');
  }
  request.auth = {
    userId: user.id,
    role: user.role,
    dealerAccountId: user.dealerAccountId.toString(),
    storeIds: user.storeIds.map((storeId) => storeId.toString()),
  };
  next();
});
