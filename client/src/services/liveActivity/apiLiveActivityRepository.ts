import { apiRequest } from '../apiClient';
import type { ActivityCategory } from '../../components/UI/LiveActivityPulse';
import type { LiveFeedPost } from './liveActivityStore';

type ApiActivityCategory = 'lead' | 'appointment' | 'showroom' | 'inventory' | 'deal' | 'report' | 'account' | 'system' | 'ai';
interface ApiActivityEvent {
  _id: string; storeId: string; actorName: string; category: ApiActivityCategory; title: string;
  description: string; entityType: string; entityId: string; occurredAt: string;
}
const categoryMap: Record<ApiActivityCategory, ActivityCategory> = {
  lead: 'lead', appointment: 'appointment', showroom: 'showroom', inventory: 'inventory',
  deal: 'showroom', report: 'report', account: 'account', system: 'account', ai: 'ai_high_intent',
};

function mapEvent(event: ApiActivityEvent): LiveFeedPost {
  return {
    id: event._id, storeId: event.storeId, agentName: event.actorName, initials: event.actorName.slice(0, 2).toUpperCase(),
    role: 'staff', priority: 1, category: categoryMap[event.category], title: event.title, detail: event.description,
    route: event.entityType === 'showroom_visit' && event.entityId
      ? `/app/showroom?view=visit&visitId=${encodeURIComponent(event.entityId)}`
      : `/app/showroom?view=activity`,
    timestamp: Date.parse(event.occurredAt), comments: [],
  };
}

export const apiLiveActivityRepository = {
  async list(storeId: string) {
    const events = await apiRequest<ApiActivityEvent[]>(`/activity?${new URLSearchParams({ storeId }).toString()}`);
    return events.map(mapEvent);
  },
  async create(input: { storeId: string; category: ActivityCategory; title: string; description?: string; entityId?: string }) {
    const category: ApiActivityCategory = input.category === 'ai_high_intent' || input.category === 'ai_scan' ? 'ai'
      : input.category === 'contact' || input.category === 'bulk' ? 'lead' : input.category;
    const event = await apiRequest<ApiActivityEvent>('/activity', { method: 'POST', body: JSON.stringify({
      storeId: input.storeId, category, title: input.title, description: input.description, entityType: 'manual_activity', entityId: input.entityId,
    }) });
    return mapEvent(event);
  },
};
