import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { StoreData, UserRole } from '../types';
import { CURRENT_USER } from '../data/mockDatabase';
import { getPersistentStoreData } from '../services/liveActivity/liveActivityStore';
import { apiOperationalRepository } from '../services/operational/apiOperationalRepository';
import { apiInventoryRepository } from '../services/inventory/apiInventoryRepository';
import { teamRepository } from '../services/team/teamRepository';
import { getShowroomRepository } from '../services/showroom';
import { apiLiveActivityRepository } from '../services/liveActivity/apiLiveActivityRepository';
import { eveoAgent } from '../services/eveoAgent';
import { answerDemoInsight } from '../services/eveoAgent/demoInsights';
import { conversationLifetime, readConversations, saveConversation, type InsightConversation } from '../services/eveoAgent/conversations';
import { useWorkspaceUser } from '../contexts/StoreAppereanceContext';
import { useAuth } from '../contexts/AuthContext';

export type InsightCategory = 'churn' | 'inventory' | 'staff' | 'sla';

export interface InsightCardSchema {
  id: string;
  storeId: string;
  category: InsightCategory;
  title: string;
  metricValue: string;
  metricSublabel: string;
  metricBadge: string;
  summary: string;
  promptTemplate: string;
  actionLabel: string;
  hasWarningPoint?: boolean;
  actionPayload: { type: 'sms_campaign' | 'schedule_adjust' | 'crm_flag'; targetCount: number; draftMessage?: string };
}

export interface InsightChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  draftSnippet?: string;
  actionLabel?: string;
  actionReviewed?: boolean;
  actionExecuted?: boolean;
  mode?: 'preview' | 'live';
}

export interface HubMascotDigest {
  mood: 'happy' | 'curious' | 'chill' | 'alert';
  title: string;
  body: string;
  speechTitle: string;
  speechBody: string;
  hasMajorChanges: boolean;
  bulletActions: Array<{ label: string; route: string; onClick?: () => void }>;
}

export interface ResolvedInsightUser {
  fullName: string;
  firstName: string;
  role: string;
  roleBadge: string;
  greetingText: string;
  inputPlaceholder: string;
  faqs: string[];
}

const EMPTY_STORE: StoreData = { staff: [], leads: [], handoffs: [], appointments: [], sold: [], pending: [], bannerUrl: '' };
function roleLabel(role: string) {
  return ({ owner: 'Dealership owner', manager: 'Store manager', bdc: 'BDC specialist', sales: 'Sales team member' } as Record<string, string>)[role] || 'Dealership team member';
}

export function useInsightsSuite(storeId: string, roleOverride?: UserRole | string) {
  const { user: accountUser } = useAuth();
  const user = useWorkspaceUser();
  const [store, setStore] = useState<StoreData>(() => user ? EMPTY_STORE : getPersistentStoreData(storeId));
  const [readyInventoryCount, setReadyInventoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(!user);
  const effectiveRole = user?.role || roleOverride || localStorage.getItem('eveo_role') || 'bdc';
  const fullName = user?.name || CURRENT_USER;
  const firstName = fullName.trim().split(/\s+/)[0] || 'there';

  const refresh = useCallback(async () => {
    if (!user) {
      setStore(getPersistentStoreData(storeId));
      setReadyInventoryCount(0);
      setHasLoaded(true);
      setLoadError('');
      return;
    }
    if (!storeId) {
      setHasLoaded(true);
      setLoadError('Choose a store to review its records.');
      return;
    }
    setIsLoading(true);
    try {
      const [leads, appointments, inventory, team, visits] = await Promise.all([
        apiOperationalRepository.listLeads(storeId),
        apiOperationalRepository.listAppointments(storeId),
        apiInventoryRepository.list(storeId),
        teamRepository.listMembers(storeId),
        getShowroomRepository(false).listVisits(storeId),
      ]);
      const namesById = new Map(team.map((member) => [member.id, member.name]));
      setStore({
        staff: team.filter((member) => member.role !== 'owner').map((member) => ({
          id: member.id, name: member.name,
          initials: member.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
          role: member.role as StoreData['staff'][number]['role'], assignedStoreIds: [storeId],
        })),
        leads: leads.map((lead) => ({
          id: lead._id, name: lead.customerNameSnapshot, vehicle: lead.vehicleOfInterest || 'Vehicle not specified',
          status: lead.status, time: lead.createdAt,
          assignee: namesById.get(lead.assignedStoreUserId || lead.assignedPlatformUserId || '') || '', notes: lead.notes,
        })),
        appointments: appointments.map((appointment) => ({
          id: appointment._id, name: appointment.customerNameSnapshot, customer: appointment.customerNameSnapshot,
          vehicle: appointment.vehicleSnapshot || 'Vehicle not specified', time: appointment.scheduledAt || '',
          rep: namesById.get(appointment.assignedStoreUserId || appointment.assignedPlatformUserId || '') || '',
          status: appointment.status, phone: appointment.phoneSnapshot, notes: appointment.notes,
        })),
        handoffs: visits.filter(({ visit }) => visit.status === 'handoff_requested').map(({ visit }) => ({
          id: visit.id, name: visit.customerName, vehicle: 'Vehicle pending', rep: visit.assignedRepName, waitTime: 'Live', status: visit.status,
        })),
        sold: [], pending: [], bannerUrl: '',
      });
      setReadyInventoryCount(inventory.filter((vehicle) => vehicle.status === 'READY_FOR_SALE').length);
      setLoadError('');
      setHasLoaded(true);
    } catch (cause) {
      setStore(EMPTY_STORE);
      setReadyInventoryCount(0);
      setLoadError(cause instanceof Error ? cause.message : 'Live store data is not available.');
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, user]);

  useEffect(() => {
    void refresh();
    window.addEventListener('eveo:operational-updated', refresh);
    window.addEventListener('appointmentsUpdated', refresh);
    window.addEventListener('eveo:pipeline-updated', refresh);
    const timer = user ? window.setInterval(() => { void refresh(); }, 8000) : undefined;
    return () => {
      window.removeEventListener('eveo:operational-updated', refresh);
      window.removeEventListener('appointmentsUpdated', refresh);
      window.removeEventListener('eveo:pipeline-updated', refresh);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [refresh, user]);

  const unassignedLeads = store.leads.filter((lead) => !lead.assignee && !['lost', 'converted'].includes(lead.status));
  const pendingAppointments = store.appointments.filter((appointment) => appointment.status === 'pending_confirmation');
  const activeUser = useMemo<ResolvedInsightUser>(() => {
    const role = String(effectiveRole).toLowerCase();
    return {
      fullName,
      firstName,
      role,
      roleBadge: roleLabel(role),
      greetingText: 'I’m E.V.E. I’m reviewing live records from this store and will call out the next things that need attention.',
      inputPlaceholder: 'Ask about leads, appointments, inventory, or staffing…',
      faqs: ['Which open lead needs attention first?', 'Which appointment needs confirmation?', 'How many vehicles are ready for sale?'],
    };
  }, [effectiveRole, firstName, fullName]);

  const dataAvailable = !user || (hasLoaded && !loadError);
  const cards = useMemo<InsightCardSchema[]>(() => [
    {
      id: `unassigned-leads-${storeId}`, storeId, category: 'churn',
      title: 'Unassigned leads', metricValue: dataAvailable ? String(unassignedLeads.length) : '—',
      metricSublabel: 'Need an owner', metricBadge: `${unassignedLeads.length} open`,
      summary: !dataAvailable ? 'Live lead data is not available yet.' : unassignedLeads.length
        ? `${unassignedLeads.length} live leads have no assigned team member. Review the oldest first.`
        : 'Every open lead is assigned, or the live lead pipeline is empty.',
      promptTemplate: activeUser.faqs[0], actionLabel: 'Review unassigned leads',
      hasWarningPoint: dataAvailable && unassignedLeads.length > 0,
      actionPayload: { type: 'crm_flag', targetCount: unassignedLeads.length },
    },
    {
      id: `pending-appointments-${storeId}`, storeId, category: 'sla',
      title: 'Appointments to confirm', metricValue: dataAvailable ? String(pendingAppointments.length) : '—',
      metricSublabel: 'Awaiting confirmation', metricBadge: `${pendingAppointments.length} pending`,
      summary: !dataAvailable ? 'Live appointment data is not available yet.' : pendingAppointments.length
        ? `${pendingAppointments.length} live appointments still need confirmation.`
        : 'There are no live appointments awaiting confirmation.',
      promptTemplate: activeUser.faqs[1], actionLabel: 'Review appointments',
      hasWarningPoint: dataAvailable && pendingAppointments.length > 0,
      actionPayload: { type: 'schedule_adjust', targetCount: pendingAppointments.length },
    },
    {
      id: `inventory-ready-${storeId}`, storeId, category: 'inventory',
      title: 'Inventory ready for sale', metricValue: dataAvailable ? String(readyInventoryCount) : '—',
      metricSublabel: 'Available units', metricBadge: `${readyInventoryCount} ready`,
      summary: !dataAvailable ? 'Live inventory data is not available yet.' : readyInventoryCount
        ? `${readyInventoryCount} inventory records are marked ready for sale in this store.`
        : 'No inventory records are marked ready for sale in this store.',
      promptTemplate: activeUser.faqs[2], actionLabel: 'Check live inventory',
      actionPayload: { type: 'crm_flag', targetCount: readyInventoryCount },
    },
  ], [activeUser.faqs, dataAvailable, pendingAppointments.length, readyInventoryCount, storeId, unassignedLeads.length]);

  const hubDigest = useMemo<HubMascotDigest>(() => {
    const priorityCount = unassignedLeads.length + pendingAppointments.length;
    const body = !user
      ? 'You are viewing sample dealership data. Sign in to review live store records.'
      : isLoading
      ? 'I’m checking this store’s live records now.'
      : loadError
        ? `I could not read the live store records: ${loadError}`
        : !hasLoaded
          ? 'I’m loading this store’s records.'
        : priorityCount
          ? `I found ${unassignedLeads.length} unassigned leads and ${pendingAppointments.length} appointments waiting for confirmation. Start with the item that has been waiting the longest.`
          : 'There are no unassigned leads or unconfirmed appointments right now. You can ask me about live inventory or choose a review below.';
    return {
      mood: priorityCount ? 'alert' : loadError ? 'chill' : 'curious',
      title: loadError ? 'Store data unavailable' : isLoading || !hasLoaded ? 'Reviewing this store' : priorityCount ? `${priorityCount} items need attention` : 'Your store is up to date',
      body, speechTitle: 'E.V.E. store review', speechBody: body,
      hasMajorChanges: priorityCount > 0,
      bulletActions: cards.slice(0, 2).map((card) => ({ label: card.actionLabel, route: '/app/insights' })),
    };
  }, [cards, hasLoaded, isLoading, loadError, pendingAppointments.length, unassignedLeads.length, user]);

  const scope = `${user ? 'live' : 'demo'}:${accountUser?.id ?? ''}:${storeId}`;
  const [conversations, setConversations] = useState(() => readConversations(scope));
  const [activeConversation, selectConversation] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inFlight = useRef(false);
  const messages = conversations.find(({ id }) => id === activeConversation)?.messages ?? [];

  useEffect(() => {
    const nextExpiry = Math.min(...conversations.map(({ expiresAt }) => expiresAt));
    if (!Number.isFinite(nextExpiry)) return;
    const timer = window.setTimeout(() => setConversations(readConversations(scope)), Math.max(0, nextExpiry - Date.now()));
    return () => window.clearTimeout(timer);
  }, [conversations, scope]);

  const sendPrompt = useCallback(async (promptText: string, matchedCard?: InsightCardSchema) => {
    const prompt = promptText.trim().slice(0, 2000);
    if (!prompt || !storeId || inFlight.current) return;
    const existing = readConversations(scope).find(({ id }) => id === activeConversation);
    const thread: InsightConversation = existing ?? { id: crypto.randomUUID(), title: prompt.slice(0, 80), expiresAt: Date.now() + conversationLifetime, messages: [] };
    const userMessage: InsightChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, timestamp: 'Just now' };
    selectConversation(thread.id);
    setConversations(saveConversation(scope, { ...thread, messages: [...thread.messages, userMessage] }));
    inFlight.current = true;
    setPendingId(thread.id);
    try {
      const response = user ? await eveoAgent.respond({
        prompt, storeId, user: { name: activeUser.fullName, role: activeUser.roleBadge },
        selectedInsight: matchedCard ? { title: matchedCard.title, summary: matchedCard.summary, actionLabel: matchedCard.actionLabel, targetCount: matchedCard.actionPayload.targetCount } : undefined,
      }) : { content: answerDemoInsight(storeId, prompt), mode: 'preview' as const };
      const current = readConversations(scope).find(({ id }) => id === thread.id);
      if (current) {
        const message: InsightChatMessage = { id: crypto.randomUUID(), role: 'assistant', timestamp: 'Just now', ...response };
        setConversations(saveConversation(scope, { ...current, messages: [...current.messages, message] }));
      }
    } catch {
      const current = readConversations(scope).find(({ id }) => id === thread.id);
      if (current) {
        const message: InsightChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: 'E.V.E. could not read the store records just now. Please try again.', timestamp: 'Just now' };
        setConversations(saveConversation(scope, { ...current, messages: [...current.messages, message] }));
      }
    } finally {
      inFlight.current = false;
      setPendingId(null);
    }
  }, [activeConversation, activeUser.fullName, activeUser.roleBadge, scope, storeId, user]);

  const markPreviewReviewed = useCallback(async (messageId: string) => {
    const current = readConversations(scope).find(({ id }) => id === activeConversation);
    const target = current?.messages.find(({ id }) => id === messageId);
    if (!current || !target) return;
    setConversations(saveConversation(scope, { ...current, messages: current.messages.map((message) => message.id === messageId ? { ...message, actionReviewed: true } : message) }));
    if (!user || !storeId) return;
    try {
      await apiLiveActivityRepository.create({
        storeId, category: 'ai_high_intent', title: 'E.V.E. suggestion reviewed',
        description: target.actionLabel || target.content.slice(0, 300), entityId: messageId,
      });
    } catch { /* Chat review remains available even if activity logging is offline. */ }
  }, [activeConversation, scope, storeId, user]);

  return { activeUser, cards, hubDigest, messages, isLoading, pendingId, loadError, sendPrompt, markPreviewReviewed, conversations, activeConversation, selectConversation };
}
