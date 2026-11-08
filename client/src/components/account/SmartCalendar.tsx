import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, X, Mail, CheckCircle2,
  ChevronDown, Palmtree, Check, Clock, Target,
  FileText, AlertTriangle, Sparkles, Plus, Save, UserCheck, XCircle
} from 'lucide-react';
import SwipeableModal from '../UI/SwipeableModal';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import {
  getOrSeedAgentCalendar,
  saveAgentCalendarRecords,
  type UserRole,
  type DayStatus,
  type ShiftDayRecord
} from '../../data/mockDatabase';

export interface SmartCalendarProps {
  agentName: string;
  role: UserRole;
  onClose: () => void;
  onResolveRequest?: () => void;
  initialSelectedDay?: number | null;
}

const LEGEND_ITEMS = [
  { label: 'Worked', dot: 'bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.7)]', text: 'text-emerald-300/90' },
  { label: 'Missed', dot: 'bg-red-400/80 shadow-[0_0_6px_rgba(248,113,113,0.7)]', text: 'text-red-300/90' },
  { label: 'Time Off', dot: 'bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.7)]', text: 'text-amber-300/90' },
  { label: 'Vacation', dot: 'bg-pink-400/80 shadow-[0_0_6px_rgba(244,114,182,0.7)]', text: 'text-pink-300/90' },
  { label: 'Pending Vac.', dot: 'bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.8)]', text: 'text-gray-200' },
  { label: 'Pending Off', dot: 'bg-orange-400/80 shadow-[0_0_6px_rgba(251,146,60,0.7)]', text: 'text-orange-300/90' },
  { label: 'Regular Off', dot: 'bg-teal-400/80 shadow-[0_0_6px_rgba(45,212,191,0.7)]', text: 'text-teal-300/90' },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SmartCalendar({
  agentName,
  role,
  onClose,
  onResolveRequest,
  initialSelectedDay = null
}: SmartCalendarProps) {
  const { activeStoreDataKey } = useStoreAppearance();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Expanded by default so users immediately see the color legend
  const [showLegend, setShowLegend] = useState(true);

  const CREATION_DATE = new Date(2026, 9, 1);
  const TODAY = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const REGULAR_DAY_OFF = 6; // Saturday

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const offsetDays = new Date(currentYear, currentMonth, 1).getDay();

  const [calendarState, setCalendarState] = useState<Record<string, ShiftDayRecord>>(() =>
    getOrSeedAgentCalendar(activeStoreDataKey, agentName, currentYear, currentMonth)
  );

  useEffect(() => {
    setCalendarState(getOrSeedAgentCalendar(activeStoreDataKey, agentName, currentYear, currentMonth));
  }, [activeStoreDataKey, agentName, currentYear, currentMonth]);

  // Inspector & Request Creation States
  const [selectedDay, setSelectedDay] = useState<number | null>(initialSelectedDay);
  const [editingNote, setEditingNote] = useState('');
  const [editingShift, setEditingShift] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  // Batch Selection Mode State
  const [selectionMode, setSelectionMode] = useState<null | 'timeoff' | 'vacation'>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rangeStartDay, setRangeStartDay] = useState<number | null>(null);
  const [selectedBatchDays, setSelectedBatchDays] = useState<number[]>([]);
  const [batchRequestNote, setBatchRequestNote] = useState('');
  const [showToast, setShowToast] = useState(false);

  const isManagerOrOwner = role === 'manager' || role === 'owner' || role === 'bdc_manager';

  useEffect(() => {
    const handlePointerUp = () => setIsDrawing(false);
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const updateAndSaveCalendar = (updates: Record<string, ShiftDayRecord>) => {
    const nextState = { ...calendarState, ...updates };
    setCalendarState(nextState);
    saveAgentCalendarRecords(activeStoreDataKey, agentName, nextState);
  };

  const getDayRecord = (day: number): ShiftDayRecord => {
    const dateKey = `${currentYear}-${currentMonth}-${day}`;
    const displayDate = `${MONTHS_SHORT[currentMonth]} ${day}`;
    const thisDate = new Date(currentYear, currentMonth, day);

    if (selectionMode && selectedBatchDays.includes(day)) {
      return {
        dateKey,
        displayDate,
        status: selectionMode === 'vacation' ? 'pending_vacation' : 'pending',
        batchId: 'live_selection_preview',
        shiftHours: 'Selecting Batch...',
        kpiScore: 'Draft',
        kpiDetail: 'Tap Confirm below to submit',
        note: batchRequestNote,
      };
    }

    if (thisDate < CREATION_DATE) {
      return {
        dateKey,
        displayDate,
        status: 'upcoming',
        shiftHours: 'N/A',
        kpiScore: 'N/A',
        kpiDetail: '',
        note: '',
      };
    }

    const stored = calendarState[dateKey];
    if (stored) return stored;

    if (thisDate.getDay() === REGULAR_DAY_OFF) {
      return {
        dateKey,
        displayDate,
        status: 'dayoff',
        shiftHours: 'OFF (Regular Weekly Rest)',
        kpiScore: 'Rest Day',
        kpiDetail: 'Scheduled weekly rest day',
        note: 'Standard weekly rest day.',
      };
    }

    if (thisDate <= TODAY) {
      return {
        dateKey,
        displayDate,
        status: 'worked',
        shiftHours: '9:00 AM - 6:00 PM (8h)',
        kpiScore: '94% Daily Goal',
        kpiDetail: '235 Outbound Touches • 4 Appts Set',
        note: 'Standard shift completed.',
      };
    }

    return {
      dateKey,
      displayDate,
      status: 'upcoming',
      shiftHours: '9:00 AM - 6:00 PM (Scheduled)',
      kpiScore: 'Target: 250 Touches',
      kpiDetail: 'Standard floor shift',
      note: '',
    };
  };

  useEffect(() => {
    if (initialSelectedDay !== null) {
      const rec = getDayRecord(initialSelectedDay);
      setSelectedDay(initialSelectedDay);
      setEditingNote(rec.note || '');
      setEditingShift(rec.shiftHours || '9:00 AM - 6:00 PM');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedDay]);

  const getBatchDaysForRecord = (day: number, record: ShiftDayRecord): number[] => {
    if (!record.batchId) return [day];
    const matchingDays: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const rec = calendarState[`${currentYear}-${currentMonth}-${d}`];
      if (rec && rec.batchId === record.batchId) {
        matchingDays.push(d);
      }
    }
    return matchingDays.length > 0 ? matchingDays : [day];
  };

  const openInspectorForDay = (day: number) => {
    const rec = getDayRecord(day);
    setSelectedDay(day);
    setEditingNote(rec.note || '');
    setEditingShift(rec.shiftHours || '9:00 AM - 6:00 PM');
  };

  const selectRange = (start: number, end: number) => {
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    const days: number[] = [];
    for (let d = min; d <= max; d++) {
      const checkDate = new Date(currentYear, currentMonth, d);
      if (checkDate > TODAY) days.push(d);
    }
    setSelectedBatchDays(days);
  };

  const handleDayClick = (day: number) => {
    const thisDate = new Date(currentYear, currentMonth, day);
    if (thisDate < CREATION_DATE) return;

    if (selectionMode) {
      if (thisDate <= TODAY) return;
      if (rangeStartDay === null) {
        setRangeStartDay(day);
        setSelectedBatchDays([day]);
      } else if (rangeStartDay === day) {
        setRangeStartDay(null);
      } else {
        selectRange(rangeStartDay, day);
        setRangeStartDay(null);
      }
      return;
    }

    openInspectorForDay(day);
  };

  const handleGridPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectionMode || !isDrawing) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const dayCell = target?.closest('[data-calendar-day]') as HTMLElement | null;
    if (!dayCell) return;
    const hoveredDay = Number(dayCell.dataset.calendarDay);
    if (!hoveredDay || Number.isNaN(hoveredDay)) return;

    const thisDate = new Date(currentYear, currentMonth, hoveredDay);
    if (thisDate <= TODAY) return;

    if (rangeStartDay !== null) {
      selectRange(rangeStartDay, hoveredDay);
    }
  };

  const handleSaveInspectorDetails = () => {
    if (selectedDay === null) return;
    const currentRec = getDayRecord(selectedDay);
    const targetDays = getBatchDaysForRecord(selectedDay, currentRec);

    const updates: Record<string, ShiftDayRecord> = {};
    targetDays.forEach((d) => {
      const key = `${currentYear}-${currentMonth}-${d}`;
      const existing = getDayRecord(d);
      updates[key] = {
        ...existing,
        shiftHours: editingShift.trim() || existing.shiftHours,
        note: editingNote.trim(),
      };
    });

    updateAndSaveCalendar(updates);
    setNoteSavedToast(true);
    setTimeout(() => setNoteSavedToast(false), 2000);
  };

  const handleSubmitBatchRequest = () => {
    if (!selectionMode || selectedBatchDays.length === 0) return;

    const sorted = [...selectedBatchDays].sort((a, b) => a - b);
    const newBatchId = `batch_${Date.now()}`;
    const isVacation = selectionMode === 'vacation';

    const targetStatus: DayStatus = isManagerOrOwner
      ? (isVacation ? 'vacation' : 'timeoff')
      : (isVacation ? 'pending_vacation' : 'pending');

    const labelPrefix = isVacation ? 'Vacation' : 'Time Off';
    const spanLabel = sorted.length > 1 ? `${sorted.length}-Day Batch` : 'Single Day';

    const updates: Record<string, ShiftDayRecord> = {};
    sorted.forEach((d) => {
      const dateKey = `${currentYear}-${currentMonth}-${d}`;
      updates[dateKey] = {
        dateKey,
        displayDate: `${MONTHS_SHORT[currentMonth]} ${d}`,
        status: targetStatus,
        batchId: newBatchId,
        shiftHours: `${labelPrefix} (${spanLabel})`,
        kpiScore: isManagerOrOwner ? 'Approved' : 'Pending Approval',
        kpiDetail: sorted.length > 1
          ? `${MONTHS_SHORT[currentMonth]} ${sorted[0]} – ${MONTHS_SHORT[currentMonth]} ${sorted[sorted.length - 1]}`
          : `${MONTHS_SHORT[currentMonth]} ${sorted[0]}`,
        note: batchRequestNote.trim() || `${labelPrefix} requested (${spanLabel.toLowerCase()}).`,
      };
    });

    updateAndSaveCalendar(updates);
    setSelectionMode(null);
    setSelectedBatchDays([]);
    setRangeStartDay(null);
    setBatchRequestNote('');

    if (!isManagerOrOwner) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const handleManagerDecision = (decision: 'approve' | 'deny') => {
    if (selectedDay === null) return;
    const rec = getDayRecord(selectedDay);
    const targetDays = getBatchDaysForRecord(selectedDay, rec);

    const updates: Record<string, ShiftDayRecord> = {};
    targetDays.forEach((d) => {
      const key = `${currentYear}-${currentMonth}-${d}`;
      const existing = getDayRecord(d);
      if (decision === 'approve') {
        const nextStatus: DayStatus = existing.status === 'pending_vacation' ? 'vacation' : 'timeoff';
        updates[key] = {
          ...existing,
          status: nextStatus,
          kpiScore: 'Approved by Manager',
          note: editingNote.trim() || existing.note,
        };
      } else {
        updates[key] = {
          dateKey: key,
          displayDate: `${MONTHS_SHORT[currentMonth]} ${d}`,
          status: 'upcoming',
          shiftHours: '9:00 AM - 6:00 PM (Scheduled)',
          kpiScore: 'Target: 250 Touches',
          kpiDetail: 'Request denied — returned to active roster',
          note: editingNote.trim() ? `Denied: ${editingNote.trim()}` : 'Time off request denied by manager.',
        };
      }
    });

    updateAndSaveCalendar(updates);
    if (onResolveRequest) onResolveRequest();
    setSelectedDay(null);
  };

  // Softer, higher-transparency Smoked Glass Orbs & Capsules (No harsh lighting!)
  const getOrbGlassStyle = (status: DayStatus) => {
    switch (status) {
      case 'worked':
        return {
          surface: 'bg-radial-[at_30%_25%] from-emerald-400/25 via-emerald-500/14 to-emerald-950/35 border border-emerald-400/35 shadow-[inset_0_1px_4px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(16,185,129,0.28)] backdrop-blur-md',
          text: 'text-emerald-100 font-bold',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          label: 'Worked Shift',
        };
      case 'missed':
        return {
          surface: 'bg-radial-[at_30%_25%] from-red-400/28 via-red-500/16 to-red-950/40 border border-red-400/40 shadow-[inset_0_1px_4px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(239,68,68,0.3)] backdrop-blur-md',
          text: 'text-red-100 font-bold',
          badge: 'bg-red-500/15 text-red-300 border-red-500/30',
          label: 'Missed Shift',
        };
      case 'dayoff':
        return {
          surface: 'bg-radial-[at_30%_25%] from-teal-400/22 via-teal-500/12 to-teal-950/35 border border-teal-400/30 shadow-[inset_0_1px_4px_rgba(255,255,255,0.2),inset_0_-2px_5px_rgba(20,184,166,0.25)] backdrop-blur-md',
          text: 'text-teal-100 font-semibold',
          badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          label: 'Regular Day Off',
        };
      case 'timeoff':
        return {
          surface: 'bg-linear-to-b from-amber-300/28 via-amber-500/16 to-amber-950/35 border border-amber-300/45 shadow-[inset_0_1px_6px_rgba(255,255,255,0.32),inset_0_-2px_8px_rgba(245,158,11,0.3)] backdrop-blur-xl',
          text: 'text-amber-50 font-black',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          label: 'Approved Time Off',
        };
      case 'pending':
        return {
          surface: 'bg-linear-to-b from-orange-300/30 via-orange-500/18 to-orange-950/40 border border-orange-300/50 shadow-[inset_0_1px_6px_rgba(255,255,255,0.35),0_0_12px_rgba(249,115,22,0.2)] backdrop-blur-xl',
          text: 'text-orange-50 font-black',
          badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          label: 'Pending Time Off',
        };
      case 'vacation':
        return {
          surface: 'bg-linear-to-b from-pink-300/30 via-pink-500/18 to-pink-950/40 border border-pink-300/50 shadow-[inset_0_1px_8px_rgba(255,255,255,0.35),inset_0_-2px_8px_rgba(236,72,153,0.35),0_2px_12px_rgba(236,72,153,0.2)] backdrop-blur-xl',
          text: 'text-white font-black',
          badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
          label: 'Approved Vacation',
        };
      case 'pending_vacation':
        return {
          surface: 'bg-linear-to-b from-white/26 via-white/12 to-white/6 border border-white/45 shadow-[inset_0_1px_8px_rgba(255,255,255,0.5),inset_0_-2px_6px_rgba(255,255,255,0.2),0_2px_12px_rgba(255,255,255,0.1)] backdrop-blur-2xl',
          text: 'text-white font-black',
          badge: 'bg-white/15 text-white border-white/35',
          label: 'Pending Vacation Request',
        };
      default:
        return null;
    }
  };

  const inspectedRecord = selectedDay !== null ? getDayRecord(selectedDay) : null;
  const inspectedBatchDays = (selectedDay !== null && inspectedRecord)
    ? getBatchDaysForRecord(selectedDay, inspectedRecord)
    : [];
  const inspectedStyle = inspectedRecord ? getOrbGlassStyle(inspectedRecord.status) : null;

  return (
    <SwipeableModal isOpen={true} onClose={onClose} maxWidthClass="md:max-w-md">
      <div className="flex flex-col h-full min-h-0 select-none relative">

        {/* Top Header */}
        <div className="relative z-10 px-5 pt-2 pb-3.5 sm:p-5 border-b border-white/10 shrink-0">
          <div className="flex justify-between items-center gap-2 mb-3">
            <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest drop-shadow-xs flex items-center gap-2 truncate">
              {selectionMode ? (
                <span className="text-orange-400 flex items-center gap-1.5 truncate">
                  <Sparkles size={13} className="shrink-0" /> Tap Start &amp; End Date
                </span>
              ) : (
                agentName === 'self' || agentName === 'manager_self' ? 'My Shift & Attendance Ledger' : `${agentName}'s Shift Ledger`
              )}
            </h3>

            <div className="flex items-center gap-2 shrink-0">
              {/* Glowing Legend Toggle Button with Animated ChevronDown */}
              <button
                type="button"
                onClick={() => setShowLegend((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                  showLegend
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/45 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                    : 'bg-white/8 text-gray-300 border-white/15 hover:text-white hover:border-white/30'
                }`}
              >
                <span>Legend</span>
                <ChevronDown size={13} className={`transition-transform duration-300 ${showLegend ? 'rotate-180 text-orange-400' : ''}`} />
              </button>

              <button
                type="button"
                aria-label="Close calendar"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-300 hover:bg-white/20 active:scale-90 transition-all outline-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between text-lg sm:text-xl font-black text-white relative">
            <button type="button" aria-label="Previous month" onClick={() => { setSelectedDay(null); setCurrentMonth(m => m === 0 ? 11 : m - 1); if (currentMonth === 0) setCurrentYear(y => y - 1); }} className="p-2 hover:bg-white/10 active:scale-90 rounded-xl transition-all cursor-pointer"><ChevronLeft size={20}/></button>
            <button type="button" onClick={() => setShowMonthPicker(!showMonthPicker)} className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded-xl transition-colors outline-none cursor-pointer">
              <Calendar className="text-blue-500" size={18} /> {MONTHS[currentMonth]} {currentYear} <ChevronDown size={14} className="text-gray-500"/>
            </button>
            <button type="button" aria-label="Next month" onClick={() => { setSelectedDay(null); setCurrentMonth(m => m === 11 ? 0 : m + 1); if (currentMonth === 11) setCurrentYear(y => y + 1); }} className="p-2 hover:bg-white/10 active:scale-90 rounded-xl transition-all cursor-pointer"><ChevronRight size={20}/></button>
          </div>

          {/* Collapsible Key Drawer (Expanded by Default) */}
          <AnimatePresence initial={false}>
            {showLegend && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                  {LEGEND_ITEMS.map((item) => (
                    <span key={item.label} className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${item.text}`}>
                      <span className={`w-2 h-2 rounded-full ${item.dot}`} /> {item.label}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable Calendar Body + Shift Inspector */}
        <div className="relative z-10 p-4 sm:p-5 bg-black/10 flex-1 overflow-y-auto overscroll-contain space-y-4">
          <AnimatePresence mode="wait">
            {showMonthPicker ? (
              <motion.div key="picker" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-3 gap-2.5 pb-4">
                {MONTHS.map((m, idx) => (
                  <button type="button" key={m} onClick={() => { setCurrentMonth(idx); setShowMonthPicker(false); setSelectedDay(null); }} className={`py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${currentMonth === idx ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    {m}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-7 mb-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                </div>

                {/* 7-Column Calendar Grid */}
                <div
                  className={`grid grid-cols-7 gap-y-2.5 gap-x-0 relative ${selectionMode ? 'touch-none' : ''}`}
                  onPointerMove={handleGridPointerMove}
                  onPointerLeave={() => setIsDrawing(false)}
                >
                  {Array.from({ length: offsetDays }).map((_, i) => <div key={`offset-${i}`} className="h-10" />)}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const thisDate = new Date(currentYear, currentMonth, day);
                    const colIndex = (offsetDays + i) % 7;
                    const rec = getDayRecord(day);
                    const style = getOrbGlassStyle(rec.status);

                    const isBeforeCreation = thisDate < CREATION_DATE;
                    const isToday = thisDate.getTime() === TODAY.getTime();
                    const isSelectedInInspector = selectedDay === day || (inspectedRecord?.batchId && rec.batchId === inspectedRecord.batchId);

                    const isBatchableStatus =
                      rec.status === 'timeoff' ||
                      rec.status === 'pending' ||
                      rec.status === 'vacation' ||
                      rec.status === 'pending_vacation';

                    const hasBatchId = Boolean(rec.batchId);

                    const prevRec = day > 1 && colIndex > 0 ? getDayRecord(day - 1) : null;
                    const isContinuationFromLeft =
                      isBatchableStatus &&
                      hasBatchId &&
                      prevRec !== null &&
                      prevRec.batchId === rec.batchId &&
                      prevRec.status === rec.status;

                    let batchRowSpan = 1;
                    if (isBatchableStatus && hasBatchId && !isContinuationFromLeft) {
                      while (
                        day + batchRowSpan <= daysInMonth &&
                        colIndex + batchRowSpan <= 6
                      ) {
                        const nextRec = getDayRecord(day + batchRowSpan);
                        if (nextRec.batchId === rec.batchId && nextRec.status === rec.status) {
                          batchRowSpan++;
                        } else {
                          break;
                        }
                      }
                    }

                    const continuesFromPrevRow =
                      isBatchableStatus &&
                      hasBatchId &&
                      colIndex === 0 &&
                      day > 1 &&
                      getDayRecord(day - 1).batchId === rec.batchId;

                    const continuesIntoNextRow =
                      isBatchableStatus &&
                      hasBatchId &&
                      colIndex + batchRowSpan - 1 === 6 &&
                      day + batchRowSpan <= daysInMonth &&
                      getDayRecord(day + batchRowSpan).batchId === rec.batchId;

                    return (
                      <div
                        key={day}
                        data-calendar-day={day}
                        onPointerDown={() => {
                          if (selectionMode && thisDate > TODAY) {
                            setIsDrawing(true);
                            setRangeStartDay(day);
                            setSelectedBatchDays([day]);
                          }
                        }}
                        onClick={() => handleDayClick(day)}
                        className="relative h-10 flex items-center justify-center cursor-pointer group"
                      >
                        {/* CASE A: Multi-Day Batch Capsule */}
                        {style && !isBeforeCreation && isBatchableStatus && hasBatchId && !isContinuationFromLeft && batchRowSpan > 1 && (
                          <div
                            style={{ width: `calc(${batchRowSpan * 100}% - 6px)`, left: '3px' }}
                            className={`absolute inset-y-0.5 z-10 pointer-events-none transition-all duration-300 overflow-hidden ${style.surface} ${
                              continuesFromPrevRow && continuesIntoNextRow
                                ? 'rounded-lg'
                                : continuesFromPrevRow
                                  ? 'rounded-l-lg rounded-r-full'
                                  : continuesIntoNextRow
                                    ? 'rounded-l-full rounded-r-lg'
                                    : 'rounded-full'
                            } ${isSelectedInInspector ? 'ring-1 ring-white/80 shadow-[0_0_16px_rgba(255,255,255,0.3)]' : ''}`}
                          >
                            <div className="absolute top-0.5 inset-x-3 h-[35%] rounded-full bg-linear-to-b from-white/25 to-transparent pointer-events-none" />
                          </div>
                        )}

                        {/* CASE B: Individual Standalone 3D Smoked Glass Orb */}
                        {style && !isBeforeCreation && (!isBatchableStatus || !hasBatchId || (!isContinuationFromLeft && batchRowSpan === 1)) && (
                          <div
                            className={`w-9 h-9 rounded-full absolute z-10 pointer-events-none transition-transform duration-200 group-hover:scale-105 overflow-hidden ${style.surface} ${
                              isSelectedInInspector ? 'ring-1 ring-white/80 scale-105 shadow-[0_0_14px_rgba(255,255,255,0.35)]' : ''
                            }`}
                          >
                            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[65%] h-[32%] rounded-full bg-linear-to-b from-white/30 to-transparent pointer-events-none" />
                          </div>
                        )}

                        {/* Today Ring Highlight */}
                        {isToday && (
                          <div className="w-9 h-9 absolute rounded-full border border-blue-400/80 shadow-[0_0_12px_rgba(59,130,246,0.6)] z-20 pointer-events-none" />
                        )}

                        {/* Day Number */}
                        <span
                          className={`relative z-30 text-xs flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                            isBeforeCreation
                              ? 'text-gray-600/30 cursor-not-allowed'
                              : style
                                ? style.text
                                : isSelectedInInspector
                                  ? 'bg-white/15 text-white font-black ring-1 ring-white/40'
                                  : 'text-gray-300 font-semibold group-hover:bg-white/10 group-hover:text-white'
                          }`}
                        >
                          {rec.overtime && rec.status === 'worked' && (
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,1)] animate-pulse" />
                          )}
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- INTERACTIVE SHIFT & BATCH INSPECTOR DRAWER --- */}
          <AnimatePresence mode="wait">
            {!selectionMode && selectedDay !== null && inspectedRecord && (
              <motion.div
                key={`inspector-${selectedDay}-${inspectedRecord.batchId || 'single'}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-2xl shadow-xl space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        {inspectedBatchDays.length > 1
                          ? `${MONTHS_SHORT[currentMonth]} ${inspectedBatchDays[0]} – ${MONTHS_SHORT[currentMonth]} ${inspectedBatchDays[inspectedBatchDays.length - 1]} (${inspectedBatchDays.length} Days)`
                          : `${MONTHS[currentMonth]} ${selectedDay}, ${currentYear}`}
                      </h4>
                      {inspectedStyle && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${inspectedStyle.badge}`}>
                          {inspectedStyle.label}
                        </span>
                      )}
                    </div>
                    {inspectedRecord.kpiDetail && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{inspectedRecord.kpiDetail}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-black/35 border border-white/10">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1 mb-1">
                      <Clock size={11} className="text-orange-400" /> Shift Covered
                    </span>
                    <input
                      type="text"
                      value={editingShift}
                      onChange={(e) => setEditingShift(e.target.value)}
                      disabled={!isManagerOrOwner && inspectedRecord.status !== 'upcoming'}
                      className="w-full bg-transparent text-xs font-bold text-white outline-none disabled:opacity-90"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/35 border border-white/10">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1 mb-1">
                      <Target size={11} className="text-emerald-400" /> Daily KPI / Status
                    </span>
                    <p className="text-xs font-black text-emerald-400 truncate">
                      {inspectedRecord.kpiScore || 'On Target'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <FileText size={11} className="text-blue-400" />
                      {inspectedBatchDays.length > 1 ? `Batch Note (${inspectedBatchDays.length} Linked Days)` : 'Shift / Absence Note'}
                    </label>
                    {noteSavedToast && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Saved &amp; Synced
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                    placeholder="Add shift log, absence reason, or coverage note..."
                    className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/10 focus:border-orange-500 outline-none text-base sm:text-xs text-white placeholder:text-gray-600 resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {inspectedRecord.status === 'upcoming' && new Date(currentYear, currentMonth, selectedDay) > TODAY && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionMode('timeoff');
                        setSelectedBatchDays([selectedDay]);
                        setBatchRequestNote(editingNote);
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={13} /> Request This Day Off
                    </button>
                  )}

                  {isManagerOrOwner && (inspectedRecord.status === 'pending' || inspectedRecord.status === 'pending_vacation') ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => handleManagerDecision('deny')}
                        className="flex-1 min-h-10 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle size={14} /> Deny {inspectedBatchDays.length > 1 ? 'Batch' : 'Day'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManagerDecision('approve')}
                        className="flex-1 min-h-10 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <UserCheck size={14} /> Approve {inspectedBatchDays.length > 1 ? 'Batch' : 'Day'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveInspectorDetails}
                      className="ml-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Save size={13} className="text-orange-400" /> Save Note
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* --- BATCH REQUEST BUILDER DRAWER --- */}
            {selectionMode && (
              <motion.div
                key="batch-builder"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">
                    {selectedBatchDays.length === 0
                      ? 'Tap your first future date above'
                      : `${selectedBatchDays.length} ${selectedBatchDays.length === 1 ? 'Day' : 'Days'} Selected in Batch`}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectionMode('timeoff')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                        selectionMode === 'timeoff' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      Time Off
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectionMode('vacation')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                        selectionMode === 'vacation' ? 'bg-pink-500 text-white' : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      Vacation
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={batchRequestNote}
                  onChange={(e) => setBatchRequestNote(e.target.value)}
                  placeholder="Reason / note for this request batch (e.g., 3 days off for paperwork)..."
                  className="w-full min-h-10 px-3 py-2 rounded-xl bg-black/45 border border-white/10 focus:border-orange-500 outline-none text-base sm:text-xs text-white placeholder:text-gray-500"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Action Bar */}
        <div className="relative z-10 flex justify-between items-center px-5 py-4 bg-[#0a0f16]/90 border-t border-white/10 shrink-0 gap-2">
          {selectionMode ? (
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => { setSelectionMode(null); setSelectedBatchDays([]); setRangeStartDay(null); setBatchRequestNote(''); }}
                className="flex-1 min-h-11 flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 text-gray-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-all outline-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedBatchDays.length === 0}
                onClick={handleSubmitBatchRequest}
                className="flex-2 min-h-11 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 active:scale-95 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] outline-none cursor-pointer"
              >
                <Check size={14}/> Submit {selectedBatchDays.length > 1 ? `Batch (${selectedBatchDays.length}d)` : 'Single Day'}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setSelectedDay(null); setSelectionMode('timeoff'); setSelectedBatchDays([]); setRangeStartDay(null); }}
                className="flex-1 min-h-11 flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 text-xs font-bold py-2.5 px-3 rounded-xl transition-all border border-amber-500/25 outline-none cursor-pointer"
              >
                <AlertTriangle size={14}/> Request Time Off
              </button>
              <button
                type="button"
                onClick={() => { setSelectedDay(null); setSelectionMode('vacation'); setSelectedBatchDays([]); setRangeStartDay(null); }}
                className="flex-1 min-h-11 flex items-center justify-center gap-1.5 bg-pink-500/10 hover:bg-pink-500/20 active:scale-95 text-pink-300 text-xs font-bold py-2.5 px-3 rounded-xl transition-all border border-pink-500/25 outline-none cursor-pointer"
              >
                <Palmtree size={14}/> Request Vacation
              </button>
            </>
          )}
        </div>

        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-200 flex items-center gap-3 bg-emerald-500/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.5)] border border-emerald-400 w-[92%]"
            >
              <Mail size={18} className="shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-bold">Request Logged</span>
                <span className="text-[10px] font-medium opacity-90">Tap the highlighted orb/capsule anytime to view or edit its note.</span>
              </div>
              <CheckCircle2 size={18} className="ml-1 opacity-80 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SwipeableModal>
  );
}
