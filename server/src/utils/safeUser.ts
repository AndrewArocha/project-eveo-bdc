import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../models/User.js';

export function toSafeUser(user: HydratedDocument<IUser>) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    dealerAccountId: user.dealerAccountId,
    createdAt: user.createdAt,
  };
}
