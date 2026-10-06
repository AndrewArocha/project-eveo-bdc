import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageSquare, User, Activity, TrendingUp, Target, Car, Clock, Mail, ArrowLeft, ExternalLink, Users } from 'lucide-react';
import RevolverOrb from '../../components/UI/RevolverOrb';
import AppointmentModal from '../../components/UI/AppointmentModal';
import { StatBox, ClickableStatBox, RatioBox } from '../../components/UI/ReportStats';
import { NextAppointmentCard, MasterScheduleCard } from '../../components/UI/ScheduleCards';

type UserRole = 'bdc' | 'sales' | 'manager';
type ViewState = 'store-selection' | 'dashboard';
type ExpandedModal = 'next' | 'lead' | 'agent' | 'conv' | 'sold' | 'pending' | null;

interface Store {
  id: string;
  name: string;
  logoText: string;
  bgImage: string;
}

// --- Mock Data ---
const CURRENT_USER = 'Sarah J.';

const STORES: Store[] = [
  { id: 'njx', name: 'NJ Auto Xchange', logoText: 'NJX', bgImage: 'from-[#1e3a8a]/20 to-[#0f172a]/80' },
  { id: 'dk', name: 'DK Auto Imports', logoText: 'DK', bgImage: 'from-[#7f1d1d]/20 to-[#000000]/80' },
  { id: 'kia', name: 'Northstar Kia', logoText: 'KIA', bgImage: 'from-[#374151]/20 to-[#4c0519]/80' }
];

const MOCK_SOLD = [
  { id: 401, name: 'Esther Howard', vehicle: '2024 Honda Accord', profit: '$2,400', date: 'Oct 2', rep: 'Sarah J.' },
  { id: 402, name: 'Guy Hawkins', vehicle: '2022 Ford F-150', profit: '$3,100', date: 'Oct 4', rep: 'Michael T.' },
];

const MOCK_PENDING = [
  { id: 501, name: 'Cody Fisher', vehicle: '2023 Tesla Model Y', stage: 'Financing', rep: 'Sarah J.' },
  { id: 502, name: 'Bessie Cooper', vehicle: '2021 Toyota RAV4', stage: 'Negotiation', rep: 'Sarah J.' },
];

const MOCK_AGENT_STATS = [
  { rep: 'Sarah J.', calls: 65, sms: 42, emails: 12, showroom: 5 },
  { rep: 'Erick', calls: 45, sms: 28, emails: 8, showroom: 4 },
  { rep: 'Michael T.', calls: 32, sms: 14, emails: 3, showroom: 3 }
];

const ALL_REPORTS = [
  { id: 'agent', label: 'Agent KPI', value: '85%', progress: 85, color: 'from-gray-800 to-black', ring: 'border-gray-700' },
  { id: 'lead', label: 'Lead KPI', value: null, color: 'from-gray-800 to-black', ring: 'border-gray-700' },
  { id: 'conv', label: 'Conversion Ratios', value: null, color: 'from-gray-800 to-black', ring: 'border-gray-700' },
  { id: 'sold', label: 'Sold Cars', value: '15/20', progress: 75, color: 'from-orange-950 to-black', ring: 'border-orange-500/50' },
  { id: 'pending', label: 'Pending Deals', value: '8', color: 'from-blue-950 to-black', ring: 'border-blue-500/50' },
];

export default function Reports() {
  const [role, setRole] = useState<UserRole>('bdc');
  const [viewState, setViewState] = useState<ViewState>('store-selection');
  const [activeStoreIndex, setActiveStoreIndex] = useState(1);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  
  const [expanded, setExpanded] = useState<ExpandedModal>(null);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [agentView, setAgentView] = useState<'overview' | 'calls' | 'sms' | 'emails' | 'showroom'>('overview');

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setViewState('dashboard');
  };

  const handleBack = () => {
    setViewState('store-selection');
    setSelectedStore(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && viewState === 'dashboard') {
            handleBack();
            return;
        }
        if (viewState === 'store-selection') {
            if (e.key === 'ArrowRight') setActiveStoreIndex((prev) => (prev + 1) % STORES.length);
            if (e.key === 'ArrowLeft') setActiveStoreIndex((prev) => (prev === 0 ? STORES.length - 1 : prev - 1));
            if (e.key === 'Enter') handleStoreSelect(STORES[activeStoreIndex]);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, activeStoreIndex]);

  const getSortedReports = () => {
    const rMap = new Map(ALL_REPORTS.map(r => [r.id, r]));
    const order = role === 'bdc' 
      ? ['agent', 'lead', 'conv', 'pending', 'sold']
      : role === 'sales' 
      ? ['sold', 'pending', 'agent', 'conv', 'lead']
      : ['conv', 'sold', 'lead', 'agent', 'pending'];
    return order.map(id => rMap.get(id)!);
  };
  
  const sortedReports = getSortedReports();
  const isOrbModal = ['agent', 'lead', 'conv', 'sold', 'pending'].includes(expanded || '');

  const closeExpanded = () => {
    setExpanded(null);
    setAgentView('overview');
  };

  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden flex flex-col font-sans md:pl-28 bg-gray-50 dark:bg-[#05080c]">
      
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-white/10">
        {(['bdc', 'sales', 'manager'] as UserRole[]).map((r) => (
          <button key={r} onClick={() => { setRole(r); closeExpanded(); }} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${role === r ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}>
            {r}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewState === 'store-selection' && (
          <motion.div key="stores" className="h-full w-full flex flex-col items-center justify-center pt-20 pb-32 absolute inset-0" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5 }}>
            <div className="absolute top-10 left-12 md:left-40 z-20">
              <h1 className="text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-none">Reports</h1>
            </div>

            <div className="flex items-center justify-center w-full max-w-6xl px-4 overflow-visible h-96 relative perspective-1000">
              <AnimatePresence mode="popLayout">
                {STORES.map((store, index) => {
                  const isActive = index === activeStoreIndex;
                  const offset = index - activeStoreIndex;

                  let visualOffset = offset;
                  if (offset > 1) visualOffset = -1;
                  if (offset < -1) visualOffset = 1;

                  const absOffset = Math.abs(visualOffset);

                  return (
                    <motion.div
                      key={store.id}
                      layoutId={`store-${store.id}`}
                      onClick={() => handleStoreSelect(store)}
                      className="absolute flex flex-col items-center cursor-pointer outline-none group w-64 md:w-80"
                      animate={{ x: visualOffset * 300, scale: isActive ? 1 : 0.75, opacity: isActive ? 1 : 0.3, zIndex: 10 - absOffset }}
                      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                    >
                      <motion.div
                        className={`
                          relative w-full aspect-square rounded-full overflow-hidden transition-all duration-500
                          backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/10
                          shadow-[0_20px_40px_rgba(0,0,0,0.1),inset_0_1px_10px_rgba(255,255,255,0.4),inset_0_-10px_20px_rgba(0,0,0,0.05)]
                          dark:shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_10px_rgba(255,255,255,0.1),inset_0_-10px_20px_rgba(0,0,0,0.2)]
                          group-hover:shadow-[0_20px_50px_rgba(249,115,22,0.15),inset_0_1px_15px_rgba(255,255,255,0.6),inset_0_-10px_20px_rgba(0,0,0,0.1)]
                        `}
                      >
                        <div className={`absolute inset-0 bg-linear-to-br ${store.bgImage} opacity-30 mix-blend-overlay`} />
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[75%] h-[35%] bg-linear-to-b from-white/30 dark:from-white/10 to-transparent rounded-[100%] pointer-events-none" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-2xl">
                          <span className="font-black text-4xl md:text-6xl text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                            {store.logoText}
                          </span>
                          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest mt-2 bg-black/30 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                            {store.name}
                          </span>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {viewState === 'dashboard' && selectedStore && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full pb-32">
            
            <div className="w-full pt-12 flex flex-col items-center justify-center relative z-20">
              <button 
                onClick={handleBack}
                className="w-20 h-20 rounded-full border border-gray-700 bg-linear-to-b from-gray-800/50 to-black flex items-center justify-center shadow-xl mb-4 hover:scale-105 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-orange-500 group"
                title="Switch Store"
              >
                <span className="text-xl font-black text-white tracking-widest drop-shadow-md group-hover:text-orange-500 transition-colors">{selectedStore.logoText}</span>
              </button>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 drop-shadow-sm">{selectedStore.name}</h2>
            </div>

            <div className="px-6 md:px-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center lg:items-start min-h-[60vh] mt-8">
              
              {/* --- LEFT COLUMN: The Revolver Orbs --- */}
              <div className="relative w-full lg:w-1/2 h-125 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.3))' }}>
                  <path d="M 100 100 C 250 150, 350 350, 150 450" fill="transparent" stroke="url(#orange-gradient)" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
                  <defs>
                    <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#9ca3af" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#9ca3af" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="relative w-full h-full z-10">
                  {sortedReports.map((report, idx) => {
                    const isCenter = idx === 0;
                    const positions = [
                      { top: '40%', left: '45%', scale: 1.2 }, 
                      { top: '15%', left: '20%', scale: 0.8 }, 
                      { top: '75%', left: '25%', scale: 0.8 }, 
                      { top: '25%', left: '70%', scale: 0.7 }, 
                      { top: '85%', left: '60%', scale: 0.7 }, 
                    ];
                    
                    return (
                      <RevolverOrb 
                        key={report.id}
                        report={report}
                        pos={positions[idx]}
                        isCenter={isCenter}
                        layoutId={isOrbModal ? `orb-${report.id}` : undefined}
                        onClick={() => setExpanded(report.id as ExpandedModal)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* --- RIGHT COLUMN: Dashboard Cards --- */}
              <div className="w-full lg:w-1/2 flex flex-col gap-6 z-10 pt-8">
                
                <NextAppointmentCard onClick={() => setExpanded('next')} />
                <MasterScheduleCard onClick={() => setIsApptModalOpen(true)} />

              </div>
            </div>

            {/* --- EXPANDABLE ORB MODALS --- */}
            <AnimatePresence>
              {expanded && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden pointer-events-none">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeExpanded} className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-auto" />
                  
                  <motion.div layoutId={isOrbModal ? `orb-${expanded}` : `modal-${expanded}`} className="w-full max-w-4xl h-[80vh] max-h-200 flex flex-col pointer-events-auto z-10 overflow-hidden shadow-2xl border border-white/10 bg-[#0a0f16]/95 backdrop-blur-3xl rounded-3xl relative">
                    
                    <div className="relative z-10 flex items-center justify-between p-6 md:p-8 border-b border-white/10">
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        {expanded === 'agent' && <><Target className="text-emerald-500" /> Agent KPIs (Effort Metrics)</>}
                        {expanded === 'lead' && <><Activity className="text-orange-500" /> Lead Visibility</>}
                        {expanded === 'conv' && <><TrendingUp className="text-blue-500" /> Conversion Ratios</>}
                        {expanded === 'sold' && <><Car className="text-emerald-500" /> Sold Vehicles</>}
                        {expanded === 'pending' && <><Clock className="text-blue-500" /> Pending Deals</>}
                        {expanded === 'next' && <><User className="text-orange-500" /> Appointment Details</>}
                      </h2>
                      <button onClick={closeExpanded} className="p-2 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-black/20">
                      
                      {/* 1. AGENT KPI (Effort) with Drill Downs */}
                      {expanded === 'agent' && (
                        <div className="flex flex-col h-full gap-6">
                           {agentView === 'overview' ? (
                             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                               <ClickableStatBox icon={<Phone className="text-blue-500"/>} label="Calls Made" value="142" onClick={() => setAgentView('calls')} />
                               <ClickableStatBox icon={<MessageSquare className="text-emerald-500"/>} label="SMS Sent" value="84" onClick={() => setAgentView('sms')} />
                               <ClickableStatBox icon={<Mail className="text-orange-500"/>} label="Emails" value="23" onClick={() => setAgentView('emails')} />
                               <ClickableStatBox icon={<Users className="text-purple-500"/>} label="Showroom" value="12" onClick={() => setAgentView('showroom')} />
                             </motion.div>
                           ) : (
                             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-[#0a0f16] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-4">
                                  <button onClick={() => setAgentView('overview')} className="p-2 bg-black border border-white/10 rounded-lg hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><ArrowLeft size={16}/></button>
                                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">
                                    {agentView === 'calls' ? 'Outbound Calls' : agentView === 'sms' ? 'SMS Sent' : agentView === 'emails' ? 'Emails' : 'Showroom Handled'}
                                  </h3>
                                </div>
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                  <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                    <tr><th className="px-6 py-4">Rep</th><th className="px-6 py-4 text-right">Volume Generated</th></tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {MOCK_AGENT_STATS.map(stat => (
                                      <tr key={stat.rep} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2"><User size={14} className="text-gray-500"/> {stat.rep}</td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-400 text-lg">{stat[agentView]}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                             </motion.div>
                           )}
                        </div>
                      )}

                      {/* 2. LEAD KPI (Visibility) */}
                      {expanded === 'lead' && (
                         <div className="flex flex-col gap-6">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <StatBox icon={<Activity className="text-orange-500"/>} label="Total Leads (Month)" value="1,248" />
                             <StatBox icon={<Clock className="text-blue-500"/>} label="Avg Response Time" value="4m 12s" />
                             <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl shadow-inner border border-white/5">
                               <div className="mb-2"><User className="text-emerald-500"/></div>
                               <p className="text-xl font-black text-white text-center">Sarah Connor</p>
                               <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Last Contacted (10m ago)</p>
                             </div>
                           </div>
                         </div>
                      )}

                      {/* 3. CONVERSION RATIOS */}
                      {expanded === 'conv' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RatioBox label="Contact Ratio" value="48%" sub="Leads that responded" />
                            <RatioBox label="Show Ratio" value="68%" sub="Appointments that arrived" />
                            <RatioBox label="Lead to Delivery" value="8%" sub="Total leads to sold" />
                            <RatioBox label="Inventory to Delivery" value="45%" sub="Turnover rate" />
                         </div>
                      )}

                      {/* 4. SOLD CARS */}
                      {expanded === 'sold' && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                              <tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">Gross / Date</th><th className="px-6 py-4 text-right">Rep</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {MOCK_SOLD.map(deal => (
                                <tr key={deal.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4 font-bold text-white">{deal.name}</td>
                                  <td className="px-6 py-4 text-gray-400">{deal.vehicle}</td>
                                  <td className="px-6 py-4 font-bold text-emerald-400">{deal.profit} <span className="text-xs text-gray-500 ml-2 font-normal">{deal.date}</span></td>
                                  <td className="px-6 py-4 text-right text-gray-300 font-medium">{deal.rep || CURRENT_USER}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 5. PENDING DEALS */}
                      {expanded === 'pending' && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                              <tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">Stage</th><th className="px-6 py-4 text-right">Rep</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {MOCK_PENDING.map(deal => (
                                <tr key={deal.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4 font-bold text-white">{deal.name}</td>
                                  <td className="px-6 py-4 text-gray-400">{deal.vehicle}</td>
                                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400">{deal.stage}</span></td>
                                  <td className="px-6 py-4 text-right text-gray-300 font-medium">{deal.rep || CURRENT_USER}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 6. NEXT APPT DEEP DIVE */}
                      {expanded === 'next' && (
                        <div className="flex flex-col h-full">
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <h1 className="text-4xl font-black text-white mb-2">Alex Mercer</h1>
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-lg">Confirmed Arrival</span>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-black text-orange-500">2:30 PM</p>
                                <p className="text-sm font-bold text-gray-400 mt-1">Today</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Vehicle of Interest</span>
                                <span className="font-bold text-white text-lg">2024 Mazda CX-5</span>
                              </div>
                              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Assigned Rep</span>
                                <span className="font-bold text-white text-lg">Erick</span>
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <button className="flex-1 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-emerald-500/30 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Phone size={16}/> Call Customer</button>
                              <button className="flex-1 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-blue-500/30 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><MessageSquare size={16}/> Send SMS</button>
                              <button className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><ExternalLink size={16}/> Open in CRM</button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      <AppointmentModal 
        isOpen={isApptModalOpen} 
        onClose={() => setIsApptModalOpen(false)} 
      />
    </div>
  );
}