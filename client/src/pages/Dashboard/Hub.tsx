import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, Clock, CalendarDays, TrendingUp } from 'lucide-react';
import defaultBanner from '../../images/defaultBanner.avif'; 
import DashboardCard from '../../components/UI/DashboardCard';
import ProgressCard from '../../components/UI/ProgressCard';
import HubModals from '../../components/UI/HubModals';
import { STORES, CURRENT_USER, type UserRole } from '../../data/mockDatabase';

type ExpandedCard = 'leads' | 'handoffs' | 'insights' | 'appts' | 'kpi' | 'followups' | null;

interface HomeProps {
  bannerImg?: string;
  homeBtnLogo?: string;
  dealershipName?: string;
}

export default function Hub({ bannerImg, homeBtnLogo, dealershipName = "Auto Dealership" }: HomeProps) {
  const [role, setRole] = useState<UserRole>('bdc');
  const [expanded, setExpanded] = useState<ExpandedCard>(null);
  const [activeStoreIdx, setActiveStoreIdx] = useState(0);
  
  const activeStore = STORES[activeStoreIdx];
  const displayBanner = bannerImg || defaultBanner;
  
  const glassClasses = `backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 border border-white/50 dark:border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1)]`;
  const kpiValue = role === 'bdc' ? 42 : role === 'sales' ? 65 : 82; 

  const handleStoreToggle = () => {
    if (role === 'bdc') setActiveStoreIdx((prev) => (prev + 1) % Math.min(STORES.length, 3));
  };

  return (
    <motion.div className="relative z-10 w-full h-full min-h-screen pb-32 md:pb-12 md:pl-28 overflow-x-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-white/10">
        {(['bdc', 'sales', 'manager'] as UserRole[]).map((r) => (
          <button key={r} onClick={() => { setRole(r); setExpanded(null); }} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${role === r ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-200 h-75 bg-orange-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Banner */}
      <section onClick={handleStoreToggle} className={`relative w-full h-[55vh] min-h-105 md:h-95 mb-8 md:mb-10 md:rounded-4xl overflow-hidden group md:mt-8 md:mx-8 md:w-[calc(100%-4rem)] max-w-6xl xl:mx-auto shadow-2xl dark:shadow-none ${role === 'bdc' ? 'cursor-pointer' : ''}`}>
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
              <DashboardCard layoutId="card-appts" title="Pending Confirmations" value="8" trend="Requires Action" titleColor="text-gray-500" icon={<CalendarDays size={14}/>} dotColor="bg-red-500" pingColor="bg-red-400" onClick={() => setExpanded('appts')} />
              <ProgressCard layoutId="card-kpi" title="Daily Activity KPI" percentage={kpiValue} trend="Goal: 250 Touches" onClick={() => setExpanded('kpi')} />
              <DashboardCard layoutId="card-followups" title="Urgent Follow-Ups" value="14" trend="> 15 mins unattended" titleColor="text-gray-500" icon={<Clock size={14}/>} dotColor="bg-red-500" pingColor="bg-red-400" onClick={() => setExpanded('followups')} />
            </>
          )}
          {role === 'sales' && (
            <>
              <DashboardCard layoutId="card-appts" title="Today's Appointments" value="4" trend="2 Pending Confirmation" titleColor="text-gray-500" icon={<CalendarDays size={14}/>} dotColor="bg-red-500" pingColor="bg-red-400" onClick={() => setExpanded('appts')} />
              <ProgressCard layoutId="card-kpi" title="Monthly Target" percentage={kpiValue} trend="On Pace" onClick={() => setExpanded('kpi')} />
              <DashboardCard layoutId="none" title="Closing Ratio" value="22%" trend="Top 30% of floor" titleColor="text-gray-500" icon={<TrendingUp size={14}/>} onClick={() => {}} />
            </>
          )}
          {role === 'manager' && (
            <>
              <ProgressCard layoutId="card-kpi" title="Store Conversion" percentage={kpiValue} trend="Lead-to-Show" onClick={() => setExpanded('kpi')} />
              <DashboardCard layoutId="none" title="BDC Response Time" value="4m 12s" trend="-30s from yesterday" titleColor="text-gray-500" icon={<Clock size={14}/>} onClick={() => {}} />
              <DashboardCard layoutId="none" title="Floor Response Time" value="1m 42s" trend="Excellent" titleColor="text-gray-500" icon={<Clock size={14}/>} onClick={() => {}} />
            </>
          )}
        </div>
      </div>

      {/* --- Expandable Modals Engine --- */}
      <AnimatePresence>
        {expanded && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExpanded(null)} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm pointer-events-auto" />
            <motion.div layoutId={`card-${expanded}`} className={`${glassClasses} w-full max-w-5xl h-[85vh] max-h-200 flex flex-col pointer-events-auto z-10 overflow-hidden shadow-2xl border border-white/50 dark:border-white/20 bg-white/90 dark:bg-[#0a0f16]/90 backdrop-blur-3xl`}>
              <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-white/40 dark:from-white/10 to-transparent pointer-events-none z-0" />
              <HubModals expanded={expanded} role={role} onClose={() => setExpanded(null)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}