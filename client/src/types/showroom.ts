import type { ShowroomVehicleSelection, ShowroomMediaAsset } from './vehicle';

export type ShowroomVisitStatus =
  | 'active'
  | 'handoff_requested'
  | 'completed'
  | 'cancelled';

export type ShowroomEventType =
  | 'customer_greeted'
  | 'visit_claimed'
  | 'walkaround_started'
  | 'media_added'
  | 'test_drive_started'
  | 'test_drive_completed'
  | 'handoff_requested'
  | 'bdc_contact_logged'
  | 'note_added'
  | 'visit_completed';

/** Persisted visit record; the event stream is stored separately. */
export interface ShowroomVisitRecord {
  id: string;
  storeId: string;
  customerName: string;
  customerPhone: string | null;
  notes: string | null;
  assignedRepId: string;
  assignedRepName: string;
  checkedInById: string;
  checkedInByName: string;
  status: ShowroomVisitStatus;
  vehicleOfInterest: ShowroomVehicleSelection['vehicleOfInterest'];
  tradeIn: ShowroomVehicleSelection['tradeIn'];
  createdAt: string;
  updatedAt: string;
}

export interface ShowroomEvent {
  id: string;
  visitId: string;
  storeId: string;
  type: ShowroomEventType;
  actorId: string;
  actorName: string;
  occurredAt: string;
  message: string;
  media?: ShowroomMediaAsset;
}

export interface ShowroomVisitSnapshot {
  visit: ShowroomVisitRecord;
  events: ShowroomEvent[];
}

export interface CreateShowroomVisitInput {
  customerName: string;
  customerPhone?: string;
  notes?: string;
  assignedRepId: string;
  assignedRepName: string;
  checkedInById: string;
  checkedInByName: string;
  vehicles: ShowroomVehicleSelection;
}

export interface AppendShowroomEventInput {
  type: ShowroomEventType;
  actorId: string;
  actorName: string;
  message: string;
  media?: ShowroomMediaAsset;
}

export interface AssignShowroomVisitInput {
  assignedRepId: string;
  assignedRepName: string;
  actorId: string;
  actorName: string;
}

export interface ShowroomRepository {
  listVisits(storeId: string): Promise<ShowroomVisitSnapshot[]>;
  getVisit(storeId: string, visitId: string): Promise<ShowroomVisitSnapshot | null>;
  createVisit(storeId: string, input: CreateShowroomVisitInput): Promise<ShowroomVisitSnapshot>;
  appendEvent(storeId: string, visitId: string, input: AppendShowroomEventInput): Promise<ShowroomVisitSnapshot>;
  assignVisit(storeId: string, visitId: string, input: AssignShowroomVisitInput): Promise<ShowroomVisitSnapshot>;
  subscribe(storeId: string, callback: () => void): () => void;
}