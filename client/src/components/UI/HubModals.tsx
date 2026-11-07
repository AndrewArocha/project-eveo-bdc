// src/components/UI/HubModals.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  X, Search, Clock, UserCheck, Activity, Users, Car, Lock, Zap,
  XCircle, Smartphone, CalendarDays, Target, ExternalLink, ArrowRight,
  ArrowLeft, Phone, Sparkles, Plus, LoaderCircle
} from 'lucide-react';
import { MOCK_FOLLOWUPS, CURRENT_USER, STORE_DATA, type UserRole, type DealRecord } from '../../data/mockDatabase';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { StatBox } from '../reports/ReportStats';
import {
  hydrateStorePipeline,
  createStoreLeadAsync,
  confirmStoreAppointmentAsync,
} from '../../services/liveActivity/liveActivityStore';

interface HubModalsProps {
  expanded: string;
  role: UserRole;
  onClose: () => void;
  onOpenShowroom?: () => void;
}

export default function HubModals({ expanded, role, onClose, onOpenShowroom }: HubModalsProps) {
  const [kpiView, setKpiView] = useState<'overview' | 'sold' | 'pending'>('overview');
  const [leadSearch, setLeadSearch] = useState('');
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadVehicle, setNewLeadVehicle] = useState('');
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, setPipelineTick] = useState(0);

  const { activeStoreId, activeStore } = useStoreAppearance();

  useEffect(() => {
    hydrateStorePipeline(activeStoreId);
    const sync = () => setPipelineTick((t) => t + 1);
    window.addEventListener('eveo:pipeline-updated', sync);
    return () => window.removeEventListener('eveo:pipeline-updated', sync);
  }, [activeStoreId]);

  const activeStoreData = STORE_DATA[activeStoreId] || STORE_DATA['njx'];

  const storeLeads = activeStoreData.leads || [];
  const storeHandoffs = activeStoreData.handoffs || [];
  const storeAppts = activeStoreData.appointments || [];
  const storeSold = activeStoreData.sold || [];
  const storePending = activeStoreData.pending || [];

  const filteredLeads = storeLeads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.vehicle.toLowerCase().includes(leadSearch.toLowerCase())
  );

  const handleCreateLead = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadVehicle.trim()) return;
    setBusyId('create_lead');
    try {
      await createStoreLeadAsync(activeStoreId, {
        name: newLeadName,
        vehicle: newLeadVehicle,
        notes: newLeadNotes,
      });
      setNewLeadName('');
      setNewLeadVehicle('');
      setNewLeadNotes('');
      setIsAddingLead(false);
      setPipelineTick((t) => t + 1);
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmAppt = async (apptId: number | string) => {
    setBusyId(String(apptId));
    try {
      await confirmStoreAppointmentAsync(activeStoreId, apptId);
      setPipelineTick((t) => t + 1);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 select-none sm:select-auto">
      {/* Modal Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:p-6 md:p-8 border-b border-gray-200 dark:border-white/10 shrink-0">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-0.5">
            {activeStore.name}
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5 truncate">
            {expanded === 'leads' && <><Activity className="text-emerald-500 shrink-0" size={22} /> <span className="truncate">Recent Leads Pipeline ({storeLeads.length})</span></>}
            {expanded === 'handoffs' && <><Users className="text-orange-500 shrink-0" size={22} /> <span className="truncate">Live Showroom Lobby</span></>}
            {expanded === 'insights' && <><Sparkles className="text-purple-500 shrink-0" size={22} /> <span className="text-purple-500 truncate">AI Insights Engine</span></>}
            {expanded === 'appts' && <><CalendarDays className="text-blue-500 shrink-0" size={22} /> <span className="truncate">Appointment Desk</span></>}
            {expanded === 'kpi' && <><Target className="text-emerald-500 shrink-0" size={22} /> <span className="truncate">Performance Metrics</span></>}
            {expanded === 'followups' && <><Clock className="text-red-500 shrink-0" size={22} /> <span className="truncate">Urgent Follow-Ups</span></>}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {expanded === 'leads' && (
            <button
              type="button"
              onClick={() => setIsAddingLead((prev) => !prev)}
              className="min-h-9 flex items-center gap-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/35 px-3.5 py-2 text-xs font-bold text-orange-400 transition-all cursor-pointer"
            >
              <Plus size={14} /> {isAddingLead ? 'Cancel' : 'New Lead'}
            </button>
          )}

          {expanded === 'handoffs' && onOpenShowroom && (
            <button
              type="button"
              onClick={onOpenShowroom}
              className="min-h-10 flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <span className="hidden sm:inline">Open Full Showroom</span>
              <span className="sm:hidden">Showroom</span>
              <ArrowRight size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Modal Body */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-4 sm:p-6 md:p-8 bg-gray-50/50 dark:bg-black/20">

        {/* --- LEADS VIEW (With Async Persistent Lead Creator!) --- */}
        {expanded === 'leads' && (
          <div className="flex flex-col h-full">
            {isAddingLead && (
              <form
                onSubmit={(e) => void handleCreateLead(e)}
                className="mb-5 p-4 rounded-2xl bg-white dark:bg-[#0a0f16] border border-orange-500/35 space-y-3"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block">
                  Create Persistent CRM Lead ({activeStore.name})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    name="new_lead_name"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    required
                    placeholder="Customer Full Name *"
                    className="min-h-10 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-orange-500"
                  />
                  <input
                    name="new_lead_vehicle"
                    value={newLeadVehicle}
                    onChange={(e) => setNewLeadVehicle(e.target.value)}
                    required
                    placeholder="Vehicle of Interest *"
                    className="min-h-10 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-orange-500"
                  />
                  <input
                    name="new_lead_notes"
                    value={newLeadNotes}
                    onChange={(e) => setNewLeadNotes(e.target.value)}
                    placeholder="Initial Notes (optional)"
                    className="min-h-10 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={busyId === 'create_lead'}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    {busyId === 'create_lead' ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}
                    Save to Pipeline
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center gap-4 mb-4 sm:mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <input
                  name="hub_lead_search"
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search recent leads..."
                  className="w-full min-h-11 pl-10 pr-4 py-2.5 bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-xl text-base sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:hidden pb-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-4 rounded-2xl bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">{lead.name}</h4>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Car size={13} className="shrink-0 text-orange-500" />
                        <span className="truncate">{lead.vehicle}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 shrink-0">
                      {lead.status}
                    </span>
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/4 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 line-clamp-2">
                      {lead.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5 text-xs">
                    <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {lead.time}</span>
                      <span>&bull;</span>
                      <span>Rep: <strong className="text-gray-700 dark:text-gray-200">{lead.assignee}</strong></span>
                    </div>
                    <button type="button" className="flex items-center gap-1.5 text-orange-500 font-bold text-xs bg-orange-500/10 active:scale-95 px-3 py-1.5 rounded-lg transition-transform cursor-pointer">
                      <ExternalLink size={12} /> CRM
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Customer &amp; Notes</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assigned</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {lead.name}
                        <span className="block text-[10px] font-normal text-gray-500 mt-1 max-w-50 truncate">{lead.notes}</span>
                        <span className="block text-xs font-normal text-gray-500 mt-0.5"><Clock size={10} className="inline mr-1" />{lead.time}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.vehicle}</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400">{lead.status}</span></td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.assignee}</td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" className="flex items-center gap-1.5 ml-auto text-orange-500 hover:text-orange-600 font-bold text-xs bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors outline-none cursor-pointer">
                          <ExternalLink size={12} /> View CRM
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- URGENT FOLLOW UPS VIEW --- */}
        {expanded === 'followups' && (
          <div className="flex flex-col h-full gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Customers waiting longer than 15 minutes for a response.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pb-4">
              {MOCK_FOLLOWUPS.map((followup) => (
                <div key={followup.id} className="bg-white dark:bg-[#0a0f16] border border-red-500/30 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-red-500" />
                  <div className="pl-3 sm:pl-4">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{followup.name}</h3>
                      <span className="text-xs font-bold text-red-500 shrink-0">{followup.time}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 italic">
                      &ldquo;{followup.message}&rdquo;
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><UserCheck size={13} /> Rep: {followup.rep}</span>
                      <button type="button" className="min-h-9 flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 px-3.5 py-2 rounded-xl transition-all outline-none cursor-pointer">
                        <Smartphone size={14} /> Ping Agent
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- HANDOFFS / LOBBY VIEW --- */}
        {expanded === 'handoffs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pb-4">
            {storeHandoffs.map((handoff) => {
              const isCritical = parseInt(handoff.waitTime, 10) >= 4;
              const isAssignedToMe = handoff.rep === CURRENT_USER;
              return (
                <div key={handoff.id} className={`bg-white dark:bg-[#0a0f16] border ${isCritical ? 'border-red-500/50 shadow-red-500/10' : 'border-orange-500/30 shadow-orange-500/5'} rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden group`}>
                  <div className={`absolute top-0 left-0 w-1.5 sm:w-2 h-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                  <div className="pl-3 sm:pl-4">
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{handoff.name}</h3>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5 mt-1 truncate"><Car size={14} className="shrink-0" /> {handoff.vehicle}</p>
                      </div>
                      <span className={`${isCritical ? 'bg-red-500 text-white' : 'bg-orange-500/10 text-orange-500'} text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shrink-0`}>
                        {!isCritical && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" /></span>}
                        Waiting {handoff.waitTime}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {(role === 'manager' || role === 'owner') && (
                        <button type="button" onClick={onOpenShowroom} className="flex-1 min-h-11 min-w-30 flex items-center justify-center gap-2 bg-emerald-500 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl shadow-md cursor-pointer hover:bg-emerald-600 active:scale-[0.98] transition-all outline-none">
                          <UserCheck size={16} /> Override &amp; Take Up
                        </button>
                      )}
                      {role === 'bdc' && (
                        <button type="button" onClick={onOpenShowroom} className="flex-1 min-h-11 min-w-30 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:text-orange-500 text-xs sm:text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all cursor-pointer outline-none">
                          <Smartphone size={16} /> Page Rep ({handoff.rep})
                        </button>
                      )}
                      {role === 'sales' && !isCritical && isAssignedToMe && (
                        <button type="button" onClick={onOpenShowroom} className="flex-1 min-h-11 min-w-30 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl shadow-md cursor-pointer active:scale-[0.98] transition-all outline-none">
                          <UserCheck size={16} /> I&apos;ve Got Them
                        </button>
                      )}
                      {role === 'sales' && isCritical && !isAssignedToMe && (
                        <button type="button" onClick={onOpenShowroom} className="flex-1 min-h-11 min-w-30 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl shadow-md cursor-pointer active:scale-[0.98] transition-all outline-none">
                          <Zap size={16} /> Take Over Lead
                        </button>
                      )}
                      {role === 'sales' && !isCritical && !isAssignedToMe && (
                        <button type="button" disabled className="flex-1 min-h-11 min-w-30 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-400 text-xs sm:text-sm font-bold py-2.5 rounded-xl cursor-not-allowed border border-gray-200 dark:border-white/10">
                          <Lock size={16} /> Locked to {handoff.rep}
                        </button>
                      )}
                      {role === 'sales' && isCritical && isAssignedToMe && (
                        <button type="button" disabled className="flex-1 min-h-11 min-w-30 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 text-xs sm:text-sm font-bold py-2.5 rounded-xl cursor-not-allowed border border-red-500/20">
                          <XCircle size={16} /> Privilege Lost
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- APPOINTMENTS VIEW (With Async Persistent Confirmation!) --- */}
        {expanded === 'appts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pb-4">
            {storeAppts.map((appt) => (
              <div key={appt.id} className="bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{appt.name || appt.customer}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5 mt-1 truncate"><Car size={14} className="shrink-0" /> {appt.vehicle}</p>
                    </div>
                    <span className={`${appt.status === 'Pending Confirm' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'} text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest shrink-0`}>
                      {appt.status}
                    </span>
                  </div>
                  {appt.notes && (
                    <div className="mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 italic">&ldquo;{appt.notes}&rdquo;</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2.5 sm:gap-3">
                  <button type="button" className="flex-1 min-h-11 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all outline-none cursor-pointer">
                    <ExternalLink size={14} /> View CRM
                  </button>
                  {appt.status === 'Pending Confirm' ? (
                    <button
                      type="button"
                      disabled={busyId === String(appt.id)}
                      onClick={() => void handleConfirmAppt(appt.id)}
                      className="flex-1 min-h-11 flex items-center justify-center gap-2 bg-emerald-500 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all outline-none cursor-pointer"
                    >
                      {busyId === String(appt.id) ? <LoaderCircle size={15} className="animate-spin" /> : <UserCheck size={16} />}
                      Confirm
                    </button>
                  ) : (
                    <button type="button" disabled className="flex-1 min-h-11 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-400 text-xs sm:text-sm font-bold py-2.5 rounded-xl cursor-not-allowed">
                      Confirmed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- KPI DETAILS VIEW --- */}
        {expanded === 'kpi' && (
          <div className="flex flex-col h-full gap-6">
            {kpiView === 'overview' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-lg relative text-center">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-1.5">{role === 'bdc' ? 'Daily Outreach Summary' : 'Monthly Goal Progress'}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Detailed breakdown of your current metrics at {activeStore.name}.</p>

                <div className="grid grid-cols-1 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-8 w-full">
                  {role === 'bdc' ? (
                    <StatBox icon={<Phone className="text-blue-500" />} label="Outbound Calls" value="142" />
                  ) : (
                    <>
                      <StatBox icon={<Target className="text-orange-500" />} label="Target" value="20" />
                      <button type="button" onClick={() => setKpiView('sold')} className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 hover:bg-emerald-500/10 active:scale-[0.98] rounded-2xl shadow-inner border border-gray-200 dark:border-white/5 transition-all cursor-pointer outline-none min-w-36">
                        <div className="mb-2"><Car className="text-emerald-500 group-hover:scale-110 transition-transform" /></div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{storeSold.length}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Sold <ArrowRight size={10} className="inline" /></p>
                      </button>
                      <button type="button" onClick={() => setKpiView('pending')} className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 hover:bg-blue-500/10 active:scale-[0.98] rounded-2xl shadow-inner border border-gray-200 dark:border-white/5 transition-all cursor-pointer outline-none min-w-36">
                        <div className="mb-2"><Clock className="text-blue-500 group-hover:scale-110 transition-transform" /></div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{storePending.length}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Pending <ArrowRight size={10} className="inline" /></p>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {(kpiView === 'sold' || kpiView === 'pending') && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center gap-3">
                  <button type="button" onClick={() => setKpiView('overview')} className="p-2 bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all outline-none cursor-pointer">
                    <ArrowLeft size={16} />
                  </button>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                    {kpiView === 'sold' ? 'Sold Vehicles' : 'Pending Deals'}
                  </h3>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/5 md:hidden">
                  {(kpiView === 'sold' ? storeSold : storePending).map((deal: DealRecord) => (
                    <div key={deal.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{deal.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{deal.vehicle}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Rep: {deal.rep || CURRENT_USER}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {kpiView === 'sold' ? (
                          <span className="font-black text-emerald-500 text-sm">{deal.profit}</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500">
                            {deal.stage}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <table className="hidden md:table w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">{kpiView === 'sold' ? 'Gross / Date' : 'Stage'}</th>
                      <th className="px-6 py-4 text-right">Rep</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {(kpiView === 'sold' ? storeSold : storePending).map((deal: DealRecord) => (
                      <tr key={deal.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{deal.name}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{deal.vehicle}</td>
                        <td className="px-6 py-4">
                          {kpiView === 'sold' ? <span className="font-bold text-emerald-600">{deal.profit}</span> : <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600">{deal.stage}</span>}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300 font-medium">{deal.rep || CURRENT_USER}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}