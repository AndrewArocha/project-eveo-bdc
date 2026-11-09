import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, CheckCircle2,
  Calendar, DollarSign, AlertCircle, Car, FileText, Target,
  Clock, Coffee, Globe, ArrowRight, Edit2, RotateCcw, Lock, Radio
} from 'lucide-react';

import SaveButton from './SaveButton';
import SmartCalendar from './SmartCalendar';
import GlassActionOrb from '../UI/GlassActionOrb';
import { apiRequest } from '../../services/apiClient';

import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';

import {
  CURRENT_USER,
  getVisibleStoreRoster,
  getOrSeedAgentCalendar,
  type UserRole,
  type GlobalUser,
  type StoreStaff,
  type ShiftDayRecord
} from '../../data/mockDatabase';

// ==========================================
// 1. PROFILE FORM (Clean, Uncluttered, Zero DevTools Warnings)
// ==========================================
export function ProfileForm() {
  const { user, refreshUser, role } = useAuth();
  const { activeStore, registeredStores, refreshStores } = useStoreAppearance();
  const persistedStore = registeredStores.find((store) => store.id === activeStore.id);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [storeName, setStoreName] = useState(activeStore.name || '');
  const [storePhone, setStorePhone] = useState(activeStore.phone || '');
  const [website, setWebsite] = useState(activeStore.websiteUrl || '');
  const [address, setAddress] = useState(persistedStore?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user?.id, user?.name, user?.phone]);

  useEffect(() => {
    setStoreName(activeStore.name || '');
    setStorePhone(activeStore.phone || '');
    setWebsite(activeStore.websiteUrl || '');
    setAddress(persistedStore?.address || '');
  }, [activeStore.id, activeStore.name, activeStore.phone, activeStore.websiteUrl, persistedStore?.address]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    setIsSaving(true);
    try {
      await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify({ name, phone }) });
      await refreshUser();
      if (role === 'owner' && activeStore.id) {
        await apiRequest(`/stores/${encodeURIComponent(activeStore.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: storeName, phone: storePhone, website, address }),
        });
        await refreshStores();
      }
      setFeedback('Profile saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Profile could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void saveProfile(event)} className="relative z-10 flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Your profile</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Update the name and contact information attached to your EVEO account.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Full name
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#0a0f16] dark:text-white" />
        </label>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Sign-in email
          <input value={user?.email || ''} readOnly className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400" />
        </label>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Your phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} autoComplete="tel" className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#0a0f16] dark:text-white" />
        </label>
      </div>
      {role === 'owner' && <section className="border-t border-gray-200 pt-5 dark:border-white/10">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Store profile</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">These details appear in the Hub and are used by website inventory sync.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Dealership name
            <input value={storeName} onChange={(event) => setStoreName(event.target.value)} required maxLength={120} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#0a0f16] dark:text-white" />
          </label>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Dealership phone
            <input value={storePhone} onChange={(event) => setStorePhone(event.target.value)} maxLength={40} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#0a0f16] dark:text-white" />
          </label>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 sm:col-span-2">Dealership website
            <input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={2048} placeholder="https://dealership.example" className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#0a0f16] dark:text-white" />
          </label>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 sm:col-span-2">Address
            <input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={300} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#0a0f16] dark:text-white" />
          </label>
        </div>
      </section>}
      {(error || feedback) && <p role={error ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2.5 text-xs ${error ? 'border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'}`}>{error || feedback}</p>}
      <button type="submit" disabled={isSaving} className="min-h-11 w-full rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60 sm:w-auto">{isSaving ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}

// ==========================================
// 2. SCHEDULE FORM (3D Glass Action Orbs + Hover/Tap Tooltips)
// ==========================================
export function ScheduleForm({ role }: { role: UserRole }) {
  const { user } = useAuth();
  const { activeStoreId, activeStoreDataKey, activeStore } = useStoreAppearance();

  type DailyShift = { start: string; end: string };
  type WeeklySchedule = Record<string, DailyShift>;

  const defaultSchedule: WeeklySchedule = {
    Monday: { start: '9:00 AM', end: '6:00 PM' },
    Tuesday: { start: '9:00 AM', end: '6:00 PM' },
    Wednesday: { start: '9:00 AM', end: '6:00 PM' },
    Thursday: { start: '9:00 AM', end: '6:00 PM' },
    Friday: { start: '9:00 AM', end: '6:00 PM' },
    Saturday: { start: '10:00 AM', end: '4:00 PM' },
    Sunday: { start: 'OFF', end: 'OFF' },
  };

  const [scheduleState, setScheduleState] = useState<WeeklySchedule>(() => {
    if (user?.weeklySchedule) return { ...defaultSchedule, ...user.weeklySchedule };
    const saved = user ? null : localStorage.getItem('eveo_user_schedule');
    return saved ? JSON.parse(saved) : defaultSchedule;
  });

  const [hasSubmittedSchedule, setHasSubmittedSchedule] = useState(() => {
    return user ? Boolean(user.weeklySchedule && Object.keys(user.weeklySchedule).length) : localStorage.getItem('eveo_user_schedule') !== null;
  });

  const [isRequestingChange, setIsRequestingChange] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState<string | null>(null);
  const [calendarInitialDay, setCalendarInitialDay] = useState<number | null>(null);
  const [expandShifts, setExpandShifts] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState('');
  const { refreshUser } = useAuth();

  const [teamState, setTeamState] = useState<Array<GlobalUser | StoreStaff>>(() => user ? [] : getVisibleStoreRoster(activeStoreId));

  useEffect(() => {
    setTeamState(user ? [] : getVisibleStoreRoster(activeStoreId));
  }, [activeStoreId, user]);

  useEffect(() => {
    if (user) {
      setScheduleState({ ...defaultSchedule, ...user.weeklySchedule });
      setHasSubmittedSchedule(Boolean(user.weeklySchedule && Object.keys(user.weeklySchedule).length));
    }
  // defaults are stable for a mounted form; only replace when the server user changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.weeklySchedule]);

  const [calendarRecords, setCalendarRecords] = useState<Record<string, ShiftDayRecord>>(() =>
    user ? {} : getOrSeedAgentCalendar(activeStoreDataKey, CURRENT_USER)
  );

  useEffect(() => {
    if (user) {
      setCalendarRecords({});
      return;
    }
    const refreshRecords = () => {
      setCalendarRecords(getOrSeedAgentCalendar(activeStoreDataKey, CURRENT_USER));
    };
    refreshRecords();
    window.addEventListener('eveo:calendar-updated', refreshRecords);
    return () => window.removeEventListener('eveo:calendar-updated', refreshRecords);
  }, [activeStoreDataKey, showCalendar, user]);

  const completedShiftsHistory = Object.values(calendarRecords)
    .filter((rec) => rec.status === 'worked' || rec.status === 'missed')
    .sort((a, b) => {
      const dayA = Number(a.dateKey.split('-')[2] || 0);
      const dayB = Number(b.dateKey.split('-')[2] || 0);
      return dayB - dayA;
    });

  const isManager = role === 'manager' || role === 'owner' || role === 'bdc_manager';

  const handleResolveRequest = (agentName: string) => {
    setTeamState((prev) =>
      prev.map((agent) => (agent.name === agentName ? { ...agent, pendingRequest: false } : agent))
    );
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    setScheduleState(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    setScheduleError('');
    try {
      if (user) {
        await apiRequest('/users/me/schedule', { method: 'PATCH', body: JSON.stringify({ schedule: scheduleState }) });
        await refreshUser();
      } else {
        localStorage.setItem('eveo_user_schedule', JSON.stringify(scheduleState));
      }
      setHasSubmittedSchedule(true);
      setIsRequestingChange(false);
    } catch (cause) {
      setScheduleError(cause instanceof Error ? cause.message : 'Schedule could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManagerResetSchedule = (targetAgentName: string) => {
    if (!isManager) return;
    if (targetAgentName === 'manager_self') {
      localStorage.removeItem('eveo_user_schedule');
      setScheduleState(defaultSchedule);
      setHasSubmittedSchedule(false);
      setIsRequestingChange(false);
      setEditingAgent(null);
    } else {
      localStorage.removeItem(`eveo_cal_v3_${activeStoreDataKey}_${targetAgentName}`);
      localStorage.removeItem(`eveo_calendar_v2_${targetAgentName}`);
      setEditingAgent(null);
    }
  };

  const selectClasses = "flex-1 sm:flex-initial min-h-10 bg-white dark:bg-[#0a0f16] border border-gray-300 dark:border-white/15 rounded-xl px-3 py-1.5 text-sm sm:text-xs font-bold outline-none text-gray-900 dark:text-white transition-colors focus:border-orange-500 cursor-pointer";

  const renderDayGrid = () => (
    <div className="grid grid-cols-1 gap-3 mb-4">
      {Object.keys(defaultSchedule).map(day => (
        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 gap-2">
          <span className="font-bold text-gray-900 dark:text-white w-24 text-sm">{day}</span>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <select
              aria-label={`${day} start time`}
              name={`${day.toLowerCase()}_start`}
              value={scheduleState[day].start}
              onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
              className={selectClasses}
            >
              <option className="bg-white dark:bg-gray-900">8:00 AM</option>
              <option className="bg-white dark:bg-gray-900">9:00 AM</option>
              <option className="bg-white dark:bg-gray-900">10:00 AM</option>
              <option className="bg-white dark:bg-gray-900">OFF</option>
            </select>
            <span className="text-gray-500 text-xs font-medium">to</span>
            <select
              aria-label={`${day} end time`}
              name={`${day.toLowerCase()}_end`}
              value={scheduleState[day].end}
              onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
              className={selectClasses}
            >
              <option className="bg-white dark:bg-gray-900">4:00 PM</option>
              <option className="bg-white dark:bg-gray-900">5:00 PM</option>
              <option className="bg-white dark:bg-gray-900">6:00 PM</option>
              <option className="bg-white dark:bg-gray-900">7:00 PM</option>
              <option className="bg-white dark:bg-gray-900">OFF</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );

  if (user) {
    return (
      <div className="relative z-10 flex flex-col gap-5">
        <div><h3 className="text-base font-semibold text-gray-900 dark:text-white">My availability</h3><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Set your regular weekly showroom availability. This is saved to your EVEO account.</p></div>
        {renderDayGrid()}
        {scheduleError && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-700 dark:text-red-200">{scheduleError}</p>}
        {hasSubmittedSchedule && <p className="text-xs text-emerald-700 dark:text-emerald-300">Your availability is saved.</p>}
        <SaveButton label={isSaving ? 'Saving…' : 'Save availability'} onClick={() => void handleSaveSchedule()} />
      </div>
    );
  }

  // --- MANAGER & OWNER TEAM VIEW (Sleek Icon-First Glass Orbs!) ---
  if (isManager) {
    return (
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{activeStore.name} Roster</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hover orbs (or tap on mobile) to inspect shifts, notes, and live floor activity.</p>
          </div>
        </div>

        {/* Manager's Own Compact Row */}
        <div>
          <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2.5">My Schedule</h4>

          {editingAgent === 'manager_self' ? (
            <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/30 flex flex-col gap-4 shadow-lg">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit2 size={15} className="text-orange-500" /> {hasSubmittedSchedule ? 'Edit My Schedule' : 'Initialize Schedule'}
                </span>
                <div className="flex items-center gap-3">
                  {hasSubmittedSchedule && (
                    <button type="button" onClick={() => handleManagerResetSchedule('manager_self')} className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                  <button type="button" onClick={() => setEditingAgent(null)} className="text-xs font-bold text-gray-400 hover:text-white cursor-pointer px-2 py-1">Cancel</button>
                  <button type="button" onClick={() => { handleSaveSchedule(); setEditingAgent(null); }} className="text-xs font-bold bg-orange-500 text-white px-4 py-1.5 rounded-xl cursor-pointer shadow-md hover:bg-orange-600">
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              {renderDayGrid()}
            </div>
          ) : (
            <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 ${hasSubmittedSchedule ? 'bg-orange-500/5 border-orange-500/20' : 'bg-red-500/5 border-red-500/30 shadow-lg'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-xs border ${hasSubmittedSchedule ? 'bg-radial-[at_30%_25%] from-orange-400/40 to-orange-950/60 border-orange-400/50 text-orange-300' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                  AH
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{CURRENT_USER}</p>
                  {hasSubmittedSchedule ? (
                    <p className="text-[11px] text-gray-500 truncate">{scheduleState['Monday'].start} – {scheduleState['Monday'].end}</p>
                  ) : (
                    <p className="text-[11px] text-red-400 font-bold flex items-center gap-1"><AlertCircle size={11} /> Setup Required</p>
                  )}
                </div>
              </div>

              {/* Glass Orb Action Cluster */}
              <div className="flex items-center gap-2 shrink-0">
                {hasSubmittedSchedule ? (
                  <>
                    <GlassActionOrb
                      icon={<Calendar size={15} />}
                      tooltip="My Shift Calendar & Notes"
                      tone="blue"
                      onClick={() => { setCalendarInitialDay(null); setShowCalendar('manager_self'); }}
                    />
                    <GlassActionOrb
                      icon={<Edit2 size={15} />}
                      tooltip="Edit My Weekly Hours"
                      tone="orange"
                      onClick={() => setEditingAgent('manager_self')}
                    />
                    <GlassActionOrb
                      icon={<Clock size={15} />}
                      tooltip="Active Shift: Mon – Fri"
                      subTooltip={`${scheduleState['Monday'].start} – ${scheduleState['Monday'].end}`}
                      tone="amber"
                    />
                    <GlassActionOrb
                      icon={<Coffee size={15} />}
                      tooltip="Rest Days: Sat & Sun"
                      tone="teal"
                    />
                  </>
                ) : (
                  <GlassActionOrb
                    icon={<Edit2 size={15} />}
                    tooltip="Initialize Schedule"
                    tone="red"
                    pulseDot="red"
                    badgeText="Setup"
                    onClick={() => setEditingAgent('manager_self')}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team Roster Directory (Compact 1-Row Cards with 3D Glass Orbs!) */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/10">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
            Active Floor &amp; BDC Roster ({teamState.length})
          </h4>
          <div className="flex flex-col gap-2.5 max-h-115 overflow-y-auto pr-1 custom-scrollbar">
            {teamState.map((agent) => {
              const hasPendingReq = 'pendingRequest' in agent && Boolean(agent.pendingRequest);
              const liveText = ('liveActivity' in agent && agent.liveActivity) ? agent.liveActivity : 'Active on floor';
              const shiftDays = agent.schedule || 'Mon - Fri (9AM - 6PM)';
              const restDays = ('daysOff' in agent && agent.daysOff) ? agent.daysOff : 'Sat & Sun';

              return editingAgent === agent.name ? (
                <div key={`edit-${agent.name}`} className="bg-white/80 dark:bg-black/40 p-4 rounded-2xl border border-orange-500/50 flex flex-col gap-4 shadow-lg relative">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Edit2 size={15} className="text-orange-500" /> Override {agent.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => handleManagerResetSchedule(agent.name)} className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                        <RotateCcw size={12} /> Reset
                      </button>
                      <button type="button" onClick={() => setEditingAgent(null)} className="text-xs font-bold text-gray-400 hover:text-white cursor-pointer px-2 py-1">Cancel</button>
                      <button type="button" onClick={() => setEditingAgent(null)} className="text-xs font-bold bg-orange-500 text-white px-4 py-1.5 rounded-xl cursor-pointer shadow-md hover:bg-orange-600">Save</button>
                    </div>
                  </div>
                  {renderDayGrid()}
                </div>
              ) : (
                <div
                  key={agent.name}
                  className="bg-white/50 dark:bg-black/25 px-3.5 py-3 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                >
                  {/* Left: Avatar + Name + Role Pill (On mobile, also shows concise live activity subtitle since there's room) */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 shrink-0 bg-radial-[at_30%_25%] from-blue-400/35 via-blue-600/20 to-slate-950 border border-blue-400/40 text-blue-200 rounded-full flex items-center justify-center font-black text-xs relative shadow-inner">
                      <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[60%] h-[30%] rounded-full bg-white/30 pointer-events-none" />
                      {('initials' in agent && agent.initials) ? agent.initials : agent.name.slice(0, 2).toUpperCase()}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0a0f16]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{agent.name}</p>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/8 text-gray-400 shrink-0">
                          {agent.role}
                        </span>
                      </div>
                      {/* Mobile shows concise activity inline; Desktop keeps row ultra-clean and shows activity via the glowing Emerald Orb! */}
                      <p className="md:hidden text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1 truncate">
                        <Radio size={10} className="shrink-0 animate-pulse" /> {liveText}
                      </p>
                    </div>
                  </div>

                  {/* Right: 3D Glass Orb Action Bar (Zero bulky text labels!) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* 1. Live Floor Activity Orb (Desktop hover / Mobile tap) */}
                    <div className="hidden md:block">
                      <GlassActionOrb
                        icon={<Radio size={14} />}
                        tooltip={liveText}
                        subTooltip="Live Floor Status"
                        tone="emerald"
                        pulseDot="emerald"
                      />
                    </div>

                    {/* 2. Calendar & Shift Notes Orb (Pulsating Red Dot if agent has a pending request!) */}
                    <GlassActionOrb
                      icon={<Calendar size={14} />}
                      tooltip={`${agent.name}'s Calendar & Notes`}
                      subTooltip={hasPendingReq ? 'Action Required: Pending Time-Off!' : 'Inspect shifts & KPIs'}
                      tone="blue"
                      pulseDot={hasPendingReq ? 'red' : undefined}
                      onClick={() => { setCalendarInitialDay(null); setShowCalendar(agent.name); }}
                    />

                    {/* 3. Override Shift Orb */}
                    <GlassActionOrb
                      icon={<Edit2 size={14} />}
                      tooltip={`Override ${agent.name}'s Hours`}
                      subTooltip="Manager Shift Override"
                      tone="orange"
                      onClick={() => setEditingAgent(agent.name)}
                    />

                    {/* 4. Shift Schedule & Days Off Orb */}
                    <GlassActionOrb
                      icon={<Clock size={14} />}
                      tooltip={`Shift: ${shiftDays}`}
                      subTooltip={`Rest Days: ${restDays}`}
                      tone="amber"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {showCalendar && (
            <SmartCalendar
              agentName={showCalendar}
              role={role}
              initialSelectedDay={calendarInitialDay}
              onClose={() => { setShowCalendar(null); setCalendarInitialDay(null); }}
              onResolveRequest={() => handleResolveRequest(showCalendar)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- AGENT PERSONAL SCHEDULE VIEW ---
  return (
    <div className="relative z-10 flex flex-col gap-6">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-0.5">Shift Management ({activeStore.name})</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Locked schedule feeds daily dealership SLAs. Resets require Manager override.</p>
      </div>

      {(!hasSubmittedSchedule || isRequestingChange) ? (
        <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 sm:p-5 border border-orange-500/30">
          <div className="flex items-center gap-2.5 text-orange-500 mb-4">
            {isRequestingChange ? (
              <><Clock size={18} /><h4 className="font-bold text-sm">Request Shift Modification</h4></>
            ) : (
              <><AlertCircle size={18} /><h4 className="font-bold text-sm">Initial Schedule Setup Required</h4></>
            )}
          </div>

          {renderDayGrid()}

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
            {isRequestingChange ? (
              <>
                <SaveButton label={isSaving ? 'Submitting...' : 'Submit Request'} onClick={handleSaveSchedule} />
                <button
                  type="button"
                  onClick={() => setIsRequestingChange(false)}
                  className="w-full sm:w-auto py-2 px-4 text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </>
            ) : (
              <SaveButton label={isSaving ? 'Locking...' : 'Lock in Schedule'} onClick={handleSaveSchedule} />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Compact Locked Status Bar with Glass Orbs */}
          <div className="bg-white/50 dark:bg-black/25 rounded-2xl p-4 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 bg-radial-[at_30%_25%] from-emerald-400/40 to-emerald-950/60 border border-emerald-400/50 text-emerald-300 rounded-full flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">Schedule Locked</h4>
                  <Lock size={11} className="text-gray-400 shrink-0" />
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  Mon–Fri ({scheduleState['Monday'].start}–{scheduleState['Monday'].end})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <GlassActionOrb
                icon={<Calendar size={15} />}
                tooltip="Open Attendance & Vacation Calendar"
                tone="orange"
                pulseDot="orange"
                onClick={() => { setCalendarInitialDay(null); setShowCalendar('self'); }}
              />
              <GlassActionOrb
                icon={<Edit2 size={15} />}
                tooltip="Request Shift Hours Change"
                tone="neutral"
                onClick={() => setIsRequestingChange(true)}
              />
            </div>
          </div>

          {/* Synced Completed Shifts & Attendance Log */}
          <div className="pt-4 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Shift Ledger ({completedShiftsHistory.length})
              </h4>
              {completedShiftsHistory.length > 3 && (
                <button
                  type="button"
                  onClick={() => setExpandShifts(!expandShifts)}
                  className="text-xs font-bold text-orange-500 hover:text-orange-400 uppercase tracking-wider cursor-pointer"
                >
                  {expandShifts ? 'Recent (3)' : `All (${completedShiftsHistory.length})`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <AnimatePresence>
                {completedShiftsHistory.slice(0, expandShifts ? undefined : 3).map((shift) => {
                  const dayNum = Number(shift.dateKey.split('-')[2] || 1);
                  const isMissed = shift.status === 'missed';
                  return (
                    <motion.button
                      type="button"
                      key={shift.dateKey}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        setCalendarInitialDay(dayNum);
                        setShowCalendar('self');
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2 group ${
                        isMissed
                          ? 'bg-red-500/5 border-red-500/25 hover:border-red-500/50'
                          : 'bg-gray-50 dark:bg-white/4 border-gray-200 dark:border-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-black text-sm text-gray-900 dark:text-white">{shift.displayDate}</p>
                        <span className={`w-2.5 h-2.5 rounded-full ${isMissed ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'}`} />
                      </div>

                      <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                        {shift.note || shift.shiftHours}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-white/5">
                        <span className={isMissed ? 'text-red-400' : 'text-emerald-400'}>{shift.kpiScore}</span>
                        <span className="text-orange-400">Note &rarr;</span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCalendar && (
          <SmartCalendar
            agentName={showCalendar}
            role={role}
            initialSelectedDay={calendarInitialDay}
            onClose={() => { setShowCalendar(null); setCalendarInitialDay(null); }}
            onResolveRequest={() => handleResolveRequest('self')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 3. PAYROLL FORM (Owner Only for Disbursements; BDC/Sales for Personal Commission Tracker)
// ==========================================
export function PayrollForm({ role }: { role: UserRole }) {
  const { user } = useAuth();
  const isOwner = role === 'owner' || role === 'super_admin';
  const { activeStoreId, activeStore } = useStoreAppearance();
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white/60 p-5 dark:border-white/10 dark:bg-black/20">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payroll and commissions</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Payroll is not connected to live dealership or payment records yet. No sample earnings or payout amounts are shown.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number, forceUSD = false) => {
    if (!forceUSD && role === 'bdc') {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  if (isOwner) {
    const initialTeam = getVisibleStoreRoster(activeStoreId);

    const PAYROLL_DATA = initialTeam.map((emp: GlobalUser | StoreStaff) => {
      const wage = 'wage' in emp ? (emp.wage || 2800) : 2800;
      const dailyRate = wage / 30;
      const completedShifts = 14;
      const baseAccrued = Math.round(dailyRate * completedShifts);
      const commissions = emp.name === 'Andres Hernandez' ? 606 : 350;

      return {
        ...emp,
        baseAccrued,
        commissions,
        owed: baseAccrued + commissions,
        status: 'Pending'
      };
    });

    const totalPending = PAYROLL_DATA.reduce((sum, emp) => sum + emp.owed, 0);

    return (
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-200 dark:border-white/10 gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block mb-1">
              Owner Executive Ledger &bull; {activeStore.name}
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contractor Disbursements</h3>
          </div>
          <div className="text-left sm:text-right bg-white/50 dark:bg-black/20 px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/5 shrink-0">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Pending Run</p>
            <p className="text-xl font-black text-emerald-500">{formatCurrency(totalPending, true)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:hidden">
          {PAYROLL_DATA.map((emp) => {
            const isInstant = 'route' in emp && typeof emp.route === 'string' && emp.route.includes('Global');
            return (
              <div key={emp.name} className="p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{emp.name}</p>
                  <p className="font-mono font-black text-base text-emerald-400 mt-0.5">
                    {formatCurrency(emp.owed, true)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <GlassActionOrb
                    icon={isInstant ? <Globe size={14} /> : <Clock size={14} />}
                    tooltip={isInstant ? 'Global Instant Transfer' : '1-3 Business Days'}
                    tone={isInstant ? 'blue' : 'neutral'}
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/app/payroll-checkout', { state: { employee: emp } })}
                    className="min-h-9 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    Pay <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Team Member</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4 text-right">Owed</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {PAYROLL_DATA.map((emp) => (
                <tr key={emp.name} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">{emp.name}</div>
                    <div className="text-xs text-gray-500 uppercase">{emp.role}</div>
                  </td>
                  <td className="px-6 py-4">
                    <GlassActionOrb
                      icon={<Globe size={14} />}
                      tooltip="Global Instant Route"
                      tone="blue"
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                    {formatCurrency(emp.owed, true)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate('/app/payroll-checkout', { state: { employee: emp } })}
                      className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold rounded-xl transition-all border border-emerald-500/30 flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      Pay <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const payoutTotal = role === 'bdc' ? 1460000 : 2450;

  const metrics = role === 'bdc' ? [
    { label: 'Appointments Shown', count: '14 Shows', rate: '40,000 COP/ea', total: 560000, icon: <User size={16} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Appointments Sold', count: '4 Sold', rate: '100,000 COP/ea', total: 400000, icon: <Car size={16} />, color: 'text-blue-500', bg: 'bg-blue-500/10' }
  ] : [
    { label: 'Flats / Minimums', count: '4 Flats', rate: '$250/ea minimum', total: 1000, icon: <Car size={16} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Gross Profit Split', count: 'Front/Back', rate: '20% Margin', total: 1450, icon: <Target size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  ];

  const bonusTier = role === 'bdc' ? { current: 14, target: 20, reward: '200,000 COP', label: 'Shows' } : { current: 4, target: 10, reward: '$500 Volume Bonus', label: 'Cars Sold' };

  const mockLedger = role === 'bdc' ? [
    { date: 'Oct 6', customer: 'Gordon Freeman', type: 'Show', amount: 40000, status: 'Funded' },
    { date: 'Oct 4', customer: 'Alyx Vance', type: 'Sold', amount: 100000, status: 'Pending' },
  ] : [
    { date: 'Oct 6', customer: 'Gordon Freeman', type: 'Flat', amount: 250, status: 'Funded' },
    { date: 'Oct 4', customer: 'Alyx Vance', type: 'Gross %', amount: 840, status: 'Pending' },
  ];

  return (
    <div className="relative z-10 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-linear-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-center items-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><DollarSign size={64} /></div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1 z-10">Variable Payout</p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white z-10">{formatCurrency(payoutTotal)}</h2>
          <p className="text-[11px] text-emerald-400 font-bold mt-1.5 z-10">Oct 1 – Oct 15</p>
        </div>

        <div className="flex flex-col gap-3">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-gray-200 dark:border-white/10 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`${metric.bg} ${metric.color} p-2.5 rounded-xl shrink-0`}>{metric.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{metric.label}</p>
                  <p className="text-xs text-gray-500 truncate">{metric.count}</p>
                </div>
              </div>
              <p className="text-base font-black text-gray-900 dark:text-white shrink-0">{formatCurrency(metric.total)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-white/5">
        <div className="flex justify-between items-end gap-2 mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Next Bonus Tier</p>
            <p className="text-xs text-gray-500 mt-0.5">{bonusTier.target} {bonusTier.label} &rarr; {bonusTier.reward}</p>
          </div>
          <p className="text-base font-black text-orange-500 shrink-0">{bonusTier.current} / {bonusTier.target}</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
          <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(bonusTier.current / bonusTier.target) * 100}%` }} />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-white/10">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
          <FileText size={15} className="text-orange-400" /> Ledger
        </h3>

        <div className="grid grid-cols-1 gap-2.5">
          {mockLedger.map((row, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{row.customer}</p>
                <p className="text-xs text-gray-500 mt-0.5">{row.date} &bull; {row.type}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-400 text-sm">{formatCurrency(row.amount)}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${row.status === 'Funded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. SECURITY FORM
// ==========================================
export function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(''); setFeedback('');
    if (newPassword !== confirmPassword) { setError('The new passwords do not match.'); return; }
    setIsSaving(true);
    try {
      await apiRequest('/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setFeedback('Password updated. Use it the next time you sign in.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Password could not be updated.');
    } finally { setIsSaving(false); }
  };
  const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 dark:border-white/15 dark:bg-[#0a0f16] dark:text-white';
  return <form onSubmit={(event) => void changePassword(event)} className="relative z-10 flex max-w-xl flex-col gap-4">
    <div><h3 className="text-base font-semibold text-gray-900 dark:text-white">Account security</h3><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Change your password. EVEO checks your current password before saving.</p></div>
    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} /></label>
    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">New password<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} /><span className="mt-1 block font-normal text-gray-500">Use at least 12 characters.</span></label>
    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Confirm new password<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} /></label>
    {(error || feedback) && <p role={error ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2.5 text-xs ${error ? 'border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'}`}>{error || feedback}</p>}
    <button type="submit" disabled={isSaving} className="min-h-11 w-full rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60 sm:w-auto">{isSaving ? 'Updating…' : 'Update password'}</button>
  </form>;
}
