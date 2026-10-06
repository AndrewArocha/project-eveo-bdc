// src/pages/Dashboard/Hub.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, UserCheck, Activity, Users, Car, Lock, Zap, XCircle, Smartphone, CalendarDays, Target, TrendingUp, Phone, Mail, MessageSquare, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';
import defaultBanner from '../../images/defaultBanner.avif'; 

type UserRole = 'bdc' | 'sales' | 'manager';
type ExpandedCard = 'leads' | 'handoffs' | 'insights' | 'appts' | 'kpi' | 'followups' | null;

interface HomeProps {
  bannerImg?: string;
  homeBtnLogo?: string;
  dealershipName?: string;
}

// --- Mock Data & Session ---
const CURRENT_USER = 'Sarah J.'; 

const MOCK_STORES = [
  { id: 1, name: 'Diamond', logo: 'DI' },
  { id: 2, name: 'NJ Auto Xchange', logo: 'NJ' },
  { id: 3, name: 'Drive On Eastchester', logo: 'DO' },
];

const MOCK_LEADS = [
  { id: 1, name: 'Sarah Connor', vehicle: '2024 Tesla Model 3', status: 'Contacted', time: '10 mins ago', assignee: 'Alex M.', notes: 'Looking to trade in a 2018 Camry.' },
  { id: 2, name: 'John Smith', vehicle: '2021 Ford F-150', status: 'New Lead', time: '15 mins ago', assignee: 'Unassigned', notes: 'Requested internet price.' },
  { id: 3, name: 'Maria Garcia', vehicle: '2023 Honda CR-V', status: 'Appt Set', time: '1 hour ago', assignee: 'Alex M.', notes: 'Coming in tomorrow at 2PM.' },
];

const MOCK_HANDOFFS = [
  { id: 101, name: 'Elena Rostova', vehicle: '2024 Kia Telluride', rep: 'Michael T.', waitTime: '4m', status: 'waiting' }, 
  { id: 102, name: 'Marcus Johnson', vehicle: '2020 Civic Type R', rep: 'Sarah J.', waitTime: '1m', status: 'waiting' },
];

const MOCK_APPTS = [
  { id: 201, name: 'Gordon Freeman', vehicle: '2024 Tesla Model Y', time: '1:00 PM', rep: 'Sarah J.', status: 'Pending Confirm', phone: '(555) 123-4567', notes: 'Needs financing options.' },
  { id: 202, name: 'Alyx Vance', vehicle: '2022 Honda Civic', time: '3:30 PM', rep: 'Michael T.', status: 'Confirmed', phone: '(555) 987-6543', notes: 'First time buyer.' },
];

const MOCK_FOLLOWUPS = [
  { id: 301, name: 'Robert Fox', time: '18 mins ago', rep: 'Sarah J.', message: 'Can we do 5PM instead?' },
  { id: 302, name: 'Jenny Wilson', time: '22 mins ago', rep: 'Alex M.', message: 'Does the 2021 model have Apple CarPlay?' },
];

const MOCK_SOLD = [
  { id: 401, name: 'Esther Howard', vehicle: '2024 Honda Accord', profit: '$2,400', date: 'Oct 2', rep: 'Sarah J.' },
  { id: 402, name: 'Guy Hawkins', vehicle: '2022 Ford F-150', profit: '$3,100', date: 'Oct 4', rep: 'Michael T.' },
];

const MOCK_PENDING = [
  { id: 501, name: 'Cody Fisher', vehicle: '2023 Tesla Model Y', stage: 'Financing', rep: 'Sarah J.' },
  { id: 502, name: 'Bessie Cooper', vehicle: '2021 Toyota RAV4', stage: 'Negotiation', rep: 'Sarah J.' },
];

export default function Hub({ bannerImg, homeBtnLogo, dealershipName = "Auto Dealership" }: HomeProps) {
  const [role, setRole] = useState<UserRole>('bdc');
  const [expanded, setExpanded] = useState<ExpandedCard>(null);
  
  // Drill-down state for the KPI Modal
  const [kpiView, setKpiView] = useState<'overview' | 'sold' | 'pending'>('overview');

  // Store Toggler State
  const [activeStoreIdx, setActiveStoreIdx] = useState(0);
  const activeStore = MOCK_STORES[activeStoreIdx];

  const displayBanner = bannerImg || defaultBanner;
  const glassClasses = `backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 border border-white/50 dark:border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1)]`;

  const kpiValue = role === 'bdc' ? 42 : role === 'sales' ? 65 : 82; 

  const handleStoreToggle = () => {
    if (role === 'bdc') {
      setActiveStoreIdx((prev) => (prev + 1) % Math.min(MOCK_STORES.length, 3));
    }
  };

  return (
    <motion.div className="relative z-10 w-full h-full min-h-screen pb-32 md:pb-12 md:pl-28 overflow-x-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-white/10">
        {(['bdc', 'sales', 'manager'] as UserRole[]).map((r) => (
          <button key={r} onClick={() => { setRole(r); setExpanded(null); setKpiView('overview'); }} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${role === r ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-200 h-75 bg-orange-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Banner with Store Toggler */}
      <section 
        onClick={handleStoreToggle}
        className={`relative w-full h-[55vh] min-h-105 md:h-95 mb-8 md:mb-10 md:rounded-4xl overflow-hidden group md:mt-8 md:mx-8 md:w-[calc(100%-4rem)] max-w-6xl xl:mx-auto shadow-2xl dark:shadow-none ${role === 'bdc' ? 'cursor-pointer' : ''}`}
      >
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: `url('${displayBanner}')` }} />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#05080c]/95 via-[#05080c]/60 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="max-w-xl">
              <span className="flex items-center gap-2 text-orange-500 font-bold tracking-wider text-[10px] md:text-xs uppercase mb-2 drop-shadow-md">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>
                System Online &bull; {CURRENT_USER}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white drop-shadow-lg">
                {role === 'bdc' ? 'BDC Command Center' : role === 'sales' ? 'Showroom Floor' : 'Dealership Overview'}
              </h1>
              <p className="text-gray-200 text-sm md:text-base font-medium drop-shadow-md leading-relaxed">
                {role === 'bdc' && "Your automated lead parsing is running. Click to switch active store."}
                {role !== 'bdc' && "Monitor real-time pipeline conversion, SLA breaches, and staff performance."}
              </p>
            </div>
            
            <button className="relative flex items-center p-1.5 pr-6 gap-4 rounded-full backdrop-blur-xl bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 shadow-lg hover:bg-white/30 dark:hover:bg-white/10 hover:-translate-y-0.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
              {homeBtnLogo ? (
                <div className="flex items-center justify-center bg-white rounded-full p-2 shrink-0 z-10 shadow-sm h-11 w-24"><img src={homeBtnLogo} alt={`${dealershipName} Logo`} className="h-full w-full object-contain" /></div>
              ) : (
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-200 text-black px-4 py-3 rounded-full text-[11px] font-extrabold tracking-tighter shrink-0 z-10 shadow-sm">{activeStore.logo} <span className="text-orange-600 ml-0.5">/</span> {role.toUpperCase()}</div>
              )}
              <span className="text-white font-semibold text-sm z-10 whitespace-nowrap drop-shadow-sm">{activeStore.name}</span>
            </button>
          </motion.div>
        </div>

        {/* Dynamic Pagination Dots */}
        {role === 'bdc' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {MOCK_STORES.slice(0, 3).map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeStoreIdx ? 'bg-orange-500 w-4' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </section>

      {/* --- Section 1: Universal Shared Overviews --- */}
      <div className="px-6 md:px-10 max-w-6xl mx-auto relative z-20 mb-10">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-500 dark:text-gray-400">Real-Time Action Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard layoutId="card-leads" title="Recent Leads" value="1,248" trend="+12% this week" titleColor="text-emerald-500" icon={<Activity size={14}/>} onClick={() => setExpanded('leads')} />
          <DashboardCard layoutId="card-handoffs" title="Live Showroom" value="2" trend="Waiting" titleColor="text-orange-500" icon={<Users size={14}/>} dotColor="bg-orange-500" pingColor="bg-orange-400" borderGlow="bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30 dark:border-orange-500/20" onClick={() => setExpanded('handoffs')} />
          <DashboardCard layoutId="card-insights" title="AI Assistant" value="3" trend="Insights" titleColor="text-purple-500" icon={<Activity size={14}/>} dotColor="bg-red-500" pingColor="bg-purple-400" onClick={() => setExpanded('insights')} />
        </div>
      </div>

      {/* --- Section 2: Role-Specific Workspace --- */}
      <div className="px-6 md:px-10 max-w-6xl mx-auto relative z-20">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-500 dark:text-gray-400">My Workspace</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {role === 'bdc' && (
            <>
              <DashboardCard layoutId="card-appts" title="Pending Confirmations" value="8" trend="Requires Action" titleColor="text-gray-500" icon={<Phone size={14}/>} dotColor="bg-red-500" pingColor="bg-red-400" onClick={() => setExpanded('appts')} />
              <ProgressCard layoutId="card-kpi" title="Daily Activity KPI" percentage={kpiValue} trend="Goal: 250 Touches" onClick={() => { setExpanded('kpi'); setKpiView('overview'); }} />
              <DashboardCard layoutId="card-followups" title="Urgent Follow-Ups" value="14" trend="> 15 mins unattended" titleColor="text-gray-500" icon={<Clock size={14}/>} dotColor="bg-red-500" pingColor="bg-red-400" onClick={() => setExpanded('followups')} />
            </>
          )}

          {role === 'sales' && (
            <>
              <DashboardCard layoutId="card-appts" title="Today's Appointments" value="4" trend="2 Pending Confirmation" titleColor="text-gray-500" icon={<CalendarDays size={14}/>} dotColor="bg-red-500" pingColor="bg-red-400" onClick={() => setExpanded('appts')} />
              <ProgressCard layoutId="card-kpi" title="Monthly Target" percentage={kpiValue} trend="On Pace" onClick={() => { setExpanded('kpi'); setKpiView('overview'); }} />
              <DashboardCard layoutId="none" title="Closing Ratio" value="22%" trend="Top 30% of floor" titleColor="text-gray-500" icon={<TrendingUp size={14}/>} onClick={() => {}} />
            </>
          )}

          {role === 'manager' && (
            <>
              <ProgressCard layoutId="card-kpi" title="Store Conversion" percentage={kpiValue} trend="Lead-to-Show" onClick={() => { setExpanded('kpi'); setKpiView('overview'); }} />
              <DashboardCard layoutId="none" title="BDC Response Time" value="4m 12s" trend="-30s from yesterday" titleColor="text-gray-500" icon={<Clock size={14}/>} onClick={() => {}} />
              <DashboardCard layoutId="none" title="Floor Response Time" value="1m 42s" trend="Excellent" titleColor="text-gray-500" icon={<Clock size={14}/>} onClick={() => {}} />
            </>
          )}
        </div>
      </div>

      {/* --- Expandable Modals --- */}
      <AnimatePresence>
        {expanded && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExpanded(null)} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm pointer-events-auto" />
            <motion.div layoutId={`card-${expanded}`} className={`${glassClasses} w-full max-w-5xl h-[85vh] max-h-200 flex flex-col pointer-events-auto z-10 overflow-hidden shadow-2xl border border-white/50 dark:border-white/20 bg-white/90 dark:bg-[#0a0f16]/90 backdrop-blur-3xl`}>
              <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-white/40 dark:from-white/10 to-transparent pointer-events-none z-0" />
              
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
                <button onClick={() => setExpanded(null)} className="p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
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
                    <div className="mt-auto pt-6 flex justify-end">
                      <button className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors outline-none focus-visible:text-orange-500">
                        View All Leads <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* --- URGENT FOLLOW UPS VIEW (BDC) --- */}
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
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 italic">
                              "{followup.message}"
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><UserCheck size={12}/> Rep: {followup.rep}</span>
                              <button onClick={() => console.log('Pinging', followup.rep)} className="flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
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
                  <div className="flex flex-col h-full gap-6">
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
                                {role === 'manager' && (
                                  <button className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer hover:bg-emerald-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><UserCheck size={16} /> Override & Take Up</button>
                                )}
                                {role === 'bdc' && (
                                  <>
                                    <button onClick={() => console.log('Page Rep')} className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-500 font-bold py-2.5 rounded-xl transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><Smartphone size={16} /> Page Rep</button>
                                    {isCritical && <button onClick={() => console.log('Alert Manager')} className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold py-2.5 rounded-xl border border-red-500/20 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Users size={16} /> Alert Managers</button>}
                                  </>
                                )}
                                {role === 'sales' && (
                                  <>
                                    {!isCritical && isAssignedToMe && <button className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><UserCheck size={16} /> I've Got Them</button>}
                                    {isCritical && !isAssignedToMe && <button className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md shadow-orange-500/20 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><Zap size={16} /> Take Over Lead</button>}
                                    {!isCritical && !isAssignedToMe && <button disabled className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-400 font-bold py-2.5 rounded-xl cursor-not-allowed border border-gray-200 dark:border-white/10"><Lock size={16} /> Locked to {handoff.rep}</button>}
                                    {isCritical && isAssignedToMe && <button disabled className="flex-1 min-w-30 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 font-bold py-2.5 rounded-xl cursor-not-allowed border border-red-500/20"><XCircle size={16} /> Privilege Lost</button>}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- APPOINTMENTS VIEW (Confirmations) --- */}
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

                          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                              <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Time</span>
                              <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Clock size={14} className="text-gray-400"/> {appt.time}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                              <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Phone</span>
                              <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Phone size={14} className="text-gray-400"/> {appt.phone}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold py-2 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><MessageSquare size={14}/> SMS</button>
                            <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold py-2 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Phone size={14}/> Call</button>
                        </div>
                        <div className="flex gap-3">
                           <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 font-bold py-2.5 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><ExternalLink size={14}/> View CRM</button>
                           {appt.status === 'Pending Confirm' ? (
                             <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-emerald-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><UserCheck size={16} /> Confirm</button>
                           ) : (
                             <button disabled className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-400 font-bold py-2.5 rounded-xl cursor-not-allowed border border-gray-200 dark:border-white/10">Confirmed</button>
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
                             <>
                               <StatBox icon={<Phone className="text-blue-500"/>} label="Outbound Calls" value="142" />
                               <StatBox icon={<MessageSquare className="text-emerald-500"/>} label="SMS Sent" value="84" />
                               <StatBox icon={<Mail className="text-orange-500"/>} label="Emails" value="23" />
                             </>
                           ) : (
                             <>
                               <StatBox icon={<Target className="text-orange-500"/>} label="Target" value="20" />
                               {/* Clickable StatBoxes for Drill Down */}
                               <button onClick={() => setKpiView('sold')} className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 rounded-2xl min-w-30 shadow-inner border border-gray-200 dark:border-white/5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                                 <div className="mb-2"><Car className="text-emerald-500 group-hover:scale-110 transition-transform"/></div>
                                 <p className="text-3xl font-black text-gray-900 dark:text-white">13</p>
                                 <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Sold <ArrowRight size={10} className="inline"/></p>
                               </button>
                               <button onClick={() => setKpiView('pending')} className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 hover:bg-blue-500/10 dark:hover:bg-blue-500/10 rounded-2xl min-w-30 shadow-inner border border-gray-200 dark:border-white/5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                 <div className="mb-2"><Clock className="text-blue-500 group-hover:scale-110 transition-transform"/></div>
                                 <p className="text-3xl font-black text-gray-900 dark:text-white">3</p>
                                 <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Pending <ArrowRight size={10} className="inline"/></p>
                               </button>
                             </>
                           )}
                         </div>

                         {/* Manager Specific Conversion Ratios */}
                         {role === 'manager' && (
                           <div className="flex flex-col gap-4 mt-10 w-full border-t border-gray-200 dark:border-white/10 pt-8">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 text-center">Store Conversion Ratios</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                 <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-white/5">
                                   <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Lead to Contact</span>
                                   <span className="text-lg font-black text-gray-900 dark:text-white">48%</span>
                                 </div>
                                 <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-white/5">
                                   <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Contact to Appt</span>
                                   <span className="text-lg font-black text-gray-900 dark:text-white">24%</span>
                                 </div>
                                 <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-white/5">
                                   <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Appt to Sold</span>
                                   <span className="text-lg font-black text-gray-900 dark:text-white">15%</span>
                                 </div>
                              </div>
                           </div>
                         )}
                      </motion.div>
                    )}

                    {/* KPI Drill Down Lists */}
                    {(kpiView === 'sold' || kpiView === 'pending') && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center gap-4">
                          <button onClick={() => setKpiView('overview')} className="p-2 bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><ArrowLeft size={16}/></button>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">{kpiView === 'sold' ? 'Sold Vehicles' : 'Pending Working Deals'}</h3>
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
                                  {kpiView === 'sold' ? (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{deal.profit} <span className="text-xs text-gray-500 ml-2 font-normal">{deal.date}</span></span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600">{deal.stage}</span>
                                  )}
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
                      <div className="w-24 h-24 mx-auto mb-6 bg-purple-500/10 rounded-full flex items-center justify-center border-2 border-purple-500/20 shadow-xl"><span className="text-4xl drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">✨</span></div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Assistant is sleeping...</h3>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProgressCard({ title, percentage, trend, onClick, layoutId }: { title: string, percentage: number, trend: string, onClick: () => void, layoutId: string }) {
  const getColors = (pct: number) => {
    if (pct <= 25) return { stroke: 'text-red-500', glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' };
    if (pct <= 50) return { stroke: 'text-orange-500', glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' };
    if (pct <= 75) return { stroke: 'text-yellow-400', glow: 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' };
    return { stroke: 'text-emerald-500', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' };
  };
  const colors = getColors(percentage);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    const timer = setTimeout(() => { setOffset(circumference - (percentage / 100) * circumference); }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  const glassClasses = `backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 border border-white/50 dark:border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6),inset_0_-5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1),inset_0_-5px_15px_rgba(0,0,0,0.2)]`;

  return (
    <motion.div layoutId={layoutId} onClick={onClick} className={`p-6 rounded-3xl flex flex-col justify-between min-h-40 relative overflow-hidden transition-all outline-none cursor-pointer hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-orange-500 group ${glassClasses}`}>
      <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none rounded-t-3xl" />
      <div className="flex justify-between items-start z-10 w-full h-full relative">
        <div className="flex flex-col justify-between h-full">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 drop-shadow-sm text-gray-500 dark:text-gray-400"><Target size={14}/> {title}</h3>
          <p className="text-xs font-bold tracking-wider drop-shadow-sm text-gray-500 dark:text-gray-400 mt-auto">{trend} <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-orange-500">Expand &rarr;</span></p>
        </div>
        <div className="relative w-21 h-21 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
             <circle cx="42" cy="42" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200 dark:text-white/10" />
             <circle cx="42" cy="42" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`transition-all duration-1000 ease-out ${colors.stroke} ${colors.glow}`} />
          </svg>
          <div className="absolute inset-2 rounded-full backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 flex items-center justify-center shadow-inner"><span className="text-base font-black text-gray-900 dark:text-white drop-shadow-md">{percentage}%</span></div>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardCard({ title, value, trend, titleColor = 'text-gray-500', icon, dotColor, pingColor, borderGlow, onClick, layoutId }: { title: string, value: string | number, trend: string, titleColor?: string, icon: React.ReactNode, dotColor?: string, pingColor?: string, borderGlow?: string, onClick: () => void, layoutId: string }) {
  const baseClasses = borderGlow || 'bg-white/40 dark:bg-[#0a0f16]/40 border-white/50 dark:border-white/10';
  const glassClasses = `backdrop-blur-xl border shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6),inset_0_-5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1),inset_0_-5px_15px_rgba(0,0,0,0.2)]`;
  const cursorStyle = layoutId === 'none' ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-orange-500 group';

  return (
    <motion.div {...(layoutId !== 'none' && { layoutId })} onClick={layoutId !== 'none' ? onClick : undefined} className={`p-6 rounded-3xl flex flex-col justify-between min-h-40 relative overflow-hidden transition-all outline-none ${glassClasses} ${baseClasses} ${cursorStyle}`}>
      <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none rounded-t-3xl" />
      {dotColor && (
        <div className="absolute top-5 right-5 flex h-2.5 w-2.5 z-10">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor || dotColor}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`}></span>
        </div>
      )}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 z-10 drop-shadow-sm ${titleColor}`}>{icon} {title}</h3>
        <p className="text-3xl font-black text-gray-900 dark:text-white mb-4 z-10 drop-shadow-md">{value}</p>
      </div>
      <p className="text-xs font-bold tracking-wider z-10 flex items-center justify-between drop-shadow-sm text-gray-500 dark:text-gray-400">
        {trend} {layoutId !== 'none' && <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">Expand &rarr;</span>}
      </p>
    </motion.div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 rounded-2xl min-w-30 shadow-inner border border-gray-200 dark:border-white/5">
      <div className="mb-2">{icon}</div><p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p><p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{label}</p>
    </div>
  );
}