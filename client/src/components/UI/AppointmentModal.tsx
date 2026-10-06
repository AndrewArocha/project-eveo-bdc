import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown, Clock, User, Car } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ApptStatus = 'CONFIRMED' | 'PENDING CONFIRM' | 'NO SHOW' | 'ARRIVED' | 'SOLD';

interface Appointment {
  id: string;
  time: string;
  customer: string;
  vehicle: string;
  rep: string;
  status: ApptStatus;
}

export default function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  const [currentMonth, setCurrentMonth] = useState(9); // 9 = October
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState<number>(6); // Default to today (Oct 6)
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const offsetDays = new Date(currentYear, currentMonth, 1).getDay();

  // Mock Database of Appointments (Keyed by YYYY-M-D)
  const mockAppointments: { [key: string]: Appointment[] } = {
    '2026-9-6': [
      { id: '1', time: '1:00 PM', customer: 'Gordon Freeman', vehicle: '2024 Tesla Model Y', rep: 'Erick', status: 'CONFIRMED' },
      { id: '2', time: '2:30 PM', customer: 'Alyx Vance', vehicle: '2022 Honda Civic', rep: 'Laura', status: 'PENDING CONFIRM' },
      { id: '3', time: '4:00 PM', customer: 'Eli Vance', vehicle: '2021 Ford F-150', rep: 'Erick', status: 'CONFIRMED' },
    ],
    '2026-9-7': [
      { id: '4', time: '9:15 AM', customer: 'Sarah Connor', vehicle: '2025 Toyota RAV4', rep: 'Sarah J.', status: 'CONFIRMED' },
      { id: '5', time: '11:00 AM', customer: 'John Connor', vehicle: '2023 Jeep Wrangler', rep: 'Erick', status: 'PENDING CONFIRM' },
    ],
    '2026-9-8': [
      { id: '6', time: '3:00 PM', customer: 'Arthur Morgan', vehicle: '2024 Ford Mustang', rep: 'Michael T.', status: 'CONFIRMED' },
    ],
    '2026-9-2': [
      { id: '7', time: '10:00 AM', customer: 'Master Chief', vehicle: '2024 Toyota Tacoma', rep: 'Laura', status: 'SOLD' },
      { id: '8', time: '1:30 PM', customer: 'Cortana', vehicle: '2022 Honda Accord', rep: 'Sarah J.', status: 'ARRIVED' },
      { id: '9', time: '5:00 PM', customer: 'Avery Johnson', vehicle: '2021 Chevy Silverado', rep: 'Erick', status: 'NO SHOW' },
    ]
  };

  const handlePrevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); setShowMonthPicker(false); };
  const handleNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); setShowMonthPicker(false); };

  const getStatusColors = (status: ApptStatus) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'PENDING CONFIRM': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      case 'ARRIVED': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'SOLD': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'NO SHOW': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const getStatusDotColor = (status: ApptStatus) => {
    switch (status) {
      case 'CONFIRMED': case 'ARRIVED': case 'SOLD': return 'bg-emerald-500';
      case 'PENDING CONFIRM': return 'bg-orange-500';
      case 'NO SHOW': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const selectedDateKey = `${currentYear}-${currentMonth}-${selectedDay}`;
  const todaysAppointments = mockAppointments[selectedDateKey] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 md:p-6 overflow-hidden pointer-events-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          {/* Main Modal Wrapper */}
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="w-full max-w-6xl h-[90vh] flex flex-col pointer-events-auto z-10 overflow-hidden shadow-2xl bg-[#0a0f16]/80 backdrop-blur-3xl border border-white/10 rounded-3xl relative"
          >
            <div className="absolute top-0 left-0 w-full h-40 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="relative z-10 shrink-0 flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                <Calendar className="text-blue-500" /> Master Schedule
              </h2>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors outline-none"><X size={20} /></button>
            </div>

            {/* Split Content Body */}
            <div className="relative z-10 flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
              
              {/* LEFT PANE: The Calendar */}
              <div className="w-full md:w-85 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 flex flex-col overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between text-xl font-black text-white mb-6">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
                    <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="flex items-center gap-2 hover:bg-white/5 px-3 py-1 rounded-xl transition-colors outline-none">
                      {MONTHS[currentMonth]} {currentYear} <ChevronDown size={14} className="text-gray-500"/>
                    </button>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={20}/></button>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {showMonthPicker ? (
                      <motion.div key="picker" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-3 gap-2 h-full pb-4">
                        {MONTHS.map((m, idx) => (
                          <button key={m} onClick={() => { setCurrentMonth(idx); setShowMonthPicker(false); }} className={`py-3 rounded-xl text-xs font-bold transition-colors ${currentMonth === idx ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                            {m.slice(0, 3)}
                          </button>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div key="grid" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: offsetDays }).map((_, i) => <div key={`offset-${i}`} className="w-10 h-10 mx-auto"></div>)}
                          
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = selectedDay === day;
                            const dayKey = `${currentYear}-${currentMonth}-${day}`;
                            const dayAppts = mockAppointments[dayKey] || [];
                            
                            return (
                              <button 
                                key={day} 
                                onClick={() => setSelectedDay(day)}
                                className={`relative w-10 h-10 mx-auto flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all outline-none ${isSelected ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                              >
                                <span>{day}</span>
                                {dayAppts.length > 0 && (
                                  <div className="flex gap-0.5 absolute bottom-1.5">
                                    {dayAppts.slice(0, 3).map((appt, idx) => (
                                      <span key={idx} className={`w-1 h-1 rounded-full ${getStatusDotColor(appt.status)} shadow-sm`} />
                                    ))}
                                    {dayAppts.length > 3 && <span className="w-1 h-1 rounded-full bg-white opacity-50 shadow-sm" />}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT PANE: Appointment Table Container */}
              <div className="flex-1 flex flex-col bg-[#0a0f16]/40 min-w-0 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-white">Schedule for {MONTHS[currentMonth]} {selectedDay}, {currentYear}</h3>
                    <p className="text-xs text-gray-400 mt-1">{todaysAppointments.length} Appointment{todaysAppointments.length !== 1 && 's'} Found</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 p-6 pt-6 overflow-hidden">
                  {todaysAppointments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                      <Calendar size={48} className="mb-4" />
                      <p className="font-bold">No appointments scheduled.</p>
                      <p className="text-xs">Select another day or add a new appointment.</p>
                    </div>
                  ) : (
                    /* The dedicated inner scrolling wrapper for the table */
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-auto shadow-sm custom-scrollbar">
                      <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
                        <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 backdrop-blur-md">
                          <tr>
                            <th className="px-6 py-4"><span className="flex items-center gap-2"><Clock size={12}/> TIME</span></th>
                            <th className="px-6 py-4"><span className="flex items-center gap-2"><User size={12}/> CUSTOMER</span></th>
                            <th className="px-6 py-4"><span className="flex items-center gap-2"><Car size={12}/> VEHICLE</span></th>
                            <th className="px-6 py-4">REP</th>
                            <th className="px-6 py-4">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {todaysAppointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                              <td className="px-6 py-4 text-orange-500 font-bold">{appt.time}</td>
                              <td className="px-6 py-4 font-bold text-white">{appt.customer}</td>
                              <td className="px-6 py-4 text-gray-400">{appt.vehicle}</td>
                              <td className="px-6 py-4 text-gray-300">{appt.rep}</td>
                              <td className="px-6 py-4 pr-8">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${getStatusColors(appt.status)}`}>
                                  {appt.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}