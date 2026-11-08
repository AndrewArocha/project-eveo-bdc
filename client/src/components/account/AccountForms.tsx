import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Camera, Mail, Smartphone, CheckCircle2, ChevronDown,
  Calendar, DollarSign, AlertCircle, Car, FileText, Target,
  Clock, Coffee, Globe, ArrowRight, Edit2, RotateCcw, Lock, Radio
} from 'lucide-react';

import SaveButton from './SaveButton';
import InputField from './InputField';
import SmartCalendar from './SmartCalendar';
import GlassActionOrb from '../UI/GlassActionOrb';

import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';

import {
  getStoreDataOrEmpty,
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
  const { role } = useAuth();
  const { getBanner, setBanner, activeStoreId, activeStoreDataKey, activeStore } = useStoreAppearance();

  const isOwner = role === 'owner' || role === 'super_admin';
  const isAdmin = role === 'manager' || isOwner;

  const initialBanner = getBanner(activeStoreId) || getBanner(activeStoreDataKey) || getStoreDataOrEmpty(activeStoreId).bannerUrl || '';

  const [storeBanner, setStoreBanner] = useState(initialBanner);
  const [workPhone, setWorkPhone] = useState('Ext. 104');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStoreBanner(getBanner(activeStoreId) || getBanner(activeStoreDataKey) || getStoreDataOrEmpty(activeStoreId).bannerUrl || '');
  }, [activeStoreId, activeStoreDataKey, getBanner]);

  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      if (isOwner) {
        setBanner(activeStoreId, storeBanner);
      }
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="relative z-10 flex flex-col gap-6">
      {isOwner && (
        <div className="bg-white/50 dark:bg-black/20 p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xs">
          <div className="flex justify-between items-center gap-2 mb-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{activeStore.name} Hub Banner</h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
              Owner
            </span>
          </div>

          <div className="relative w-full h-32 sm:h-40 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 group border border-gray-300 dark:border-white/10">
            <img src={storeBanner} alt={`${activeStore.name} Banner Preview`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <input
                id="store-banner-upload"
                name="store_banner_upload"
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                accept="image/*"
                aria-label="Upload store banner"
                className="hidden"
              />
              <GlassActionOrb
                icon={<Camera size={18} />}
                tooltip="Upload New Store Banner"
                tone="orange"
                size="lg"
                onClick={() => bannerInputRef.current?.click()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contact & Identity Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputField label="Full Name" name="full_name" defaultValue="Andres Hernandez" />
        <InputField label="Primary Email" name="primary_email" defaultValue="andres@dealership.com" type="email" />

        <PhoneVerificationField />

        <div className={`flex flex-col relative group ${!isAdmin ? 'opacity-75' : ''}`}>
          <label
            htmlFor="work-phone-ext"
            className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 transition-colors focus-within:text-orange-500 cursor-pointer"
          >
            <span>Work Phone (Net2Phone)</span>
            {isAdmin ? <span className="text-emerald-500">Admin</span> : <span className="text-orange-500">Locked</span>}
          </label>
          <div className="relative">
            <input
              id="work-phone-ext"
              name="work_phone_ext"
              type="text"
              value={workPhone}
              onChange={(e) => setWorkPhone(e.target.value)}
              disabled={!isAdmin}
              className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2.5 text-base sm:text-sm font-semibold text-gray-900 dark:text-white disabled:cursor-not-allowed outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200/60 dark:border-white/10 flex justify-end">
        <SaveButton label={isSaving ? 'Saving...' : 'Save Profile'} onClick={handleSaveProfile} />
      </div>
    </div>
  );
}

// ==========================================
// 2. SCHEDULE FORM (3D Glass Action Orbs + Hover/Tap Tooltips)
// ==========================================
export function ScheduleForm({ role }: { role: UserRole }) {
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
  };

  const [scheduleState, setScheduleState] = useState<WeeklySchedule>(() => {
    const saved = localStorage.getItem('eveo_user_schedule');
    return saved ? JSON.parse(saved) : defaultSchedule;
  });

  const [hasSubmittedSchedule, setHasSubmittedSchedule] = useState(() => {
    return localStorage.getItem('eveo_user_schedule') !== null;
  });

  const [isRequestingChange, setIsRequestingChange] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState<string | null>(null);
  const [calendarInitialDay, setCalendarInitialDay] = useState<number | null>(null);
  const [expandShifts, setExpandShifts] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);

  const [teamState, setTeamState] = useState<Array<GlobalUser | StoreStaff>>(() =>
    getVisibleStoreRoster(activeStoreId)
  );

  useEffect(() => {
    setTeamState(getVisibleStoreRoster(activeStoreId));
  }, [activeStoreId]);

  const [calendarRecords, setCalendarRecords] = useState<Record<string, ShiftDayRecord>>(() =>
    getOrSeedAgentCalendar(activeStoreDataKey, CURRENT_USER)
  );

  useEffect(() => {
    const refreshRecords = () => {
      setCalendarRecords(getOrSeedAgentCalendar(activeStoreDataKey, CURRENT_USER));
    };
    refreshRecords();
    window.addEventListener('eveo:calendar-updated', refreshRecords);
    return () => window.removeEventListener('eveo:calendar-updated', refreshRecords);
  }, [activeStoreDataKey, showCalendar]);

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

  const handleSaveSchedule = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('eveo_user_schedule', JSON.stringify(scheduleState));
      setHasSubmittedSchedule(true);
      setIsRequestingChange(false);
      setIsSaving(false);
    }, 600);
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
  const isOwner = role === 'owner' || role === 'super_admin';
  const { activeStoreId, activeStore } = useStoreAppearance();
  const navigate = useNavigate();

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
  return (
    <div className="relative z-10 flex flex-col gap-6">
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-3">
          <InputField label="Current Password" name="current_password" type="password" />
          <InputField label="New Password" name="new_password" type="password" />
        </div>
      </div>

      <div className="pt-5 border-t border-gray-200 dark:border-white/10">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Two-Factor Authentication (2FA)</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center"><Smartphone size={18} /></div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">Authenticator App</p>
                <p className="text-xs text-gray-500 truncate">Google Authenticator / Authy</p>
              </div>
            </div>
            <GlassActionOrb icon={<CheckCircle2 size={15} />} tooltip="2FA Active & Verified" tone="emerald" />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">Recovery Email</p>
                <p className="text-xs text-gray-500 truncate">backup@personal.com</p>
              </div>
            </div>
            <GlassActionOrb icon={<Edit2 size={14} />} tooltip="Update Recovery Email" tone="neutral" />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end"><SaveButton label="Update Security" /></div>
    </div>
  );
}

// ==========================================
// 5. PHONE VERIFICATION FIELD (With Explicit IDs & Labels)
// ==========================================
function PhoneVerificationField() {
  const [phone, setPhone] = useState("300 000 0000");
  const [isVerified, setIsVerified] = useState(true);

  return (
    <div className="flex flex-col relative group min-w-0">
      <label
        htmlFor="personal-sms-phone"
        className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-orange-500 cursor-pointer"
      >
        <span>Personal Phone (SMS)</span>
        {!isVerified && <span className="text-red-500">Unverified</span>}
      </label>
      <div className="relative flex items-center bg-transparent border-b border-gray-300 dark:border-white/20 py-1.5 transition-colors focus-within:border-orange-500">
        <div className="relative flex items-center text-gray-900 dark:text-white font-semibold pr-2 border-r border-gray-300 dark:border-white/20 mr-3 shrink-0">
          <select
            id="personal-phone-country"
            name="personal_phone_country"
            aria-label="Country code"
            className="bg-transparent appearance-none outline-none cursor-pointer pl-1 pr-5 py-1 text-base sm:text-sm z-10"
          >
            <option value="+1" className="text-black">🇺🇸 +1</option>
            <option value="+57" className="text-black">🇨🇴 +57</option>
          </select>
          <ChevronDown size={14} className="absolute right-0.5 pointer-events-none text-gray-400" />
        </div>
        <input
          id="personal-sms-phone"
          name="personal_sms_phone"
          type="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setIsVerified(false); }}
          className="flex-1 bg-transparent py-1 text-base sm:text-sm font-semibold text-gray-900 dark:text-white outline-none w-full min-w-0"
        />
        <div className="shrink-0 ml-2">
          {isVerified ? (
            <GlassActionOrb icon={<CheckCircle2 size={14} />} tooltip="SMS Phone Verified" tone="emerald" size="sm" />
          ) : (
            <button type="button" onClick={() => setIsVerified(true)} className="text-xs font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1 rounded-lg cursor-pointer">
              Verify
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
