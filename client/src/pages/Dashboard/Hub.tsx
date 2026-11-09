// src/pages/Dashboard/Hub.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, Clock, CalendarDays, TrendingUp, DollarSign, AlertTriangle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import defaultBanner from '../../images/defaultBanner.avif';
import DashboardCard from '../../components/UI/DashboardCard';
import ProgressCard from '../../components/UI/ProgressCard';
import HubModals from '../../components/UI/HubModals';
import SwipeableModal from '../../components/UI/SwipeableModal';
import GlobalLoader from '../../components/UI/GlobalLoader';
import { useAuth } from '../../contexts/AuthContext';
import { playCardScroll } from '../../utils/soundEngine';
import { CURRENT_USER } from '../../data/mockDatabase';
import { getPersistentStoreData } from '../../services/liveActivity/liveActivityStore';
import type { StoreData } from '../../types';
import { apiOperationalRepository } from '../../services/operational/apiOperationalRepository';
import { showroomRepository } from '../../services/showroom';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import EveoMascot from '../../components/insights/EveoMascot';

type ExpandedCard = 'leads' | 'handoffs' | 'appts' | 'kpi' | 'followups' | null;

interface HomeProps {
  bannerImg?: string;
  homeBtnLogo?: string;
  dealershipName?: string;
}

export default function Hub({ bannerImg, homeBtnLogo, dealershipName = 'Auto Dealership' }: HomeProps) {
  const { role, user } = useAuth();
  const [expanded, setExpanded] = useState<ExpandedCard>(null);
  const [isSwitchingStore, setIsSwitchingStore] = useState(false);
  const { getBanner, activeStore, activeStoreId, setActiveStoreId, stores } = useStoreAppearance();
  const activeStoreIdx = Math.max(0, stores.findIndex((store) => store.id === activeStore.id));
  const [isEveBubbleOpen, setIsEveBubbleOpen] = useState(false);
  const [seenPriorityIds, setSeenPriorityIds] = useState<string[]>([]);

  const [storeData, setStoreData] = useState<StoreData>(() => user
    ? { staff: [], leads: [], handoffs: [], appointments: [], sold: [], pending: [], bannerUrl: '' }
    : getPersistentStoreData(activeStore.id));

  const refreshStoreData = useCallback(async () => {
    if (!user) {
      setStoreData(getPersistentStoreData(activeStore.id));
      return;
    }
    try {
      const [leads, appointments, visits] = await Promise.all([
        apiOperationalRepository.listLeads(activeStoreId),
        apiOperationalRepository.listAppointments(activeStoreId),
        showroomRepository.listVisits(activeStoreId),
      ]);
      setStoreData({
        staff: [],
        leads: leads.map((lead) => ({ id: lead._id, name: lead.customerNameSnapshot, vehicle: lead.vehicleOfInterest || 'Vehicle not specified', status: lead.status, time: lead.createdAt, assignee: lead.assignedStoreUserId || lead.assignedPlatformUserId || '', notes: lead.notes })),
        appointments: appointments.map((appointment) => ({ id: appointment._id, name: appointment.customerNameSnapshot, customer: appointment.customerNameSnapshot, vehicle: appointment.vehicleSnapshot || 'Vehicle not specified', time: appointment.scheduledAt || '', rep: appointment.assignedStoreUserId || appointment.assignedPlatformUserId || '', status: appointment.status })),
        handoffs: visits.filter(({ visit }) => visit.status === 'handoff_requested').map(({ visit }) => ({ id: visit.id, name: visit.customerName, vehicle: 'Vehicle pending', rep: visit.assignedRepName, waitTime: 'Live', status: visit.status })),
        sold: [], pending: [], bannerUrl: '',
      });
    } catch {
      setStoreData({ staff: [], leads: [], handoffs: [], appointments: [], sold: [], pending: [], bannerUrl: '' });
    }
  }, [activeStore.id, activeStoreId, user]);

  useEffect(() => {
    void refreshStoreData();
    const sync = () => { void refreshStoreData(); };
    window.addEventListener('eveo:pipeline-updated', sync);
    window.addEventListener('eveo:operational-updated', sync);
    window.addEventListener('appointmentsUpdated', sync);
    const timer = user ? window.setInterval(sync, 5000) : undefined;
    return () => {
      window.removeEventListener('eveo:pipeline-updated', sync);
      window.removeEventListener('eveo:operational-updated', sync);
      window.removeEventListener('appointmentsUpdated', sync);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [refreshStoreData, user]);

  const rawBanner = getBanner(activeStore.id) || activeStore.bannerUrl || bannerImg || defaultBanner;
  const displayBanner = rawBanner.trim();

  const liveLeadCount = storeData.leads.length;
  const liveHandoffCount = storeData.handoffs.length;
  const liveApptCount = storeData.appointments.length;

  const navigate = useNavigate();
  const kpiValue = role === 'bdc' ? 42 : role === 'sales' ? 65 : 82;
  const seenKey = `eveo-seen-priorities:${user?.id || 'demo'}:${activeStore.id}`;
  useEffect(() => {
    try {
      const stored = localStorage.getItem(seenKey);
      setSeenPriorityIds(stored ? JSON.parse(stored) as string[] : []);
    } catch { setSeenPriorityIds([]); }
  }, [seenKey]);

  const priorityIds = [
    ...storeData.leads.filter((lead) => !lead.assignee).map((lead) => `lead:${lead.id}`),
    ...storeData.leads
      .filter((lead) => lead.status?.toLowerCase() === 'new' && Number.isFinite(Date.parse(lead.time)) && Date.now() - Date.parse(lead.time) >= 60_000)
      .map((lead) => `lead:handle:${lead.id}`),
    ...storeData.appointments.filter((appointment) => appointment.status === 'pending_confirmation' || appointment.status === 'Pending Confirm').map((appointment) => `appointment:${appointment.id}`),
    ...storeData.handoffs.map((visit) => `visit:${visit.id}`),
  ];
  const unreadPriorityIds = priorityIds.filter((id) => !seenPriorityIds.includes(id));
  const unreadLeads = unreadPriorityIds.filter((id) => id.startsWith('lead:') && !id.startsWith('lead:handle:')).length;
  const overdueHandleLeads = unreadPriorityIds.filter((id) => id.startsWith('lead:handle:')).length;
  const unreadAppointments = unreadPriorityIds.filter((id) => id.startsWith('appointment:')).length;
  const unreadHandoffs = unreadPriorityIds.filter((id) => id.startsWith('visit:')).length;
  const markPrioritiesSeen = (prefix?: string) => {
    const ids = prefix ? priorityIds.filter((id) => id.startsWith(prefix)) : priorityIds;
    const next = [...new Set([...seenPriorityIds, ...ids])];
    setSeenPriorityIds(next);
    try { localStorage.setItem(seenKey, JSON.stringify(next)); } catch { /* storage may be blocked */ }
  };

  const canChooseStore = (role === 'bdc' || role === 'bdc_manager') && stores.length > 1;

  return (
    <motion.div
      className="relative z-10 w-full h-full min-h-full pb-4 sm:pb-12 md:pl-28 overflow-x-hidden select-none sm:select-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {isSwitchingStore && (
          <GlobalLoader fullScreen={true} text="Switching stores…" />
        )}
      </AnimatePresence>

      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-200 h-75 bg-orange-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Banner */}
      <section className="relative w-full h-44 sm:h-72 lg:h-80 mb-3 sm:mb-8 rounded-b-3xl md:rounded-4xl overflow-hidden group md:mt-8 md:mx-8 md:w-[calc(100%-4rem)] max-w-6xl xl:mx-auto shadow-2xl dark:shadow-none">
        <img
          src={displayBanner}
          alt={`${activeStore.name} Dealership Hero Banner`}
          onError={(event) => { if (!event.currentTarget.src.endsWith('/defaultBanner.avif')) event.currentTarget.src = defaultBanner; }}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#05080c]/95 via-[#05080c]/75 to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-end p-4 pb-6 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2.5 sm:gap-6">
            <div className="max-w-xl">
              <span className="flex items-center gap-2 text-orange-500 font-bold tracking-wider text-[9px] sm:text-xs uppercase mb-1 drop-shadow-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                System Online &bull; {user?.name || CURRENT_USER}
              </span>
              <h1 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-0.5 sm:mb-2 text-white drop-shadow-lg leading-tight">
                {role === 'bdc' ? 'BDC Command Center' : role === 'sales' ? 'Showroom Floor' : 'Dealership Overview'}
              </h1>
              <p className="text-gray-300 text-[11px] sm:text-sm font-medium drop-shadow-md leading-snug max-w-md line-clamp-2">
                {role === 'bdc'
                  ? user ? 'Review incoming leads and activity across your assigned stores.' : 'Your demo lead workspace is ready. Choose a store from the banner dots.'
                  : user ? 'Review dealership activity, appointments, and pipeline records.' : 'Explore a dealership demo workspace with sample operational metrics.'}
              </p>
            </div>

            <div className="relative flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-black/35 px-3 py-2 backdrop-blur-xl">
              {homeBtnLogo && homeBtnLogo.trim().length > 0 ? (
                <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-xs sm:h-10 sm:w-16">
                  <img src={homeBtnLogo} alt={`${dealershipName} Logo`} onError={(event) => { event.currentTarget.src = eveoSymbol; }} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white p-1 sm:h-10 sm:w-10">
                  <img src={eveoSymbol} alt="" className="h-full w-full object-contain" />
                </div>
              )}
              <span className="max-w-40 truncate text-xs font-semibold text-white drop-shadow-xs sm:max-w-56 sm:text-sm">{activeStore.name}</span>
            </div>
          </div>
        </div>

        {canChooseStore && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {stores.map((store, idx) => (
              <button
                key={store.id}
                type="button"
                aria-label={`Show ${store.name}`}
                aria-current={idx === activeStoreIdx ? 'true' : undefined}
                onClick={() => {
                  if (idx === activeStoreIdx) return;
                  playCardScroll();
                  setIsSwitchingStore(true);
                  setActiveStoreId(store.id);
                  window.setTimeout(() => setIsSwitchingStore(false), 450);
                }}
                className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${idx === activeStoreIdx ? 'w-7 bg-white shadow-[0_0_8px_rgba(255,255,255,0.65)]' : 'w-2.5 bg-white/55 hover:bg-white/85'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Action Grid */}
      <div className="px-3.5 sm:px-6 md:px-10 max-w-6xl mx-auto relative z-20">
        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2.5 sm:mb-5 text-gray-500 dark:text-gray-400 px-1">
          Real-Time Action Center &amp; Workspace
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          <DashboardCard
            layoutId="card-leads"
            title="Recent Leads"
            value={liveLeadCount.toString()}
            trend="In Active Pipeline"
            titleColor="text-emerald-500"
            icon={<Activity size={13} />}
            dotColor={unreadLeads ? 'bg-emerald-500' : undefined}
            pingColor={unreadLeads ? 'bg-emerald-400' : undefined}
            onClick={() => { markPrioritiesSeen('lead:'); setExpanded('leads'); }}
          />
          <DashboardCard
            layoutId="card-handoffs"
            title="Live Showroom"
            value={liveHandoffCount.toString()}
            trend={liveHandoffCount > 0 ? 'Waiting for Handoff' : 'Floor is Clear'}
            titleColor="text-orange-500"
            icon={<Users size={13} />}
            dotColor={unreadHandoffs ? 'bg-orange-500' : undefined}
            pingColor={unreadHandoffs ? 'bg-orange-400' : undefined}
            borderGlow={liveHandoffCount > 0 ? 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30 dark:border-orange-500/20' : undefined}
            onClick={() => { markPrioritiesSeen('visit:'); setExpanded('handoffs'); }}
          />
          <section className="relative min-h-28 overflow-visible rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#0a0f16]/80 sm:min-h-40 sm:rounded-3xl sm:p-6" aria-label="E.V.E. assistant">
            {unreadPriorityIds.length > 0 && <span className="absolute right-3.5 top-3.5 flex h-2.5 w-2.5 sm:right-5 sm:top-5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" /></span>}
            <div className="flex h-full items-center gap-2 sm:gap-4">
              <EveoMascot size="sm" mood={unreadPriorityIds.length ? 'alert' : 'sleep'} flashAlertKey={unreadPriorityIds.join('|')} allowSleep onClick={() => setIsEveBubbleOpen((open) => !open)} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 sm:text-xs">AI Assistant · E.V.E.</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{unreadPriorityIds.length ? `${unreadPriorityIds.length} to review` : 'Resting'}</p>
                <p className="mt-1 text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">{unreadPriorityIds.length ? 'New dealership priorities' : 'No priority updates'}</p>
                {isEveBubbleOpen && <div className="absolute inset-x-3 bottom-full z-40 mb-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-white/15 dark:bg-[#101722] sm:inset-x-5">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{unreadPriorityIds.length ? 'I found new dealership activity.' : 'Everything important is up to date.'}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{unreadPriorityIds.length ? `${unreadLeads} unassigned leads · ${overdueHandleLeads} leads waiting over 1 minute · ${unreadAppointments} appointments to confirm · ${unreadHandoffs} showroom handoffs.` : 'I’ll wake when a new lead needs attention, an appointment needs confirmation, or a customer needs a handoff.'}</p>
                  <button type="button" onClick={() => { markPrioritiesSeen(); setIsEveBubbleOpen(false); navigate('/app/insights'); }} className="mt-2 min-h-9 rounded-xl bg-orange-600 px-3 text-xs font-semibold text-white">Review with E.V.E.</button>
                </div>}
              </div>
            </div>
          </section>

          {role === 'bdc' && (
            <>
              <DashboardCard layoutId="card-appts" title="Confirmations" value={liveApptCount.toString()} trend="Requires Action" titleColor="text-gray-400" icon={<CalendarDays size={13} />} dotColor={unreadAppointments ? 'bg-red-500' : undefined} pingColor={unreadAppointments ? 'bg-red-400' : undefined} onClick={() => { markPrioritiesSeen('appointment:'); setExpanded('appts'); }} />
              <ProgressCard layoutId="card-kpi" title="Daily KPI" percentage={user ? null : kpiValue} trend={user ? 'No live KPI target' : 'Demo target: 250'} onClick={() => setExpanded('kpi')} />
              <DashboardCard layoutId="card-followups" title="Follow-Ups" value={user ? '—' : '14'} trend={user ? 'Follow-up feed' : '> 15m unattended'} titleColor="text-gray-400" icon={<Clock size={13} />} dotColor={undefined} onClick={() => setExpanded('followups')} />
            </>
          )}
          {role === 'sales' && (
            <>
              <DashboardCard layoutId="card-appts" title="Appointments" value={liveApptCount.toString()} trend="Today's Desk" titleColor="text-gray-400" icon={<CalendarDays size={13} />} dotColor={unreadAppointments ? 'bg-red-500' : undefined} pingColor={unreadAppointments ? 'bg-red-400' : undefined} onClick={() => { markPrioritiesSeen('appointment:'); setExpanded('appts'); }} />
              <ProgressCard layoutId="card-kpi" title="Monthly Target" percentage={user ? null : kpiValue} trend={user ? 'No live target configured' : 'Demo pacing'} onClick={() => setExpanded('kpi')} />
              <DashboardCard layoutId="none" title="Closing Ratio" value={user ? '—' : '22%'} trend={user ? 'No live sales source' : 'Demo metric'} titleColor="text-gray-400" icon={<TrendingUp size={13} />} onClick={() => {}} />
            </>
          )}
          {role === 'manager' && (
            <>
              <ProgressCard layoutId="card-kpi" title="Store Conv." percentage={user ? null : kpiValue} trend={user ? 'No live conversion source' : 'Demo metric'} onClick={() => setExpanded('kpi')} />
              <DashboardCard layoutId="none" title="BDC Resp." value={user ? '—' : '4m 12s'} trend={user ? 'No live response source' : 'Demo metric'} titleColor="text-gray-400" icon={<Clock size={13} />} onClick={() => {}} />
              <DashboardCard layoutId="none" title="Floor Resp." value={user ? '—' : '1m 42s'} trend={user ? 'No live response source' : 'Demo metric'} titleColor="text-gray-400" icon={<Clock size={13} />} onClick={() => {}} />
            </>
          )}
          {role === 'owner' && (
            <>
              <DashboardCard
                layoutId="owner-payroll"
                title="Disbursements"
                value={user ? '—' : '3'}
                trend={user ? 'Payroll source not connected' : 'Demo metric'}
                titleColor="text-orange-500"
                icon={<DollarSign size={13} />}
                dotColor={undefined}
                borderGlow="bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30 dark:border-orange-500/20"
                onClick={() => navigate('/app/account')}
              />
              <DashboardCard
                layoutId="owner-sla"
                title="SLA Breaches"
                value={user ? '—' : '12'}
                trend={user ? 'Follow-up source not connected' : 'Demo metric'}
                titleColor="text-red-500"
                icon={<AlertTriangle size={13} />}
                dotColor={undefined}
                borderGlow="bg-red-500/5 dark:bg-red-500/10 border-red-500/30 dark:border-red-500/20"
                onClick={() => setExpanded('followups')}
              />
              <DashboardCard
                layoutId="owner-api"
                title="API Pipelines"
                value={user ? '—' : '100%'}
                trend={user ? 'Integration health unavailable' : 'Demo metric'}
                titleColor="text-emerald-500"
                icon={<Database size={13} />}
                dotColor={undefined}
                borderGlow="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-red-500/20"
                onClick={() => navigate('/app/settings')}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal Container */}
      <SwipeableModal
        isOpen={expanded !== null}
        onClose={() => setExpanded(null)}
        layoutId={expanded ? `card-${expanded}` : undefined}
      >
        {expanded && (
            <HubModals
              expanded={expanded}
              role={role}
              onClose={() => setExpanded(null)}
              onOpenShowroom={() => {
                setExpanded(null);
                navigate(`/app/showroom?view=showroom`);
              }}
            />
        )}
      </SwipeableModal>
    </motion.div>
  );
}
