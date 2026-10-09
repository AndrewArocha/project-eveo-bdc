import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Clock, UserCheck, Activity, Users, Car, Lock, Zap, XCircle, Smartphone, CalendarDays, Target, ExternalLink, ArrowRight, ArrowLeft, Phone } from 'lucide-react';
import { MOCK_LEADS, MOCK_FOLLOWUPS, MOCK_HANDOFFS, MOCK_APPTS, MOCK_SOLD, MOCK_PENDING, CURRENT_USER, type UserRole  } from '../../data/mockDatabase';
import StatBox from './StatBox';

interface HubModalsProps {
  expanded: string;
  role: UserRole;
  onClose: () => void;
}

export default function HubModals({ expanded, role, onClose }: HubModalsProps) {
  const [kpiView, setKpiView] = useState<'overview' | 'sold' | 'pending'>('overview');

  return (
    <div className="flex flex-col h-full">
      <div className="relative z-10 flex items-center justify-between p-6 md:p-8 border-b border-gray-200 dark:border-white/10">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            {expanded === 'leads' && <><Activity className="text-emerald-500" /> Recent Leads Pipeline</>}
            {expanded === 'handoffs' && <><Users className="text-orange-500" /> Live Showroom Lobby</>}
            {expanded === 'insights' && <span className="text-purple-500 flex items-center gap-2">✨ AI Insights Engine</span>}
            {expanded === 'appts' && <><CalendarDays className="text-blue-500" /> Appointment Desk</>}
            {expanded === 'kpi' && <><Target className="text-emerald-500" /> Performance Metrics</>}
            {expanded === 'followups' && <><Clock className="text-red-500" /> Urgent Follow-Ups</>}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
          <X size={20} />
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-gray-50/50 dark:bg-black/20">
        
        {/* --- LEADS VIEW --- */}
        {expanded === 'leads' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Search recent leads..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors" />
              </div>
            </div>
            <div className="bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr><th className="px-6 py-4">Customer & Notes</th><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Assigned</th><th className="px-6 py-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {MOCK_LEADS.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {lead.name}
                        <span className="block text-[10px] font-normal text-gray-500 mt-1 max-w-50 truncate">{lead.notes}</span>
                        <span className="block text-xs font-normal text-gray-500 mt-0.5"><Clock size={10} className="inline mr-1"/>{lead.time}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.vehicle}</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400">{lead.status}</span></td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.assignee}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="flex items-center gap-1.5 ml-auto text-orange-500 hover:text-orange-600 font-bold text-xs bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                          <ExternalLink size={12}/> View CRM
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
          <div className="flex flex-col h-full gap-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Customers waiting longer than 15 minutes for a response.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_FOLLOWUPS.map((followup) => (
                <div key={followup.id} className="bg-white dark:bg-[#0a0f16] border border-red-500/30 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
                  <div className="pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{followup.name}</h3>
                      <span className="text-xs font-bold text-red-500">{followup.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 italic">"{followup.message}"</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><UserCheck size={12}/> Rep: {followup.rep}</span>
                      <button className="flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors outline-none">
                        <Smartphone size={14}/> Ping Agent
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_HANDOFFS.map((handoff) => {
              const isCritical = parseInt(handoff.waitTime) >= 4;
              const isAssignedToMe = handoff.rep === CURRENT_USER;
              return (
                <div key={handoff.id} className={`bg-white dark:bg-[#0a0f16] border ${isCritical ? 'border-red-500/50 shadow-red-500/10' : 'border-orange-500/30 shadow-orange-500/5'} rounded-2xl p-6 shadow-lg relative overflow-hidden group`}>
                  <div className={`absolute top-0 left-0 w-2 h-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                  <div className="pl-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{handoff.name}</h3>
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mt-1"><Car size={14}/> {handoff.vehicle}</p>
                      </div>
                      <span className={`${isCritical ? 'bg-red-500 text-white' : 'bg-orange-500/10 text-orange-600'} text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5`}>
                        {!isCritical && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>}
                        Waiting {handoff.waitTime}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {role === 'manager' && <button className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer hover:bg-emerald-600 transition-colors outline-none"><UserCheck size={16} /> Override & Take Up</button>}
                      {role === 'bdc' && <button className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:text-orange-500 font-bold py-2.5 rounded-xl transition-colors cursor-pointer outline-none"><Smartphone size={16} /> Page Rep</button>}
                      {role === 'sales' && !isCritical && isAssignedToMe && <button className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition-colors outline-none"><UserCheck size={16} /> I've Got Them</button>}
                      {role === 'sales' && isCritical && !isAssignedToMe && <button className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition-colors outline-none"><Zap size={16} /> Take Over Lead</button>}
                      {role === 'sales' && !isCritical && !isAssignedToMe && <button disabled className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-400 font-bold py-2.5 rounded-xl cursor-not-allowed border border-gray-200 dark:border-white/10"><Lock size={16} /> Locked to {handoff.rep}</button>}
                      {role === 'sales' && isCritical && isAssignedToMe && <button disabled className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 font-bold py-2.5 rounded-xl cursor-not-allowed border border-red-500/20"><XCircle size={16} /> Privilege Lost</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- APPOINTMENTS VIEW --- */}
        {expanded === 'appts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_APPTS.map((appt) => (
              <div key={appt.id} className="bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{appt.name}</h3>
                      <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mt-1"><Car size={14}/> {appt.vehicle}</p>
                    </div>
                    <span className={`${appt.status === 'Pending Confirm' ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'} text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest`}>
                      {appt.status}
                    </span>
                  </div>
                  <div className="mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                     <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{appt.notes}"</p>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold py-2.5 rounded-xl transition-colors outline-none"><ExternalLink size={14}/> View CRM</button>
                   {appt.status === 'Pending Confirm' ? (
                     <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-emerald-600 transition-colors outline-none"><UserCheck size={16} /> Confirm</button>
                   ) : (
                     <button disabled className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-400 font-bold py-2.5 rounded-xl cursor-not-allowed">Confirmed</button>
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
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg relative">
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{role === 'bdc' ? 'Daily Outreach Summary' : 'Monthly Goal Progress'}</h3>
                 <p className="text-gray-500 mb-8">Detailed breakdown of your current metrics.</p>
                 
                 <div className="flex flex-wrap justify-center gap-8 w-full">
                   {role === 'bdc' ? (
                     <><StatBox icon={<Phone className="text-blue-500"/>} label="Outbound Calls" value="142" /></>
                   ) : (
                     <>
                       <StatBox icon={<Target className="text-orange-500"/>} label="Target" value="20" />
                       <button onClick={() => setKpiView('sold')} className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 hover:bg-emerald-500/10 rounded-2xl shadow-inner border border-gray-200 dark:border-white/5 transition-colors cursor-pointer outline-none">
                         <div className="mb-2"><Car className="text-emerald-500 group-hover:scale-110 transition-transform"/></div>
                         <p className="text-3xl font-black text-gray-900 dark:text-white">13</p>
                         <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Sold <ArrowRight size={10} className="inline"/></p>
                       </button>
                       <button onClick={() => setKpiView('pending')} className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 hover:bg-blue-500/10 rounded-2xl shadow-inner border border-gray-200 dark:border-white/5 transition-colors cursor-pointer outline-none">
                         <div className="mb-2"><Clock className="text-blue-500 group-hover:scale-110 transition-transform"/></div>
                         <p className="text-3xl font-black text-gray-900 dark:text-white">3</p>
                         <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Pending <ArrowRight size={10} className="inline"/></p>
                       </button>
                     </>
                   )}
                 </div>
              </motion.div>
            )}

            {(kpiView === 'sold' || kpiView === 'pending') && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center gap-4">
                  <button onClick={() => setKpiView('overview')} className="p-2 bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors outline-none"><ArrowLeft size={16}/></button>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">{kpiView === 'sold' ? 'Sold Vehicles' : 'Pending Deals'}</h3>
                </div>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">{kpiView === 'sold' ? 'Gross / Date' : 'Stage'}</th><th className="px-6 py-4 text-right">Rep</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {(kpiView === 'sold' ? MOCK_SOLD : MOCK_PENDING).map((deal: any) => (
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

        {/* --- INSIGHTS VIEW --- */}
        {expanded === 'insights' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-purple-500/10 rounded-full flex items-center justify-center border-2 border-purple-500/20 shadow-xl"><span className="text-4xl">✨</span></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Assistant is sleeping...</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}