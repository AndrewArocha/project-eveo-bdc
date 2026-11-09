import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { API_MESSAGES } from '../constants/api.js';
import { AppError } from '../utils/AppError.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  void next;
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    response.status(400).json({ error: { message: 'The submitted data is invalid.', code: 'VALIDATION_ERROR' } });
    return;
  }

  if (isDuplicateKeyError(error)) {
    response.status(409).json({ error: { message: 'An account already uses that email or store code.', code: 'CONFLICT' } });
    return;
  }

  console.error('Unhandled request error:', error);
  response.status(500).json({ error: { message: API_MESSAGES.internalError, code: 'INTERNAL_ERROR' } });
};

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
