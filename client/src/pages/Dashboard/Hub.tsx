// src/pages/Dashboard/Hub.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, Clock, CalendarDays, TrendingUp, DollarSign, AlertTriangle, Database, ChevronRight } from 'lucide-react';
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
  const { getBanner, activeStore, activeStoreId, cycleNextStore, stores } = useStoreAppearance();
  const activeStoreIdx = Math.max(0, stores.findIndex((store) => store.id === activeStore.id));

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

  const handleStoreToggle = () => {
    if (role === 'bdc' || role === 'bdc_manager' || role === 'owner') {
      playCardScroll();
      setIsSwitchingStore(true);
      cycleNextStore();
      setTimeout(() => setIsSwitchingStore(false), 450);
    }
  };

  const nextStoreName = stores[(activeStoreIdx + 1) % Math.max(1, stores.length)]?.name || '';

  return (
    <motion.div
      className="relative z-10 w-full h-full min-h-full pb-4 sm:pb-12 md:pl-28 overflow-x-hidden select-none sm:select-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {isSwitchingStore && (
          <GlobalLoader fullScreen={true} text={`Syncing ${nextStoreName}...`} />
        )}
      </AnimatePresence>

      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-200 h-75 bg-orange-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Banner */}
      <section
        onClick={handleStoreToggle}
        className={`relative w-full h-44 sm:h-72 lg:h-80 mb-3 sm:mb-8 rounded-b-3xl md:rounded-4xl overflow-hidden group md:mt-8 md:mx-8 md:w-[calc(100%-4rem)] max-w-6xl xl:mx-auto shadow-2xl dark:shadow-none ${(role === 'bdc' || role === 'bdc_manager' || role === 'owner') ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
      >
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
                  ? user ? 'Review incoming leads and activity across your assigned stores.' : 'Your demo lead workspace is ready. Tap the banner to rotate through stores.'
                  : user ? 'Review dealership activity, appointments, and pipeline records.' : 'Explore a dealership demo workspace with sample operational metrics.'}
              </p>
            </div>

            <button
              type="button"
              className="relative flex items-center p-1 pr-3 sm:p-1.5 sm:pr-4 gap-2 sm:gap-3 rounded-full backdrop-blur-xl bg-white/10 dark:bg-black/40 border border-white/20 dark:border-white/10 shadow-lg hover:bg-white/20 dark:hover:bg-white/10 transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange-500 group/btn cursor-pointer"
            >
              {homeBtnLogo && homeBtnLogo.trim().length > 0 ? (
                <div className="flex items-center justify-center bg-white rounded-full p-1.5 shrink-0 z-10 shadow-xs h-7 sm:h-10 w-14 sm:w-20">
                  <img src={homeBtnLogo} alt={`${dealershipName} Logo`} onError={(event) => { event.currentTarget.src = eveoSymbol; }} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-200 text-black px-2.5 py-1 sm:px-3 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-tighter shrink-0 z-10 shadow-xs">
                  <img src={eveoSymbol} alt="" className="h-4 w-4 mr-1" />{activeStore.logoText} <span className="text-orange-600 ml-0.5">/</span> {role.toUpperCase()}
                </div>
              )}
              <span className="text-white font-bold text-xs sm:text-sm z-10 whitespace-nowrap drop-shadow-xs flex items-center gap-1">
                {activeStore.name}
                {(role === 'bdc' || role === 'bdc_manager' || role === 'owner') && (
                  <ChevronRight size={14} className="text-white/50 group-hover/btn:translate-x-0.5 transition-transform" />
                )}
              </span>
            </button>
          </div>
        </div>

        {(role === 'bdc' || role === 'bdc_manager' || role === 'owner') && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {stores.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeStoreIdx ? 'w-6 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'w-2 bg-white/30 group-hover:bg-white/50'}`}
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
            onClick={() => setExpanded('leads')}
          />
          <DashboardCard
            layoutId="card-handoffs"
            title="Live Showroom"
            value={liveHandoffCount.toString()}
            trend={liveHandoffCount > 0 ? 'Waiting for Handoff' : 'Floor is Clear'}
            titleColor="text-orange-500"
            icon={<Users size={13} />}
            dotColor={liveHandoffCount > 0 ? 'bg-orange-500' : undefined}
            pingColor={liveHandoffCount > 0 ? 'bg-orange-400' : undefined}
            borderGlow={liveHandoffCount > 0 ? 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30 dark:border-orange-500/20' : undefined}
            onClick={() => setExpanded('handoffs')}
          />
          <DashboardCard
            layoutId="card-insights"
            title="AI Assistant"
            value="Open"
            trend="E.V.E. insights"
            titleColor="text-purple-500"
            icon={<Activity size={13} />}
            dotColor="bg-red-500"
            pingColor="bg-purple-400"
            onClick={() => navigate('/app/insights')}
          />

          {role === 'bdc' && (
            <>
              <DashboardCard layoutId="card-appts" title="Confirmations" value={liveApptCount.toString()} trend="Requires Action" titleColor="text-gray-400" icon={<CalendarDays size={13} />} dotColor={liveApptCount > 0 ? 'bg-red-500' : undefined} pingColor={liveApptCount > 0 ? 'bg-red-400' : undefined} onClick={() => setExpanded('appts')} />
              <ProgressCard layoutId="card-kpi" title="Daily KPI" percentage={user ? null : kpiValue} trend={user ? 'No live KPI target' : 'Demo target: 250'} onClick={() => setExpanded('kpi')} />
              <DashboardCard layoutId="card-followups" title="Follow-Ups" value={user ? '—' : '14'} trend={user ? 'Follow-up feed' : '> 15m unattended'} titleColor="text-gray-400" icon={<Clock size={13} />} dotColor={user ? undefined : 'bg-red-500'} pingColor={user ? undefined : 'bg-red-400'} onClick={() => setExpanded('followups')} />
            </>
          )}
          {role === 'sales' && (
            <>
              <DashboardCard layoutId="card-appts" title="Appointments" value={liveApptCount.toString()} trend="Today's Desk" titleColor="text-gray-400" icon={<CalendarDays size={13} />} dotColor={liveApptCount > 0 ? 'bg-red-500' : undefined} pingColor={liveApptCount > 0 ? 'bg-red-400' : undefined} onClick={() => setExpanded('appts')} />
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
                dotColor="bg-orange-500"
                pingColor="bg-orange-400"
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
                dotColor="bg-red-500"
                pingColor="bg-red-400"
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
                dotColor="bg-emerald-500"
                pingColor="bg-emerald-400"
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
