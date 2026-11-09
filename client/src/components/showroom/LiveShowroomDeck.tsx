// src/components/showroom/LiveShowroomDeck.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, Plus, Users, Radio, Eye, Globe } from 'lucide-react';
import { MasterScheduleCard } from '../reports/ScheduleCards';
import AppointmentModal from '../reports/AppointmentModal';

const glassCardClasses = `
  backdrop-blur-2xl bg-white/5 dark:bg-[#0a0f16]/40
  border border-white/20 dark:border-white/10
  shadow-[0_15px_30px_rgba(0,0,0,0.1),inset_0_1px_8px_rgba(255,255,255,0.2)]
  dark:shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_1px_8px_rgba(255,255,255,0.1)]
  rounded-3xl relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 cursor-pointer group
`;

export type SlaBubbleState = 'overdue_red' | 'due_soon_yellow' | 'ongoing_orange' | 'completed_green';
export type LeadSourceBrand = 'CarFax' | 'CarGurus' | 'TrueCar' | 'AutoTrader' | 'CarZing' | 'Other';

export interface FloorAppointmentBubble {
  id: string;
  appointmentId?: string;
  customerId?: string;
  leadId?: string;
  customerPhone?: string;
  visitId?: string;
  customerName: string;
  vehicle: string;
  rep: string;
  timeLabel: string;
  slaState: SlaBubbleState;
  badgeText: string;
  leadSource?: LeadSourceBrand;
}

const LEAD_SOURCE_SOURCES: LeadSourceBrand[] = [
  'CarGurus',
  'CarFax',
  'TrueCar',
  'AutoTrader',
  'CarZing',
  'Other',
];

export function resolveLeadSourceForCustomer(customerName: string, explicitSource?: LeadSourceBrand): LeadSourceBrand {
  if (explicitSource) return explicitSource;
  let hash = 0;
  for (let i = 0; i < customerName.length; i++) {
    hash = (hash * 31 + customerName.charCodeAt(i)) % 997;
  }
  return LEAD_SOURCE_SOURCES[hash % LEAD_SOURCE_SOURCES.length];
}

/** Crisp SVG / Brand Emblem for each Lead Source inside the 3D Showroom Orb */
function LeadSourceOrbGraphic({ source }: { source: LeadSourceBrand }) {
  switch (source) {
    case 'CarFax':
      return (
        <div className="flex flex-col items-center justify-center z-20">
          <div className="flex items-center gap-0.5">
            {['C', 'A', 'R', 'F', 'A', 'X'].map((ch, i) => (
              <span
                key={i}
                className="w-3.5 h-4 sm:w-4 sm:h-4.5 bg-white text-black font-black text-[9px] sm:text-[10px] flex items-center justify-center rounded-xs shadow-xs"
              >
                {ch}
              </span>
            ))}
          </div>
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-300 mt-1.5">
            Verified Lead
          </span>
        </div>
      );
    case 'CarGurus':
      return (
        <div className="flex flex-col items-center justify-center z-20">
          <span className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-md">
            Car<span className="text-sky-400">Gurus</span>
          </span>
          <span className="px-1.5 py-0.2 mt-1 rounded bg-sky-500/20 border border-sky-400/30 text-[7px] font-black uppercase tracking-widest text-sky-300">
            Deal Rating
          </span>
        </div>
      );
    case 'TrueCar':
      return (
        <div className="flex flex-col items-center justify-center z-20">
          <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/25 flex items-center justify-center mb-0.5">
            <span className="text-xs font-black text-white">TC</span>
          </div>
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
            TrueCar
          </span>
        </div>
      );
    case 'AutoTrader':
      return (
        <div className="flex flex-col items-center justify-center z-20">
          <span className="text-xs sm:text-sm font-black tracking-tight text-white">
            Auto<span className="text-orange-400">trader</span>
          </span>
          <span className="w-8 h-1 rounded-full bg-linear-to-r from-orange-500 to-blue-500 mt-1" />
        </div>
      );
    case 'CarZing':
      return (
        <div className="flex flex-col items-center justify-center z-20">
          <span className="text-sm sm:text-base font-black italic tracking-tight text-white">
            Car<span className="text-emerald-400">Zing</span>
          </span>
          <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-300 mt-0.5">
            Pre-Qual
          </span>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center z-20 text-gray-200">
          <Globe size={20} className="mb-1 text-gray-300" />
          <span className="text-[10px] font-black uppercase tracking-widest">Other Source</span>
        </div>
      );
  }
}

interface LiveShowroomDeckProps {
  storeId: string;
  latestCompletedHero: {
    customerName: string;
    vehicle: string;
    rep: string;
    time: string;
  };
  activeVisitCount: number;
  scheduledCount: number;
  ongoingAppointmentBubbles: FloorAppointmentBubble[];
  onSwitchToActivity: () => void;
  onOpenCheckIn: () => void;
  onExpandOngoingDash: () => void;
  onOpenOrStartVisit: (bubble: FloorAppointmentBubble) => void;
  onMarkOverdueStrike: (bubble: FloorAppointmentBubble) => void;
}

export default function LiveShowroomDeck({
  storeId,
  latestCompletedHero,
  activeVisitCount,
  scheduledCount,
  ongoingAppointmentBubbles,
  onSwitchToActivity,
  onOpenCheckIn,
  onExpandOngoingDash,
  onOpenOrStartVisit,
  onMarkOverdueStrike,
}: LiveShowroomDeckProps) {
  const [isMasterScheduleOpen, setIsMasterScheduleOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* --- TOP COMMAND ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">

        <div className="lg:col-span-3 flex flex-row lg:flex-col justify-between gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenCheckIn}
            className={`${glassCardClasses} flex-1 px-4 py-3 lg:p-5 flex items-center justify-between gap-3 text-left outline-none`}
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2.5 lg:p-3 bg-orange-500/20 border border-orange-500/30 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform shadow-[inset_0_0_15px_rgba(249,115,22,0.2)]">
                <Plus size={18} />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-white">Add Walk-In</h3>
                <p className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-gray-500">Start Floor Visit</p>
              </div>
            </div>
            <ArrowRight size={15} className="relative z-10 text-orange-500 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          <button
            type="button"
            onClick={onSwitchToActivity}
            className={`${glassCardClasses} flex-1 px-4 py-3 lg:p-5 flex items-center justify-between gap-3 text-left outline-none`}
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2.5 lg:p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]">
                <Radio size={18} />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-white">Live Activity</h3>
                <p className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-gray-500">Showroom</p>
              </div>
            </div>
            <ArrowRight size={15} className="relative z-10 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>

        <div className="lg:col-span-5 flex">
          <div
            onClick={onExpandOngoingDash}
            className={`${glassCardClasses} w-full p-5 sm:p-8 flex flex-col justify-between`}
          >
            <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />

            <div className="relative z-10">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-3 sm:mb-4 flex items-center gap-2">
                <CheckCircle2 size={12} /> Latest Completed Visit
              </h4>

              <div className="mb-5">
                <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-xs truncate">
                  {latestCompletedHero.customerName}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1 truncate">
                  {latestCompletedHero.time} &bull; {latestCompletedHero.vehicle} &bull; Rep: {latestCompletedHero.rep}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="py-2 px-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Users size={13} className="text-orange-500" /> {activeVisitCount} Floor
                </span>
                <span className="py-2 px-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Radio size={13} className="text-blue-400" /> {scheduledCount} Appts
                </span>
                <span className="py-2 px-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold flex items-center justify-center gap-1.5 group-hover:bg-white/10 transition-colors">
                  <Eye size={13} className="text-emerald-400" /> Lobby
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex">
          <div className="w-full flex flex-col justify-center">
            <MasterScheduleCard onClick={() => setIsMasterScheduleOpen(true)} />
          </div>
        </div>

      </div>

      {/* --- BOTTOM ROW: ONGOING APPOINTMENTS RADAR WITH LEAD SOURCE ORBS! --- */}
      <div className="pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {ongoingAppointmentBubbles.length > 0 ? 'Ongoing appointments' : 'No ongoing appointments'}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &gt;15m Overdue (Strike)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Due &le;15m</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> On Floor</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed (&lt;1h)</span>
          </div>
        </div>

        {ongoingAppointmentBubbles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <EmptyShowroomFuelGauge />
            <p className="text-xs font-bold text-gray-500 mt-3">
              Floor queue is on E — Add a walk-in or open Master Schedule above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 pt-3">
            {ongoingAppointmentBubbles.map((bubble) => {
              const sourceBrand = resolveLeadSourceForCustomer(bubble.customerName, bubble.leadSource);

              const orbStyles: Record<
                SlaBubbleState,
                { badgeBorder: string; dot: string; orbRing: string; orbGrad: string }
              > = {
                overdue_red: {
                  badgeBorder: 'border-red-500/50 text-red-400',
                  dot: 'bg-red-500 animate-ping',
                  orbRing: 'border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.2)]',
                  orbGrad: 'from-red-500/20 to-[#0a0f16]/90',
                },
                due_soon_yellow: {
                  badgeBorder: 'border-amber-400/50 text-amber-300',
                  dot: 'bg-amber-400 animate-pulse',
                  orbRing: 'border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.18)]',
                  orbGrad: 'from-amber-500/20 to-[#0a0f16]/90',
                },
                ongoing_orange: {
                  badgeBorder: 'border-orange-500/50 text-orange-400',
                  dot: 'bg-orange-500 animate-pulse',
                  orbRing: 'border-orange-500/50 shadow-[0_0_25px_rgba(249,115,22,0.2)]',
                  orbGrad: 'from-orange-500/20 to-[#0a0f16]/90',
                },
                completed_green: {
                  badgeBorder: 'border-emerald-500/50 text-emerald-400',
                  dot: 'bg-emerald-500',
                  orbRing: 'border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]',
                  orbGrad: 'from-emerald-500/20 to-[#0a0f16]/90',
                },
              };

              const st = orbStyles[bubble.slaState];

              return (
                <div key={bubble.id} className="flex flex-col items-center group relative">
                  <div
                    onClick={() => onOpenOrStartVisit(bubble)}
                    className={`relative z-20 -mb-3 ml-6 px-3 py-1 rounded-full backdrop-blur-xl bg-[#0a0f16]/95 border ${st.badgeBorder} flex items-center gap-1.5 text-[10px] font-black whitespace-nowrap cursor-pointer transition-transform group-hover:scale-105`}
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${st.dot}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${st.dot.split(' ')[0]}`} />
                    </span>
                    <span>{bubble.badgeText}</span>
                  </div>

                  {/* Lead Source Brand Orb (CarFax, CarGurus, TrueCar, AutoTrader, CarZing, Other!) */}
                  <button
                    type="button"
                    onClick={() => onOpenOrStartVisit(bubble)}
                    title={`Lead Source: ${sourceBrand}`}
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 ${st.orbRing} bg-linear-to-b ${st.orbGrad} backdrop-blur-xl flex flex-col items-center justify-center text-white overflow-hidden transition-transform group-hover:scale-105 active:scale-95 cursor-pointer px-2`}
                  >
                    <div className="absolute inset-0 rounded-full bg-linear-to-tr from-white/5 to-transparent pointer-events-none z-10" />
                    <div className="absolute top-2 right-4 w-8 h-4 bg-white/10 rounded-full blur-xs pointer-events-none -rotate-45 z-10" />
                    <LeadSourceOrbGraphic source={sourceBrand} />
                  </button>

                  <div className="text-center mt-2.5">
                    <p className="text-sm font-black text-white truncate max-w-36">
                      {bubble.customerName}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-400 truncate max-w-36">
                      {bubble.vehicle}
                    </p>
                    <p className="text-[10px] font-bold text-orange-500 mt-0.5">
                      Rep: {bubble.rep} &bull; {sourceBrand}
                    </p>
                  </div>

                  {bubble.slaState === 'overdue_red' && (
                    <button
                      type="button"
                      onClick={() => onMarkOverdueStrike(bubble)}
                      className="mt-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-[10px] font-black text-red-400 flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle size={11} /> Log 15m Strike
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AppointmentModal
        isOpen={isMasterScheduleOpen}
        onClose={() => setIsMasterScheduleOpen(false)}
        storeId={storeId}
      />
    </motion.div>
  );
}

function EmptyShowroomFuelGauge() {
  return (
    <svg viewBox="0 0 200 110" className="w-48 h-28 overflow-visible">
      <path d="M 25 90 A 75 75 0 0 1 175 90" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeDasharray="4 14" />
      <line x1="25" y1="90" x2="36" y2="84" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="15" x2="100" y2="28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <line x1="175" y1="90" x2="164" y2="84" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <text x="10" y="96" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="system-ui">E</text>
      <text x="182" y="96" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="system-ui">F</text>
      <rect x="95" y="0" width="10" height="11" rx="1.5" fill="none" stroke="#ffffff" strokeWidth="1.8" />
      <path d="M 105 3 L 108 6 L 108 10" fill="none" stroke="#ffffff" strokeWidth="1.5" />
      <motion.g
        initial={{ rotate: 45 }}
        animate={{ rotate: [0, -3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '100px', originY: '90px' }}
      >
        <polygon points="100,86 42,64 100,94" fill="#ef4444" />
      </motion.g>
      <circle cx="100" cy="90" r="8" fill="#ffffff" />
    </svg>
  );
}
