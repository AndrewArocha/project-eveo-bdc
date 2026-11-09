import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../models/User.js';

export function toSafeUser(user: HydratedDocument<IUser>, demoMode: boolean) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    demoMode,
    phone: user.phone || '',
    workPhone: user.workPhone || '',
    weeklySchedule: user.weeklySchedule || {},
    role: user.role,
    dealerAccountId: user.dealerAccountId,
    storeIds: user.storeIds.map((storeId) => storeId.toString()),
    createdAt: user.createdAt,
  };
}
