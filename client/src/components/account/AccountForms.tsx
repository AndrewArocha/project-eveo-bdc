import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Mail, Smartphone, CheckCircle2, ChevronDown, Calendar, DollarSign, AlertCircle, Car, FileText, Target, Clock, Coffee, Globe, ArrowRight, Edit2, RotateCcw } from 'lucide-react';

import SaveButton from './SaveButton';
import InputField from './InputField';
import SmartCalendar from './SmartCalendar';

import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';

// Pull from the new SaaS Database structure
import { MOCK_COMPLETED_SHIFTS, STORE_DATA, EVEO_GLOBAL_TEAM } from '../../data/mockDatabase';
import { type UserRole, type GlobalUser, type StoreStaff } from '../../types';

// ==========================================
// 1. PROFILE FORM (With Store Context & Avatar Sync)
// ==========================================
export function ProfileForm() {
  const { role } = useAuth();
  const { getBanner, setBanner } = useStoreAppearance();

  const isOwner = role === 'owner' || role === 'super_admin';
  const isAdmin = role === 'manager' || isOwner;

  const ACTIVE_STORE_ID = 'njx';

  const initialBanner = getBanner(ACTIVE_STORE_ID) || STORE_DATA[ACTIVE_STORE_ID].bannerUrl || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=2000';

  const [storeBanner, setStoreBanner] = useState(initialBanner);
  const [avatarImg, setAvatarImg] = useState<string | null>(localStorage.getItem('eveo_avatar'));
  const [workPhone, setWorkPhone] = useState('Ext. 104');
  const [isSaving, setIsSaving] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      if (isOwner) {
        setBanner(ACTIVE_STORE_ID, storeBanner);
      }

      if (avatarImg) {
        localStorage.setItem('eveo_avatar', avatarImg);
        window.dispatchEvent(new Event('avatarUpdated'));
      }

      console.log('Profile Saved!');
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="relative z-10 flex flex-col gap-8">
      {isOwner && (
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm mb-2">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Store Branding</h3>
              <p className="text-xs text-gray-500 mt-1">Customize the dealership banner seen by your team.</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">Owner Access</span>
          </div>

          <div className="relative w-full h-32 md:h-48 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 group border border-gray-300 dark:border-white/10">
            <img src={storeBanner} alt="Store Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />
              <button onClick={() => bannerInputRef.current?.click()} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl backdrop-blur-md font-bold transition-all hover:scale-105 outline-none cursor-pointer">
                <Camera size={18} /> Upload New Banner
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 pb-8 border-b border-gray-200 dark:border-white/10">
        <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
          <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

          <div className="w-24 h-24 rounded-full bg-linear-to-br from-orange-400 to-orange-600 shadow-lg flex items-center justify-center text-white text-3xl font-black overflow-hidden border-2 border-white/20 relative">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-white/30 rounded-[100%] pointer-events-none z-20" />

            {avatarImg ? (
              <img src={avatarImg} alt="Profile" className="w-full h-full object-cover relative z-10" />
            ) : (
              <span className="relative z-10">AH</span>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 z-30 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform outline-none cursor-pointer">
            <Camera size={14} />
          </button>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Andres Hernandez</h3>
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mt-1">{role.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        <InputField label="Full Name" defaultValue="Andres Hernandez" />
        <InputField label="Primary Email" defaultValue="andres@dealership.com" type="email" />

        <PhoneVerificationField />

        <div className={`flex flex-col relative group ${!isAdmin ? 'opacity-75' : ''}`}>
          <label className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors focus-within:text-orange-500">
            <span>Work Phone (Net2Phone)</span>
            {isAdmin ? <span className="text-emerald-500">Admin Editable</span> : <span className="text-orange-500">Managed by Admin</span>}
          </label>
          <div className="relative">
            <input type="text" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} disabled={!isAdmin} className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2 text-base font-semibold text-gray-900 dark:text-white disabled:cursor-not-allowed outline-none focus:border-orange-500 transition-colors" />
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <SaveButton label={isSaving ? 'Saving...' : 'Save Profile'} onClick={handleSaveProfile} />
      </div>
    </div>
  );
}

// ==========================================
// 2. SCHEDULE FORM
// ==========================================
export function ScheduleForm({ role }: { role: UserRole }) {
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
  const [expandShifts, setExpandShifts] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);

  const initialTeam = (role === 'manager' || role === 'owner') ? STORE_DATA['njx'].staff : EVEO_GLOBAL_TEAM;
  const [teamState, setTeamState] = useState<Array<GlobalUser | StoreStaff>>(initialTeam);

  const isManager = role === 'manager' || role === 'owner';

  const handleResolveRequest = (agentName: string) => {
    setTeamState((prev: Array<GlobalUser | StoreStaff>) => prev.map((agent: GlobalUser | StoreStaff) =>
      agent.name === agentName ? { ...agent, pendingRequest: false } : agent
    ));
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

  // 🌟 NEW: Wipe data for testers and recycled accounts
  const handleResetSchedule = (target: string) => {
    if (target === 'manager_self' || target === 'self') {
      localStorage.removeItem('eveo_user_schedule');
      setScheduleState(defaultSchedule);
      setHasSubmittedSchedule(false);
      setIsRequestingChange(false);
      setEditingAgent(null);
    } else {
      // If a manager resets a team member, just close the pane (since team members are currently mock static data)
      setEditingAgent(null);
    }
  };

  const renderDayGrid = () => (
    <div className="grid grid-cols-1 gap-4 mb-4">
      {Object.keys(defaultSchedule).map(day => (
        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 gap-2">
          <span className="font-semibold text-gray-900 dark:text-white w-24 text-sm">{day}</span>
          <div className="flex gap-2 items-center">
            <select
              value={scheduleState[day].start}
              onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
              className="bg-transparent border border-gray-300 dark:border-white/20 rounded-lg px-2 py-1 text-xs font-bold outline-none text-gray-900 dark:text-white transition-colors focus:border-orange-500"
            >
              <option>8:00 AM</option>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>OFF</option>
            </select>
            <span className="text-gray-500 text-xs">to</span>
            <select
              value={scheduleState[day].end}
              onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
              className="bg-transparent border border-gray-300 dark:border-white/20 rounded-lg px-2 py-1 text-xs font-bold outline-none text-gray-900 dark:text-white transition-colors focus:border-orange-500"
            >
              <option>4:00 PM</option>
              <option>5:00 PM</option>
              <option>6:00 PM</option>
              <option>7:00 PM</option>
              <option>OFF</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );

  // --- MANAGER & OWNER TEAM VIEW ---
  if (isManager) {
    return (
      <div className="relative z-10 flex flex-col gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Team Schedule Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Review agent schedules, verify completed shifts, and track requested days off.</p>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3">My Schedule (Manager)</h4>

          {editingAgent === 'manager_self' ? (
            <div className="bg-orange-500/5 p-5 rounded-2xl border border-orange-500/30 flex flex-col gap-4 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit2 size={16} className="text-orange-500" /> {hasSubmittedSchedule ? 'Edit My Schedule' : 'Initialize Schedule'}
                </span>
                <div className="flex items-center gap-4">
                  {/* 🌟 NEW: The Reset Button */}
                  {hasSubmittedSchedule && (
                    <button onClick={() => handleResetSchedule('manager_self')} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors outline-none cursor-pointer">
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setEditingAgent(null)} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white outline-none cursor-pointer">Cancel</button>
                    <button onClick={() => { handleSaveSchedule(); setEditingAgent(null); }} className="text-xs font-bold bg-orange-500 text-white px-4 py-2 rounded-lg outline-none cursor-pointer shadow-md hover:bg-orange-600">
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
              {renderDayGrid()}
            </div>
          ) : (
            // 🌟 NEW: Managers now see a warning if their schedule isn't initialized!
            <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row justify-between lg:items-center gap-4 ${hasSubmittedSchedule ? 'bg-orange-500/5 border-orange-500/20' : 'bg-red-500/5 border-red-500/30 shadow-lg'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${hasSubmittedSchedule ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'}`}>
                  <User size={18} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">My Account</p>
                  {hasSubmittedSchedule ? (
                    <p className="text-xs text-gray-500 mt-0.5">Today: {scheduleState['Monday'].start} - {scheduleState['Monday'].end}</p>
                  ) : (
                    <p className="text-xs text-red-500 font-bold mt-0.5 flex items-center gap-1"><AlertCircle size={12} /> Initial Setup Required</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasSubmittedSchedule ? (
                  <>
                    <button onClick={() => setShowCalendar('manager_self')} className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
                      <Calendar size={14} /> See Details
                    </button>
                    <button onClick={() => setEditingAgent('manager_self')} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
                      <Edit2 size={14} /> Edit
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-orange-500/10 text-orange-600 cursor-default"><Clock size={14} /> Mon - Fri</div>
                    <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-teal-500/10 text-teal-600 cursor-default"><Coffee size={14} /> Sat & Sun</div>
                  </>
                ) : (
                  <button onClick={() => setEditingAgent('manager_self')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors outline-none cursor-pointer">
                    <Edit2 size={14} /> Initialize Schedule
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-white/10">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Team Directory</h4>
          <div className="flex flex-col gap-4 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
            {teamState.map((agent: GlobalUser | StoreStaff) => (
              editingAgent === agent.name ? (
                <div key={`edit-${agent.name}`} className="bg-white/80 dark:bg-black/40 p-5 rounded-2xl border border-orange-500/50 flex flex-col gap-4 shadow-lg relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Edit2 size={16} className="text-orange-500" /> Editing {agent.name}'s Schedule
                    </span>
                    <div className="flex items-center gap-4">
                      {/* 🌟 NEW: The Reset Button for Teammates */}
                      <button onClick={() => handleResetSchedule(agent.name)} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors outline-none cursor-pointer">
                        <RotateCcw size={12} /> Reset
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingAgent(null)} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white outline-none cursor-pointer">Cancel</button>
                        <button onClick={() => setEditingAgent(null)} className="text-xs font-bold bg-orange-500 text-white px-4 py-2 rounded-lg outline-none cursor-pointer shadow-md hover:bg-orange-600">Save</button>
                      </div>
                    </div>
                  </div>
                  {renderDayGrid()}
                </div>
              ) : (
                <div key={agent.name} className="bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col lg:flex-row justify-between lg:items-center gap-4 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center"><User size={18} /></div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{agent.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Today: 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setShowCalendar(agent.name)} className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer">
                      {('pendingRequest' in agent && agent.pendingRequest) && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse" />}
                      <Calendar size={14} /> See Details
                    </button>

                    <button onClick={() => setEditingAgent(agent.name)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
                      <Edit2 size={14} /> Edit
                    </button>

                    <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-orange-500/10 text-orange-600 cursor-default"><Clock size={14} /> {agent.schedule || 'Variable'}</div>
                    {'daysOff' in agent && <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-teal-500/10 text-teal-600 cursor-default"><Coffee size={14} /> {agent.daysOff}</div>}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showCalendar && (
            <SmartCalendar
              agentName={showCalendar}
              role={role}
              onClose={() => setShowCalendar(null)}
              onResolveRequest={() => handleResolveRequest(showCalendar)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- AGENT PERSONAL SCHEDULE VIEW ---
  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Shift Management</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Your schedule feeds directly into the daily dealership KPI targets.</p>
      </div>

      {(!hasSubmittedSchedule || isRequestingChange) ? (
        <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-6 border border-orange-500/30">

          <div className="flex items-center gap-3 text-orange-500 mb-6">
            {isRequestingChange ? (
              <><Clock size={20} /><h4 className="font-bold">Request Schedule Change</h4></>
            ) : (
              <><AlertCircle size={20} /><h4 className="font-bold">Initial Schedule Setup Required</h4></>
            )}
          </div>

          {renderDayGrid()}

          <div className="flex items-center gap-4 mt-4">
            {isRequestingChange ? (
              <>
                <SaveButton label={isSaving ? 'Submitting...' : 'Submit Request'} onClick={handleSaveSchedule} />
                <button
                  onClick={() => setIsRequestingChange(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors outline-none cursor-pointer"
                >
                  Cancel
                </button>
              </>
            ) : (
              <SaveButton label={isSaving ? 'Saving...' : 'Lock in Schedule'} onClick={handleSaveSchedule} />
            )}
          </div>
        </div>
      ) : (

        <div className="flex flex-col gap-6">
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-6 border border-gray-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 shrink-0 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 size={24} /></div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Schedule Locked</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Mon-Fri ({scheduleState['Monday'].start}-{scheduleState['Monday'].end}),
                  Sat ({scheduleState['Saturday'].start}-{scheduleState['Saturday'].end})
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">Active</span>

              <div className="flex gap-3 mt-1">
                {/* 🌟 NEW: Tester/User Reset Button */}
                <button
                  onClick={() => handleResetSchedule('self')}
                  className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest outline-none cursor-pointer"
                >
                  <RotateCcw size={10} /> Reset
                </button>
                <button
                  onClick={() => setIsRequestingChange(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-orange-500 transition-colors uppercase tracking-widest outline-none cursor-pointer"
                >
                  <Edit2 size={10} /> Edit
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-white/10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Schedule Tracking</h3>
              <button onClick={() => setShowCalendar('self')} className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors outline-none cursor-pointer">
                See Detailed Schedule +
              </button>
            </div>

            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Completed Shifts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {MOCK_COMPLETED_SHIFTS.slice(0, expandShifts ? undefined : 3).map((shift, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={i} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5 relative overflow-hidden shadow-sm">
                    {shift.overtime && <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse" />}
                    <p className="font-bold text-gray-900 dark:text-white">{shift.date}</p>
                    <p className="text-xs text-gray-500 mt-1">{shift.hours}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 inline-block px-2 py-0.5 rounded ${shift.status === 'COMPLETE' ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-600 bg-red-500/10'}`}>{shift.status}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {MOCK_COMPLETED_SHIFTS.length > 3 && (
              <button onClick={() => setExpandShifts(!expandShifts)} className="mt-4 text-xs font-bold text-gray-500 hover:text-orange-500 transition-colors uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded px-1 self-start cursor-pointer">
                {expandShifts ? "Show Less" : `View All (${MOCK_COMPLETED_SHIFTS.length})`}
              </button>
            )}
          </div>
        </div>
      )}
      <AnimatePresence>
        {showCalendar && (
          <SmartCalendar
            agentName={showCalendar}
            role={role}
            onClose={() => setShowCalendar(null)}
            onResolveRequest={() => handleResolveRequest('self')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 3. PAYROLL FORM
// ==========================================
export function PayrollForm({ role }: { role: UserRole }) {
  const isManager = role === 'manager' || role === 'owner';
  const navigate = useNavigate();

  const formatCurrency = (amount: number, forceUSD = false) => {
    if (!forceUSD && role === 'bdc') {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  if (isManager) {
    const initialTeam = (role === 'manager' || role === 'owner') ? STORE_DATA['njx'].staff : EVEO_GLOBAL_TEAM;

    const PAYROLL_DATA = initialTeam.map((emp: GlobalUser | StoreStaff) => {
      const wage = 'wage' in emp ? (emp.wage || 0) : 0;
      const dailyRate = wage / 30;
      const completedShifts = 14;
      const baseAccrued = dailyRate * completedShifts;
      const commissions = emp.name === 'Andres Hernandez' ? 606666 : 150000;

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
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 pb-6 border-b border-gray-200 dark:border-white/10 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Contractor Disbursements</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review pending BDC commissions and initiate zero-delay global transfers.</p>
          </div>
          <div className="text-left sm:text-right bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 shrink-0">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Pending Run</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPending, true)}</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-125">
            <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Team Member</th>
                <th className="px-6 py-4">Payout Route</th>
                <th className="px-6 py-4 text-right">Amount Owed</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {PAYROLL_DATA.map((emp) => (
                <tr key={emp.name} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">{emp.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{emp.role}</div>
                  </td>
                  <td className="px-6 py-4">
                    {('route' in emp && typeof emp.route === 'string' && emp.route.includes('Global')) ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded w-fit border border-blue-500/20">
                        <Globe size={12} /> Instant Transfer
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-white/5 px-2.5 py-1 rounded w-fit">
                        <Clock size={12} /> 1-3 Business Days
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(emp.owed, true)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate('/app/payroll-checkout', { state: { employee: emp } })}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-xs font-bold rounded-lg transition-all border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-end gap-1.5 ml-auto outline-none cursor-pointer"
                    >
                      Issue Payment <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-4">
          <Globe className="text-orange-500 shrink-0 mt-0.5" size={20} />
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-white">EVEO Global Pay is active.</strong> International team members mapped to "Global Instant" will receive funds in their local currency immediately, bypassing traditional 3-day holding periods and wire fees.
          </p>
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
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Private Commission Tracker</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Track your real-time earnings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-linear-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 rounded-3xl p-8 flex flex-col justify-center items-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><DollarSign size={64} /></div>
          <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-2 z-10">Variable Payout</p>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white z-10">{formatCurrency(payoutTotal)}</h2>
          <p className="text-xs text-emerald-600 font-bold mt-2 z-10">Period: Oct 1 - Oct 15</p>
        </div>

        <div className="flex flex-col gap-4">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200 dark:border-white/10 flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`${metric.bg} ${metric.color} p-2 rounded-lg shrink-0`}>{metric.icon}</div>
                <div><p className="text-sm font-bold text-gray-900 dark:text-white">{metric.label}</p><p className="text-xs text-gray-500">{metric.count} ({metric.rate})</p></div>
              </div>
              <p className="text-lg font-black text-gray-900 dark:text-white shrink-0">{formatCurrency(metric.total)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/5">
        <div className="flex justify-between items-end mb-4">
          <div><p className="text-sm font-bold text-gray-900 dark:text-white">Next Bonus Tier</p><p className="text-xs text-gray-500 mt-1">{bonusTier.target} {bonusTier.label} required for {bonusTier.reward}</p></div>
          <p className="text-lg font-black text-orange-500">{bonusTier.current} / {bonusTier.target}</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-white/10 h-3 rounded-full overflow-hidden">
          <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(bonusTier.current / bonusTier.target) * 100}%` }} />
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText size={18} className="text-gray-400" /> Commission Ledger
        </h3>
        <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-125">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4 text-right">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {mockLedger.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4 text-gray-500">{row.date}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{row.customer}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.type}</td>
                  <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(row.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${row.status === 'Funded' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
          <InputField label="Current Password" type="password" />
          <InputField label="New Password" type="password" />
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Two-Factor Authentication (2FA)</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center"><Smartphone size={20} /></div>
              <div><p className="font-bold text-gray-900 dark:text-white">Authenticator App</p><p className="text-xs text-gray-500">Use Google Authenticator or Authy</p></div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0">Enabled</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-500 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div><p className="font-bold text-gray-900 dark:text-white">Recovery Email</p><p className="text-xs text-gray-500">backup@personal.com</p></div>
            </div>
            <button className="text-xs font-bold self-start sm:self-auto text-gray-500 hover:text-orange-500 transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded px-1">Edit</button>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end"><SaveButton label="Update Security" /></div>
    </div>
  );
}

// ==========================================
// 5. PHONE VERIFICATION FIELD
// ==========================================
function PhoneVerificationField() {
  const [phone, setPhone] = useState("300 000 0000");
  const [isVerified, setIsVerified] = useState(true);

  return (
    <div className="flex flex-col relative group">
      <label className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-orange-500">
        <span>Personal Phone (SMS)</span>{!isVerified && <span className="text-red-500">Verification Required</span>}
      </label>
      <div className="relative flex items-center bg-transparent border-b border-gray-300 dark:border-white/20 py-1 transition-colors focus-within:border-orange-500">
        <div className="relative flex items-center text-gray-900 dark:text-white font-semibold pr-2 border-r border-gray-300 dark:border-white/20 mr-3">
          <select className="bg-transparent appearance-none outline-none cursor-pointer pl-1 pr-6 py-1 z-10"><option value="+1" className="text-black">🇺🇸 +1</option><option value="+57" className="text-black">🇨🇴 +57</option></select>
          <ChevronDown size={14} className="absolute right-1 pointer-events-none text-gray-400" />
        </div>
        <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setIsVerified(false); }} className="flex-1 bg-transparent py-1 text-base font-semibold text-gray-900 dark:text-white outline-none w-full min-w-0" />
        <div className="shrink-0 ml-2">
          {isVerified ? <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg"><CheckCircle2 size={14} /> Verified</span> : <button className="text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg">Send OTP</button>}
        </div>
      </div>
    </div>
  );
}