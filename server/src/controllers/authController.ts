import type { RequestHandler } from 'express';
import { acceptUserInvitation, createOwnerAccount, resendOwnerVerification, signIn, verifyOwnerEmail } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signup: RequestHandler = asyncHandler(async (request, response) => {
  const session = await createOwnerAccount(request.body);
  response.status(202).json({ data: session });
});

export const verifyEmail: RequestHandler = asyncHandler(async (request, response) => {
  const session = await verifyOwnerEmail(request.body.token);
  response.status(200).json({ data: session });
});

export const resendVerification: RequestHandler = asyncHandler(async (request, response) => {
  await resendOwnerVerification(request.body);
  response.status(200).json({ data: { requested: true } });
});

export const signin: RequestHandler = asyncHandler(async (request, response) => {
  const session = await signIn(request.body.email, request.body.password);
  response.status(200).json({ data: session });
});

export const acceptInvitation: RequestHandler = asyncHandler(async (request, response) => {
  const session = await acceptUserInvitation(request.body);
  response.status(201).json({ data: session });
});
