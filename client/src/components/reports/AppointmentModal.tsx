import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown, Clock, User, Car, Plus, Save } from 'lucide-react';
// 🌟 FIXED: Added the missing import
import { saveAppointments, type Appointment as DemoAppointment } from '../../utils/appointmentManager';
import { SleekPillButton } from '../UI/SleekButtons';
import { useAuth } from '../../contexts/AuthContext';
import { apiOperationalRepository, type ApiAppointment } from '../../services/operational/apiOperationalRepository';
import { teamRepository } from '../../services/team/teamRepository';
import type { ApiTeamMember } from '../../services/apiClient';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

type ApptStatus = DemoAppointment['status'] | 'CANCELLED' | 'SHOWED';

interface Appointment {
  id: string;
  time: string;
  customer: string;
  vehicle: string;
  rep: string;
  status: ApptStatus;
}

export default function AppointmentModal({ isOpen, onClose, storeId }: AppointmentModalProps) {
  const { user } = useAuth();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [apiAppointments, setApiAppointments] = useState<ApiAppointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<ApiTeamMember[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [syncError, setSyncError] = useState('');

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const offsetDays = new Date(currentYear, currentMonth, 1).getDay();

  const dbKey = `eveo_appointments_${storeId}`;
  const [appointmentsDb, setAppointmentsDb] = useState<{ [key: string]: Appointment[] }>(() => {
    const saved = localStorage.getItem(dbKey);
    return saved ? JSON.parse(saved) : {};
  });

  const [newAppt, setNewAppt] = useState({ time: '10:00 AM', durationMinutes: 30 as 15 | 30 | 45 | 60, customer: '', vehicle: '', rep: '' });
  const timeOptions = Array.from({ length: 37 }, (_, index) => {
    const minutes = 9 * 60 + index * 15;
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${meridiem}`;
  });

  useEffect(() => {
    if (!user || !isOpen || !storeId) {
      setApiAppointments([]);
      setTeamMembers([]);
      return;
    }
    let active = true;
    setIsLoadingAppointments(true);
    setSyncError('');
    Promise.all([apiOperationalRepository.listAppointments(storeId), teamRepository.listMembers(storeId)])
      .then(([appointments, members]) => {
        if (!active) return;
        setApiAppointments(appointments);
        setTeamMembers(members.filter((member) => member.role !== 'owner'));
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setSyncError(cause instanceof Error ? cause.message : 'Schedule could not be loaded.');
        setApiAppointments([]);
        setTeamMembers([]);
      })
      .finally(() => { if (active) setIsLoadingAppointments(false); });
    return () => { active = false; };
  }, [isOpen, storeId, user]);

  // 🌟 FIXED: Kept only ONE saveToDatabase function
  const saveToDatabase = (dateKey: string, updatedAppts: Appointment[]) => {
    const newDbState = { ...appointmentsDb, [dateKey]: updatedAppts };
    setAppointmentsDb(newDbState);
    saveAppointments(storeId, dateKey, updatedAppts.map((appointment) => ({ ...appointment, status: appointment.status as DemoAppointment['status'] })));
  };

  // 🌟 FIXED: Kept only ONE handleAddAppointment function
  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.customer || !newAppt.vehicle) return;

    if (user) {
      setIsSavingAppointment(true);
      setSyncError('');
      try {
        const [clock, meridiem] = newAppt.time.split(' ');
        const [hourText, minuteText] = clock.split(':');
        const hour = (Number(hourText) % 12) + (meridiem === 'PM' ? 12 : 0);
        const scheduledAt = new Date(currentYear, currentMonth, selectedDay, hour, Number(minuteText || 0));
        await apiOperationalRepository.createAppointment({
          storeId,
          customerNameSnapshot: newAppt.customer.trim(),
          vehicleSnapshot: newAppt.vehicle.trim(),
          scheduledAt: scheduledAt.toISOString(),
          status: 'pending_confirmation',
          durationMinutes: newAppt.durationMinutes,
          ...(newAppt.rep ? { assignedStoreUserId: newAppt.rep } : {}),
        });
        setApiAppointments(await apiOperationalRepository.listAppointments(storeId));
        setIsAddingMode(false);
        setNewAppt({ time: '10:00 AM', durationMinutes: 30, customer: '', vehicle: '', rep: '' });
      } catch (cause) {
        setSyncError(cause instanceof Error ? cause.message : 'Appointment could not be saved.');
      } finally {
        setIsSavingAppointment(false);
      }
      return;
    }

    const dateKey = `${currentYear}-${currentMonth}-${selectedDay}`;
    const currentDayAppts = appointmentsDb[dateKey] || [];

    const createdAppt: Appointment = {
      id: Date.now().toString(),
      time: newAppt.time,
      customer: newAppt.customer,
      vehicle: newAppt.vehicle,
      rep: newAppt.rep,
      status: 'PENDING CONFIRM'
    };

    const updatedAppts = [...currentDayAppts, createdAppt].sort((a, b) => {
      return new Date(`2000/01/01 ${a.time}`).getTime() - new Date(`2000/01/01 ${b.time}`).getTime();
    });

    saveToDatabase(dateKey, updatedAppts);
    setIsAddingMode(false);
    setNewAppt({ time: '10:00 AM', durationMinutes: 30, customer: '', vehicle: '', rep: '' });
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

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': case 'ARRIVED': case 'SOLD': return 'bg-emerald-500';
      case 'PENDING CONFIRM': return 'bg-orange-500';
      case 'NO SHOW': return 'bg-red-500';
      case 'cancelled': case 'CANCELLED': return 'bg-gray-500';
      case 'pending_confirmation': return 'bg-orange-500';
      case 'no_show': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const selectedDateKey = `${currentYear}-${currentMonth}-${selectedDay}`;
  const isSameLocalDay = (value: string | null) => {
    if (!value) return false;
    const date = new Date(value);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth && date.getDate() === selectedDay;
  };
  const todaysAppointments: Appointment[] = user
    ? apiAppointments.filter((appointment) => isSameLocalDay(appointment.scheduledAt)).map((appointment) => {
      const assignedId = appointment.assignedStoreUserId || appointment.assignedPlatformUserId || '';
      const status: ApptStatus = appointment.status === 'pending_confirmation' ? 'PENDING CONFIRM'
        : appointment.status === 'no_show' ? 'NO SHOW'
          : appointment.status === 'cancelled' ? 'CANCELLED' : appointment.status.toUpperCase().replaceAll('_', ' ') as ApptStatus;
      return {
        id: appointment._id,
        time: appointment.scheduledAt ? new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Time not set',
        customer: appointment.customerNameSnapshot,
        vehicle: appointment.vehicleSnapshot || 'Vehicle not specified',
        rep: teamMembers.find((member) => member.id === assignedId)?.name || 'Unassigned',
        status,
      };
    })
    : appointmentsDb[selectedDateKey] || [];
  const appointmentsForDay = (day: number) => user
    ? apiAppointments.filter((appointment) => {
      if (!appointment.scheduledAt) return false;
      const date = new Date(appointment.scheduledAt);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth && date.getDate() === day;
    })
    : appointmentsDb[`${currentYear}-${currentMonth}-${day}`] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 md:p-6 overflow-hidden pointer-events-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-6xl h-[90vh] flex flex-col pointer-events-auto z-10 overflow-hidden shadow-2xl bg-white text-gray-900 dark:bg-[#0a0f16]/95 dark:text-white backdrop-blur-3xl border border-gray-200 dark:border-white/10 rounded-3xl relative"
          >
            <div className="absolute top-0 left-0 w-full h-40 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 shrink-0 flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                <Calendar className="text-blue-500" /> Master Schedule
              </h2>
              <button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors outline-none dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"><X size={20} /></button>
            </div>

            {/* Split Content Body */}
            <div className="relative z-10 flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

              {/* LEFT PANE: The Calendar */}
              <div className="w-full md:w-85 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex flex-col overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
                    <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 px-3 py-1 rounded-xl transition-colors outline-none">
                      {MONTHS[currentMonth]} {currentYear} <ChevronDown size={14} className="text-gray-500" />
                    </button>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={20} /></button>
                  </div>

                  <AnimatePresence mode="wait">
                    {showMonthPicker ? (
                      <motion.div key="picker" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-3 gap-2 h-full pb-4">
                        {MONTHS.map((m, idx) => (
                          <button key={m} onClick={() => { setCurrentMonth(idx); setShowMonthPicker(false); }} className={`py-3 rounded-xl text-xs font-semibold transition-colors ${currentMonth === idx ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'}`}>
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
                            const dayAppts = appointmentsForDay(day);

                            return (
                              <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`relative w-10 h-10 mx-auto flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all outline-none ${isSelected ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'}`}
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
              <div className="flex-1 flex flex-col bg-white dark:bg-[#0a0f16]/40 min-w-0 overflow-hidden relative">
                <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule for {MONTHS[currentMonth]} {selectedDay}, {currentYear}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{todaysAppointments.length} Appointment{todaysAppointments.length !== 1 && 's'} Found</p>
                  </div>

                  <SleekPillButton
                    tone={isAddingMode ? 'neutral' : 'orange'}
                    icon={isAddingMode ? <X size={13} /> : <Plus size={13} />}
                    onClick={() => setIsAddingMode(!isAddingMode)}
                  >
                    {isAddingMode ? 'Cancel' : 'New Appt'}
                  </SleekPillButton>

                </div>

                <div className="flex-1 flex flex-col min-h-0 p-6 pt-6 overflow-hidden">

                  <AnimatePresence>
                    {isAddingMode && (
                      <motion.div initial={{ height: 0, opacity: 0, marginBottom: 0 }} animate={{ height: 'auto', opacity: 1, marginBottom: 24 }} exit={{ height: 0, opacity: 0, marginBottom: 0 }} className="overflow-hidden shrink-0">
                        <form onSubmit={(event) => void handleAddAppointment(event)} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 rounded-2xl flex flex-col gap-4">
                          <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> Schedule New Appointment
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                            <input type="text" value={newAppt.customer} onChange={e => setNewAppt({ ...newAppt, customer: e.target.value })} placeholder="Customer Name" required className="bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-colors" />
                            <input type="text" value={newAppt.vehicle} onChange={e => setNewAppt({ ...newAppt, vehicle: e.target.value })} placeholder="Vehicle of Interest" required className="bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-colors" />
                            <select value={newAppt.time} onChange={e => setNewAppt({ ...newAppt, time: e.target.value })} className="bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-colors">
                              {timeOptions.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <select aria-label="Appointment duration" value={newAppt.durationMinutes} onChange={(e) => setNewAppt({ ...newAppt, durationMinutes: Number(e.target.value) as 15 | 30 | 45 | 60 })} className="bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-colors">
                              {[15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
                            </select>
                            <select value={newAppt.rep} onChange={e => setNewAppt({ ...newAppt, rep: e.target.value })} className="bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-colors">
                              <option value="">Unassigned</option>
                              {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                            </select>
                          </div>
                          <div className="flex justify-end mt-2">
                            <button type="submit" disabled={isSavingAppointment} className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-md outline-none cursor-pointer disabled:opacity-60">
                              <Save size={14} /> {isSavingAppointment ? 'Saving…' : 'Save Appointment'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {syncError && <p role="alert" className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{syncError}</p>}
                  {isLoadingAppointments ? (
                    <div className="h-full grid place-items-center text-sm text-gray-600 dark:text-gray-400">Loading store schedule…</div>
                  ) : todaysAppointments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <Calendar size={48} className="mb-4" />
                      <p className="font-bold">No appointments scheduled.</p>
                      <p className="text-xs">Select another day or add a new appointment.</p>
                    </div>
                  ) : (
                    <div className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-auto shadow-sm custom-scrollbar">
                      <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
                        <thead className="bg-gray-100 dark:bg-black/40 text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 backdrop-blur-md">
                          <tr>
                            <th className="px-6 py-4"><span className="flex items-center gap-2"><Clock size={12} /> TIME</span></th>
                            <th className="px-6 py-4"><span className="flex items-center gap-2"><User size={12} /> CUSTOMER</span></th>
                            <th className="px-6 py-4"><span className="flex items-center gap-2"><Car size={12} /> VEHICLE</span></th>
                            <th className="px-6 py-4">REP</th>
                            <th className="px-6 py-4">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                          {todaysAppointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                              <td className="px-6 py-4 text-orange-700 dark:text-orange-400 font-semibold">{appt.time}</td>
                              <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{appt.customer}</td>
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{appt.vehicle}</td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{appt.rep}</td>
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
