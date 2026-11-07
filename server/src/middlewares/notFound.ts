import type { RequestHandler } from 'express';
import { API_MESSAGES } from '../constants/api.js';
import { AppError } from '../utils/AppError.js';

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(404, `${API_MESSAGES.notFound} (${request.method} ${request.path})`, 'NOT_FOUND'));
};
