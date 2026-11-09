// src/pages/Dashboard/LiveShowroom.tsx
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertCircle, ArrowLeft, CalendarClock, CalendarDays, CarFront, ChevronRight, DollarSign, ImagePlus,
  MessageSquareText, Radio, ScanBarcode, Send, Sparkles, Trash2,
  UserCheck, Users, Video, X
} from 'lucide-react';
import { CURRENT_USER, getStoreDataOrEmpty, getVisibleStoreRoster } from '../../data/mockDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import type {
  AppendShowroomEventInput,
  ShowroomEvent,
  ShowroomEventType,
  ShowroomVisitSnapshot,
} from '../../types/showroom';
import type { ShowroomVehicleSelection, ShowroomVehicleDraft } from '../../types/vehicle';
import DashboardCard from '../../components/UI/DashboardCard';
import HubModals from '../../components/UI/HubModals';
import SwipeableModal from '../../components/UI/SwipeableModal';
import GlobalLoader from '../../components/UI/GlobalLoader';
import ShowroomVehicleDetails from '../../components/showroom/ShowroomVehicleDetails';
import VehicleVinLookupField from '../../components/showroom/VehicleVinLookupField';
import LiveShowroomDeck, { type FloorAppointmentBubble } from '../../components/showroom/LiveShowroomDeck';
import LiveActivityDeck from '../../components/showroom/LiveActivityDeck';
import { showroomRepository } from '../../services/showroom';
import { apiLiveActivityRepository } from '../../services/liveActivity/apiLiveActivityRepository';
import { apiOperationalRepository } from '../../services/operational/apiOperationalRepository';
import { apiInventoryRepository, type ApiInventoryVehicle } from '../../services/inventory/apiInventoryRepository';
import { teamRepository } from '../../services/team/teamRepository';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import type { ApiTeamMember } from '../../services/apiClient';
import { getMockShowroomMedia, saveMockShowroomMedia } from '../../services/showroomMedia/mockShowroomMediaStore';
import { decodeVin } from '../../utils/nhtsaVinService';
import { getAppointmentsByDate, getTodayDateKey, type Appointment } from '../../utils/appointmentManager';
import {
  listLiveFeed,
  publishLiveActivity,
  resolveAgentAvatar,
  getInitials,
  type LiveFeedPost,
} from '../../services/liveActivity/liveActivityStore';

const EMPTY_VEHICLES: ShowroomVehicleSelection = {
  vehicleOfInterest: null,
  tradeIn: null,
};

const EVENT_LABELS: Record<ShowroomEventType, string> = {
  customer_greeted: 'Customer greeted',
  visit_claimed: 'Salesperson took ownership',
  walkaround_started: 'Walk-around started',
  media_added: 'Photo or video added',
  test_drive_started: 'Test drive started',
  test_drive_completed: 'Test drive completed',
  deal_desked: 'Deal desked',
  handoff_requested: 'BDC handoff requested',
  bdc_contact_logged: 'BDC activity logged',
  note_added: 'Visit note added',
  visit_completed: 'Visit completed',
};

const DEMO_SCAN_VINS = [
  { label: '2024 Kia Telluride SX', vin: '5XYP5DGC0RG412890' },
  { label: '2023 Honda Civic Type R', vin: 'JHMFL5G40PX000412' },
  { label: '2024 Ford F-150 Lariat', vin: '1FTFW1E84RFA10294' },
];

const glassCardClasses = `
  backdrop-blur-2xl bg-white/5 dark:bg-[#0a0f16]/40
  border border-white/20 dark:border-white/10
  shadow-[0_15px_30px_rgba(0,0,0,0.1),inset_0_1px_8px_rgba(255,255,255,0.2)]
  dark:shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_1px_8px_rgba(255,255,255,0.1)]
  rounded-3xl relative overflow-hidden
`;

const inputClasses =
  'min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-base sm:text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500';

function createActor(role: string, authenticatedUser: { id: string; name: string } | null) {
  if (authenticatedUser) return { actorId: authenticatedUser.id, actorName: authenticatedUser.name };
  const actorName = localStorage.getItem('eveo_user_name') || CURRENT_USER;
  const actorId = localStorage.getItem('eveo_user_id') || `demo-${role}-${actorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return { actorId, actorName };
}

function formatTime(value: string | number) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function formatDateTime(value: string | number) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function vehicleTitle(vehicle: ShowroomVehicleSelection['vehicleOfInterest']): string {
  if (!vehicle) return 'Vehicle pending VIN';
  return [vehicle.modelYear, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ') || vehicle.vin;
}

type ExclusiveView = 'portal' | 'showroom' | 'activity' | 'visit';
type StoreAppointment = Appointment & { appointmentId?: string; customerId?: string; leadId?: string; customerPhone?: string };

export default function LiveShowroom() {
  const { role, user: accountUser } = useAuth();
  const user = accountUser?.demoMode ? null : accountUser;
  const { activeStore, activeStoreId, activeStoreDomainId, cycleNextStore, stores, setActiveStoreId } = useStoreAppearance();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedStoreId = searchParams.get('storeId');
  const requestedStore = stores.find((store) =>
    store.id === requestedStoreId || store.domainId === requestedStoreId || store.legacyDataKey === requestedStoreId,
  );
  const storeId = requestedStore?.domainId || activeStoreDomainId;

  useEffect(() => {
    if (requestedStore && requestedStore.id !== activeStoreId) setActiveStoreId(requestedStore.id);
  }, [activeStoreId, requestedStore, setActiveStoreId]);

  const viewFromUrl = searchParams.get('view') as ExclusiveView | null;
  const visitIdFromUrl = searchParams.get('visitId');
  const [activeView, setActiveView] = useState<ExclusiveView>(() => {
    if (visitIdFromUrl) return 'visit';
    if (viewFromUrl === 'showroom' || viewFromUrl === 'activity') return viewFromUrl;
    return 'portal';
  });

  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(visitIdFromUrl);
  const [isSwitchingStore, setIsSwitchingStore] = useState(false);
  const actor = useMemo(() => createActor(role, user), [role, user]);
  const [storeTeamMembers, setStoreTeamMembers] = useState<ApiTeamMember[]>([]);

  useEffect(() => {
    if (!user || !storeId) {
      setStoreTeamMembers([]);
      return;
    }
    let active = true;
    teamRepository.listMembers(storeId)
      .then((members) => { if (active) setStoreTeamMembers(members); })
      .catch(() => { if (active) setStoreTeamMembers([]); });
    return () => { active = false; };
  }, [storeId, user]);

  const salespeople = useMemo(() => {
    if (user) {
      const assigned = storeTeamMembers
        .filter((member) => member.role === 'sales' || member.role === 'manager')
        .map((member) => ({ id: member.id, name: member.name, role: member.role as 'sales' | 'manager' }));
      return assigned.length > 0 ? assigned : [{ id: user.id, name: user.name, role: 'sales' as const }];
    }
    const staff = getStoreDataOrEmpty(storeId).staff;
    return staff.filter((person) => person.role === 'sales' || person.role === 'manager');
  }, [storeId, storeTeamMembers, user]);

  const roster = useMemo(() => user ? [] : getVisibleStoreRoster(storeId), [storeId, user]);

  // --- STATE ---
  const [snapshots, setSnapshots] = useState<ShowroomVisitSnapshot[]>([]);
  const [storeAppts, setStoreAppts] = useState<StoreAppointment[]>(() => user ? [] : getAppointmentsByDate(storeId, getTodayDateKey()));
  const [strikesLog, setStrikesLog] = useState<Record<string, string>>({});
  const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isVinScannerOpen, setIsVinScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [greetedPerson, setGreetedPerson] = useState('themselves');
  const [checkInStep, setCheckInStep] = useState(0);
  const [relatedCustomerName, setRelatedCustomerName] = useState('');
  const [assignedRepId, setAssignedRepId] = useState('');
  const [vehicles, setVehicles] = useState<ShowroomVehicleSelection>(EMPTY_VEHICLES);

  // Visit Timeline Note + Staged Photo/Video State
  const [newNote, setNewNote] = useState('');
  const [stagedMediaFile, setStagedMediaFile] = useState<File | null>(null);
  const [stagedMediaPreviewUrl, setStagedMediaPreviewUrl] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Live Activity Feed State
  const [feedPosts, setFeedPosts] = useState<LiveFeedPost[]>(() => user ? [] : listLiveFeed(storeId));
  const [storePipelineCustomers, setStorePipelineCustomers] = useState<string[]>([]);
  const [onlineCursorIdx, setOnlineCursorIdx] = useState(0);

  // Smart Actionable "Log Live Activity" Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'deal_desked' | 'new_inventory' | 'vip_appt' | 'lot_walk'>('deal_desked');
  const [composerStep, setComposerStep] = useState(0);
  const [selectedCustomerPill, setSelectedCustomerPill] = useState('');
  const [dealGrossAmount, setDealGrossAmount] = useState('$3,850');
  const [composerVehicleDraft, setComposerVehicleDraft] = useState<ShowroomVehicleDraft | null>(null);
  const [composerQuickChip, setComposerQuickChip] = useState('Buyer Order Signed & Routed to F&I');
  const [postMediaFile, setPostMediaFile] = useState<File | null>(null);
  const [isPostingActivity, setIsPostingActivity] = useState(false);
  const postMediaInputRef = useRef<HTMLInputElement>(null);

  const refreshActivity = useCallback(async () => {
    try {
      setFeedPosts(user ? await apiLiveActivityRepository.list(storeId) : listLiveFeed(storeId));
    } catch {
      if (!user) setFeedPosts(listLiveFeed(storeId));
    }
  }, [storeId, user]);

  const recordActivity = async (input: Parameters<typeof publishLiveActivity>[1]) => {
    if (user) {
      const created = await apiLiveActivityRepository.create({
        storeId,
        category: input.category,
        title: input.title,
        description: input.detail || '',
      });
      setFeedPosts((current) => [created, ...current.filter((post) => post.id !== created.id)]);
      return;
    }
    publishLiveActivity(storeId, input);
    setFeedPosts(listLiveFeed(storeId));
  };

  useEffect(() => {
    if (!stagedMediaFile) {
      setStagedMediaPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(stagedMediaFile);
    setStagedMediaPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [stagedMediaFile]);

  const [, setAvatarTick] = useState(0);
  useEffect(() => {
    const onAvatar = () => {
      setAvatarTick((t) => t + 1);
      if (!user) setFeedPosts(listLiveFeed(storeId));
    };
    window.addEventListener('avatarUpdated', onAvatar);
    return () => window.removeEventListener('avatarUpdated', onAvatar);
  }, [storeId, user]);

  useEffect(() => {
    const syncAppts = async () => {
      if (!user) {
        setStoreAppts(getAppointmentsByDate(storeId, getTodayDateKey()));
        return;
      }
      try {
        const records = await apiOperationalRepository.listAppointments(storeId);
        const today = new Date();
        setStoreAppts(records.filter((item) => item.scheduledAt && new Date(item.scheduledAt).toDateString() === today.toDateString() && item.status !== 'cancelled')
          .map((item) => ({
            id: item._id, time: new Date(item.scheduledAt!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            customer: item.customerNameSnapshot, vehicle: item.vehicleSnapshot || 'Vehicle not specified',
            rep: storeTeamMembers.find((member) => member.id === item.assignedStoreUserId || member.id === item.assignedPlatformUserId)?.name || 'Unassigned',
            status: item.status === 'arrived' || item.status === 'showed' ? 'ARRIVED' : item.status === 'no_show' ? 'NO SHOW' : 'CONFIRMED',
            appointmentId: item._id, customerId: item.customerId || undefined, leadId: item.leadId || undefined, customerPhone: item.phoneSnapshot,
          })));
      } catch {
        setStoreAppts([]);
      }
    };
    void syncAppts();
    if (!user) setFeedPosts(listLiveFeed(storeId));
    window.addEventListener('appointmentsUpdated', syncAppts);
    const timer = user ? window.setInterval(() => { void syncAppts(); }, 5000) : undefined;
    return () => {
      window.removeEventListener('appointmentsUpdated', syncAppts);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [storeId, storeTeamMembers, user]);

  useEffect(() => {
    const syncFeed = () => { void refreshActivity(); };
    window.addEventListener('eveo:live-feed-updated', syncFeed);
    window.addEventListener('storage', syncFeed);
    void refreshActivity();
    const timer = user ? window.setInterval(() => { void refreshActivity(); }, 5000) : undefined;
    return () => {
      window.removeEventListener('eveo:live-feed-updated', syncFeed);
      window.removeEventListener('storage', syncFeed);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [storeId, user, refreshActivity]);

  const refresh = useCallback(async () => {
    try {
      const results = await showroomRepository.listVisits(storeId);
      setSnapshots(results);
    } catch {
      // Ignore transient mock error
    }
  }, [storeId]);

  useEffect(() => {
    void refresh();
    const unsubscribe = showroomRepository.subscribe(storeId, () => { void refresh(); });
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [storeId, refresh]);

  useEffect(() => {
    if (!assignedRepId && salespeople.length > 0) {
      setAssignedRepId(String(salespeople[0].id));
    }
  }, [assignedRepId, salespeople]);

  const switchView = (next: ExclusiveView, visitId?: string | null) => {
    setActiveView(next);
    if (visitId) {
      setSelectedVisitId(visitId);
      setSearchParams({ view: next, visitId });
    } else if (next === 'portal') {
      setSelectedVisitId(null);
      setSearchParams({});
    } else {
      setSelectedVisitId(null);
      setSearchParams({ view: next });
    }
  };

  const activeSnapshots = useMemo(
    () => snapshots.filter(({ visit }) => visit.status !== 'completed' && visit.status !== 'cancelled'),
    [snapshots]
  );
  const completedSnapshots = useMemo(
    () => snapshots.filter(({ visit }) => visit.status === 'completed'),
    [snapshots]
  );

  const selectedSnapshot = useMemo(
    () => snapshots.find(({ visit }) => visit.id === selectedVisitId) ?? activeSnapshots[0] ?? null,
    [snapshots, activeSnapshots, selectedVisitId]
  );

  const latestCompletedHero = useMemo(() => {
    if (completedSnapshots.length > 0) {
      const latest = completedSnapshots[0].visit;
      return {
        customerName: latest.customerName,
        vehicle: vehicleTitle(latest.vehicleOfInterest),
        rep: latest.assignedRepName,
        time: formatTime(latest.updatedAt),
      };
    }
    const storeSold = user ? undefined : getStoreDataOrEmpty(storeId).sold[0];
    return {
      customerName: storeSold?.name || '',
      vehicle: storeSold?.vehicle || '',
      rep: storeSold?.rep || salespeople[0]?.name || '',
      time: '',
    };
  }, [completedSnapshots, storeId, salespeople, user]);

  const ongoingAppointmentBubbles = useMemo<FloorAppointmentBubble[]>(() => {
    const bubbles: FloorAppointmentBubble[] = [];

    activeSnapshots.forEach(({ visit }, idx) => {
      if (strikesLog[visit.id]) return;
      const isOverdue = visit.status === 'handoff_requested' && idx === 0;
      bubbles.push({
        id: visit.id,
        visitId: visit.id,
        customerName: visit.customerName,
        vehicle: vehicleTitle(visit.vehicleOfInterest),
        rep: visit.assignedRepName,
        timeLabel: isOverdue ? '16m Overdue' : 'On Floor Now',
        slaState: isOverdue ? 'overdue_red' : 'ongoing_orange',
        badgeText: isOverdue ? `Overdue • ${visit.customerName.split(' ')[0]}` : `Active • ${visit.customerName.split(' ')[0]}`,
      });
    });

    storeAppts.forEach((appt) => {
      const cName = appt.customer || appt.name || 'Guest';
      if (bubbles.some((b) => b.customerName === cName) || strikesLog[`appt_${appt.id}`]) return;
      bubbles.push({
        id: `appt_${appt.id}`,
        appointmentId: appt.appointmentId,
        customerId: appt.customerId,
        leadId: appt.leadId,
        customerPhone: appt.customerPhone,
        customerName: cName,
        vehicle: appt.vehicle,
        rep: appt.rep,
        timeLabel: `${appt.time} (In 12m)`,
        slaState: 'due_soon_yellow',
        badgeText: `Due 12m • ${cName.split(' ')[0]}`,
      });
    });

    if (completedSnapshots.length > 0 && bubbles.length < 5) {
      const comp = completedSnapshots[0].visit;
      bubbles.push({
        id: comp.id,
        visitId: comp.id,
        customerName: comp.customerName,
        vehicle: vehicleTitle(comp.vehicleOfInterest),
        rep: comp.assignedRepName,
        timeLabel: 'Completed <1h ago',
        slaState: 'completed_green',
        badgeText: `Done • ${comp.customerName.split(' ')[0]}`,
      });
    }

    return bubbles.slice(0, 5);
  }, [activeSnapshots, storeAppts, completedSnapshots, strikesLog]);

  const onlineUsersList = useMemo(() => {
    if (user) {
      const recentByActor = new Map<string, LiveFeedPost>();
      [...feedPosts].sort((a, b) => b.timestamp - a.timestamp).forEach((post) => {
        if (!recentByActor.has(post.agentName)) recentByActor.set(post.agentName, post);
      });
      return Array.from(recentByActor.values()).map((post) => ({
        name: post.agentName,
        initials: getInitials(post.agentName),
        avatarUrl: null,
        statusText: post.title,
      }));
    }
    return roster.map((member, idx) => {
      const initials = ('initials' in member && member.initials) ? member.initials : getInitials(member.name);
      const latestPost = feedPosts.find((p) => p.agentName === member.name);
      const statusText = latestPost
        ? latestPost.title
        : ('liveActivity' in member && member.liveActivity)
          ? String(member.liveActivity)
          : idx % 2 === 0
            ? 'Showroom • Active Floor'
            : 'BDC Queue • Outbound';
      return {
        name: member.name,
        initials,
        avatarUrl: resolveAgentAvatar(member.name, initials),
        statusText,
      };
    });
  }, [feedPosts, roster, user]);

  const selectedOnlineUser = onlineUsersList[onlineCursorIdx % Math.max(1, onlineUsersList.length)] || null;

  useEffect(() => {
    if (onlineUsersList.length < 2) return;
    const rotation = window.setInterval(() => setOnlineCursorIdx((index) => (index + 1) % onlineUsersList.length), 5000);
    return () => window.clearInterval(rotation);
  }, [onlineUsersList.length]);

  useEffect(() => {
    if (!user) {
      const demoStore = getStoreDataOrEmpty(storeId);
      const names = new Set<string>();
      demoStore.handoffs?.forEach((handoff) => names.add(handoff.name));
      demoStore.leads?.forEach((lead) => names.add(lead.name));
      demoStore.appointments?.forEach((appointment) => names.add(appointment.name || appointment.customer || ''));
      setStorePipelineCustomers(Array.from(names).filter(Boolean).slice(0, 6));
      return;
    }
    let active = true;
    Promise.all([apiOperationalRepository.listLeads(storeId), apiOperationalRepository.listAppointments(storeId)])
      .then(([leads, appointments]) => {
        if (!active) return;
        const names = new Set<string>();
        leads.forEach((lead) => names.add(lead.customerNameSnapshot));
        appointments.forEach((appointment) => names.add(appointment.customerNameSnapshot));
        setStorePipelineCustomers(Array.from(names).filter(Boolean).slice(0, 6));
      })
      .catch(() => { if (active) setStorePipelineCustomers([]); });
    return () => { active = false; };
  }, [storeId, user]);

  const handleStoreBannerClick = () => {
    if (role === 'bdc' || role === 'bdc_manager' || role === 'owner') {
      setIsSwitchingStore(true);
      cycleNextStore();
      setTimeout(() => setIsSwitchingStore(false), 450);
    }
  };

  const handleOpenOrStartVisit = async (bubble: FloorAppointmentBubble) => {
    if (bubble.visitId) {
      switchView('visit', bubble.visitId);
      return;
    }
    const repObj = salespeople.find((s) => s.name === bubble.rep) || salespeople[0];
    if (!repObj) return;
    setMutationError(null);
    setIsSubmitting(true);
    try {
      const created = await showroomRepository.createVisit(storeId, {
        customerName: bubble.customerName,
        customerPhone: bubble.customerPhone,
        greetedPerson: 'customer',
        appointmentId: bubble.appointmentId,
        customerId: bubble.customerId,
        leadId: bubble.leadId,
        notes: `Visit started from scheduled appointment (${bubble.vehicle}).`,
        assignedRepId: String(repObj.id),
        assignedRepName: repObj.name,
        checkedInById: actor.actorId,
        checkedInByName: actor.actorName,
        vehicles: EMPTY_VEHICLES,
      });
      setSnapshots((current) => [created, ...current.filter((item) => item.visit.id !== created.visit.id)]);
      switchView('visit', created.visit.id);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : 'Could not start the scheduled visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkOverdueStrike = (bubble: FloorAppointmentBubble) => {
    setStrikesLog((prev) => ({ ...prev, [bubble.id]: bubble.rep }));
    void recordActivity({
      agentName: user?.name || 'E.V.E.',
      isAiAgent: !user,
      priority: 1,
      category: user ? 'showroom' : 'ai_high_intent',
      title: user ? `Manager review requested • ${bubble.customerName}` : `SLA Strike Logged • ${bubble.rep}`,
      detail: user
        ? `A manager flagged this appointment for review. ${bubble.vehicle}`
        : `Appointment for ${bubble.customerName} (${bubble.vehicle}) exceeded 15m overdue window without check-in.`,
    });
  };

  const handleCheckIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMutationError(null);
    if (!customerName.trim()) {
      setMutationError('Enter the customer’s name to start the visit.');
      return;
    }
    const selectedRep = salespeople.find((person) => String(person.id) === assignedRepId) || salespeople[0];
    if (!selectedRep) return;

    setIsSubmitting(true);
    try {
      const created = await showroomRepository.createVisit(storeId, {
        customerName,
        greetedPerson: greetedPerson === 'themselves' ? 'the customer' : `${greetedPerson}: ${relatedCustomerName}`,
        assignedRepId: String(selectedRep.id),
        assignedRepName: selectedRep.name,
        checkedInById: actor.actorId,
        checkedInByName: actor.actorName,
        vehicles,
      });

      setSnapshots((current) => [created, ...current.filter((item) => item.visit.id !== created.visit.id)]);

      if (!user) publishLiveActivity(storeId, {
        agentName: selectedRep.name,
        role: 'sales',
        priority: 1,
        category: 'showroom',
        title: `Walk-In Greeted • ${customerName.trim()}`,
        detail: `Showroom visit started • ${vehicleTitle(vehicles.vehicleOfInterest)}`,
        route: `/app/showroom?view=visit&visitId=${created.visit.id}`,
      });

      setCustomerName('');
      setGreetedPerson('themselves');
      setVehicles(EMPTY_VEHICLES);
      setRelatedCustomerName('');
      setCheckInStep(0);
      setIsCheckInOpen(false);
      switchView('visit', created.visit.id);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not start visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const appendEvent = async (
    type: ShowroomEventType,
    message: string,
    extras: Partial<AppendShowroomEventInput> = {}
  ): Promise<boolean> => {
    if (!selectedSnapshot) return false;
    setBusyAction(type);
    setMutationError(null);
    try {
      const updated = await showroomRepository.appendEvent(storeId, selectedSnapshot.visit.id, {
        type,
        actorId: actor.actorId,
        actorName: actor.actorName,
        message,
        ...extras,
      });
      setSnapshots((current) => current.map((item) => (item.visit.id === updated.visit.id ? updated : item)));

      if (!user) publishLiveActivity(storeId, {
        agentName: actor.actorName,
        role,
        priority: type === 'note_added' && !extras.media ? 2 : 1,
        category: 'showroom',
        title: `${EVENT_LABELS[type]} • ${selectedSnapshot.visit.customerName}`,
        detail: message,
        media: extras.media,
        route: `/app/showroom?view=visit&visitId=${selectedSnapshot.visit.id}`,
      });

      if (type === 'visit_completed') {
        switchView('showroom');
      }
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not update visit.');
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const handleStageEvent = async (type: ShowroomEventType, message: string, photo?: File, replyToEventId?: string) => {
    try {
      const media = photo ? await saveMockShowroomMedia(photo, storeId) : undefined;
      return await appendEvent(type, message, { ...(media ? { media } : {}), ...(replyToEventId ? { replyToEventId } : {}) });
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not upload the visit photo.');
      return false;
    }
  };

  const handleNoteOrMediaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSnapshot) return;
    const trimmed = newNote.trim();
    if (!trimmed && !stagedMediaFile) return;

    if (stagedMediaFile) {
      setBusyAction('media_added');
      setMutationError(null);
      try {
        const asset = await saveMockShowroomMedia(stagedMediaFile, storeId);
        const caption = trimmed || `${asset.kind === 'video' ? 'Walkaround video' : 'Showroom photo'} attached (${asset.fileName})`;
        await appendEvent('media_added', caption, { media: asset });
        setStagedMediaFile(null);
        setNewNote('');
      } catch (error) {
        setMutationError(error instanceof Error ? error.message : 'Could not upload media.');
      } finally {
        setBusyAction(null);
      }
      return;
    }

    await appendEvent('note_added', trimmed);
    setNewNote('');
  };

  const handleAssignToMe = async () => {
    if (!selectedSnapshot) return;
    const actorRep = salespeople.find((person) => person.name === actor.actorName);
    const nextRepId = actorRep ? String(actorRep.id) : actor.actorId;
    setBusyAction('visit_claimed');
    setMutationError(null);
    try {
      const updated = await showroomRepository.assignVisit(storeId, selectedSnapshot.visit.id, {
        assignedRepId: nextRepId,
        assignedRepName: actor.actorName,
        actorId: actor.actorId,
        actorName: actor.actorName,
      });
      setSnapshots((current) => current.map((item) => (item.visit.id === updated.visit.id ? updated : item)));
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not claim visit.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSmartActivitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (composerStep < 2) {
      setComposerStep((step) => step + 1);
      return;
    }
    setIsPostingActivity(true);

    try {
      let mediaAsset = undefined;
      if (postMediaFile) {
        mediaAsset = await saveMockShowroomMedia(postMediaFile, storeId);
      }

      const targetCustomer = selectedCustomerPill || storePipelineCustomers[0] || 'Walk-In Client';
      const decodedTitle = vehicleTitle(composerVehicleDraft);

      if (composerType === 'deal_desked') {
        await recordActivity({
          agentName: actor.actorName,
          role,
          priority: 1,
          category: 'showroom',
          title: `Deal Desked • ${targetCustomer} (${dealGrossAmount})`,
          detail: `${decodedTitle} • ${composerQuickChip}`,
          dealAmount: dealGrossAmount,
          vehicleVin: composerVehicleDraft?.vin,
          media: mediaAsset,
        });
      } else if (composerType === 'new_inventory') {
        await recordActivity({
          agentName: actor.actorName,
          role,
          priority: 1,
          category: 'inventory',
          title: `Fresh Unit Logged • ${decodedTitle}`,
          detail: `${composerQuickChip}${composerVehicleDraft?.vin ? ` • VIN ${composerVehicleDraft.vin}` : ''}`,
          vehicleVin: composerVehicleDraft?.vin,
          media: mediaAsset,
        });
      } else if (composerType === 'vip_appt') {
        await recordActivity({
          agentName: actor.actorName,
          role,
          priority: 1,
          category: 'appointment',
          title: `VIP Appt Locked • ${targetCustomer}`,
          detail: `${decodedTitle} • ${composerQuickChip}`,
          media: mediaAsset,
        });
      } else {
        await recordActivity({
          agentName: actor.actorName,
          role,
          priority: 1,
          category: 'showroom',
          title: `Floor Check • ${composerQuickChip}`,
          detail: `Verified frontline lot & showroom staging at ${activeStore.name}.`,
          media: mediaAsset,
        });
      }

      setPostMediaFile(null);
      setComposerVehicleDraft(null);
      setIsComposerOpen(false);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not record this activity.');
    } finally {
      setIsPostingActivity(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 w-full min-h-full pb-12 md:pl-28 overflow-x-hidden select-none sm:select-auto"
    >
      <AnimatePresence>
        {isSwitchingStore && (
          <GlobalLoader fullScreen={true} text={`Syncing ${activeStore.name}...`} />
        )}
      </AnimatePresence>

      <header className="mx-auto mb-5 mt-4 flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 md:mt-6 md:px-8">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-500">Live workspace</p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-3xl">{activeStore.name}</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {activeView === 'portal' ? 'Choose a live operational workspace.' : activeView === 'showroom' ? 'Showroom floor and appointment activity.' : activeView === 'activity' ? 'Recent team activity.' : `Customer visit · ${selectedSnapshot?.visit.customerName || ''}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {activeView !== 'portal' && (
            <button type="button" onClick={() => activeView === 'visit' ? switchView('showroom') : switchView('portal')} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10">
              <ArrowLeft size={13} /> {activeView === 'visit' ? 'Back' : 'Selector'}
            </button>
          )}
          {(role === 'bdc' || role === 'bdc_manager' || role === 'owner') && stores.length > 1 && (
            <button type="button" onClick={handleStoreBannerClick} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10">
              Switch store <ChevronRight size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 sm:px-6 md:px-10 max-w-6xl mx-auto">

        {/* Rotating live status; the people avatars are intentionally omitted from the demo. */}
        {activeView !== 'portal' && onlineUsersList.length > 0 && selectedOnlineUser && (
          <div className="mb-5 flex justify-end">
            <div className="flex max-w-full items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
              <img src={eveoSymbol} alt="" className="h-6 w-6 opacity-70" />
              <span className="truncate"><strong className="font-semibold text-gray-700 dark:text-gray-200">{selectedOnlineUser.name}</strong> · {selectedOnlineUser.statusText}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* VIEW 0: INITIAL PORTAL PICKER */}
          {activeView === 'portal' && (
            <motion.div
              key="view-portal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2"
            >
              <DashboardCard
                layoutId="portal-showroom"
                title="Live Showroom"
                value={ongoingAppointmentBubbles.length.toString()}
                trend="Customer visits in progress"
                titleColor="text-orange-500"
                icon={<Users size={15} />}
                borderGlow="bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30 dark:border-orange-500/20"
                onClick={() => switchView('showroom')}
              />

              <DashboardCard
                layoutId="portal-activity"
                title="Live Activity"
                value={feedPosts.length.toString()}
                trend="Recent dealership activity"
                titleColor="text-emerald-500"
                icon={<Activity size={15} />}
                onClick={() => switchView('activity')}
              />
            </motion.div>
          )}

          {/* VIEW 1: LIVE SHOWROOM DECK */}
          {activeView === 'showroom' && (
            <LiveShowroomDeck
              key="deck-showroom"
              storeId={storeId}
              latestCompletedHero={latestCompletedHero}
              activeVisitCount={activeSnapshots.length}
              scheduledCount={storeAppts.length}
              ongoingAppointmentBubbles={ongoingAppointmentBubbles}
              onSwitchToActivity={() => switchView('activity')}
              onOpenCheckIn={() => { setCheckInStep(0); setIsCheckInOpen(true); setMutationError(null); }}
              onExpandOngoingDash={() => setIsLobbyModalOpen(true)}
              onOpenOrStartVisit={(bubble) => void handleOpenOrStartVisit(bubble)}
              onMarkOverdueStrike={handleMarkOverdueStrike}
            />
          )}

          {/* VIEW 2: LIVE ACTIVITY DECK */}
          {activeView === 'activity' && (
            <LiveActivityDeck
              key="deck-activity"
              storeId={storeId}
              actorName={actor.actorName}
              feedPosts={feedPosts}
              setFeedPosts={setFeedPosts}
              activeVisitCount={activeSnapshots.length}
              onSwitchToShowroom={() => switchView('showroom')}
              onOpenNewActivity={() => { setComposerStep(0); setIsComposerOpen(true); }}
              onOpenVinScanner={() => setIsVinScannerOpen(true)}
              allowComments={!user}
            />
          )}

          {/* VIEW 3: DEDICATED CUSTOMER VISIT COCKPIT (Self-Contained, Zero Route Mismatches!) */}
          {activeView === 'visit' && selectedSnapshot && (
            <motion.div
              key={`visit-${selectedSnapshot.visit.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <DedicatedVisitCockpit
                snapshot={selectedSnapshot}
                actor={actor}
                role={role}
                isBdc={role === 'bdc' || role === 'bdc_manager'}
                busyAction={busyAction}
                mutationError={mutationError}
                newNote={newNote}
                setNewNote={setNewNote}
                stagedMediaFile={stagedMediaFile}
                stagedMediaPreviewUrl={stagedMediaPreviewUrl}
                onClearStagedMedia={() => setStagedMediaFile(null)}
                mediaInputRef={mediaInputRef}
                onAppendEvent={appendEvent}
                onStageEvent={handleStageEvent}
                onNoteOrMediaSubmit={handleNoteOrMediaSubmit}
                onStageMedia={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) setStagedMediaFile(f);
                }}
                onAssignToMe={handleAssignToMe}
                onClearError={() => setMutationError(null)}
                onBackToFloor={() => switchView('showroom')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- REUSED HUBMODALS ('handoffs') FOR EXPANDED ONGOING FLOOR DASHBOARD --- */}
      <SwipeableModal isOpen={isLobbyModalOpen} onClose={() => setIsLobbyModalOpen(false)}>
        <HubModals
          expanded="handoffs"
          role={role}
          onClose={() => setIsLobbyModalOpen(false)}
          onOpenShowroom={() => {
            setIsLobbyModalOpen(false);
            if (activeSnapshots[0]) {
              switchView('visit', activeSnapshots[0].visit.id);
            }
          }}
        />
      </SwipeableModal>

      {/* --- SMART, PRE-FILLABLE "LOG LIVE ACTIVITY" MODAL --- */}
      <SwipeableModal isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} maxWidthClass="md:max-w-xl">
        <div className="flex flex-col h-full min-h-0 p-5 sm:p-7 overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Step {composerStep + 1} of 3</span>
              <h2 className="text-lg sm:text-xl font-black text-white">Activity</h2>
            </div>
            <button type="button" onClick={() => setIsComposerOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={(e) => void handleSmartActivitySubmit(e)} className="space-y-5">
            {composerStep === 0 && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(
                [
                  { id: 'deal_desked', label: 'Deal Desked', icon: <DollarSign size={16} />, desc: 'VIN + Gross' },
                  { id: 'new_inventory', label: 'New Inventory', icon: <CarFront size={16} />, desc: 'Photo + VIN' },
                  { id: 'vip_appt', label: 'VIP Appt', icon: <CalendarDays size={16} />, desc: 'Confirm Show' },
                  { id: 'lot_walk', label: 'Activity', icon: <Radio size={16} />, desc: 'Share a status' },
                ] as const
              ).map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setComposerType(item.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${composerType === item.id
                      ? 'border-orange-500 bg-orange-500/15 text-white shadow-[0_0_20px_rgba(249,115,22,0.25)]'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/25'
                    }`}
                >
                  <span className="text-orange-400">{item.icon}</span>
                  <div>
                    <p className="text-xs font-black text-white">{item.label}</p>
                    <p className="text-[9px] font-bold text-gray-400">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>}

            {composerStep === 1 && <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Choose a customer (optional)</span>
                <div className="flex flex-wrap gap-1.5">
                  {storePipelineCustomers.map((cName) => <button type="button" key={cName} onClick={() => setSelectedCustomerPill(cName)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedCustomerPill === cName ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>{cName}</button>)}
                  {selectedCustomerPill && <button type="button" onClick={() => setSelectedCustomerPill('')} className="px-3 py-1.5 rounded-xl text-xs text-gray-400">Clear selection</button>}
                </div>
              </div>}

            {composerStep === 2 && <>
            {composerType === 'deal_desked' && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-2">
                  1-Tap Front/Back Deal Gross
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {['$2,400', '$3,850', '$5,200', '$6,900+'].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setDealGrossAmount(amt)}
                      className={`py-2 rounded-xl font-mono text-xs font-black border cursor-pointer ${dealGrossAmount === amt
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(composerType === 'deal_desked' || composerType === 'new_inventory') && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Vehicle VIN Lookup (1-Tap NHTSA Decode)
                  </span>
                  {composerVehicleDraft && (
                    <span className="text-[10px] font-mono text-emerald-400">{composerVehicleDraft.vin}</span>
                  )}
                </div>
                {user ? (
                  <VehicleVinLookupField purpose="vehicle_of_interest" value={composerVehicleDraft} onChange={setComposerVehicleDraft} />
                ) : <div className="flex flex-wrap gap-1.5">
                  {DEMO_SCAN_VINS.map((v) => (
                    <button
                      type="button"
                      key={v.vin}
                      onClick={async () => {
                        const res = await decodeVin(v.vin);
                        setComposerVehicleDraft({
                          ...res.vehicle,
                          purpose: 'vehicle_of_interest',
                          source: 'nhtsa-vpic',
                          decodedAt: new Date().toISOString(),
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${composerVehicleDraft?.vin === v.vin
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-orange-500/40'
                        }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>}
              </div>
            )}

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                1-Tap Outcome Tag
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Buyer Order Signed & Routed to F&I',
                  'Fresh Trade-In Inspected & Priced',
                  'Front-Line SUV Row Staged',
                  'Customer Confirmed & Keys Pulled',
                ].map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => setComposerQuickChip(chip)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${composerQuickChip === chip
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : 'bg-white/5 text-gray-400 border-white/10'
                      }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <input
                ref={postMediaInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setPostMediaFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => postMediaInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-white/20 hover:border-orange-500/40 bg-white/5 flex items-center justify-center gap-2 text-xs font-bold text-gray-300 cursor-pointer"
              >
                <ImagePlus size={16} className="text-orange-400" />
                {postMediaFile ? `Attached (4K WebP Ready): ${postMediaFile.name}` : 'Snap or Attach Vehicle / Deal Photo'}
              </button>
            </div>
            {composerType === 'lot_walk' && <label className="block"><span className="mb-2 block text-xs font-semibold text-gray-300">What are you working on?</span><textarea value={composerQuickChip} onChange={(event) => setComposerQuickChip(event.target.value)} maxLength={240} rows={3} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white" placeholder="Taking lunch, working older leads, or another status…" /></label>}

            <button
              type="submit"
              disabled={isPostingActivity}
              className="w-full min-h-13 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              {isPostingActivity ? 'Broadcasting...' : 'Broadcast Live Activity'}
            </button>
            </>}
            <div className="flex gap-2">
              {composerStep > 0 && <button type="button" onClick={() => setComposerStep((step) => step - 1)} className="min-h-11 flex-1 rounded-xl border border-white/15 text-sm font-semibold text-gray-200">Back</button>}
              {composerStep < 2 && <button type="submit" className="min-h-11 flex-1 rounded-xl bg-orange-500 text-sm font-bold text-white">Continue</button>}
            </div>
          </form>
        </div>
      </SwipeableModal>

{/* --- WALK-IN CHECK-IN MODAL WITH LIVE DATABASE QUERY & PROMINENT CUSTOM VIN BUTTON --- */}
      <SwipeableModal isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} maxWidthClass="md:max-w-lg">
        <div className="flex flex-col h-full min-h-0 p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block">Step {checkInStep + 1} of 4</span>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <UserCheck size={18} className="text-orange-500" /> Add Visit
              </h2>
            </div>
            <button type="button" onClick={() => setIsCheckInOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCheckIn} className="flex min-h-[20rem] flex-col justify-between space-y-4" aria-label="Add visit setup">
            {/* 1. Live Database Customer Query Input + "+ Create" Fallback */}
            <div hidden={checkInStep !== 0}>
              <h3 className="mb-3 text-base font-semibold text-white">What’s the name of the customer?</h3>
              <div>
                <input
                  name="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="Search customer name"
                  className={inputClasses}
                />
              </div>
              {/* Live Query Matches from Store Database OR "+ Create" Badge */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(() => {
                  const query = customerName.trim().toLowerCase();
                  const matches = storePipelineCustomers.filter((c) =>
                    !query ? true : c.toLowerCase().includes(query)
                  );

                  if (matches.length > 0) {
                    return matches.slice(0, 10).map((name) => (
                      <button
                        type="button"
                        key={name}
                        onClick={() => setCustomerName(name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          customerName.toLowerCase() === name.toLowerCase()
                            ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {name}
                      </button>
                    ));
                  }

                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs font-bold text-emerald-300">
                      + Create &ldquo;{customerName.trim()}&rdquo; as New Walk-In Record
                    </span>
                  );
                })()}
              </div>
            </div>

            <div hidden={checkInStep !== 1} className="space-y-3">
              <h3 className="text-base font-semibold text-white">Who’s the car for?</h3>
              <select value={greetedPerson} onChange={(event) => setGreetedPerson(event.target.value)} className={inputClasses}>
                <option value="themselves">Themselves</option><option value="spouse/partner">Spouse / Partner</option><option value="friend">Friend</option><option value="family">Family</option><option value="someone else">Someone Else</option>
              </select>
              {greetedPerson !== 'themselves' && <input value={relatedCustomerName} onChange={(event) => setRelatedCustomerName(event.target.value)} required maxLength={120} placeholder="What’s the name of the customer?" className={inputClasses} />}
            </div>

            {/* 2. 1-Tap Sales Rep Pill Selector */}
            <div hidden={checkInStep !== 2}>
              <h3 className="mb-3 text-base font-semibold text-white">Who’s the sales rep assigned?</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                Assign Floor Rep
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {salespeople.map((person) => {
                  const isRepSelected = String(person.id) === assignedRepId;
                  return (
                    <button
                      type="button"
                      key={person.id}
                      onClick={() => setAssignedRepId(String(person.id))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isRepSelected
                          ? 'bg-orange-500/20 border-orange-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-black/50 border border-white/15 flex items-center justify-center text-[10px] font-black text-orange-400 shrink-0">
                        {getInitials(person.name)}
                      </span>
                      <span className="text-xs font-bold truncate">{person.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 1-Tap Vehicle of Interest Pills + Prominent Custom VIN Button */}
            <div hidden={checkInStep !== 3}>
              <h3 className="mb-3 text-base font-semibold text-white">Select interested vehicle</h3>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Vehicle of Interest (1-Tap NHTSA Decode)
                </span>
                {vehicles.vehicleOfInterest && (
                  <span className="text-[10px] font-bold text-emerald-400 truncate max-w-48">
                    ✓ {vehicleTitle(vehicles.vehicleOfInterest)}
                  </span>
                )}
              </div>
              {user ? (
                <p className="text-xs text-gray-500">Use “Enter Custom VIN or Trade-In” below to scan or enter a vehicle from your dealership.</p>
              ) : <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_SCAN_VINS.map((v) => {
                  const isMatched = vehicles.vehicleOfInterest?.vin === v.vin;
                  return (
                    <button
                      type="button"
                      key={v.vin}
                      onClick={async () => {
                        const res = await decodeVin(v.vin);
                        setVehicles((prev) => ({
                          ...prev,
                          vehicleOfInterest: {
                            ...res.vehicle,
                            purpose: 'vehicle_of_interest',
                            source: 'nhtsa-vpic',
                            decodedAt: new Date().toISOString(),
                          },
                        }));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isMatched
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/25'
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{v.label}</p>
                      <p className="text-[9px] font-mono text-gray-400 mt-0.5">{v.vin.slice(-6)}</p>
                    </button>
                  );
                })}
              </div>}

              {/* Large, Easy-to-Press Custom VIN / Trade-In Expander Button! */}
              <details className="mt-3 group">
                <summary className="w-full min-h-11 px-4 py-2.5 rounded-xl bg-white/6 hover:bg-white/12 border border-white/15 text-xs font-bold text-orange-400 cursor-pointer select-none list-none flex items-center justify-between transition-all active:scale-[0.99]">
                  <span className="flex items-center gap-2">
                    <ScanBarcode size={16} /> + Enter Custom VIN or Trade-In
                  </span>
                  <ChevronRight size={15} className="group-open:rotate-90 transition-transform" />
                </summary>
                <div className="pt-3">
                  <ShowroomVehicleDetails value={vehicles} onChange={setVehicles} />
                </div>
              </details>
            </div>

            {mutationError && <p className="text-xs text-red-400" role="alert">{mutationError}</p>}
            <div className="flex gap-2 border-t border-white/10 pt-3">
              {checkInStep > 0 && <button type="button" onClick={() => setCheckInStep((step) => Math.max(0, step - 1))} className="min-h-11 flex-1 rounded-xl border border-white/15 px-4 text-sm font-semibold text-gray-300">Back</button>}
              {checkInStep < 3 ? <button type="button" disabled={checkInStep === 0 && !customerName.trim() || checkInStep === 1 && greetedPerson !== 'themselves' && !relatedCustomerName.trim()} onClick={() => setCheckInStep((step) => Math.min(3, step + 1))} className="min-h-11 flex-1 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white disabled:opacity-40">Continue</button> : <button type="submit" disabled={isSubmitting || !assignedRepId} className="min-h-11 flex-1 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white disabled:opacity-40">{isSubmitting ? 'Starting visit…' : 'Start visit'}</button>}
            </div>
          </form>
        </div>
      </SwipeableModal>

      {/* --- QUICK VIN SCANNER MODAL --- */}
      <SwipeableModal isOpen={isVinScannerOpen} onClose={() => setIsVinScannerOpen(false)} maxWidthClass="md:max-w-md">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ScanBarcode size={18} className="text-orange-500" /> Quick VIN Scanner
            </h3>
            <button type="button" onClick={() => setIsVinScannerOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
              <X size={15} />
            </button>
          </div>
          <div className="space-y-2">
            {user ? (
              <VehicleVinLookupField purpose="vehicle_of_interest" value={composerVehicleDraft} onChange={setComposerVehicleDraft} />
            ) : DEMO_SCAN_VINS.map((v) => (
              <button
                type="button"
                key={v.vin}
                onClick={async () => {
                  setIsVinScannerOpen(false);
                  const res = await decodeVin(v.vin);
                  setComposerVehicleDraft({
                    ...res.vehicle,
                    purpose: 'vehicle_of_interest',
                    source: 'nhtsa-vpic',
                    decodedAt: new Date().toISOString(),
                  });
                  setComposerType('new_inventory');
                  setComposerStep(0);
                  setIsComposerOpen(true);
                }}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-orange-500/15 border border-white/10 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white">{v.label}</p>
                  <p className="text-[10px] font-mono text-gray-400">{v.vin}</p>
                </div>
                <span className="text-xs font-bold text-orange-400">Decode &rarr;</span>
              </button>
            ))}
          </div>
        </div>
      </SwipeableModal>
    </motion.div>
  );
}

// ============================================================================
// DEDICATED CUSTOMER VISIT COCKPIT (View 4: 'visit')
// ============================================================================

const QUICK_CHIPS: Array<{ label: string; type: ShowroomEventType }> = [
  { label: '🔑 Pulled Keys & Staged', type: 'walkaround_started' },
  { label: '🔥 Loved Exterior / Trim', type: 'note_added' },
  { label: '🛣️ Out on Test Drive', type: 'test_drive_started' },
  { label: '📋 Appraising Trade-In', type: 'note_added' },
  { label: '💵 Reviewing Numbers', type: 'note_added' },
  { label: '⚡ Requesting BDC Assist', type: 'handoff_requested' },
];

const VISIT_STAGES = ['Greeting', 'Walk around', 'Demo Drive', 'Desking', 'Sold'] as const;

function VisitPostGallery({ snapshot }: { snapshot: ShowroomVisitSnapshot }) {
  const [slides, setSlides] = useState<Array<{ event: ShowroomEvent; url: string }>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    void Promise.all(snapshot.events.filter((event) => event.media?.kind === 'image').map(async (event) => {
      const blob = await getMockShowroomMedia(event.media!.id);
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      urls.push(url);
      return { event, url };
    })).then((items) => {
      if (!cancelled) setSlides(items.filter((item): item is { event: ShowroomEvent; url: string } => Boolean(item)));
    });
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [snapshot.events]);

  useEffect(() => setActiveIndex((index) => Math.min(index, Math.max(0, slides.length - 1))), [slides.length]);
  const active = slides[activeIndex];
  if (!active) return null;

  return (
    <section aria-label="Showroom visit photos" className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0f16]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-white/10 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{active.event.actorName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{EVENT_LABELS[active.event.type]} · {activeIndex + 1} of {slides.length}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous visit photo" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => index - 1)} className="h-10 w-10 rounded-full border border-gray-200 text-gray-700 disabled:opacity-35 dark:border-white/15 dark:text-white">‹</button>
          <button type="button" aria-label="Next visit photo" disabled={activeIndex >= slides.length - 1} onClick={() => setActiveIndex((index) => index + 1)} className="h-10 w-10 rounded-full border border-gray-200 text-gray-700 disabled:opacity-35 dark:border-white/15 dark:text-white">›</button>
        </div>
      </div>
      <div className="grid md:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.8fr)]">
        <div className="flex min-h-64 items-center justify-center bg-gray-950 md:min-h-80">
          <img src={active.url} alt={`${active.event.type.replaceAll('_', ' ')} by ${active.event.actorName}`} className="max-h-[70dvh] w-full object-contain" />
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">{EVENT_LABELS[active.event.type]}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">{active.event.message}</p>
          <time className="mt-3 block text-xs text-gray-500 dark:text-gray-400">{formatDateTime(active.event.occurredAt)}</time>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 border-t border-gray-200 py-3 dark:border-white/10" aria-label="Choose visit photo">
        {slides.map((slide, index) => <button key={slide.event.id} type="button" aria-label={`Show photo ${index + 1}`} aria-current={index === activeIndex} onClick={() => setActiveIndex(index)} className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-orange-500' : 'w-2.5 bg-gray-300 dark:bg-gray-600'}`} />)}
      </div>
    </section>
  );
}

function VisitStageWizard({
  snapshot, stage, setStage, busyAction, mutationError, onClearError, onStageEvent,
}: {
  snapshot: ShowroomVisitSnapshot;
  stage: number;
  setStage: (stage: number) => void;
  busyAction: string | null;
  mutationError: string | null;
  onClearError: () => void;
  onStageEvent: (type: ShowroomEventType, message: string, photo?: File, replyToEventId?: string) => Promise<boolean>;
}) {
  const { visit, events } = snapshot;
  const { user: accountUser } = useAuth();
  const user = accountUser?.demoMode ? null : accountUser;
  const [inventory, setInventory] = useState<ApiInventoryVehicle[]>([]);
  const [selectedCars, setSelectedCars] = useState<string[]>(() => {
    const initial = vehicleTitle(visit.vehicleOfInterest);
    return initial === 'Vehicle pending VIN' ? [] : [initial];
  });
  const [carsSeen, setCarsSeen] = useState('');
  const [walkaroundImpression, setWalkaroundImpression] = useState('Neutral');
  const [driveImpression, setDriveImpression] = useState('Neutral');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const greeting = events.find((event) => event.type === 'customer_greeted');
  const hasWalkaround = events.some((event) => event.type === 'walkaround_started');
  const hasDriveStarted = events.some((event) => event.type === 'test_drive_started');
  const hasDriveCompleted = events.some((event) => event.type === 'test_drive_completed');
  const deskEvent = events.find((event) => event.type === 'deal_desked' || event.type === 'handoff_requested');
  const isComplete = visit.status === 'completed';
  const completed = [Boolean(greeting?.media), Boolean(events.find((event) => event.type === 'walkaround_started')?.media), Boolean(events.find((event) => event.type === 'test_drive_completed')?.media), Boolean(deskEvent?.media), isComplete];

  useEffect(() => {
    if (!user) { setInventory([]); return; }
    let active = true;
    apiInventoryRepository.list(visit.storeId, { status: 'READY_FOR_SALE' })
      .then((vehicles) => { if (active) setInventory(vehicles); })
      .catch(() => { if (active) setInventory([]); });
    return () => { active = false; };
  }, [user, visit.storeId]);

  useEffect(() => {
    if (!photo) { setPhotoPreview(''); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (isComplete) setStage(4);
    else if (deskEvent) setStage(4);
    else if (hasDriveCompleted) setStage(3);
    else if (hasWalkaround) setStage(2);
  }, [deskEvent, hasDriveCompleted, hasWalkaround, isComplete, setStage]);

  const clearStep = () => { setNote(''); setPhoto(null); };
  const impressions = ['Positive', 'Neutral', 'Negative'];
  const submitStep = async () => {
    if (stage === 0) {
      if (!photo || !greeting) return;
      const trimmed = note.trim();
      const detail = `Greeting proof${trimmed ? ` · ${trimmed}` : ''}`;
      if (await onStageEvent('media_added', detail, photo, greeting.id)) { clearStep(); setStage(1); }
      return;
    }
    if (stage === 1) {
      if (!photo) return;
      const viewedCars = [...new Set([...selectedCars, carsSeen.trim()].filter(Boolean))];
      const detail = [`Cars viewed: ${viewedCars.join(', ') || 'Not recorded'}`, `Impression: ${walkaroundImpression}`, note.trim() && `Notes: ${note.trim()}`].filter(Boolean).join(' · ');
      if (await onStageEvent('walkaround_started', detail, photo)) { clearStep(); setStage(2); }
      return;
    }
    if (stage === 2) {
      if (!hasDriveStarted) {
        if (await onStageEvent('test_drive_started', `Test drive started.${note.trim() ? ` ${note.trim()}` : ''}`)) { clearStep(); }
        return;
      }
      if (!photo) return;
      const detail = [`Customer impression: ${driveImpression}`, note.trim() && `Notes: ${note.trim()}`].filter(Boolean).join(' · ');
      if (await onStageEvent('test_drive_completed', detail, photo || undefined)) { clearStep(); setStage(3); }
      return;
    }
    if (stage === 3) {
      if (!deskEvent && !photo) return;
      const detail = `Deal desked${note.trim() ? ` · ${note.trim()}` : ''}`;
      const type: ShowroomEventType = deskEvent && !photo ? 'note_added' : 'deal_desked';
      if (await onStageEvent(type, detail, photo || undefined, deskEvent?.id)) { clearStep(); setStage(4); }
      return;
    }
    if (!photo) return;
    const detail = `Customer delivery${note.trim() ? ` · ${note.trim()}` : ''}`;
    if (await onStageEvent('visit_completed', detail, photo || undefined)) { clearStep(); }
  };

  const stepTitle = VISIT_STAGES[stage];
  const needsPhoto = stage === 0 || stage === 1 || (stage === 2 && hasDriveStarted && !hasDriveCompleted) || stage === 3 || stage === 4;
  const driveAlreadyStarted = stage === 2 && hasDriveStarted && !hasDriveCompleted;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:p-6" aria-labelledby="visit-step-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">Sales visit · step {stage + 1} of {VISIT_STAGES.length}</p>
          <h3 id="visit-step-title" className="mt-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{stepTitle}</h3>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-white/8 dark:text-gray-200">{visit.greetedPerson} · {visit.assignedRepName}</span>
      </div>
      <nav aria-label="Visit progress" className="mt-5 grid grid-cols-5 gap-1.5 sm:gap-2">
        {VISIT_STAGES.map((label, index) => <button key={label} type="button" onClick={() => setStage(index)} aria-current={index === stage ? 'step' : undefined} className={`min-h-11 rounded-xl border px-1.5 text-center text-[10px] font-semibold transition sm:text-xs ${index === stage ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300' : completed[index] ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/4 dark:text-gray-400'}`}><span className="block text-xs">{completed[index] ? '✓' : index + 1}</span><span className="block truncate">{label}</span></button>)}
      </nav>

      <div className="mt-5 space-y-4">
        {stage === 0 && <><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-200">Add a greeting photo or a photo of the vehicle to record this step.</div><PhotoPicker photo={photo} preview={photoPreview} onChange={setPhoto} label="Greeting photo · required" help="Take a photo of the vehicle or greeting moment. Respect the customer’s consent." /></>}
        {stage === 1 && <>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cars the customer viewed</p>
            {inventory.length > 0 && <fieldset className="mt-2 grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-white/4" aria-label="Choose vehicles from live inventory">
              <legend className="sr-only">Choose vehicles from live inventory</legend>
              {inventory.slice(0, 24).map((vehicle) => {
                const label = `${vehicle.vehicle}${vehicle.stockNumber ? ` · ${vehicle.stockNumber}` : ''}`;
                const checked = selectedCars.includes(label);
                return <label key={vehicle._id} className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm text-gray-800 hover:bg-white dark:text-gray-200 dark:hover:bg-white/6"><input type="checkbox" checked={checked} onChange={() => setSelectedCars((current) => checked ? current.filter((item) => item !== label) : [...current, label])} className="h-4 w-4 accent-orange-500" /><span className="min-w-0 truncate">{label}</span></label>;
              })}
            </fieldset>}
            <label className="mt-2 block text-xs font-medium text-gray-600 dark:text-gray-400">Add another model or stock number<input value={carsSeen} onChange={(event) => setCarsSeen(event.target.value)} placeholder="Optional" className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#101722] dark:text-white" /></label>
            {user && inventory.length === 0 && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No ready inventory is available to select. Add a vehicle or enter the model above.</p>}
          </div>
          <PhotoPicker photo={photo} preview={photoPreview} onChange={setPhoto} label="Walk-around photo · required" help="Show the customer viewing the vehicle or walking the lot." />
          <fieldset><legend className="text-xs font-semibold text-gray-700 dark:text-gray-300">Walkaround impression</legend><div className="mt-2 grid grid-cols-3 gap-2">{impressions.map((value) => <button key={value} type="button" aria-pressed={walkaroundImpression === value} onClick={() => setWalkaroundImpression(value)} className={`min-h-11 rounded-xl border text-sm font-semibold ${walkaroundImpression === value ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'}`}>{value}</button>)}</div></fieldset>
        </>}
        {stage === 2 && <>
          <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/8 dark:text-blue-200">{driveAlreadyStarted ? 'Test drive is in progress. Record the customer’s impression when they return.' : 'Start the test drive now. Finish this step after recording how the customer felt.'}</p>
          {driveAlreadyStarted && <fieldset><legend className="text-xs font-semibold text-gray-700 dark:text-gray-300">Customer driving impression</legend><div className="mt-2 grid grid-cols-3 gap-2">{impressions.map((value) => <button key={value} type="button" aria-pressed={driveImpression === value} onClick={() => setDriveImpression(value)} className={`min-h-11 rounded-xl border text-sm font-semibold ${driveImpression === value ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'}`}>{value}</button>)}</div></fieldset>}
          {driveAlreadyStarted && <PhotoPicker photo={photo} preview={photoPreview} onChange={setPhoto} label="Demo-drive photo · required" help="Capture the customer seated in or driving the vehicle, with permission." />}
        </>}
        {stage === 3 && <PhotoPicker photo={photo} preview={photoPreview} onChange={setPhoto} label="Desking photo · required" help="Photograph the proposed deal. Do not include personal or financial information." />}
        {stage === 4 && <PhotoPicker photo={photo} preview={photoPreview} onChange={setPhoto} label="Sold photo · required" help="Add a photo of the signed contract or vehicle handoff." />}
        {<label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Visit notes<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder={stage === 0 ? 'Add context to the greeting (optional)' : 'Add details for BDC or the next team member'} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#101722] dark:text-white" /></label>}
        {mutationError && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200"><span>{mutationError}</span><button type="button" onClick={onClearError} className="font-semibold">Dismiss</button></div>}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 dark:border-white/10 sm:flex-row sm:justify-between">
          <button type="button" disabled={stage === 0 || busyAction !== null} onClick={() => { clearStep(); setStage(stage - 1); }} className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 disabled:opacity-40 dark:border-white/15 dark:text-gray-200">Previous step</button>
          <button type="button" disabled={busyAction !== null || (needsPhoto && !photo) || (isComplete && stage === 4)} onClick={() => void submitStep()} className="min-h-11 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-45">{busyAction ? 'Saving…' : stage === 2 && !hasDriveStarted ? 'Start demo drive' : stage === 4 ? (isComplete ? 'Visit complete' : 'Complete sale') : stage === 0 ? 'Save greeting & continue' : stage === 1 ? 'Save walk-around & continue' : stage === 2 ? 'Save demo drive & continue' : 'Save desking & continue'}</button>
        </div>
      </div>
    </section>
  );
}

function PhotoPicker({ photo, preview, onChange, label, help }: { photo: File | null; preview: string; onChange: (file: File | null) => void; label: string; help?: string }) {
  const inputId = `visit-photo-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  return <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-gray-900 dark:text-white">{label}</p>{help && <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-600 dark:text-gray-400">{help}</p>}</div><label htmlFor={inputId} className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-orange-600 px-3 text-xs font-semibold text-white"><ImagePlus size={15} />{photo ? 'Replace' : 'Take / choose'}</label><input id={inputId} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => onChange(event.target.files?.[0] || null)} /></div>
    {photo && <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-black/20"><img src={preview} alt="Selected visit photo" className="h-14 w-20 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-200">{photo.name}</span><button type="button" onClick={() => onChange(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-300">Remove</button></div>}
  </div>;
}

function DedicatedVisitCockpit({
  snapshot,
  actor,
  role,
  isBdc,
  busyAction,
  mutationError,
  newNote,
  setNewNote,
  stagedMediaFile,
  stagedMediaPreviewUrl,
  onClearStagedMedia,
  mediaInputRef,
  onAppendEvent,
  onStageEvent,
  onNoteOrMediaSubmit,
  onStageMedia,
  onAssignToMe,
  onClearError,
  onBackToFloor,
}: {
  snapshot: ShowroomVisitSnapshot;
  actor: { actorId: string; actorName: string };
  role: string;
  isBdc: boolean;
  busyAction: string | null;
  mutationError: string | null;
  newNote: string;
  setNewNote: (v: string) => void;
  stagedMediaFile: File | null;
  stagedMediaPreviewUrl: string | null;
  onClearStagedMedia: () => void;
  mediaInputRef: React.RefObject<HTMLInputElement | null>;
  onAppendEvent: (type: ShowroomEventType, message: string, extras?: Partial<AppendShowroomEventInput>) => Promise<boolean>;
  onStageEvent: (type: ShowroomEventType, message: string, photo?: File, replyToEventId?: string) => Promise<boolean>;
  onNoteOrMediaSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onStageMedia: (e: ChangeEvent<HTMLInputElement>) => void;
  onAssignToMe: () => Promise<void>;
  onClearError: () => void;
  onBackToFloor: () => void;
}) {
  const quickTelemetryEnabled = import.meta.env.VITE_SHOW_QUICK_TELEMETRY === 'true';
  const { visit, events } = snapshot;
  const [stage, setStage] = useState(1);
  const isClosed = visit.status === 'completed' || visit.status === 'cancelled';
  const hasWalkaround = events.some((event) => event.type === 'walkaround_started');
  const hasTestDriveStarted = events.some((event) => event.type === 'test_drive_started');
  const hasTestDriveCompleted = events.some((event) => event.type === 'test_drive_completed');
  const hasHandoff = visit.status === 'handoff_requested' || events.some((e) => e.type === 'handoff_requested');
  const isAssignedToActor = visit.assignedRepId === actor.actorId || visit.assignedRepName === actor.actorName;

  const steps = [
    { key: 'greeted', label: 'Greeted', done: true },
    { key: 'walkaround', label: 'Walkaround', done: hasWalkaround, onTrigger: () => !hasWalkaround && void onAppendEvent('walkaround_started', 'Walk-around started.') },
    {
      key: 'test_drive',
      label: hasTestDriveStarted && !hasTestDriveCompleted ? 'Driving' : 'Test Drive',
      done: hasTestDriveCompleted,
      active: hasTestDriveStarted && !hasTestDriveCompleted,
      onTrigger: () => {
        if (!hasTestDriveStarted) void onAppendEvent('test_drive_started', 'Test drive started.');
        else if (!hasTestDriveCompleted) void onAppendEvent('test_drive_completed', 'Test drive completed.');
      },
    },
    {
      key: 'handoff',
      label: isBdc ? 'Log BDC' : 'Handoff',
      done: hasHandoff,
      onTrigger: () => {
        if (isBdc) void onAppendEvent('bdc_contact_logged', 'BDC logged customer contact / follow-up.');
        else if (visit.status !== 'handoff_requested') void onAppendEvent('handoff_requested', 'Salesperson requested BDC assistance.');
      },
    },
    {
      key: 'complete',
      label: 'Complete',
      done: visit.status === 'completed',
      onTrigger: () => !isClosed && void onAppendEvent('visit_completed', 'Visit completed.'),
    },
  ];

  const initials = getInitials(visit.customerName);

  return (
    <div className="space-y-6">
      {/* Top Customer Summary Card (Matches ScheduleCards Glass!) */}
      <div className={`${glassCardClasses} p-6 sm:p-8`}>
        <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-linear-to-b from-orange-500/20 to-[#0a0f16] border-2 border-orange-500/50 flex items-center justify-center font-black text-xl text-white shrink-0">
              {initials}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-1">
                Active Showroom Visit
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{visit.customerName}</h2>
              <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Assigned to <strong className="text-white">{visit.assignedRepName}</strong></span>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> {formatDateTime(visit.createdAt)}</span>
                {visit.customerPhone && <><span>&bull;</span><span>{visit.customerPhone}</span></>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isAssignedToActor && !isClosed && (role === 'sales' || role === 'manager' || role === 'owner') && (
              <button
                type="button"
                onClick={() => void onAssignToMe()}
                disabled={busyAction !== null}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold cursor-pointer"
              >
                <UserCheck size={14} className="inline mr-1.5" /> Claim Customer
              </button>
            )}
            <button
              type="button"
              onClick={onBackToFloor}
              className="min-h-11 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
            >
              Showroom
            </button>
          </div>
        </div>

        {/* 1-Tap 5-Stage Progress Stepper */}
        <div className="hidden">
          {steps.map((step, i) => (
            <button
              type="button"
              key={step.key}
              disabled={isClosed || busyAction !== null || !step.onTrigger}
              onClick={step.onTrigger}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border text-center transition-all ${step.done
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : step.active
                    ? 'border-orange-500 bg-orange-500/20 text-orange-300 animate-pulse'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-orange-500/40 hover:text-white'
                } ${step.onTrigger && !isClosed ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
            >
              <span className="text-xs font-black">{step.done ? '✓' : i + 1}</span>
              <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full">{step.label}</span>
            </button>
          ))}
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Vehicle of Interest</p>
            <p className="mt-1 text-sm font-bold text-white">{vehicleTitle(visit.vehicleOfInterest)}</p>
            {visit.vehicleOfInterest && <p className="mt-0.5 font-mono text-[10px] text-gray-400">VIN: {visit.vehicleOfInterest.vin}</p>}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Customer Trade-In</p>
            <p className="mt-1 text-sm font-bold text-white">{vehicleTitle(visit.tradeIn)}</p>
            {visit.tradeIn && <p className="mt-0.5 font-mono text-[10px] text-gray-400">VIN: {visit.tradeIn.vin}</p>}
          </div>
        </div>
      </div>

      <VisitPostGallery snapshot={snapshot} />
      <VisitStageWizard snapshot={snapshot} stage={stage} setStage={setStage} busyAction={busyAction} mutationError={mutationError} onClearError={onClearError} onStageEvent={onStageEvent} />

      {/* Lower Split: [Left 1-Tap Chips + Photo/Note Logger] | [Right Visit Timeline] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {quickTelemetryEnabled && !isClosed && (
          <div className="lg:col-span-5">
            <div className={`${glassCardClasses} p-6 space-y-4`}>
              <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
              <h3 className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1.5">
                <Sparkles size={13} /> 1-Tap Quick Telemetry
              </h3>

              <div className="relative z-10 grid grid-cols-2 gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    type="button"
                    key={chip.label}
                    disabled={busyAction !== null}
                    onClick={() => void onAppendEvent(chip.type, chip.label)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-bold text-gray-200 hover:text-white active:scale-95 transition-all cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {mutationError && (
                <div className="relative z-10 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle size={15} className="shrink-0" />
                  <span className="flex-1">{mutationError}</span>
                  <button type="button" onClick={onClearError}><X size={14} /></button>
                </div>
              )}

              {stagedMediaFile && (
                <div className="relative z-10 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {stagedMediaPreviewUrl && stagedMediaFile?.type.startsWith('image/') ? (
                      <img src={stagedMediaPreviewUrl || undefined} alt="Preview" className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                        <Video size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{stagedMediaFile?.name}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold">4K Auto-Downscaler Ready</p>
                    </div>
                  </div>
                  <button type="button" onClick={onClearStagedMedia} className="p-2 text-gray-400 hover:text-red-400 cursor-pointer">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}

              <form onSubmit={(e) => void onNoteOrMediaSubmit(e)} className="relative z-10 space-y-3 pt-2 border-t border-white/10">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    className="min-h-11 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-orange-400 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <ImagePlus size={16} /> Media
                  </button>
                  <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={onStageMedia} />

                  <input
                    name="visit_note_input"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={stagedMediaFile ? 'Add photo caption...' : 'Add floor note for BDC...'}
                    className={inputClasses}
                  />
                </div>
                <button
                  type="submit"
                  disabled={(!newNote.trim() && !stagedMediaFile) || busyAction !== null}
                  className="w-full min-h-11 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={14} /> {stagedMediaFile ? 'Upload Media & Note' : 'Post Update'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="lg:col-span-12">
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:p-6">
            <div className="relative z-10 flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold tracking-tight text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MessageSquareText size={14} className="text-orange-500" /> Visit Timeline ({events.length})
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
              </span>
            </div>

            <ol className="relative z-10 space-y-0 max-h-105 overflow-y-auto pr-1 custom-scrollbar">
              {events.slice().reverse().map((event, index) => (
                <TimelineEvent key={event.id} event={event} isLast={index === events.length - 1} onReply={(message) => onAppendEvent('note_added', message, { replyToEventId: event.id })} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({ event, isLast, onReply }: { event: ShowroomEvent; isLast: boolean; onReply: (message: string) => Promise<boolean> }) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const mediaId = event.media?.id;

  useEffect(() => {
    let objectUrl: string | null = null;
    let mounted = true;
    if (mediaId) {
      void getMockShowroomMedia(mediaId).then((blob) => {
        if (!mounted || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setMediaUrl(objectUrl);
      });
    }
    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaId]);

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && <span aria-hidden="true" className="absolute bottom-0 left-4 top-8 w-px bg-white/10" />}
      <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[10px] font-bold text-orange-700 dark:border-white/15 dark:bg-white/5 dark:text-orange-300">
        {getInitials(event.actorName)}
      </span>
      <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-900 dark:text-white">{event.replyToEventId ? 'Comment' : EVENT_LABELS[event.type]}</p>
          <time className="text-[10px] text-gray-500 dark:text-gray-400">{formatDateTime(event.occurredAt)}</time>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">{event.message}</p>
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">{event.actorName}</p>
        {event.media && mediaUrl && (
          <div className="mt-2.5 overflow-hidden rounded-xl border border-gray-200 bg-black/40 dark:border-white/10">
            {event.media.kind === 'image' && <img src={mediaUrl} alt={event.media.fileName} className="max-h-60 w-full object-contain" />}
            {event.media.kind === 'video' && <video src={mediaUrl} controls playsInline className="max-h-60 w-full bg-black" />}
          </div>
        )}
        <div className="mt-3 border-t border-gray-200 pt-2 dark:border-white/10">
          {replyOpen ? <form onSubmit={async (formEvent) => { formEvent.preventDefault(); if (!reply.trim() || replyBusy) return; setReplyBusy(true); const saved = await onReply(reply.trim()); setReplyBusy(false); if (saved) { setReply(''); setReplyOpen(false); } }} className="flex gap-2">
            <input value={reply} onChange={(formEvent) => setReply(formEvent.target.value)} maxLength={1000} aria-label={`Reply to ${EVENT_LABELS[event.type]}`} placeholder="Add a comment or ask for context…" className="min-h-10 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#101722] dark:text-white" />
            <button type="submit" disabled={!reply.trim() || replyBusy} className="min-h-10 rounded-xl bg-orange-600 px-3 text-xs font-semibold text-white disabled:opacity-45">{replyBusy ? '…' : 'Reply'}</button>
          </form> : <button type="button" onClick={() => setReplyOpen(true)} className="min-h-9 text-xs font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200">Reply / add context</button>}
        </div>
      </div>
    </li>
  );
}
