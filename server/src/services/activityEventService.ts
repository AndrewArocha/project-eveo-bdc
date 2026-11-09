import { ActivityEvent } from '../models/ActivityEvent.js';
import { User } from '../models/User.js';

export async function recordActivityEventSafely(input: {
  dealerAccountId: string;
  storeId: string;
  userId: string;
  category: 'lead' | 'appointment' | 'inventory' | 'deal';
  title: string;
  description?: string;
  entityType: string;
  entityId: string;
}) {
  try {
    const actor = await User.findById(input.userId).select('name').lean();
    if (!actor) return;
    await ActivityEvent.create({
      dealerAccountId: input.dealerAccountId,
      storeId: input.storeId,
      actorUserId: input.userId,
      actorName: actor.name,
      category: input.category,
      title: input.title,
      description: input.description ?? '',
      entityType: input.entityType,
      entityId: input.entityId,
    });
  } catch (error) {
    console.error('Could not record a domain activity event.', {
      category: input.category,
      entityType: input.entityType,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
  }
}
