import type { AppendShowroomEventInput, AssignShowroomVisitInput, CreateShowroomVisitInput, ShowroomEvent, ShowroomEventType, ShowroomRepository, ShowroomVisitRecord, ShowroomVisitSnapshot, } from '../../types/showroom';

interface PersistedState {
  visits: ShowroomVisitRecord[];
  events: ShowroomEvent[];
}

const STORAGE_PREFIX = 'eveo_showroom_v1_';
const CHANGE_EVENT = 'eveo:showroom-updated';
const MOCK_LATENCY_MS = 180;

const wait = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function createId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}_${crypto.randomUUID()}`
    : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function emptyState(): PersistedState {
  return { visits: [], events: [] };
}

function getStorageKey(storeId: string): string {
  return `${STORAGE_PREFIX}${storeId}`;
}

function readState(storeId: string): PersistedState {
  try {
    const stored = localStorage.getItem(getStorageKey(storeId));
    if (!stored) return emptyState();
    const parsed = JSON.parse(stored) as Partial<PersistedState>;
    return {
      visits: Array.isArray(parsed.visits) ? parsed.visits : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(storeId: string, state: PersistedState): void {
  try {
    localStorage.setItem(getStorageKey(storeId), JSON.stringify(state));
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not persist the showroom demo data: ${error.message}`
        : 'Could not persist the showroom demo data.',
        { cause: error }
    );
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { storeId } }));
}

function sortEvents(events: ShowroomEvent[]): ShowroomEvent[] {
  return [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

function snapshotFor(state: PersistedState, visit: ShowroomVisitRecord): ShowroomVisitSnapshot {
  return {
    visit,
    events: sortEvents(state.events.filter((event) => event.visitId === visit.id)),
  };
}

function applyEventStatus(visit: ShowroomVisitRecord, type: ShowroomEventType): ShowroomVisitRecord['status'] {
  if (type === 'handoff_requested') return 'handoff_requested';
  if (type === 'visit_completed') return 'completed';
  // Keep the visit in the BDC queue until BDC explicitly logs activity.
  if (type === 'bdc_contact_logged' && visit.status === 'handoff_requested') return 'active';
  return visit.status;
}

export const mockShowroomRepository: ShowroomRepository = {
  async listVisits(storeId) {
    await wait();
    const state = readState(storeId);
    return [...state.visits]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((visit) => snapshotFor(state, visit));
  },

  async getVisit(storeId, visitId) {
    await wait();
    const state = readState(storeId);
    const visit = state.visits.find((item) => item.id === visitId);
    return visit ? snapshotFor(state, visit) : null;
  },

  async createVisit(storeId, input: CreateShowroomVisitInput) {
    await wait();
    const customerName = input.customerName.trim();
    if (!customerName) throw new Error('Customer name is required.');
    if (!input.assignedRepName.trim() || !input.assignedRepId.trim()) {
      throw new Error('Choose a salesperson for this visit.');
    }

    const state = readState(storeId);
    const now = new Date().toISOString();
    const visit: ShowroomVisitRecord = {
      id: createId('visit'),
      storeId,
      customerName,
      customerPhone: input.customerPhone?.trim() || null,
      notes: input.notes?.trim() || null,
      assignedRepId: input.assignedRepId,
      assignedRepName: input.assignedRepName,
      checkedInById: input.checkedInById,
      checkedInByName: input.checkedInByName,
      status: 'active',
      vehicleOfInterest: input.vehicles.vehicleOfInterest,
      tradeIn: input.vehicles.tradeIn,
      createdAt: now,
      updatedAt: now,
    };

    // The first timeline event is always created with the visit, never as a separate UI-only step.
    const greetedEvent: ShowroomEvent = {
      id: createId('evt'),
      visitId: visit.id,
      storeId,
      type: 'customer_greeted',
      actorId: input.checkedInById,
      actorName: input.checkedInByName,
      occurredAt: now,
      message: 'Customer greeted. Live visit started.',
    };
    const initialNoteEvent: ShowroomEvent | null = input.notes?.trim()
      ? {
          id: createId('evt'),
          visitId: visit.id,
          storeId,
          type: 'note_added',
          actorId: input.checkedInById,
          actorName: input.checkedInByName,
          occurredAt: now,
          message: `Initial context: ${input.notes.trim()}`,
        }
      : null;

    const updated: PersistedState = {
      visits: [visit, ...state.visits],
      events: [...state.events, greetedEvent, ...(initialNoteEvent ? [initialNoteEvent] : [])],
    };
    writeState(storeId, updated);
    return snapshotFor(updated, visit);
  },

  async appendEvent(storeId, visitId, input: AppendShowroomEventInput) {
    await wait();
    const state = readState(storeId);
    const visitIndex = state.visits.findIndex((item) => item.id === visitId);
    if (visitIndex < 0) throw new Error('This showroom visit could not be found.');

    const current = state.visits[visitIndex];
    if (current.status === 'completed' || current.status === 'cancelled') {
      throw new Error('This visit is closed and cannot receive new events.');
    }

    const now = new Date().toISOString();
    const event: ShowroomEvent = {
      id: createId('evt'),
      visitId,
      storeId,
      type: input.type,
      actorId: input.actorId,
      actorName: input.actorName,
      occurredAt: now,
      message: input.message.trim() || eventLabel(input.type),
      ...(input.media ? { media: input.media } : {}),
    };

    const updatedVisit: ShowroomVisitRecord = {
      ...current,
      status: applyEventStatus(current, input.type),
      updatedAt: now,
    };
    const updatedVisits = [...state.visits];
    updatedVisits[visitIndex] = updatedVisit;

    const updatedState: PersistedState = {
      visits: updatedVisits,
      events: [...state.events, event],
    };
    writeState(storeId, updatedState);
    return snapshotFor(updatedState, updatedVisit);
  },

  async assignVisit(storeId, visitId, input: AssignShowroomVisitInput) {
    await wait();
    const state = readState(storeId);
    const index = state.visits.findIndex((item) => item.id === visitId);
    if (index < 0) throw new Error('This showroom visit could not be found.');
    const current = state.visits[index];
    if (current.status === 'completed' || current.status === 'cancelled') {
      throw new Error('This visit is closed and cannot be reassigned.');
    }

    const now = new Date().toISOString();
    const updatedVisit = {
      ...current,
      assignedRepId: input.assignedRepId,
      assignedRepName: input.assignedRepName,
      updatedAt: now,
    };
    const event: ShowroomEvent = {
      id: createId('evt'),
      visitId,
      storeId,
      type: 'visit_claimed',
      actorId: input.actorId,
      actorName: input.actorName,
      occurredAt: now,
      message: `Visit taken over by ${input.assignedRepName}.`,
    };
    const visits = [...state.visits];
    visits[index] = updatedVisit;
    const updatedState = { visits, events: [...state.events, event] };
    writeState(storeId, updatedState);
    return snapshotFor(updatedState, updatedVisit);
  },

  subscribe(storeId, callback) {
    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ storeId?: string }>).detail;
      if (detail?.storeId === storeId) callback();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === getStorageKey(storeId)) callback();
    };
    window.addEventListener(CHANGE_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  },
};

function eventLabel(type: ShowroomEventType): string {
  const labels: Record<ShowroomEventType, string> = {
    customer_greeted: 'Customer greeted',
    visit_claimed: 'Visit claimed',
    walkaround_started: 'Walk-around started',
    media_added: 'Media added',
    test_drive_started: 'Test drive started',
    test_drive_completed: 'Test drive completed',
    handoff_requested: 'BDC handoff requested',
    bdc_contact_logged: 'BDC contact logged',
    note_added: 'Note added',
    visit_completed: 'Visit completed',
  };
  return labels[type];
}
