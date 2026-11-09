// src/pages/Dashboard/Reports.tsx
import { useState, useEffect, useMemo, useRef, useCallback, type WheelEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  X,
  Target,
  Activity,
  TrendingUp,
  Car,
  Clock,
  User,
  CheckCircle2,
  ArrowLeft,
  FileDown,
  Share2,
  Calendar as CalendarIcon,
  PackageSearch,
  ShieldCheck,
  Lock,
} from 'lucide-react';

import AppointmentModal from '../../components/reports/AppointmentModal';
import ChartCard from '../../components/reports/ChartCard';
import { NextAppointmentCard, MasterScheduleCard } from '../../components/reports/ScheduleCards';
import {
  InventoryReportModal,
  ExecutiveBdcMasterModal,
  AgentKPIModal,
  LeadVisibilityModal,
  ConversionRatiosModal,
  SoldVehiclesModal,
  CustomerDeepDiveModal,
  computeLiveStoreTelemetry,
  getStoreArchivedReports,
  downloadReportPdfFile,
  executeReportShare,
  getGrantedExportAgents,
  toggleAgentExportPermission,
  setAgentLiveActivity,
  type ArchiveCategory,
  type ArchivedReportRecord,
} from '../../components/reports/OrbModals';
import SwipeableModal from '../../components/UI/SwipeableModal';
import LiveReports from './LiveReports';

import { CURRENT_USER, getVisibleStoreRoster, type Store } from '../../data/mockDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import {
  playCardScroll,
  playGalleryClick,
  playHover,
  playModalOpen,
  playBack,
} from '../../utils/soundEngine';

type ViewState = 'store-selection' | 'dashboard';
type ReportId = 'inventory' | 'sold' | 'lead' | 'conv' | 'pending' | 'agent' | 'bdc_master';

interface ReportStaticMeta {
  label: string;
  ring: string;
  tagline: string;
  icon: React.ReactNode;
  accent: string;
  archiveCat: ArchiveCategory;
  chartTitle: string;
  chartBadge: string;
}

const REPORT_META: Record<ReportId, ReportStaticMeta> = {
  inventory: {
    label: 'Inventory',
    ring: 'border-emerald-500/40',
    tagline: 'Total cars ready, aging >90d stock & lot valuation.',
    icon: <PackageSearch size={17} className="text-emerald-400" />,
    accent: 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    archiveCat: 'inventory',
    chartTitle: 'Lot Aging Composition (Pie / Donut)',
    chartBadge: '<30d vs 30–89d vs >90d',
  },
  sold: {
    label: 'Sold Cars',
    ring: 'border-amber-500/50',
    tagline: 'Delivered units, front/back gross profit & rep splits.',
    icon: <Car size={17} className="text-amber-400" />,
    accent: 'border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
    archiveCat: 'sold',
    chartTitle: 'Monthly Target vs. Actual Delivered',
    chartBadge: 'Goal Pacing',
  },
  lead: {
    label: 'Lead Flow',
    ring: 'border-orange-500/40',
    tagline: 'Store-wide multi-channel lead volume & source ROI.',
    icon: <Activity size={17} className="text-orange-400" />,
    accent: 'border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    archiveCat: 'lead',
    chartTitle: 'Lead Source Mix',
    chartBadge: 'Illustrative demo data · Web / Trade / Social',
  },
  conv: {
    label: 'Conversion Ratios',
    ring: 'border-blue-500/40',
    tagline: 'Stage-to-stage funnel progression & show-to-close.',
    icon: <TrendingUp size={17} className="text-blue-400" />,
    accent: 'border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    archiveCat: 'conv',
    chartTitle: 'Stage-to-Stage Pipeline Retention Funnel',
    chartBadge: 'Inquiry → Sold Drop-Off',
  },
  pending: {
    label: 'Pending Deals',
    ring: 'border-purple-500/50',
    tagline: 'Active desked deals awaiting F&I or spot delivery.',
    icon: <Clock size={17} className="text-purple-400" />,
    accent: 'border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    archiveCat: 'sold',
    chartTitle: 'F&I Desking Queue Distribution',
    chartBadge: 'By Deal Stage',
  },
  agent: {
    label: 'Agent KPI',
    ring: 'border-gray-600',
    tagline: 'Individual rep calls, SMS, emails & showroom ups.',
    icon: <Target size={17} className="text-sky-400" />,
    accent: 'border-sky-500/60 shadow-[0_0_15px_rgba(56,189,248,0.3)]',
    archiveCat: 'kpi',
    chartTitle: 'Response Time SLA Histogram',
    chartBadge: '3m SLA Cutoff',
  },
  bdc_master: {
    label: 'BDC Report',
    ring: 'border-orange-500/60',
    tagline: 'Executive conglomerated BDC & store delivery rollup.',
    icon: <ShieldCheck size={17} className="text-orange-400" />,
    accent: 'border-orange-500/70 shadow-[0_0_15px_rgba(249,115,22,0.35)]',
    archiveCat: 'bdc',
    chartTitle: 'Quarterly Lead Source Mix',
    chartBadge: 'Illustrative demo data · Not historical totals',
  },
};

export default function Reports() {
  const { user } = useAuth();
  return user && !user.demoMode ? <LiveReports /> : <DemoReports />;
}

function DemoReports() {
  const { role } = useAuth();
  const { activeStoreId, setActiveStoreId, stores } = useStoreAppearance();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewState, setViewState] = useState<ViewState>('store-selection');
  const [telemetryTick, setTelemetryTick] = useState(0);
  const wheelCooldownRef = useRef<number>(0);

  const roleStr = String(role).toLowerCase();
  const isManagerOrAbove =
    roleStr === 'super_admin' ||
    roleStr === 'owner' ||
    roleStr === 'manager' ||
    roleStr === 'bdc_manager';

  const canBrowseAllStores =
    roleStr === 'super_admin' || roleStr === 'bdc' || roleStr === 'bdc_manager';

  const visibleStores = useMemo(() => {
    if (canBrowseAllStores) return stores;
    return stores.filter((store) => store.id === activeStoreId);
  }, [canBrowseAllStores, activeStoreId, stores]);

  const [storeCarouselIndex, setStoreCarouselIndex] = useState(() =>
    Math.max(0, visibleStores.findIndex((s) => s.id === activeStoreId))
  );
  const [selectedStoreIdx, setSelectedStoreIdx] = useState<number>(-1);
  const [didDrag, setDidDrag] = useState(false);
  const [openedStore, setOpenedStore] = useState<Store | null>(null);

  const [rotationIndex, setRotationIndex] = useState(0);
  const [isNextApptOpen, setIsNextApptOpen] = useState(false);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [deepLinkedReportId, setDeepLinkedReportId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const onOpenArchive = () => setIsArchiveModalOpen(true);
    const onOpenPerms = () => setIsPermissionsModalOpen(true);
    const onLiveSync = () => setTelemetryTick((t) => t + 1);

    window.addEventListener('eveo:open-generated-reports', onOpenArchive);
    window.addEventListener('eveo:open-report-permissions', onOpenPerms);
    window.addEventListener('eveo:pipeline-updated', onLiveSync);
    window.addEventListener('eveo:archive-updated', onLiveSync);
    window.addEventListener('appointmentsUpdated', onLiveSync);

    return () => {
      window.removeEventListener('eveo:open-generated-reports', onOpenArchive);
      window.removeEventListener('eveo:open-report-permissions', onOpenPerms);
      window.removeEventListener('eveo:pipeline-updated', onLiveSync);
      window.removeEventListener('eveo:archive-updated', onLiveSync);
      window.removeEventListener('appointmentsUpdated', onLiveSync);
    };
  }, []);

  useEffect(() => {
    const storeParam = searchParams.get('store');
    const reportIdParam = searchParams.get('reportId');
    if (reportIdParam) {
      const targetStore = stores.find((store) =>
        store.id === (storeParam || activeStoreId)
        || store.domainId === (storeParam || activeStoreId)
        || store.legacyDataKey === (storeParam || activeStoreId),
      );
      if (!targetStore) return;
      setOpenedStore(targetStore);
      setActiveStoreId(targetStore.id);
      setViewState('dashboard');
      setDeepLinkedReportId(reportIdParam);
      setIsArchiveModalOpen(true);
    }
  }, [searchParams, activeStoreId, setActiveStoreId, stores]);

  const sortedReportIds = useMemo<ReportId[]>(() => {
    if (isManagerOrAbove) {
      return ['bdc_master', 'inventory', 'sold', 'lead', 'conv', 'pending', 'agent'];
    }
    if (roleStr === 'bdc') {
      return ['agent', 'lead', 'conv', 'inventory', 'pending'];
    }
    return ['inventory', 'sold', 'pending', 'conv', 'lead'];
  }, [isManagerOrAbove, roleStr]);

  const activeReportIndex =
    ((rotationIndex % sortedReportIds.length) + sortedReportIds.length) %
    sortedReportIds.length;
  const activeReportId = sortedReportIds[activeReportIndex];
  const activeReportMeta = REPORT_META[activeReportId];

  useEffect(() => {
    if (viewState === 'dashboard' && openedStore) {
      setAgentLiveActivity(
        openedStore.id,
        CURRENT_USER,
        `Auditing ${activeReportMeta.label} • ${openedStore.logoText}`
      );
    }
  }, [viewState, openedStore, activeReportMeta.label]);

  const liveTelemetry = useMemo(
    () => computeLiveStoreTelemetry(openedStore?.id || activeStoreId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openedStore?.id, activeStoreId, telemetryTick]
  );

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenStore = useCallback((store: Store) => {
    playModalOpen();
    setOpenedStore(store);
    setActiveStoreId(store.id);
    setRotationIndex(0);
    setViewState('dashboard');
  }, [setActiveStoreId]);

  const handleCloseDashboard = useCallback(() => {
    playBack();
    setViewState('store-selection');
    setOpenedStore(null);
    setSelectedStoreIdx(-1);
  }, []);

  // Mouse-Wheel Handler for Desktop Revolver Wheel
  const handleRevolverWheel = (e: WheelEvent<HTMLElement>) => {
    const now = Date.now();
    if (now - wheelCooldownRef.current < 200) return;
    if (Math.abs(e.deltaY) < 12) return;
    wheelCooldownRef.current = now;
    if (e.deltaY > 0) {
      setRotationIndex((prev) => prev + 1);
      playGalleryClick();
    } else {
      setRotationIndex((prev) => prev - 1);
      playGalleryClick();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isApptModalOpen || isNextApptOpen || isArchiveModalOpen || isPermissionsModalOpen) {
        return;
      }

      if (viewState === 'store-selection') {
        if (e.key === 'ArrowRight' && visibleStores.length > 1) {
          e.preventDefault();
          setStoreCarouselIndex((prev) => (prev + 1) % visibleStores.length);
          setSelectedStoreIdx((prev) => (prev === -1 ? 0 : (prev + 1) % visibleStores.length));
          playCardScroll();
        } else if (e.key === 'ArrowLeft' && visibleStores.length > 1) {
          e.preventDefault();
          setStoreCarouselIndex((prev) => (prev === 0 ? visibleStores.length - 1 : prev - 1));
          setSelectedStoreIdx((prev) => (prev <= 0 ? visibleStores.length - 1 : prev - 1));
          playCardScroll();
        } else if (e.key === 'Enter' && selectedStoreIdx !== -1 && visibleStores[selectedStoreIdx]) {
          handleOpenStore(visibleStores[selectedStoreIdx]);
        } else if (e.key === 'Escape') {
          setSelectedStoreIdx(-1);
        }
      } else if (viewState === 'dashboard') {
        if (e.key === 'Escape') {
          handleCloseDashboard();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setRotationIndex((prev) => prev - 1);
          playGalleryClick();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          setRotationIndex((prev) => prev + 1);
          playGalleryClick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewState,
    selectedStoreIdx,
    isApptModalOpen,
    isNextApptOpen,
    isArchiveModalOpen,
    isPermissionsModalOpen,
    visibleStores,
    handleOpenStore,
    handleCloseDashboard,
  ]);

  const renderActiveReportContent = () => {
    if (activeReportId === 'inventory') return <InventoryReportModal triggerToast={triggerToast} />;
    if (activeReportId === 'bdc_master') return <ExecutiveBdcMasterModal triggerToast={triggerToast} />;
    if (activeReportId === 'agent') return <AgentKPIModal triggerToast={triggerToast} />;
    if (activeReportId === 'lead') return <LeadVisibilityModal triggerToast={triggerToast} />;
    if (activeReportId === 'conv') return <ConversionRatiosModal triggerToast={triggerToast} />;
    if (activeReportId === 'sold') return <SoldVehiclesModal triggerToast={triggerToast} />;
    return (
      <CustomerDeepDiveModal
        storeId={openedStore?.id || activeStoreId}
        type="pending"
        triggerToast={triggerToast}
      />
    );
  };

  return (
    <div
      onClick={() => {
        if (viewState === 'store-selection' && selectedStoreIdx !== -1) {
          setSelectedStoreIdx(-1);
        }
      }}
      className="relative h-full min-h-[calc(100dvh-5rem)] md:min-h-dvh w-full overflow-hidden flex flex-col font-sans md:pl-28 bg-[#05080c] text-white select-none"
    >
      <AnimatePresence>
        {/* This boundary contains both the page view and the optional store banner; sync mode supports siblings. */}
        {/* PHASE 1: STORE SELECTION CAROUSEL */}
        {viewState === 'store-selection' && (
          <motion.div
            key="stores"
            className="h-full flex-1 w-full flex flex-col items-center justify-center py-8 px-4 relative touch-none"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.3 }}
            onPanStart={() => setDidDrag(false)}
            onPan={(_, info) => {
              if (Math.abs(info.offset.x) > 12) setDidDrag(true);
            }}
            onPanEnd={(_, info) => {
              if (visibleStores.length <= 1) return;
              if (info.offset.x < -40 || info.velocity.x < -250) {
                const nextIdx = (storeCarouselIndex + 1) % visibleStores.length;
                setStoreCarouselIndex(nextIdx);
                setSelectedStoreIdx(nextIdx);
                playCardScroll();
              } else if (info.offset.x > 40 || info.velocity.x > 250) {
                const prevIdx =
                  storeCarouselIndex === 0 ? visibleStores.length - 1 : storeCarouselIndex - 1;
                setStoreCarouselIndex(prevIdx);
                setSelectedStoreIdx(prevIdx);
                playCardScroll();
              }
              setTimeout(() => setDidDrag(false), 60);
            }}
          >
            <div className="absolute top-6 sm:top-10 left-6 sm:left-12 md:left-36 z-20 pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500 block mb-1">
                Executive Analytics
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-none">
                Reports
              </h1>
              <p className="text-[11px] text-gray-500 font-semibold mt-2">
                {selectedStoreIdx === -1
                  ? visibleStores.length > 1
                    ? 'Drag to browse stores • Tap to select'
                    : 'Tap your assigned store to open reports'
                  : `Selected: ${visibleStores[selectedStoreIdx]?.name} • Tap again to open`}
              </p>
            </div>

            <div className="flex items-center justify-center w-full max-w-6xl px-4 overflow-visible h-80 sm:h-96 relative">
              <AnimatePresence mode="popLayout">
                {visibleStores.map((store, index) => {
                  const isCenter = index === storeCarouselIndex;
                  const isSelected = index === selectedStoreIdx;
                  const offset = index - storeCarouselIndex;
                  const visualOffset =
                    visibleStores.length <= 1
                      ? 0
                      : offset > 1
                        ? -1
                        : offset < -1
                          ? 1
                          : offset;
                  const absOffset = Math.abs(visualOffset);

                  return (
                    <motion.div
                      key={store.id}
                      onHoverStart={() => {
                        if (isCenter) playHover();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (didDrag) return;

                        if (!isCenter) {
                          setStoreCarouselIndex(index);
                          setSelectedStoreIdx(index);
                          playCardScroll();
                          return;
                        }

                        if (!isSelected) {
                          setSelectedStoreIdx(index);
                          playHover();
                          return;
                        }

                        handleOpenStore(store);
                      }}
                      className="absolute flex flex-col items-center cursor-pointer outline-none group w-56 sm:w-64 md:w-80 will-change-transform"
                      animate={{
                        x:
                          visualOffset *
                          (typeof window !== 'undefined' && window.innerWidth < 640 ? 185 : 290),
                        y: isSelected ? -12 : 0,
                        scale: isCenter ? (isSelected ? 1.04 : 1) : 0.72,
                        opacity: isCenter ? 1 : 0.28,
                        zIndex: 10 - absOffset,
                      }}
                      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                    >
                      <div
                        className={`relative w-full aspect-square rounded-full overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 dark:bg-black/30 border ${
                          isSelected
                            ? 'border-orange-400/80 shadow-[0_0_45px_rgba(249,115,22,0.3),inset_0_1px_15px_rgba(255,255,255,0.5)]'
                            : 'border-white/30 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_10px_rgba(255,255,255,0.1)]'
                        }`}
                      >
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[75%] h-[35%] bg-linear-to-b from-white/30 dark:from-white/10 to-transparent rounded-[100%] pointer-events-none" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-2xl p-4 text-center">
                          <span className="font-black text-4xl md:text-6xl text-white tracking-widest">
                            {store.logoText}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full backdrop-blur-md border transition-colors ${
                              isSelected
                                ? 'bg-orange-500 text-white border-orange-400 shadow-lg'
                                : 'bg-black/40 text-white/90 border-white/10'
                            }`}
                          >
                            {isSelected ? `Tap Again to Open ${store.logoText}` : store.name}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: REPORT VIEW */}
        {viewState === 'dashboard' && openedStore && (
          <motion.div
            key="showcase-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative flex-1 h-full w-full overflow-hidden text-white"
          >
            <button
              type="button"
              onClick={handleCloseDashboard}
              className="fixed top-4 right-4 sm:top-5 sm:right-5 z-60 h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-white/15 bg-black/50 backdrop-blur-xl text-white/70 transition-all hover:scale-105 hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="Back to Store Selection"
            >
              <X size={18} />
            </button>

            {/* ============================================================= */}
            {/* MOBILE VIEW (xl:hidden) - ZERO VERTICAL SCROLL + FALSE-SWIPE  */}
            {/* ============================================================= */}
            <motion.div
              onPanEnd={(_, info) => {
                // Strict False-Swipe Safeguard: Must be horizontal (>65px), >2.2x vertical offset, and deliberate velocity
                const dx = info.offset.x;
                const dy = info.offset.y;
                const vx = info.velocity.x;
                if (
                  Math.abs(dx) > 65 &&
                  Math.abs(dx) > Math.abs(dy) * 2.2 &&
                  Math.abs(vx) > 180
                ) {
                  playGalleryClick();
                  if (dx < 0) setRotationIndex((prev) => prev + 1);
                  else setRotationIndex((prev) => prev - 1);
                }
              }}
              className="xl:hidden relative z-10 h-[calc(100dvh-5rem)] w-full px-3.5 pt-3 pb-2.5 flex flex-col justify-between gap-2 overflow-hidden touch-none"
            >
              {/* 1. Compact Mobile Top Header + Icon-Only Selector */}
              <div className="shrink-0 space-y-2">
                <div className="flex items-center gap-2.5 pr-11">
                  <button
                    type="button"
                    onClick={handleCloseDashboard}
                    className="h-8 w-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center font-black text-[10px] text-orange-400 cursor-pointer shrink-0"
                  >
                    {openedStore.logoText}
                  </button>
                  <div className="min-w-0">
                    <h1 className="text-lg font-black tracking-tight text-white leading-tight truncate">
                      {activeReportMeta.label}
                    </h1>
                    <p className="text-[10px] text-orange-300/85 truncate">
                      {activeReportMeta.tagline}
                    </p>
                  </div>
                </div>

                {/* Single-Row Icon-Only Selector */}
                <div className="flex items-center justify-between gap-1.5">
                  {sortedReportIds.map((id, idx) => {
                    const meta = REPORT_META[id];
                    const isSelected = idx === activeReportIndex;
                    return (
                      <button
                        type="button"
                        key={id}
                        title={meta.label}
                        onClick={() => {
                          playGalleryClick();
                          setRotationIndex(idx);
                        }}
                        className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? `${meta.accent} bg-white/15 scale-105`
                            : 'border-white/10 bg-white/4 opacity-60'
                        }`}
                      >
                        {meta.icon}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Main Breakdown Card (Fits Cleanly Without Vertical Scroll) */}
              <div className="flex-1 min-h-0 w-full rounded-3xl border border-white/12 bg-[#0a0f16]/95 shadow-[0_12px_30px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden flex flex-col justify-between">
                <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                    {activeReportMeta.icon}
                    {activeReportMeta.label} Breakdown
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">
                    Swipe L/R &bull; {activeReportIndex + 1}/{sortedReportIds.length}
                  </span>
                </div>
                {renderActiveReportContent()}
              </div>

              {/* 3. Purpose-Built Domain Chart Card (Compact Mobile Mode) */}
              <div className="shrink-0">
                <ChartCard
                  reportId={activeReportId}
                  meta={activeReportMeta}
                  telemetry={liveTelemetry}
                  compact
                  onOpenArchive={() => setIsArchiveModalOpen(true)}
                />
              </div>
            </motion.div>

            {/* ============================================================= */}
            {/* DESKTOP VIEW (hidden xl:flex) - HORIZONTAL CARD ALIGNMENT!    */}
            {/* ============================================================= */}
            <div className="hidden xl:flex flex-col justify-center relative z-10 h-dvh w-full max-w-7xl mx-auto px-8 2xl:px-12 py-6">
              {/* TOP HEADER ROW: Store Badge + Report Icons + Report Title */}
              <div className="w-full mb-5 shrink-0">
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.25em] text-[#efc07b] font-bold">
                    {openedStore.name}
                  </span>
                  <div className="h-px w-16 bg-[#efc07b]/30" />
                </div>

                <div className="flex items-center gap-3 mb-2.5">
                  <button
                    type="button"
                    onClick={handleCloseDashboard}
                    className="h-10 w-10 rounded-full border border-white/15 bg-white/5 hover:border-orange-500/50 flex items-center justify-center font-black text-xs text-white transition-all cursor-pointer shrink-0"
                    title="Back to Store Carousel"
                  >
                    {openedStore.logoText}
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {sortedReportIds.map((id, idx) => {
                      const meta = REPORT_META[id];
                      const isSelected = idx === activeReportIndex;
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => {
                            playGalleryClick();
                            setRotationIndex(idx);
                          }}
                          title={meta.label}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? `${meta.accent} bg-white/15 scale-105`
                              : 'border-white/10 bg-white/4 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {meta.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-baseline gap-4">
                  <h1 className="text-3xl 2xl:text-4xl font-black tracking-tight text-white leading-none">
                    {activeReportMeta.label}
                  </h1>
                  <p className="text-xs 2xl:text-sm font-medium text-orange-300/90 truncate">
                    {activeReportMeta.tagline}
                  </p>
                </div>
              </div>

              {/* ALIGNED 50/50 TWO-COLUMN ROW: Both Cards Sit on the Exact Same Top Horizontal Line! */}
              <div className="grid grid-cols-12 items-start gap-8 w-full">
                {/* LEFT COLUMN (5 cols): Purposeful Chart Card + Schedule Cards */}
                <section className="col-span-5 flex flex-col gap-3.5">
                  <ChartCard
                    reportId={activeReportId}
                    meta={activeReportMeta}
                    telemetry={liveTelemetry}
                    onOpenArchive={() => setIsArchiveModalOpen(true)}
                  />

                  <NextAppointmentCard
                    storeId={openedStore.id}
                    onClick={() => setIsNextApptOpen(true)}
                  />
                  <MasterScheduleCard onClick={() => setIsApptModalOpen(true)} />
                </section>

                {/* RIGHT COLUMN (7 cols): Locked-Size Breakdown Card + Mouse-Wheel Revolver */}
                <section className="col-span-7 flex items-start justify-between gap-4 min-w-0">
                  {/* Fixed-Size Breakdown Card (Top edge aligns 1:1 with Left Chart Card!) */}
                  <div className="flex-1 h-115 rounded-3xl border border-white/12 bg-linear-to-b from-[#121822]/95 via-[#0a0f16]/95 to-[#070a0f]/98 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)] overflow-hidden flex flex-col justify-between relative">
                    <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between shrink-0 bg-white/2">
                      <span className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                        {activeReportMeta.icon}
                        {activeReportMeta.label} Live Breakdown
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Report {activeReportIndex + 1} of {sortedReportIds.length}
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                      {renderActiveReportContent()}
                    </div>
                  </div>

                  {/* Right Revolver Wheel (Supports Mouse Wheel Scrolling + Drag + Click!) */}
                  <div
                    onWheel={handleRevolverWheel}
                    title="Scroll mouse wheel or drag to rotate reports"
                    className="relative flex h-115 w-26 2xl:w-28 items-center justify-end shrink-0 cursor-ns-resize"
                  >
                    <motion.div
                      className="relative h-full w-full flex justify-end items-center touch-none"
                      onPointerDown={(e) => e.stopPropagation()}
                      onPanEnd={(_, info) => {
                        if (info.offset.y < -25 || info.velocity.y < -180) {
                          setRotationIndex((prev) => prev + 1);
                          playGalleryClick();
                        } else if (info.offset.y > 25 || info.velocity.y > 180) {
                          setRotationIndex((prev) => prev - 1);
                          playGalleryClick();
                        }
                      }}
                    >
                      {[-2, -1, 0, 1, 2].map((offset) => {
                        const absoluteIndex = rotationIndex + offset;
                        const repIdx =
                          ((absoluteIndex % sortedReportIds.length) + sortedReportIds.length) %
                          sortedReportIds.length;
                        const id = sortedReportIds[repIdx];
                        const meta = REPORT_META[id];
                        const isCenter = offset === 0;

                        return (
                          <motion.div
                            key={offset}
                            title={`${meta.label} (Scroll wheel to cycle)`}
                            onClick={() => {
                              if (offset !== 0) {
                                setRotationIndex(rotationIndex + offset);
                                playGalleryClick();
                              }
                            }}
                            animate={{
                              y: offset * 102,
                              x: Math.abs(offset) * 16,
                              scale: isCenter ? 1.06 : 0.74 - Math.abs(offset) * 0.08,
                              opacity: isCenter ? 1 : 0.42 - Math.abs(offset) * 0.1,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                            className={`absolute right-1 top-1/2 -mt-10 h-19 w-19 2xl:h-21 2xl:w-21 cursor-pointer rounded-full border bg-[#0a0f16] flex items-center justify-center will-change-transform ${
                              isCenter
                                ? 'border-[#efc07b] shadow-[0_0_25px_rgba(239,192,123,0.28),inset_0_1px_0_rgba(255,255,255,0.2)] z-20'
                                : `${meta.ring} z-10`
                            }`}
                          >
                            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />
                            {meta.icon}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                </section>
              </div>
            </div>

            {/* Next Appointment Deep Dive Modal */}
            <SwipeableModal isOpen={isNextApptOpen} onClose={() => setIsNextApptOpen(false)}>
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <User className="text-orange-500" /> Next Appointment Details
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsNextApptOpen(false)}
                    className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <CustomerDeepDiveModal
                    storeId={openedStore.id}
                    type="next"
                    triggerToast={triggerToast}
                  />
                </div>
              </div>
            </SwipeableModal>

            {/* Generated Reports Archive Modal */}
            <GeneratedReportsArchiveModal
              isOpen={isArchiveModalOpen}
              onClose={() => {
                setIsArchiveModalOpen(false);
                setDeepLinkedReportId(null);
                if (searchParams.has('reportId')) {
                  searchParams.delete('reportId');
                  setSearchParams(searchParams, { replace: true });
                }
              }}
              storeId={openedStore.id}
              storeName={openedStore.name}
              initialReportId={deepLinkedReportId}
              triggerToast={triggerToast}
            />

            {/* Manager Export Access Permission Modal */}
            <ReportPermissionsModal
              isOpen={isPermissionsModalOpen}
              onClose={() => setIsPermissionsModalOpen(false)}
              storeId={openedStore.id}
              storeName={openedStore.name}
              triggerToast={triggerToast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {openedStore && (
        <AppointmentModal
          isOpen={isApptModalOpen}
          onClose={() => setIsApptModalOpen(false)}
          storeId={openedStore.id}
        />
      )}

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-300 flex items-center gap-3 bg-emerald-500/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400"
          >
            <CheckCircle2 size={18} />
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// HIERARCHICAL GENERATED REPORTS ARCHIVE MODAL
// ============================================================================
const ARCHIVE_CATEGORIES: Array<{
  id: ArchiveCategory;
  label: string;
  sublabel: string;
  color: string;
  dot: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'inventory',
    label: 'Inventory',
    sublabel: 'Total Stock, >90d Aging & Pie Mix',
    color: 'text-emerald-400',
    dot: 'bg-emerald-500',
    icon: <PackageSearch size={15} className="text-emerald-400" />,
  },
  {
    id: 'sold',
    label: 'Sold',
    sublabel: 'Delivered Units, Gross & Rep Splits',
    color: 'text-amber-400',
    dot: 'bg-amber-400',
    icon: <Car size={15} className="text-amber-400" />,
  },
  {
    id: 'lead',
    label: 'Lead',
    sublabel: 'Q1–Q4 Stacked Lead Attribution',
    color: 'text-orange-400',
    dot: 'bg-orange-500',
    icon: <Activity size={15} className="text-orange-400" />,
  },
  {
    id: 'conv',
    label: 'Conversion',
    sublabel: 'Stage-to-Stage Funnel Progression',
    color: 'text-blue-400',
    dot: 'bg-blue-500',
    icon: <TrendingUp size={15} className="text-blue-400" />,
  },
  {
    id: 'kpi',
    label: 'Agent KPI',
    sublabel: 'SLA Response Histogram & Outreach',
    color: 'text-sky-400',
    dot: 'bg-sky-400',
    icon: <Target size={15} className="text-sky-400" />,
  },
  {
    id: 'bdc',
    label: 'BDC Master',
    sublabel: '3-Chart Composite Executive Report',
    color: 'text-orange-400',
    dot: 'bg-orange-500',
    icon: <ShieldCheck size={15} className="text-orange-400" />,
  },
];

const MONTHS_ORDER = ['June', 'July', 'September', 'October'];

function GeneratedReportsArchiveModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  initialReportId,
  triggerToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  initialReportId?: string | null;
  triggerToast: (msg: string) => void;
}) {
  const [records, setRecords] = useState<ArchivedReportRecord[]>(() =>
    getStoreArchivedReports(storeId)
  );
  const [selectedCategory, setSelectedCategory] = useState<ArchiveCategory | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRecords(getStoreArchivedReports(storeId));
  }, [storeId, isOpen]);

  useEffect(() => {
    const refresh = () => setRecords(getStoreArchivedReports(storeId));
    window.addEventListener('eveo:archive-updated', refresh);
    return () => window.removeEventListener('eveo:archive-updated', refresh);
  }, [storeId]);

  useEffect(() => {
    if (!initialReportId) return;
    const match = records.find((r) => r.id === initialReportId);
    if (match) {
      setSelectedCategory(match.category);
      setSelectedMonth(match.month);
      setSelectedDay(match.day);
    }
  }, [initialReportId, records]);

  const activeCatMeta = ARCHIVE_CATEGORIES.find((c) => c.id === selectedCategory);
  const catRecords = records.filter((r) => r.category === selectedCategory);
  const monthRecords = catRecords.filter((r) => r.month === selectedMonth);
  const dayRecords = monthRecords.filter((r) => r.day === selectedDay);

  const daysInSelectedMonth = (() => {
    const map = new Map<number, ArchivedReportRecord[]>();
    monthRecords.forEach((record) => {
      const dayItems = map.get(record.day) || [];
      dayItems.push(record);
      map.set(record.day, dayItems);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  })();

  const handleStepBack = () => {
    if (selectedDay !== null) setSelectedDay(null);
    else if (selectedMonth !== null) setSelectedMonth(null);
    else if (selectedCategory !== null) setSelectedCategory(null);
  };

  return (
    <SwipeableModal isOpen={isOpen} onClose={onClose} maxWidthClass="md:max-w-3xl">
      <div className="flex flex-col h-full min-h-0 text-white select-none sm:select-auto">
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {selectedCategory !== null && (
              <button
                type="button"
                onClick={handleStepBack}
                className="p-2 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 block">
                {storeName} &bull; NDA Transparency Vault
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Generated Reports
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-5 bg-black/25">
          {selectedCategory === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ARCHIVE_CATEGORIES.map((cat) => {
                const count = records.filter((r) => r.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playGalleryClick();
                      setSelectedCategory(cat.id);
                    }}
                    className="p-5 rounded-3xl bg-linear-to-b from-[#141a23]/95 via-[#0a0f16] to-[#070a0f] border border-white/10 hover:border-orange-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_15px_35px_rgba(0,0,0,0.65)] text-left flex flex-col justify-between min-h-34 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${cat.color}`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </span>
                      <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
                    </div>

                    <div className="my-2">
                      <span className="text-3xl font-black text-white tabular-nums">
                        {count}
                      </span>
                      <span className="text-xs font-bold text-gray-500 ml-2">
                        Saved Reports
                      </span>
                    </div>

                    <span className="text-xs font-bold text-gray-400">
                      {cat.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedCategory !== null && selectedMonth === null && activeCatMeta && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-linear-to-b from-[#141a23]/95 to-[#0a0f16] border border-white/12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeCatMeta.icon}
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wide">
                      {activeCatMeta.label} Reports
                    </h2>
                    <p className="text-xs text-gray-400">{activeCatMeta.sublabel}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/8 text-xs font-black text-white">
                  {catRecords.length} Total
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {MONTHS_ORDER.map((m) => {
                  const mCount = catRecords.filter((r) => r.month === m).length;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        playGalleryClick();
                        setSelectedMonth(m);
                      }}
                      className="p-5 rounded-3xl bg-linear-to-b from-[#141a23]/95 via-[#0a0f16] to-[#070a0f] border border-white/10 hover:border-orange-500/40 text-left flex flex-col justify-between min-h-30 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                        2026 Archive
                      </span>
                      <span className="text-xl font-black text-white my-1">{m}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400">
                          {mCount} {mCount === 1 ? 'Report' : 'Reports'}
                        </span>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(4, mCount) }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${activeCatMeta.dot}`}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedCategory !== null && selectedMonth !== null && selectedDay === null && activeCatMeta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {daysInSelectedMonth.map(([dayNum, list]) => (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => {
                      playGalleryClick();
                      setSelectedDay(dayNum);
                    }}
                    className="p-5 rounded-3xl bg-linear-to-b from-[#141a23]/95 via-[#0a0f16] to-[#070a0f] border border-white/10 hover:border-orange-500/40 text-left flex flex-col justify-between min-h-32 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                        <CalendarIcon size={13} className="text-orange-400" />
                        {selectedMonth} {dayNum}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-[10px] font-black text-orange-300">
                        {list.length} {list.length === 1 ? 'Report' : 'Reports'}
                      </span>
                    </div>

                    <div className="my-2">
                      <span className="text-xl font-black text-white">
                        {list[0].headlineValue}
                      </span>
                      <span className="block text-[10px] font-bold text-emerald-400 mt-0.5">
                        By {list[0].generatedBy?.name || 'Andres Hernandez'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/8">
                      {list.map((r) => (
                        <span
                          key={r.id}
                          className={`w-2 h-2 rounded-full ${activeCatMeta.dot}`}
                          title={r.timeLabel}
                        />
                      ))}
                      <span className="text-[10px] font-bold text-gray-500 ml-auto">
                        {list[0].timeLabel}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedCategory !== null && selectedMonth !== null && selectedDay !== null && (
            <div className="space-y-3.5">
              {dayRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-3xl bg-linear-to-b from-[#141a23]/95 via-[#0a0f16] to-[#070a0f] border border-white/12 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block">
                        {rec.dateLabel} &bull; {rec.timeLabel}
                      </span>
                      <h3 className="text-lg font-black text-white">{rec.reportLabel}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-white block">
                        {rec.headlineValue}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {rec.generatedBy?.traceId || 'EVEO-NDA-VERIFIED'}
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-gray-300 font-semibold">
                      Generated by:{' '}
                      <strong className="text-white">
                        {rec.generatedBy?.name || 'Andres Hernandez'}
                      </strong>{' '}
                      <span className="text-orange-400">
                        ({rec.generatedBy?.role || 'SUPER ADMIN'})
                      </span>
                    </span>
                    <span className="text-gray-500 font-mono text-[10px]">
                      Shares logged: {rec.shareLog?.length || 0}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {rec.summary}
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => void executeReportShare('Link', rec, triggerToast)}
                      className="px-3.5 py-2 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 text-xs font-semibold text-gray-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 size={13} className="text-sky-400" /> Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={() => void executeReportShare('WhatsApp', rec, triggerToast)}
                      className="px-3.5 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 size={13} /> Send PDF to WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadReportPdfFile(rec, triggerToast)}
                      className="px-4 py-2 rounded-full bg-linear-to-b from-white/16 to-white/6 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDown size={14} className="text-orange-400" /> Download PDF File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SwipeableModal>
  );
}

// ============================================================================
// MANAGER EXPORT ACCESS PERMISSION MODAL
// ============================================================================
function ReportPermissionsModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  triggerToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  triggerToast: (msg: string) => void;
}) {
  const roster = useMemo(
    () =>
      getVisibleStoreRoster(storeId).filter((u) => {
        const r = String(u.role).toLowerCase();
        return r === 'sales' || r === 'bdc';
      }),
    [storeId]
  );
  const [granted, setGranted] = useState<string[]>(() => getGrantedExportAgents(storeId));

  useEffect(() => {
    setGranted(getGrantedExportAgents(storeId));
  }, [storeId, isOpen]);

  return (
    <SwipeableModal isOpen={isOpen} onClose={onClose} maxWidthClass="md:max-w-lg">
      <div className="flex flex-col h-full min-h-0 text-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
              {storeName} &bull; NDA Security Gatekeeper
            </span>
            <h2 className="text-xl font-black text-white">
              Report Export Permissions
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Owners, Managers, and Super Admin have report export access by default. Sales and BDC
          agents are restricted unless explicitly authorized below. Every exported PDF is
          watermarked with the user&apos;s name and NDA Trace ID.
        </p>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {roster.map((agent) => {
            const isAllowed = granted.includes(agent.name);
            return (
              <div
                key={agent.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-sm font-bold text-white block">{agent.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {agent.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = toggleAgentExportPermission(storeId, agent.name);
                    setGranted(next);
                    triggerToast(
                      `${agent.name} export access ${
                        next.includes(agent.name) ? 'granted' : 'revoked'
                      }.`
                    );
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isAllowed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/10 text-red-300 border-red-500/25'
                  }`}
                >
                  {isAllowed ? (
                    <>
                      <ShieldCheck size={13} /> Allowed
                    </>
                  ) : (
                    <>
                      <Lock size={13} /> Restricted
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </SwipeableModal>
  );
}
