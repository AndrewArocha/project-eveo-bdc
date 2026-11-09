// src/services/liveActivity/liveActivityStore.ts
import { STORE_DATA, getStoreDataOrEmpty, readStoreScopedStorage, resolveLegacyStoreDataKey, CURRENT_USER, getVisibleStoreRoster, type StoreData } from '../../data/mockDatabase';
import type { ShowroomMediaAsset } from '../../types';
import type { ActivityCategory, ActivityPriority, LiveActivityEvent } from '../../components/UI/LiveActivityPulse';

export interface ActivityComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface LiveFeedPost extends LiveActivityEvent {
  storeId: string;
  role: string;
  detail?: string;
  dealAmount?: string;
  vehicleVin?: string;
  media?: ShowroomMediaAsset;
  comments?: ActivityComment[];
}

const STORAGE_PREFIX = 'eveo_live_feed_v6_';
const PIPELINE_STORAGE_PREFIX = 'eveo_pipeline_db_v1_';
const MAX_FEED_ITEMS = 30;
const NETWORK_LATENCY_MS = 160;

const simulateNetwork = (ms = NETWORK_LATENCY_MS) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function getStorageKey(storeId: string): string {
  return `${STORAGE_PREFIX}${storeId}`;
}

function getPipelineStorageKey(storeId: string): string {
  return `${PIPELINE_STORAGE_PREFIX}${storeId}`;
}

export function getPersistentStoreData(storeId: string): StoreData {
  const key = getPipelineStorageKey(storeId);
  const fallback = getStoreDataOrEmpty(storeId);

  try {
    const raw = readStoreScopedStorage(PIPELINE_STORAGE_PREFIX, storeId);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      ...fallback,
      leads: Array.isArray(parsed.leads) ? parsed.leads : fallback.leads,
      handoffs: Array.isArray(parsed.handoffs) ? parsed.handoffs : fallback.handoffs,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : fallback.appointments,
      sold: Array.isArray(parsed.sold) ? parsed.sold : fallback.sold,
      pending: Array.isArray(parsed.pending) ? parsed.pending : fallback.pending,
    };
  } catch {
    return fallback;
  }
}

export function savePersistentStoreData(storeId: string, updated: StoreData): StoreData {
  try {
    localStorage.setItem(getPipelineStorageKey(storeId), JSON.stringify(updated));
  } catch {
    // Ignore storage quota lock
  }
  const legacyStoreKey = resolveLegacyStoreDataKey(storeId);
  if (STORE_DATA[legacyStoreKey]) {
    STORE_DATA[legacyStoreKey].leads = updated.leads;
    STORE_DATA[legacyStoreKey].handoffs = updated.handoffs;
    STORE_DATA[legacyStoreKey].appointments = updated.appointments;
    STORE_DATA[legacyStoreKey].sold = updated.sold;
    STORE_DATA[legacyStoreKey].pending = updated.pending;
  }
  window.dispatchEvent(new CustomEvent('eveo:pipeline-updated', { detail: { storeId } }));
  return updated;
}

export async function fetchStorePipelineAsync(storeId: string): Promise<StoreData> {
  await simulateNetwork();
  return getPersistentStoreData(storeId);
}

export async function createStoreLeadAsync(
  storeId: string,
  leadInput: { name: string; vehicle: string; notes?: string; assignee?: string }
): Promise<StoreData> {
  await simulateNetwork();
  const current = getPersistentStoreData(storeId);
  const newLead = {
    id: Date.now(),
    name: leadInput.name.trim(),
    vehicle: leadInput.vehicle.trim() || '2024 SUV',
    time: 'Just now',
    status: 'New Lead',
    assignee: leadInput.assignee || CURRENT_USER,
    notes: leadInput.notes?.trim() || 'Logged via Live Workspace.',
  };
  const updated: StoreData = {
    ...current,
    leads: [newLead, ...current.leads],
  };
  savePersistentStoreData(storeId, updated);
  publishLiveActivity(storeId, {
    agentName: newLead.assignee,
    priority: 2,
    category: 'lead',
    title: `New Lead Logged • ${newLead.name}`,
    detail: `Interested in ${newLead.vehicle} • ${newLead.notes}`,
    route: '/app/hub',
  });
  return updated;
}

export async function confirmStoreAppointmentAsync(
  storeId: string,
  apptId: number | string
): Promise<StoreData> {
  await simulateNetwork();
  const current = getPersistentStoreData(storeId);
  let confirmedName = 'Customer';
  const updatedAppts = current.appointments.map((a) => {
    if (String(a.id) === String(apptId)) {
      confirmedName = a.name || a.customer || 'Customer';
      return { ...a, status: 'Confirmed' };
    }
    return a;
  });
  const updated = savePersistentStoreData(storeId, { ...current, appointments: updatedAppts });
  publishLiveActivity(storeId, {
    agentName: CURRENT_USER,
    priority: 1,
    category: 'appointment',
    title: `Confirmed Appt • ${confirmedName}`,
    detail: `Appointment verified in BDC desk.`,
    route: '/app/reports',
  });
  return updated;
}

export async function claimStoreHandoffAsync(
  storeId: string,
  handoffId: number | string
): Promise<StoreData> {
  await simulateNetwork();
  const current = getPersistentStoreData(storeId);
  const target = current.handoffs.find((h) => String(h.id) === String(handoffId));
  const updatedHandoffs = current.handoffs.filter((h) => String(h.id) !== String(handoffId));
  const updated = savePersistentStoreData(storeId, { ...current, handoffs: updatedHandoffs });

  if (target) {
    publishLiveActivity(storeId, {
      agentName: CURRENT_USER,
      priority: 1,
      category: 'showroom',
      title: `Claimed Handoff • ${target.name}`,
      detail: `Picked up ${target.name} (${target.vehicle}) from showroom lobby.`,
      route: `/app/showroom?view=showroom`,
    });
  }
  return updated;
}

function safeWriteFeed(storeId: string, posts: LiveFeedPost[]): void {
  const lightweight = posts.slice(0, MAX_FEED_ITEMS).map((post) => {
    const safePost = { ...post };
    delete safePost.avatarUrl;
    return safePost;
  });
  const key = getStorageKey(storeId);

  try {
    localStorage.setItem(key, JSON.stringify(lightweight));
  } catch {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('eveo_live_feed_v') && k !== key) {
          localStorage.removeItem(k);
        }
      });
      localStorage.setItem(key, JSON.stringify(lightweight.slice(0, 15)));
    } catch {
      // Ignore storage lock
    }
  }
}

export function getInitials(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (cleaned.slice(0, 2) || 'EV').toUpperCase();
}

export function isValidUploadedAvatar(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith('data:image/');
}

export function resolveAgentAvatar(agentName: string, initials?: string): string | null {
  const cleanName = agentName.trim().toLowerCase();
  const init = (initials || getInitials(agentName)).toUpperCase();

  if (cleanName.includes('andres') || cleanName === CURRENT_USER.toLowerCase() || init === 'AH') {
    const uploaded = localStorage.getItem('eveo_avatar');
    return isValidUploadedAvatar(uploaded) ? uploaded : null;
  }
  return null;
}

export function seedInitialLiveFeed(storeId: string): LiveFeedPost[] {
  const store = getPersistentStoreData(storeId);
  const roster = getVisibleStoreRoster(storeId);
  const now = Date.now();

  const firstHandoff = store?.handoffs?.[0]?.name || 'Marcus Johnson';
  const firstVehicle = store?.handoffs?.[0]?.vehicle || '2024 Kia Telluride';
  const secondVehicle = store?.leads?.[0]?.vehicle || '2023 Honda Civic Type R';
  const firstLead = store?.leads?.[0]?.name || 'Elena Rostova';
  const firstAppt = store?.appointments?.[0]?.name || store?.appointments?.[0]?.customer || 'David Kim';

  const rep0 = roster[0]?.name || 'Sarah J.';
  const rep1 = roster[1]?.name || 'Michael T.';

  return [
    {
      id: `seed-show-1-${storeId}`,
      storeId,
      agentName: rep0,
      initials: getInitials(rep0),
      role: 'sales',
      priority: 1,
      category: 'showroom',
      title: `Walkaround • ${firstHandoff}`,
      detail: `Exterior walkaround on ${firstVehicle}. Customer ready for test drive.`,
      route: `/app/showroom?view=showroom`,
      timestamp: now - 1000 * 60 * 2,
      comments: [{ id: 'c1', author: 'BDC Desk', text: 'Pre-approval is on file in CRM.', timestamp: now - 1000 * 60 }],
    },
    {
      id: `seed-inv-1-${storeId}`,
      storeId,
      agentName: rep1,
      initials: getInitials(rep1),
      role: 'sales',
      priority: 1,
      category: 'inventory',
      title: `Decoded VIN • ${firstVehicle}`,
      detail: `NHTSA vPIC verified • Front-line SUV row staged.`,
      route: `/app/showroom?view=showroom`,
      timestamp: now - 1000 * 60 * 4,
      comments: [],
    },
    {
      id: `seed-appt-1-${storeId}`,
      storeId,
      agentName: 'Sofia',
      initials: 'SF',
      role: 'bdc',
      priority: 1,
      category: 'appointment',
      title: `Confirmed Appt • ${firstAppt}`,
      detail: `Verified for today on ${firstVehicle}.`,
      route: '/app/reports',
      timestamp: now - 1000 * 60 * 6,
      comments: [],
    },
    {
      id: `seed-ai-1-${storeId}`,
      storeId,
      agentName: 'E.V.E.',
      initials: 'AI',
      role: 'ai_agent',
      isAiAgent: true,
      priority: 1,
      category: 'ai_high_intent',
      title: `Matched Unit • ${firstLead} → ${firstVehicle}`,
      detail: `Matched aging unit (48d) with ${firstLead}'s pre-qualification.`,
      route: '/app/insights',
      timestamp: now - 1000 * 60 * 1,
      comments: [],
    },
    {
      id: `seed-inv-2-${storeId}`,
      storeId,
      agentName: CURRENT_USER,
      initials: getInitials(CURRENT_USER),
      role: 'manager',
      priority: 1,
      category: 'inventory',
      title: `Deal Desked • ${secondVehicle} ($38,400)`,
      detail: `Signed buyer's order with ${firstHandoff} — routed to F&I office.`,
      dealAmount: '$38,400',
      route: `/app/showroom?view=showroom`,
      timestamp: now - 1000 * 60 * 16,
      comments: [],
    },
  ];
}

export function listLiveFeed(storeId: string): LiveFeedPost[] {
  try {
    const raw = readStoreScopedStorage(STORAGE_PREFIX, storeId);
    const parsed: LiveFeedPost[] = raw ? JSON.parse(raw) : seedInitialLiveFeed(storeId);
    const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : seedInitialLiveFeed(storeId);

    return list.map((item) => ({
      ...item,
      initials: item.isAiAgent ? 'AI' : getInitials(item.agentName),
      avatarUrl: item.isAiAgent ? null : resolveAgentAvatar(item.agentName, item.initials),
    }));
  } catch {
    return seedInitialLiveFeed(storeId);
  }
}

export async function fetchLiveFeedAsync(storeId: string): Promise<LiveFeedPost[]> {
  await simulateNetwork();
  return listLiveFeed(storeId);
}

export function sortFeedForDisplay(posts: LiveFeedPost[]): LiveFeedPost[] {
  return [...posts].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.timestamp - a.timestamp;
  });
}

export function publishLiveActivity(
  storeId: string,
  input: {
    agentName?: string;
    role?: string;
    isAiAgent?: boolean;
    priority: ActivityPriority;
    category: ActivityCategory;
    title: string;
    detail?: string;
    dealAmount?: string;
    vehicleVin?: string;
    media?: ShowroomMediaAsset;
    route?: string;
  }
): LiveFeedPost {
  const current = listLiveFeed(storeId);
  const agentName = input.agentName || CURRENT_USER;
  const initials = input.isAiAgent ? 'AI' : getInitials(agentName);

  const created: LiveFeedPost = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    storeId,
    agentName,
    initials,
    avatarUrl: input.isAiAgent ? null : resolveAgentAvatar(agentName, initials),
    role: input.role || 'staff',
    isAiAgent: input.isAiAgent,
    priority: input.priority,
    category: input.category,
    title: input.title,
    detail: input.detail,
    dealAmount: input.dealAmount,
    vehicleVin: input.vehicleVin,
    media: input.media,
    route: input.route || `/app/showroom?storeId=${storeId}`,
    timestamp: Date.now(),
    comments: [],
  };

  if (input.dealAmount) {
    const storeDb = getPersistentStoreData(storeId);
    const newSoldRecord = {
      id: Date.now(),
      name: input.title.replace(/^Deal Desked\s*•\s*/i, '').split('(')[0].trim() || 'Floor Buyer',
      vehicle: input.detail?.split('•')[0]?.trim() || '2024 Vehicle',
      profit: input.dealAmount,
      date: 'Today',
      rep: agentName,
    };
    savePersistentStoreData(storeId, {
      ...storeDb,
      sold: [newSoldRecord, ...storeDb.sold],
    });
  }

  const nextList = [created, ...current].slice(0, MAX_FEED_ITEMS);
  safeWriteFeed(storeId, nextList);

  window.dispatchEvent(new CustomEvent('eveo:live-feed-updated', { detail: { storeId } }));
  window.dispatchEvent(new CustomEvent('eveo:live-activity', { detail: created }));
  return created;
}

export async function publishLiveActivityAsync(
  storeId: string,
  input: Parameters<typeof publishLiveActivity>[1]
): Promise<LiveFeedPost> {
  await simulateNetwork();
  return publishLiveActivity(storeId, input);
}

export function addCommentToActivity(storeId: string, postId: string, author: string, text: string): LiveFeedPost[] {
  const trimmed = text.trim();
  if (!trimmed) return listLiveFeed(storeId);
  const current = listLiveFeed(storeId);
  const newComment: ActivityComment = {
    id: `cmt_${Date.now()}`,
    author,
    text: trimmed,
    timestamp: Date.now(),
  };
  const updated = current.map((post) =>
    post.id === postId
      ? { ...post, comments: [...(post.comments || []), newComment] }
      : post
  );
  safeWriteFeed(storeId, updated);
  window.dispatchEvent(new CustomEvent('eveo:live-feed-updated', { detail: { storeId } }));
  return updated;
}

export async function addCommentToActivityAsync(
  storeId: string,
  postId: string,
  author: string,
  text: string
): Promise<LiveFeedPost[]> {
  await simulateNetwork(120);
  return addCommentToActivity(storeId, postId, author, text);
}

export const hydrateStorePipeline = getPersistentStoreData;
