// src/components/UI/LiveActivityPulse.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  PhoneCall,
  Radio,
  CalendarCheck,
  CarFront,
  Sparkles,
  FileBarChart,
  UserCog,
  Flame,
} from 'lucide-react';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { getStoreDataOrEmpty, CURRENT_USER, getVisibleStoreRoster } from '../../data/mockDatabase';

export type ActivityPriority = 1 | 2 | 3;

export type ActivityCategory =
  // PRIORITY 1: High ROI & High Intent (Immediate Preemption + Pulsating Red/Orange Dot)
  | 'showroom'
  | 'inventory'
  | 'appointment'
  | 'ai_high_intent'
  // PRIORITY 2: Important Notes, Shifts, Lead Info Changes (Per-Agent Latest State)
  | 'lead'
  | 'account'
  // PRIORITY 3: Bulk, Contacts, Reports, Routine AI Scans (Auto-Coalesced Digest)
  | 'contact'
  | 'report'
  | 'bulk'
  | 'ai_scan';

export interface LiveActivityEvent {
  id: string;
  agentName: string;
  initials: string;
  avatarUrl?: string | null;
  isAiAgent?: boolean;
  priority: ActivityPriority;
  category: ActivityCategory;
  title: string;
  coalescedCount?: number;
  route?: string;
  timestamp: number;
}

const CATEGORY_META: Record<
  ActivityCategory,
  {
    icon: React.ReactNode;
    iconColor: string;
    orbRing: string;
    badgeBg: string;
    priorityLabel: string;
  }
> = {
  // --- PRIORITY 1 (High ROI / High Intent) ---
  showroom: {
    icon: <Radio size={13} />,
    iconColor: 'text-orange-400',
    orbRing: 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.55)]',
    badgeBg: 'bg-red-500',
    priorityLabel: 'P1 • Showroom Floor',
  },
  inventory: {
    icon: <CarFront size={13} />,
    iconColor: 'text-emerald-400',
    orbRing: 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.55)]',
    badgeBg: 'bg-red-500',
    priorityLabel: 'P1 • Inventory / VIN',
  },
  appointment: {
    icon: <CalendarCheck size={13} />,
    iconColor: 'text-amber-300',
    orbRing: 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    badgeBg: 'bg-orange-500',
    priorityLabel: 'P1 • Verified Appt',
  },
  ai_high_intent: {
    icon: <Flame size={13} />,
    iconColor: 'text-purple-300',
    orbRing: 'border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.7)]',
    badgeBg: 'bg-red-500',
    priorityLabel: 'P1 • EVEO AI Match',
  },

  // --- PRIORITY 2 (Lead & Account Updates) ---
  lead: {
    icon: <UserCog size={13} />,
    iconColor: 'text-blue-400',
    orbRing: 'border-blue-400/70 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
    badgeBg: 'bg-blue-500',
    priorityLabel: 'P2 • Lead Update',
  },
  account: {
    icon: <CalendarCheck size={13} />,
    iconColor: 'text-teal-400',
    orbRing: 'border-teal-400/70 shadow-[0_0_12px_rgba(20,184,166,0.35)]',
    badgeBg: 'bg-teal-500',
    priorityLabel: 'P2 • Roster Shift',
  },

  // --- PRIORITY 3 (Coalesced Contacts, Reports, AI Scans) ---
  contact: {
    icon: <MessageSquare size={13} />,
    iconColor: 'text-emerald-400',
    orbRing: 'border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]',
    badgeBg: 'bg-emerald-500',
    priorityLabel: 'P3 • Outbound Touch',
  },
  report: {
    icon: <FileBarChart size={13} />,
    iconColor: 'text-gray-300',
    orbRing: 'border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.15)]',
    badgeBg: 'bg-gray-400',
    priorityLabel: 'P3 • Report Sync',
  },
  bulk: {
    icon: <PhoneCall size={13} />,
    iconColor: 'text-blue-300',
    orbRing: 'border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    badgeBg: 'bg-blue-400',
    priorityLabel: 'P3 • Batch Dialer',
  },
  ai_scan: {
    icon: <Sparkles size={13} />,
    iconColor: 'text-purple-400',
    orbRing: 'border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    badgeBg: 'bg-purple-500',
    priorityLabel: 'P3 • EVEO AI Scan',
  },
};

function getInitials(name: string): string {
  const parts = name.trim().replace('.', '').split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function LiveActivityPulse() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeStoreId } = useStoreAppearance();

  const isAccountPage = location.pathname.includes('/app/account');

  // Sync user's uploaded avatar so [AH] uses the real photo!
  const [userAvatar, setUserAvatar] = useState<string | null>(() => localStorage.getItem('eveo_avatar'));
  useEffect(() => {
    const syncAvatar = () => setUserAvatar(localStorage.getItem('eveo_avatar'));
    window.addEventListener('avatarUpdated', syncAvatar);
    return () => window.removeEventListener('avatarUpdated', syncAvatar);
  }, []);

  // Interaction states (Desktop Hover + Mobile 1st-Tap Tooltip / 2nd-Tap Open)
  const [isExpanded, setIsExpanded] = useState(false);
  const [armedForSecondTap, setArmedForSecondTap] = useState(false);
  const [selectedRosterIdx, setSelectedRosterIdx] = useState<number | null>(null);
  const lastPointerType = useRef<string>('mouse');
  const [queueTimestamp] = useState(() => Date.now());

  const roster = useMemo(() => getVisibleStoreRoster(activeStoreId), [activeStoreId]);

  // Build prioritized, coalesced activity stream including the automated EVEO AI Agent!
  const prioritizedQueue = useMemo<LiveActivityEvent[]>(() => {
    const store = getStoreDataOrEmpty(activeStoreId);
    if (!store) return [];

    const leads = store.leads || [];
    const handoffs = store.handoffs || [];
    const appts = store.appointments || [];

    const firstHandoff = handoffs[0]?.name || 'Marcus Johnson';
    const firstVehicle = handoffs[0]?.vehicle || leads[0]?.vehicle || '2024 Kia Telluride';
    const firstAppt = appts[0]?.name || appts[0]?.customer || 'Elena Rostova';
    const firstLead = leads[0]?.name || 'David Kim';

    const events: LiveActivityEvent[] = [];

    // 1. EVEO AI AGENT (High-Intent P1 Match + Background P3 Scan)
    events.push({
      id: `${activeStoreId}-ai-p1`,
      agentName: 'EVEO AI',
      initials: 'AI',
      isAiAgent: true,
      priority: 1,
      category: 'ai_high_intent',
      title: `Matched ${firstLead} → ${firstVehicle}`,
      route: '/app/insights',
      timestamp: queueTimestamp - 1000,
    });

    // 2. Roster Activities mapped across P1, P2, and Coalesced P3
    roster.forEach((member, idx) => {
      const initials = ('initials' in member && member.initials) ? member.initials : getInitials(member.name);
      const isCurrentUser = member.name === CURRENT_USER || initials === 'AH';
      const avatarUrl = isCurrentUser ? userAvatar : null;

      if (member.role === 'sales') {
        // Sales reps produce fewer, high-ROI Priority 1 events (Showroom, Inventory, Sold)
        events.push({
          id: `${activeStoreId}-${member.name}-p1`,
          agentName: member.name,
          initials,
          avatarUrl,
          priority: 1,
          category: idx % 2 === 0 ? 'showroom' : 'inventory',
          title: idx % 2 === 0 ? `Showroom • ${firstHandoff}` : `Decoded ${firstVehicle}`,
          route: `/app/showroom?storeId=${activeStoreId}`,
          timestamp: queueTimestamp - idx * 2000,
        });
      } else if (member.role === 'manager' || member.role === 'bdc_manager') {
        // Managers produce Priority 1 Appointments/Overrides & Priority 2 Roster actions
        events.push({
          id: `${activeStoreId}-${member.name}-p2`,
          agentName: member.name,
          initials,
          avatarUrl,
          priority: 2,
          category: 'lead',
          title: `Updated SLA • ${firstLead}`,
          route: '/app/hub',
          timestamp: queueTimestamp - idx * 3000,
        });
      } else {
        // BDC Agents: High-ROI P1 Appointment Set OR Coalesced P3 Batch Touches (so 100 SMS become 1 digest!)
        if (idx === 0) {
          events.push({
            id: `${activeStoreId}-${member.name}-p1-appt`,
            agentName: member.name,
            initials,
            avatarUrl,
            priority: 1,
            category: 'appointment',
            title: `Booked Appt • ${firstAppt}`,
            route: '/app/reports',
            timestamp: queueTimestamp - 1500,
          });
        } else {
          const touchCount = 4 + (idx % 5);
          events.push({
            id: `${activeStoreId}-${member.name}-p3-batch`,
            agentName: member.name,
            initials,
            avatarUrl,
            priority: 3,
            category: 'contact',
            coalescedCount: touchCount,
            title: `Texted ${touchCount} leads (${firstLead})`,
            route: '/app/hub',
            timestamp: queueTimestamp - idx * 5000,
          });
        }
      }
    });

    // Sort strictly by Priority (P1 -> P2 -> P3), then recency!
    return events.sort((a, b) => a.priority - b.priority || b.timestamp - a.timestamp);
  }, [activeStoreId, queueTimestamp, roster, userAvatar]);

  const [queueCursor, setQueueCursor] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [liveOverride, setLiveOverride] = useState<LiveActivityEvent | null>(null);

  // Real-time Preemption Listener: P1 events immediately interrupt P2/P3!
  useEffect(() => {
    const handleRealTimeEvent = (e: Event) => {
      const incoming = (e as CustomEvent<LiveActivityEvent>).detail;
      if (!incoming) return;
      setLiveOverride(incoming);
      setIsVisible(true);
      setIsExpanded(true);
    };
    window.addEventListener('eveo:live-activity', handleRealTimeEvent);
    return () => window.removeEventListener('eveo:live-activity', handleRealTimeEvent);
  }, []);

  // 5-second display cycle (Pauses while user is hovering or inspecting tooltip)
  useEffect(() => {
    if (isAccountPage || prioritizedQueue.length === 0 || isExpanded || armedForSecondTap) return;

    if (isVisible) {
      const hideTimer = window.setTimeout(() => {
        setIsVisible(false);
        setLiveOverride(null);
      }, 5000);
      return () => window.clearTimeout(hideTimer);
    } else {
      const nextTimer = window.setTimeout(() => {
        setQueueCursor((prev) => (prev + 1) % prioritizedQueue.length);
        setIsVisible(true);
      }, 3000);
      return () => window.clearTimeout(nextTimer);
    }
  }, [isVisible, isAccountPage, prioritizedQueue.length, isExpanded, armedForSecondTap]);

  if (prioritizedQueue.length === 0) return null;

  const activeEvent =
    liveOverride ||
    (selectedRosterIdx !== null
      ? prioritizedQueue[selectedRosterIdx % prioritizedQueue.length]
      : prioritizedQueue[queueCursor % prioritizedQueue.length]);

  const meta = CATEGORY_META[activeEvent.category];
  const isPriorityOne = activeEvent.priority === 1;

  // Handle 1st-tap tooltip / 2nd-tap navigate on mobile, immediate click on desktop
  const handleOrbClick = () => {
    if (lastPointerType.current === 'touch') {
      if (!armedForSecondTap) {
        setIsExpanded(true);
        setArmedForSecondTap(true);
        window.setTimeout(() => {
          setIsExpanded(false);
          setArmedForSecondTap(false);
        }, 3000);
        return;
      }
      setIsExpanded(false);
      setArmedForSecondTap(false);
      if (activeEvent.route) navigate(activeEvent.route);
      return;
    }
    if (activeEvent.route) navigate(activeEvent.route);
  };

  // ============================================================================
  // MODE A: COMPACT GLASS ORB ROSTER BAR ON /app/account
  // ============================================================================
  if (isAccountPage) {
    return (
      <div className="fixed top-3.5 right-3.5 md:top-auto md:bottom-6 md:right-6 z-45 select-none">
        <div className="flex flex-col items-end gap-1.5">
          {/* Floating Tooltip Pill (Only shows when an avatar orb is hovered or tapped!) */}
          <AnimatePresence mode="wait">
            {selectedRosterIdx !== null && (
              <motion.button
                type="button"
                key={activeEvent.id}
                initial={{ opacity: 0, y: 6, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.94 }}
                onClick={() => activeEvent.route && navigate(activeEvent.route)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a0f16]/95 border border-white/20 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.75)] text-xs font-bold cursor-pointer"
              >
                <span className={meta.iconColor}>{meta.icon}</span>
                <span className="text-white font-black">{activeEvent.initials}</span>
                <span className="text-gray-300 truncate max-w-44">{activeEvent.title}</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-orange-400">
                  P{activeEvent.priority}
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Ultra-Clean Glass Orb Stack (Includes EVEO AI + Online Team) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0f16]/85 backdrop-blur-2xl border border-white/15 shadow-[0_12px_35px_rgba(0,0,0,0.6),inset_0_1px_6px_rgba(255,255,255,0.1)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
            <div className="flex items-center -space-x-1.5">
              {prioritizedQueue.map((item, idx) => {
                const itemMeta = CATEGORY_META[item.category];
                const isSelected = selectedRosterIdx === idx;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onMouseEnter={() => setSelectedRosterIdx(idx)}
                    onMouseLeave={() => setSelectedRosterIdx(null)}
                    onClick={() => setSelectedRosterIdx(isSelected ? null : idx)}
                    className={`relative w-8 h-8 rounded-full font-black text-[10px] flex items-center justify-center transition-all cursor-pointer outline-none overflow-visible ${
                      item.isAiAgent
                        ? 'bg-radial-[at_30%_25%] from-purple-400/50 via-purple-600/40 to-purple-950 text-purple-200 border border-purple-400/60'
                        : 'bg-radial-[at_30%_25%] from-slate-700 via-slate-900 to-black text-white border border-white/20'
                    } ${isSelected ? 'z-30 scale-115 ring-2 ring-orange-400' : 'z-10 hover:z-20'}`}
                  >
                    <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[60%] h-[30%] rounded-full bg-white/30 pointer-events-none" />
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.agentName} className="w-full h-full rounded-full object-cover" />
                    ) : item.isAiAgent ? (
                      <Sparkles size={13} className="text-purple-300" />
                    ) : (
                      <span>{item.initials}</span>
                    )}
                    {/* Pulsating Red Dot on P1 High-Intent Activities */}
                    {item.priority === 1 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${itemMeta.badgeBg}`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-[#0a0f16] ${itemMeta.badgeBg}`} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE B: SINGLE-CIRCLE PRIORITY PULSE ON ALL OTHER /app/* PAGES
  // Desktop: Minimalist [Avatar Orb + Icon] -> Expands text on hover!
  // Mobile: 1st tap shows text tooltip -> 2nd tap navigates!
  // ============================================================================
  return (
    <div
      onPointerDown={(e) => {
        lastPointerType.current = e.pointerType;
      }}
      onMouseEnter={() => {
        if (lastPointerType.current === 'mouse') setIsExpanded(true);
      }}
      onMouseLeave={() => {
        if (lastPointerType.current === 'mouse') setIsExpanded(false);
      }}
      className="fixed top-3.5 right-3.5 md:top-auto md:bottom-6 md:right-6 z-45 pointer-events-none select-none"
    >
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.button
            type="button"
            key={`${activeEvent.id}-${queueCursor}`}
            layout
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            onClick={handleOrbClick}
            className="pointer-events-auto relative overflow-hidden flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#0a0f16]/90 backdrop-blur-2xl border border-white/20 hover:border-orange-500/50 shadow-[0_12px_35px_rgba(0,0,0,0.75),inset_0_1px_8px_rgba(255,255,255,0.18)] active:scale-95 transition-colors cursor-pointer outline-none"
          >
            {/* 1. Circular 3D Glass Avatar (Uses uploaded photo if available, or AI Neural Orb, or Initials) */}
            <div
              className={`relative w-9 h-9 rounded-full border-2 ${meta.orbRing} flex items-center justify-center text-white font-black text-xs shrink-0 overflow-visible ${
                activeEvent.isAiAgent
                  ? 'bg-radial-[at_30%_25%] from-purple-500/50 via-purple-900 to-black'
                  : 'bg-radial-[at_30%_25%] from-slate-700 via-slate-900 to-black'
              }`}
            >
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[65%] h-[32%] rounded-full bg-white/35 pointer-events-none z-20" />

              {activeEvent.avatarUrl ? (
                <img
                  src={activeEvent.avatarUrl}
                  alt={activeEvent.agentName}
                  className="w-full h-full rounded-full object-cover relative z-10"
                />
              ) : activeEvent.isAiAgent ? (
                <Sparkles size={15} className="text-purple-300 relative z-10" />
              ) : (
                <span className="relative z-10">{activeEvent.initials}</span>
              )}

              {/* High-Intent Pulsating Red Dot for Priority 1 */}
              {isPriorityOne && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-30">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-85" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-[#0a0f16] shadow-[0_0_8px_rgba(239,68,68,1)]" />
                </span>
              )}
            </div>

            {/* 2. Activity Icon (Always visible for instant visual recognition) */}
            <span className={`shrink-0 ${meta.iconColor} flex items-center justify-center`}>
              {meta.icon}
            </span>

            {/* 3. Expandable Activity Title (Visible on Mobile OR on Desktop Hover / Mobile Tap) */}
            <AnimatePresence initial={false}>
              {isExpanded ? (
                <motion.div
                  key="expanded-text"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden flex items-center gap-2 whitespace-nowrap pr-1"
                >
                  <span className="text-xs font-bold text-white">{activeEvent.title}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-orange-400">
                    {meta.priorityLabel}
                  </span>
                </motion.div>
              ) : (
                /* On Mobile, show concise title by default since there's horizontal room at the top */
                <span className="md:hidden text-xs font-bold text-white truncate max-w-42 pr-1">
                  {activeEvent.title}
                </span>
              )}
            </AnimatePresence>

            {/* 5-Second Progress Drain Bar */}
            {!isExpanded && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-3 right-3 h-0.5 origin-left rounded-full opacity-75 ${meta.badgeBg}`}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
