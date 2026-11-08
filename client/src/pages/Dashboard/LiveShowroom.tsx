// src/pages/Dashboard/LiveShowroom.tsx
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertCircle, ArrowLeft, CalendarClock, CalendarDays, CarFront, ChevronRight, DollarSign, ImagePlus, LoaderCircle,
  MessageSquareText, Radio, ScanBarcode, Send, Sparkles, Trash2,
  UserCheck, Users, Video, X, Zap
} from 'lucide-react';
import { CURRENT_USER, getStoreDataOrEmpty, getVisibleStoreRoster } from '../../data/mockDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import defaultBanner from '../../images/defaultBanner.avif';
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
import LiveShowroomDeck, { type FloorAppointmentBubble } from '../../components/showroom/LiveShowroomDeck';
import LiveActivityDeck from '../../components/showroom/LiveActivityDeck';
import { showroomRepository } from '../../services/showroom';
import { apiLiveActivityRepository } from '../../services/liveActivity/apiLiveActivityRepository';
import { apiOperationalRepository } from '../../services/operational/apiOperationalRepository';
import { getMockShowroomMedia, saveMockShowroomMedia } from '../../services/showroomMedia/mockShowroomMediaStore';
import { decodeVin } from '../../utils/nhtsaVinService';
import { getAppointmentsByDate, getTodayDateKey, type Appointment } from '../../utils/appointmentManager';
import {
  listLiveFeed,
  publishLiveActivity,
  resolveAgentAvatar,
  isValidUploadedAvatar,
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
  const { role, user } = useAuth();
  const { activeStore, activeStoreId, activeStoreDomainId, getBanner, cycleNextStore, stores, setActiveStoreId } = useStoreAppearance();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedStoreId = searchParams.get('storeId');
  const requestedStore = stores.find((store) =>
    store.id === requestedStoreId || store.domainId === requestedStoreId || store.legacyDataKey === requestedStoreId,
  );
  const storeId = requestedStore?.domainId || activeStoreDomainId;
  const activeStoreIdx = Math.max(0, stores.findIndex((store) => store.id === storeId));
  const displayBanner = getBanner(storeId) || activeStore.bannerUrl || (storeId === 'njx' ? defaultBanner : '');

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

  const salespeople = useMemo(() => {
    if (user) return [{ id: user.id, name: user.name, role: 'sales' as const }];
    const staff = getStoreDataOrEmpty(storeId).staff;
    return staff.filter((person) => person.role === 'sales' || person.role === 'manager');
  }, [storeId, user]);

  const roster = useMemo(() => getVisibleStoreRoster(storeId), [storeId]);

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
  const [customerPhone, setCustomerPhone] = useState('');
  const [assignedRepId, setAssignedRepId] = useState('');
  const [initialNotes, setInitialNotes] = useState('');
  const [vehicles, setVehicles] = useState<ShowroomVehicleSelection>(EMPTY_VEHICLES);

  // Visit Timeline Note + Staged Photo/Video State
  const [newNote, setNewNote] = useState('');
  const [stagedMediaFile, setStagedMediaFile] = useState<File | null>(null);
  const [stagedMediaPreviewUrl, setStagedMediaPreviewUrl] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Live Activity Feed State
  const [feedPosts, setFeedPosts] = useState<LiveFeedPost[]>(() => user ? [] : listLiveFeed(storeId));
  const [onlineCursorIdx, setOnlineCursorIdx] = useState(0);

  // Smart Actionable "Log Live Activity" Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'deal_desked' | 'new_inventory' | 'vip_appt' | 'lot_walk'>('deal_desked');
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
        category: 'account',
        title: 'Staff note added',
        description: `${input.title}${input.detail ? ` — ${input.detail}` : ''}`,
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
            customer: item.customerNameSnapshot, vehicle: item.vehicleSnapshot || 'Vehicle not specified', rep: user.name,
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
  }, [storeId, user]);

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
    const storeSold = getStoreDataOrEmpty(storeId).sold[0];
    return {
      customerName: storeSold?.name || '',
      vehicle: storeSold?.vehicle || '',
      rep: storeSold?.rep || salespeople[0]?.name || '',
      time: '',
    };
  }, [completedSnapshots, storeId, salespeople]);

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
  }, [roster, feedPosts]);

  const selectedOnlineUser = onlineUsersList[onlineCursorIdx % Math.max(1, onlineUsersList.length)] || null;

  const storePipelineCustomers = useMemo(() => {
    const s = getStoreDataOrEmpty(storeId);
    const names = new Set<string>();
    s.handoffs?.forEach((h) => names.add(h.name));
    s.leads?.forEach((l) => names.add(l.name));
    s.appointments?.forEach((a) => names.add(a.name || a.customer || ''));
    return Array.from(names).filter(Boolean).slice(0, 6);
  }, [storeId]);

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
    const created = await showroomRepository.createVisit(storeId, {
      customerName: bubble.customerName,
      customerPhone: bubble.customerPhone,
      customerId: bubble.customerId,
      leadId: bubble.leadId,
      appointmentId: bubble.appointmentId,
      notes: `Checked in from Master Schedule (${bubble.vehicle}).`,
      assignedRepId: repObj ? String(repObj.id) : actor.actorId,
      assignedRepName: bubble.rep || actor.actorName,
      checkedInById: actor.actorId,
      checkedInByName: actor.actorName,
      vehicles: EMPTY_VEHICLES,
    });
    setSnapshots((current) => [created, ...current.filter((item) => item.visit.id !== created.visit.id)]);
    switchView('visit', created.visit.id);
  };

  const handleMarkOverdueStrike = (bubble: FloorAppointmentBubble) => {
    setStrikesLog((prev) => ({ ...prev, [bubble.id]: bubble.rep }));
    void recordActivity({
      agentName: user?.name || 'EVEO AI',
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
        customerPhone,
        notes: initialNotes,
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
      setCustomerPhone('');
      setInitialNotes('');
      setVehicles(EMPTY_VEHICLES);
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
  ) => {
    if (!selectedSnapshot) return;
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
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not update visit.');
    } finally {
      setBusyAction(null);
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
        const asset = await saveMockShowroomMedia(stagedMediaFile);
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
    setIsPostingActivity(true);

    try {
      let mediaAsset = undefined;
      if (postMediaFile) {
        if (user) throw new Error('Secure photo storage is not configured for authenticated showroom visits yet.');
        mediaAsset = await saveMockShowroomMedia(postMediaFile);
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

      {/* --- RECYCLED STORE BANNER CARD: ((•)) Live {activeStore.name} --- */}
      <section
        onClick={handleStoreBannerClick}
        className={`relative w-full h-44 sm:h-52 mb-5 rounded-b-3xl md:rounded-4xl overflow-hidden group md:mt-6 md:mx-8 md:w-[calc(100%-4rem)] max-w-6xl xl:mx-auto shadow-2xl ${role === 'bdc' || role === 'bdc_manager' || role === 'owner'
            ? 'cursor-pointer active:scale-[0.99] transition-transform'
            : ''
          }`}
      >
        <img
          src={displayBanner}
          alt={`${activeStore.name} Live Banner`}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/45 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#05080c]/95 via-[#05080c]/70 to-transparent" />

        {activeView !== 'portal' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activeView === 'visit') switchView('showroom');
              else switchView('portal');
            }}
            className="absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 backdrop-blur-xl text-xs font-bold text-white active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft size={13} /> {activeView === 'visit' ? 'Back to Showroom' : 'Live Selector'}
          </button>
        )}

        <div className="relative z-10 h-full flex flex-col justify-end p-5 pb-6 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-lg flex items-center gap-2.5">
                <Radio className="text-orange-500 animate-pulse shrink-0" size={26} />
                <span>Live {activeStore.name}</span>
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm font-medium mt-0.5 drop-shadow-xs">
                {activeView === 'portal'
                  ? 'Select a live operational workspace below'
                  : activeView === 'showroom'
                    ? 'Active Showroom Floor & SLA Appointment Radar'
                    : activeView === 'activity'
                      ? 'Real-Time Team & EVEO AI Telemetry Deck'
                      : `Active Customer Visit • ${selectedSnapshot?.visit.customerName || ''}`}
              </p>
            </div>

            <div className="hidden sm:flex items-center p-1.5 pr-3.5 gap-2.5 rounded-full backdrop-blur-xl bg-white/10 dark:bg-black/40 border border-white/20 text-white text-xs font-bold shrink-0">
              <span className="bg-white text-black px-2.5 py-1 rounded-full text-[10px] font-black">
                {activeStore.logoText}
              </span>
              <span>{activeStore.name}</span>
              {(role === 'bdc' || role === 'bdc_manager' || role === 'owner') && (
                <ChevronRight size={14} className="text-white/60" />
              )}
            </div>
          </div>
        </div>

        {(role === 'bdc' || role === 'bdc_manager' || role === 'owner') && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {stores.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeStoreIdx
                    ? 'w-6 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                    : 'w-2 bg-white/30'
                  }`}
              />
            ))}
          </div>
        )}
      </section>

      <div className="px-4 sm:px-6 md:px-10 max-w-6xl mx-auto">

        {/* --- TOP-RIGHT "ONLINE NOW" BAR (Initials Orbs + Uploaded Avatar for AH) --- */}
        {activeView !== 'portal' && onlineUsersList.length > 0 && selectedOnlineUser && (
          <div className="flex justify-end mb-5">
            <div className="inline-flex flex-col items-end gap-2 p-2.5 rounded-3xl bg-[#0a0f16]/85 backdrop-blur-2xl border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 pl-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  {onlineUsersList.length} Online Now
                </span>

                <div className="flex items-center -space-x-1.5 pr-1">
                  {onlineUsersList.map((u, idx) => {
                    const isSelected = idx === onlineCursorIdx % onlineUsersList.length;
                    return (
                      <button
                        type="button"
                        key={u.name}
                        onClick={() => setOnlineCursorIdx(idx)}
                        title={u.name}
                        className={`relative w-8 h-8 rounded-full font-black text-[10px] flex items-center justify-center transition-all cursor-pointer outline-none overflow-visible ${isSelected
                            ? 'z-20 scale-110 bg-orange-500 text-white ring-2 ring-white shadow-[0_0_12px_rgba(249,115,22,0.8)]'
                            : 'z-10 bg-slate-900 text-gray-200 border border-white/20 hover:bg-slate-800 hover:z-20'
                          }`}
                      >
                        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[65%] h-[32%] bg-white/25 rounded-full pointer-events-none z-20" />
                        {isValidUploadedAvatar(u.avatarUrl) ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-full object-cover relative z-10" />
                        ) : (
                          <span className="relative z-10">{u.initials}</span>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0a0f16] z-30" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-400">
                <Radio size={12} className="shrink-0 animate-pulse" />
                <span className="truncate max-w-60 sm:max-w-xs">
                  <strong>{selectedOnlineUser.name}:</strong> {selectedOnlineUser.statusText}
                </span>
              </div>
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
                trend="Active Floor & SLA Appointment Radar"
                titleColor="text-orange-500"
                icon={<Users size={15} />}
                dotColor="bg-orange-500"
                pingColor="bg-orange-400"
                borderGlow="bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30 dark:border-orange-500/20"
                onClick={() => switchView('showroom')}
              />

              <DashboardCard
                layoutId="portal-activity"
                title="Live Activity"
                value={feedPosts.length.toString()}
                trend="Real-Time Team & EVEO AI Telemetry Deck"
                titleColor="text-emerald-500"
                icon={<Activity size={15} />}
                dotColor="bg-emerald-500"
                pingColor="bg-emerald-400"
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
              onOpenCheckIn={() => { setIsCheckInOpen(true); setMutationError(null); }}
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
              onOpenNewActivity={() => setIsComposerOpen(true)}
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
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                1-Tap Smart Telemetry
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">Log Live Activity</h2>
            </div>
            <button type="button" onClick={() => setIsComposerOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={(e) => void handleSmartActivitySubmit(e)} className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(
                [
                  { id: 'deal_desked', label: 'Deal Desked', icon: <DollarSign size={16} />, desc: 'VIN + Gross' },
                  { id: 'new_inventory', label: 'New Inventory', icon: <CarFront size={16} />, desc: 'Photo + VIN' },
                  { id: 'vip_appt', label: 'VIP Appt', icon: <CalendarDays size={16} />, desc: 'Confirm Show' },
                  { id: 'lot_walk', label: 'Floor Check', icon: <Radio size={16} />, desc: 'Quick Status' },
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
            </div>

            {(composerType === 'deal_desked' || composerType === 'vip_appt') && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                  1-Tap Select Customer
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {storePipelineCustomers.map((cName) => (
                    <button
                      type="button"
                      key={cName}
                      onClick={() => setSelectedCustomerPill(cName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${selectedCustomerPill === cName
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                        }`}
                    >
                      {cName}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                <div className="flex flex-wrap gap-1.5">
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
                </div>
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

            <button
              type="submit"
              disabled={isPostingActivity}
              className="w-full min-h-13 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              {isPostingActivity ? 'Broadcasting...' : 'Broadcast Live Activity'}
            </button>
          </form>
        </div>
      </SwipeableModal>

{/* --- WALK-IN CHECK-IN MODAL WITH LIVE DATABASE QUERY & PROMINENT CUSTOM VIN BUTTON --- */}
      <SwipeableModal isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} maxWidthClass="md:max-w-lg">
        <div className="flex flex-col h-full min-h-0 p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block">
                Instant Floor Onboarding
              </span>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <UserCheck size={18} className="text-orange-500" /> Add Walk-In Visit
              </h2>
            </div>
            <button type="button" onClick={() => setIsCheckInOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-4">
            {/* 1. Live Database Customer Query Input + "+ Create" Fallback */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                Search Store Database or Create New Guest
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  name="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="Search or type guest name *"
                  className={inputClasses}
                />
                <input
                  name="customer_phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  maxLength={40}
                  type="tel"
                  placeholder="Phone (optional)"
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
                    return matches.slice(0, 4).map((name) => (
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

            {/* 2. 1-Tap Sales Rep Pill Selector */}
            <div>
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
            <div>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              </div>

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

            {mutationError && <p className="text-xs text-red-400">{mutationError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : <Zap size={16} />}
              Start Live Visit
            </button>
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
            {DEMO_SCAN_VINS.map((v) => (
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
  onAppendEvent: (type: ShowroomEventType, message: string, extras?: Partial<AppendShowroomEventInput>) => Promise<void>;
  onNoteOrMediaSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onStageMedia: (e: ChangeEvent<HTMLInputElement>) => void;
  onAssignToMe: () => Promise<void>;
  onClearError: () => void;
  onBackToFloor: () => void;
}) {
  const { visit, events } = snapshot;
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
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold cursor-pointer"
            >
              Floor Radar
            </button>
          </div>
        </div>

        {/* 1-Tap 5-Stage Progress Stepper */}
        <div className="relative z-10 grid grid-cols-5 gap-2 pt-6">
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

      {/* Lower Split: [Left 1-Tap Chips + Photo/Note Logger] | [Right Visit Timeline] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {!isClosed && (
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
                    {stagedMediaPreviewUrl && stagedMediaFile.type.startsWith('image/') ? (
                      <img src={stagedMediaPreviewUrl} alt="Preview" className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                        <Video size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{stagedMediaFile.name}</p>
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

        <div className={isClosed ? 'lg:col-span-12' : 'lg:col-span-7'}>
          <div className={`${glassCardClasses} p-6`}>
            <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <MessageSquareText size={14} className="text-orange-500" /> Visit Timeline ({events.length})
              </h3>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Synced
              </span>
            </div>

            <ol className="relative z-10 space-y-0 max-h-105 overflow-y-auto pr-1 custom-scrollbar">
              {events.slice().reverse().map((event, index) => (
                <TimelineEvent key={event.id} event={event} isLast={index === events.length - 1} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({ event, isLast }: { event: ShowroomEvent; isLast: boolean }) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
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
      <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/15 text-[10px] font-black text-orange-400">
        {getInitials(event.actorName)}
      </span>
      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-white">{EVENT_LABELS[event.type]}</p>
          <time className="text-[10px] text-gray-400">{formatDateTime(event.occurredAt)}</time>
        </div>
        <p className="mt-1 text-xs text-gray-300 leading-relaxed">{event.message}</p>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500">{event.actorName}</p>
        {event.media && mediaUrl && (
          <div className="mt-2.5 overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {event.media.kind === 'image' && <img src={mediaUrl} alt={event.media.fileName} className="max-h-60 w-full object-contain" />}
            {event.media.kind === 'video' && <video src={mediaUrl} controls playsInline className="max-h-60 w-full bg-black" />}
          </div>
        )}
      </div>
    </li>
  );
}
