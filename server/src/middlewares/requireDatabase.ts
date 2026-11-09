import type { RequestHandler } from 'express';
import { isDatabaseReady } from '../config/database.js';
import { API_MESSAGES } from '../constants/api.js';
import { AppError } from '../utils/AppError.js';

export const requireDatabase: RequestHandler = (_request, _response, next) => {
  if (!isDatabaseReady()) {
    next(new AppError(503, API_MESSAGES.databaseUnavailable, 'DATABASE_UNAVAILABLE'));
    return;
  }
  next();
};
