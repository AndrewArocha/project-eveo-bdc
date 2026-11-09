import { ApiError, apiRequest } from '../apiClient';
import type { ShowroomRepository, ShowroomVisitSnapshot, CreateShowroomVisitInput, AppendShowroomEventInput, AssignShowroomVisitInput, ShowroomEventType } from '../../types/showroom';
import type { ShowroomMediaAsset } from '../../types/vehicle';

interface ApiEvent {
  _id: string; type: ShowroomEventType; actorUserId: string; actorName: string; occurredAt: string; message: string; media?: ShowroomMediaAsset; replyToEventId?: string | null;
}
interface ApiVisit {
  _id: string; storeId: string; customerId: string; customerNameSnapshot: string; greetedPerson?: string; phoneSnapshot: string;
  assignedUserId: string; assignedRepName: string; checkedInByUserId: string; checkedInByName: string;
  status: ShowroomVisitSnapshot['visit']['status']; vehicleOfInterest?: ShowroomVisitSnapshot['visit']['vehicleOfInterest'];
  tradeIn?: ShowroomVisitSnapshot['visit']['tradeIn']; notes: string; createdAt: string; updatedAt: string; events: ApiEvent[];
}

function mapVisit(record: ApiVisit): ShowroomVisitSnapshot {
  const storeId = record.storeId;
  return {
    visit: {
      id: record._id, storeId, customerName: record.customerNameSnapshot, greetedPerson: record.greetedPerson || 'customer', customerPhone: record.phoneSnapshot || null,
      notes: record.notes || null, assignedRepId: record.assignedUserId, assignedRepName: record.assignedRepName,
      checkedInById: record.checkedInByUserId, checkedInByName: record.checkedInByName, status: record.status,
      vehicleOfInterest: record.vehicleOfInterest || null, tradeIn: record.tradeIn || null,
      createdAt: record.createdAt, updatedAt: record.updatedAt,
    },
    events: (record.events || []).map((event) => ({
      id: event._id, visitId: record._id, storeId, type: event.type, actorId: event.actorUserId,
      actorName: event.actorName, occurredAt: event.occurredAt, message: event.message, media: event.media, replyToEventId: event.replyToEventId,
    })),
  };
}

function storeQuery(storeId: string) { return new URLSearchParams({ storeId }).toString(); }

export const apiShowroomRepository: ShowroomRepository = {
  async listVisits(storeId) {
    const records = await apiRequest<ApiVisit[]>(`/showroom?${storeQuery(storeId)}`);
    return records.map(mapVisit);
  },
  async getVisit(storeId, visitId) {
    try {
      const record = await apiRequest<ApiVisit>(`/showroom/${encodeURIComponent(visitId)}?${storeQuery(storeId)}`);
      return mapVisit(record);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async createVisit(storeId, input: CreateShowroomVisitInput) {
    const record = await apiRequest<ApiVisit>('/showroom', { method: 'POST', body: JSON.stringify({
      storeId, customerId: input.customerId, customerName: input.customerName, customerPhone: input.customerPhone,
      greetedPerson: input.greetedPerson, ...(input.greetingMedia ? { greetingMedia: input.greetingMedia } : {}),
      leadId: input.leadId, appointmentId: input.appointmentId,
      assignedUserId: input.assignedRepId, notes: input.notes,
      vehicleOfInterest: input.vehicles.vehicleOfInterest, tradeIn: input.vehicles.tradeIn,
    }) });
    return mapVisit(record);
  },
  async appendEvent(storeId, visitId, input: AppendShowroomEventInput) {
    const record = await apiRequest<ApiVisit>(`/showroom/${encodeURIComponent(visitId)}/events?${storeQuery(storeId)}`, {
      method: 'POST', body: JSON.stringify({ type: input.type, message: input.message, media: input.media, replyToEventId: input.replyToEventId }),
    });
    return mapVisit(record);
  },
  async assignVisit(storeId, visitId, input: AssignShowroomVisitInput) {
    const record = await apiRequest<ApiVisit>(`/showroom/${encodeURIComponent(visitId)}/assignment?${storeQuery(storeId)}`, {
      method: 'PATCH', body: JSON.stringify({ assignedUserId: input.assignedRepId }),
    });
    return mapVisit(record);
  },
  subscribe(_storeId, callback) {
    const onStorage = () => callback();
    window.addEventListener('storage', onStorage);
    const timer = window.setInterval(callback, 5000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(timer);
    };
  },
};
