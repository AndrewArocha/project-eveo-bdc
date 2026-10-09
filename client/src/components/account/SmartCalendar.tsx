// src/components/ui/SmartCalendar.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X, Mail, CheckCircle2, ChevronDown, Palmtree, Edit3, Check } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

type DayStatus = 'worked' | 'missed' | 'timeoff' | 'upcoming' | 'pending' | 'dayoff' | 'vacation' | 'pending_vacation';

interface SmartCalendarProps {
  agentName: string;
  role: 'bdc' | 'sales' | 'manager';
  onClose: () => void;
}

export default function SmartCalendar({ agentName, role, onClose }: SmartCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(9); // 9 = October
  const [currentYear, setCurrentYear] = useState(2026);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const CREATION_DATE = new Date(2026, 9, 1); 
  const TODAY = new Date(2026, 9, 6); 
  const REGULAR_DAY_OFF = 6; 

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const offsetDays = new Date(currentYear, currentMonth, 1).getDay();

  const [calendarState, setCalendarState] = useState<{ [key: string]: DayStatus }>({
    '2026-9-2': 'worked', '2026-9-4': 'worked', '2026-9-5': 'worked', '2026-9-6': 'worked', 
    '2026-9-14': 'timeoff', '2026-9-15': 'timeoff', '2026-9-16': 'pending',
    '2026-9-20': 'vacation', '2026-9-21': 'vacation', '2026-9-22': 'vacation', '2026-9-23': 'vacation'
  });

  const [dialog, setDialog] = useState<{ isOpen: boolean; day: number | null; type: 'request' | 'manager_action' | 'manager_self_timeoff' | 'init_vacation' | null }>({ isOpen: false, day: null, type: null });
  const [showToast, setShowToast] = useState(false);

  // --- Vacation Draw Mode State ---
  const [vacationMode, setVacationMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnDates, setDrawnDates] = useState<string[]>([]);

  // Global mouse up listener to stop drawing even if mouse leaves the calendar
  useEffect(() => {
    const handleMouseUp = () => setIsDrawing(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handlePrevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); setShowMonthPicker(false); };
  const handleNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); setShowMonthPicker(false); };

  // --- Unified Interaction Handler ---
  const handleDayInteraction = (day: number, interactionType: 'click' | 'mousedown' | 'mouseenter') => {
    const thisDate = new Date(currentYear, currentMonth, day);
    if (thisDate < CREATION_DATE) return; 

    const dateKey = `${currentYear}-${currentMonth}-${day}`;
    
    // --- DRAW MODE LOGIC ---
    if (vacationMode) {
      if (thisDate > TODAY) {
        if (interactionType === 'mousedown') {
          setIsDrawing(true);
          // Toggle off if clicking an already drawn date, otherwise add
          setDrawnDates(prev => prev.includes(dateKey) ? prev.filter(d => d !== dateKey) : [...prev, dateKey]);
        } else if (interactionType === 'mouseenter' && isDrawing) {
          // Paint brush effect
          setDrawnDates(prev => prev.includes(dateKey) ? prev : [...prev, dateKey]);
        }
      }
      return;
    }

    // --- NORMAL CLICK LOGIC ---
    if (interactionType === 'click') {
      const status = getDayStatus(thisDate, dateKey);
      
      if (status === 'upcoming' && thisDate > TODAY) {
        if (role === 'manager') setDialog({ isOpen: true, day, type: 'manager_self_timeoff' });
        else setDialog({ isOpen: true, day, type: 'request' });
      }
      
      if (role === 'manager' && status === 'pending') {
        setDialog({ isOpen: true, day, type: 'manager_action' });
      }
    }
  };

  const executeAction = (action: 'approve' | 'deny' | 'request' | 'manager_self_timeoff' | 'init_vacation') => {
    if (action === 'init_vacation') {
      setVacationMode(true);
      setDialog({ isOpen: false, day: null, type: null });
      return;
    }

    if (!dialog.day) return;
    const dateKey = `${currentYear}-${currentMonth}-${dialog.day}`;
    
    if (action === 'request') {
      setCalendarState(prev => ({ ...prev, [dateKey]: 'pending' }));
      triggerToast();
    } else if (action === 'approve' || action === 'manager_self_timeoff') {
      setCalendarState(prev => ({ ...prev, [dateKey]: 'timeoff' }));
    } else if (action === 'deny') {
      setCalendarState(prev => ({ ...prev, [dateKey]: 'upcoming' }));
    }
    setDialog({ isOpen: false, day: null, type: null });
  };

  const confirmVacationDraw = () => {
    if (drawnDates.length === 0) {
      setVacationMode(false);
      return;
    }

    const targetStatus = role === 'manager' ? 'vacation' : 'pending_vacation';
    const newStates: { [key: string]: DayStatus } = {};
    drawnDates.forEach(dateKey => { newStates[dateKey] = targetStatus; });

    setCalendarState(prev => ({ ...prev, ...newStates }));
    setDrawnDates([]);
    setVacationMode(false);
    
    if (role !== 'manager') triggerToast();
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4500); 
  };

  const getDayStatus = (thisDate: Date, dateKey: string): DayStatus => {
    if (thisDate < CREATION_DATE) return 'upcoming'; 
    const dbStatus = calendarState[dateKey];
    
    if (thisDate > TODAY) {
      if (dbStatus === 'timeoff' || dbStatus === 'pending' || dbStatus === 'vacation' || dbStatus === 'pending_vacation') return dbStatus;
      return 'upcoming'; 
    } else {
      if (dbStatus) return dbStatus; 
      if (thisDate.getDay() === REGULAR_DAY_OFF) return 'dayoff'; 
      return 'missed'; 
    }
  };

  const isVacationType = (dateKey: string) => {
    if (vacationMode && drawnDates.includes(dateKey)) return true;
    return calendarState[dateKey] === 'vacation' || calendarState[dateKey] === 'pending_vacation';
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-hidden pointer-events-none">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />
      
      {/* Notice the "select-none" class added to prevent text highlighting while dragging */}
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className={`w-full max-w-105 max-h-[90vh] flex flex-col pointer-events-auto z-10 overflow-hidden shadow-2xl bg-[#0a0f16]/60 backdrop-blur-3xl rounded-3xl relative transition-colors duration-300 select-none ${vacationMode ? 'border-2 border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.15)]' : 'border border-white/20'}`}
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-5 border-b border-white/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest drop-shadow-md flex items-center gap-2">
              {vacationMode ? <><Edit3 size={12} className="text-pink-500 animate-pulse"/> Vacation Draw Mode</> : (agentName === 'self' ? 'My Schedule' : `${agentName}'s Schedule`)}
            </h3>
            {!vacationMode && <button onClick={onClose} className="p-1 rounded-full bg-white/10 text-gray-300 hover:bg-white/20 transition-colors outline-none"><X size={16} /></button>}
          </div>
          
          <div className="flex items-center justify-between text-xl font-black text-white relative">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="flex items-center gap-2 hover:bg-white/5 px-3 py-1 rounded-xl transition-colors outline-none">
              <Calendar className="text-blue-500" size={18} /> {MONTHS[currentMonth]} {currentYear} <ChevronDown size={14} className="text-gray-500"/>
            </button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={20}/></button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 mt-4">
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-emerald-400"><span className="w-2 h-2 rounded bg-emerald-500"/> Worked</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-red-400"><span className="w-2 h-2 rounded bg-red-500"/> Missed</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-yellow-400"><span className="w-2 h-2 rounded bg-yellow-500"/> Time Off</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-pink-400"><span className="w-2 h-2 rounded bg-pink-500"/> Vacation</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-teal-400"><span className="w-2 h-2 rounded bg-teal-500"/> Day Off</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-orange-400"><span className="w-2 h-2 rounded bg-orange-500"/> Pending</span>
          </div>
        </div>

        <div className="relative z-10 p-5 bg-black/20 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {showMonthPicker ? (
              <motion.div key="picker" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-3 gap-3 h-full pb-4">
                {MONTHS.map((m, idx) => (
                  <button key={m} onClick={() => { setCurrentMonth(idx); setShowMonthPicker(false); }} className={`py-3 rounded-xl text-xs font-bold transition-colors ${currentMonth === idx ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    {m}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1" onMouseLeave={() => setIsDrawing(false)}>
                  {Array.from({ length: offsetDays }).map((_, i) => <div key={`offset-${i}`} className="w-8 h-8 mx-auto"></div>)}
                  
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const thisDate = new Date(currentYear, currentMonth, day);
                    const dateKey = `${currentYear}-${currentMonth}-${day}`;
                    
                    const status = getDayStatus(thisDate, dateKey);
                    
                    const isBeforeCreation = thisDate < CREATION_DATE;
                    const isToday = thisDate.getTime() === TODAY.getTime();
                    const isOvertime = day === 8 && currentMonth === 9; 
                    
                    const isDrawn = vacationMode && drawnDates.includes(dateKey);
                    const isWhitePending = status === 'pending_vacation';
                    const isPinkVacation = status === 'vacation' || isDrawn;
                    const isLiquidLink = isPinkVacation || isWhitePending;

                    let indicatorClass = "text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"; 
                    let vacationBgClass = ""; 

                    if (isBeforeCreation) {
                      indicatorClass = "text-gray-600/30 cursor-not-allowed";
                    } else if (isLiquidLink) {
                      indicatorClass = isWhitePending ? "text-white cursor-pointer" : "text-pink-100 cursor-pointer";
                      
                      const prevIsVacation = isVacationType(`${currentYear}-${currentMonth}-${day - 1}`);
                      const nextIsVacation = isVacationType(`${currentYear}-${currentMonth}-${day + 1}`);
                      
                      const baseColor = isWhitePending 
                        ? "bg-white/20 backdrop-blur-md shadow-[inset_0_0_15px_rgba(255,255,255,0.4)] border-y border-white/40" 
                        : "bg-pink-500/40 backdrop-blur-md shadow-[inset_0_0_15px_rgba(236,72,153,0.3)]";

                      vacationBgClass = `absolute inset-y-1 z-0 ${baseColor}`;
                      
                      if (!prevIsVacation && !nextIsVacation) vacationBgClass += " inset-x-1 rounded-full border-x"; 
                      else if (!prevIsVacation && nextIsVacation) vacationBgClass += " left-1 -right-0.5 rounded-l-full border-l"; 
                      else if (prevIsVacation && !nextIsVacation) vacationBgClass += " -left-0.5 right-1 rounded-r-full border-r"; 
                      else vacationBgClass += " -left-0.5 -right-0.5 rounded-none"; 

                    } else {
                      if (status === 'worked') indicatorClass = "bg-emerald-500/20 text-emerald-400 rounded-lg shadow-[inset_0_0_8px_rgba(16,185,129,0.2)]"; 
                      else if (status === 'missed') indicatorClass = "bg-red-500/20 text-red-400 rounded-lg shadow-[inset_0_0_8px_rgba(239,68,68,0.2)]"; 
                      else if (status === 'timeoff') indicatorClass = "bg-yellow-500/20 text-yellow-400 rounded-lg shadow-[inset_0_0_8px_rgba(234,179,8,0.2)]"; 
                      else if (status === 'dayoff') indicatorClass = "bg-teal-500/20 text-teal-400 rounded-lg shadow-[inset_0_0_8px_rgba(20,184,166,0.2)] cursor-default"; 
                      else if (status === 'pending') indicatorClass = "bg-orange-500/20 text-orange-400 rounded-lg cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse";
                    }

                    if (isToday) indicatorClass += " border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]";

                    const wrapperCursor = vacationMode && thisDate > TODAY ? 'cursor-crosshair hover:bg-pink-500/20 rounded-lg' : 'cursor-pointer';

                    return (
                      <div 
                        key={day} 
                        onMouseDown={() => handleDayInteraction(day, 'mousedown')}
                        onMouseEnter={() => handleDayInteraction(day, 'mouseenter')}
                        onClick={() => handleDayInteraction(day, 'click')}
                        className={`relative flex items-center justify-center p-0.5 transition-colors ${wrapperCursor}`}
                      >
                         {isLiquidLink && <div className={vacationBgClass} />}
                         <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold relative mx-auto z-10 ${indicatorClass}`}>
                           {isOvertime && status === 'worked' && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.9)] animate-pulse" />}
                           {day}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 flex justify-between items-center px-6 py-5 bg-[#0a0f16]/90 border-t border-white/10">
           <p className="text-xs text-gray-500 hidden sm:block">Total Hours Logged: <span className="font-bold text-white">124h</span></p>
           
           <div className="flex gap-4 w-full sm:w-auto justify-end">
             {vacationMode ? (
               <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={() => { setVacationMode(false); setDrawnDates([]); }} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold py-2.5 px-4 rounded-xl transition-all outline-none">
                   Cancel
                 </button>
                 <button onClick={confirmVacationDraw} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] outline-none">
                   <Check size={14}/> Confirm Selection
                 </button>
               </div>
             ) : (
               <button onClick={() => setDialog({ isOpen: true, day: null, type: 'init_vacation' })} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white/5 hover:bg-white/10 text-pink-400 hover:text-pink-300 text-[10px] font-bold py-2.5 px-4 rounded-xl transition-colors border border-white/5 outline-none uppercase tracking-widest">
                 <Palmtree size={14}/> Request Vacation
               </button>
             )}
           </div>
        </div>

        <AnimatePresence>
          {showToast && (
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-200 flex items-center gap-3 bg-emerald-500/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.5)] border border-emerald-400 w-[90%]"
            >
              <Mail size={18} className="shrink-0" />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-bold">Request Sent Successfully</span>
                <span className="text-[10px] font-medium opacity-90">You will be notified via email upon manager approval.</span>
              </div>
              <CheckCircle2 size={18} className="ml-2 opacity-80 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ConfirmModal 
        isOpen={dialog.isOpen && dialog.type === 'init_vacation'}
        title="Schedule Vacation"
        message="Want to request a vacation? Enter drawing mode to connect the dates for your time off."
        confirmText="Yes, Enable Pen"
        type="info"
        onConfirm={() => executeAction('init_vacation')}
        onCancel={() => setDialog({ isOpen: false, day: null, type: null })}
      />

      <ConfirmModal 
        isOpen={dialog.isOpen && dialog.type === 'request'}
        title="Request Time Off"
        message={`Are you sure you want to request October ${dialog.day} off? Your manager will need to approve this.`}
        confirmText="Submit Request"
        onConfirm={() => executeAction('request')}
        onCancel={() => setDialog({ isOpen: false, day: null, type: null })}
      />

      <ConfirmModal 
        isOpen={dialog.isOpen && dialog.type === 'manager_action'}
        title="Review Time Off"
        message={`Agent has requested October ${dialog.day} off. Do you approve?`}
        confirmText="Approve"
        cancelText="Deny Request"
        type="success"
        onConfirm={() => executeAction('approve')}
        onCancel={() => executeAction('deny')}
      />

      <ConfirmModal 
        isOpen={dialog.isOpen && dialog.type === 'manager_self_timeoff'}
        title="Schedule Time Off"
        message={`Are you sure you want to schedule October ${dialog.day} off?`}
        confirmText="Confirm"
        onConfirm={() => executeAction('manager_self_timeoff')}
        onCancel={() => setDialog({ isOpen: false, day: null, type: null })}
      />
    </div>
  );
}