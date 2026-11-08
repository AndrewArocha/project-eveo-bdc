import type { RequestHandler } from 'express';
import { acceptUserInvitation, signIn, signUp } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signup: RequestHandler = asyncHandler(async (request, response) => {
  const session = await signUp(request.body);
  response.status(201).json({ data: session });
});

export const signin: RequestHandler = asyncHandler(async (request, response) => {
  const session = await signIn(request.body.email, request.body.password);
  response.status(200).json({ data: session });
});

export const acceptInvitation: RequestHandler = asyncHandler(async (request, response) => {
  const session = await acceptUserInvitation(request.body);
  response.status(201).json({ data: session });
});
