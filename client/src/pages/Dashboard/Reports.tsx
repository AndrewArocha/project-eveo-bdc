import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Activity, TrendingUp, Car, Clock, User, CheckCircle2 } from 'lucide-react';
import RevolverOrb from '../../components/reports/RevolverOrb';
import AppointmentModal from '../../components/reports/AppointmentModal';
import { NextAppointmentCard, MasterScheduleCard } from '../../components/reports/ScheduleCards';
import { AgentKPIModal, LeadVisibilityModal, ConversionRatiosModal, SoldVehiclesModal, CustomerDeepDiveModal } from '../../components/reports/OrbModals';
import { STORES, ALL_REPORTS, type UserRole } from '../../data/mockDatabase';

type ViewState = 'store-selection' | 'dashboard';
type ExpandedModal = 'next' | 'lead' | 'agent' | 'conv' | 'sold' | 'pending' | null;

export default function Reports() {
  const [role, setRole] = useState<UserRole>('bdc');
  const [viewState, setViewState] = useState<ViewState>('store-selection');
  const [activeStoreIndex, setActiveStoreIndex] = useState(1);
  const [selectedStore, setSelectedStore] = useState<typeof STORES[0] | null>(null);
  
  const [expanded, setExpanded] = useState<ExpandedModal>(null);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleStoreSelect = (store: typeof STORES[0]) => {
    setSelectedStore(store);
    setViewState('dashboard');
  };

  const handleBack = () => {
    setViewState('store-selection');
    setSelectedStore(null);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && viewState === 'dashboard') return handleBack();
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

  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden flex flex-col font-sans md:pl-28 bg-gray-50 dark:bg-[#05080c]">
      
      {/* Developer Role Toggler */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-white/10">
        {(['bdc', 'sales', 'manager'] as UserRole[]).map((r) => (
          <button key={r} onClick={() => { setRole(r); setExpanded(null); }} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${role === r ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}>
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
                  const visualOffset = offset > 1 ? -1 : offset < -1 ? 1 : offset;
                  const absOffset = Math.abs(visualOffset);

                  return (
                    <motion.div key={store.id} layoutId={`store-${store.id}`} onClick={() => handleStoreSelect(store)} className="absolute flex flex-col items-center cursor-pointer outline-none group w-64 md:w-80" animate={{ x: visualOffset * 300, scale: isActive ? 1 : 0.75, opacity: isActive ? 1 : 0.3, zIndex: 10 - absOffset }} transition={{ type: 'spring', stiffness: 250, damping: 25 }}>
                      <motion.div className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.1),inset_0_1px_10px_rgba(255,255,255,0.4),inset_0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_10px_rgba(255,255,255,0.1),inset_0_-10px_20px_rgba(0,0,0,0.2)] group-hover:shadow-[0_20px_50px_rgba(249,115,22,0.15),inset_0_1px_15px_rgba(255,255,255,0.6),inset_0_-10px_20px_rgba(0,0,0,0.1)]">
                        <div className={`absolute inset-0 bg-linear-to-br ${store.bgImage} opacity-30 mix-blend-overlay`} />
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[75%] h-[35%] bg-linear-to-b from-white/30 dark:from-white/10 to-transparent rounded-[100%] pointer-events-none" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-2xl">
                          <span className="font-black text-4xl md:text-6xl text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{store.logoText}</span>
                          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest mt-2 bg-black/30 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">{store.name}</span>
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
              <button onClick={handleBack} className="w-20 h-20 rounded-full border border-gray-700 bg-linear-to-b from-gray-800/50 to-black flex items-center justify-center shadow-xl mb-4 hover:scale-105 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-orange-500 group" title="Switch Store">
                <span className="text-xl font-black text-white tracking-widest drop-shadow-md group-hover:text-orange-500 transition-colors">{selectedStore.logoText}</span>
              </button>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 drop-shadow-sm">{selectedStore.name}</h2>
            </div>

            <div className="px-6 md:px-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center lg:items-start min-h-[60vh] mt-8">
              
              {/* LEFT COLUMN: Orbs */}
              <div className="relative w-full lg:w-1/2 h-125 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.3))' }}>
                  <path d="M 100 100 C 250 150, 350 350, 150 450" fill="transparent" stroke="url(#orange-gradient)" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
                  <defs><linearGradient id="orange-gradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#9ca3af" /><stop offset="50%" stopColor="#f97316" /><stop offset="100%" stopColor="#9ca3af" /></linearGradient></defs>
                </svg>

                <div className="relative w-full h-full z-10">
                  {sortedReports.map((report, idx) => (
                    <RevolverOrb key={report.id} report={report} pos={[{ top: '40%', left: '45%', scale: 1.2 }, { top: '15%', left: '20%', scale: 0.8 }, { top: '75%', left: '25%', scale: 0.8 }, { top: '25%', left: '70%', scale: 0.7 }, { top: '85%', left: '60%', scale: 0.7 }][idx]} isCenter={idx === 0} layoutId={isOrbModal ? `orb-${report.id}` : undefined} onClick={() => setExpanded(report.id as ExpandedModal)} />
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: Action Cards */}
              <div className="w-full lg:w-1/2 flex flex-col gap-6 z-10 pt-8">
                <NextAppointmentCard onClick={() => setExpanded('next')} />
                <MasterScheduleCard onClick={() => setIsApptModalOpen(true)} />
              </div>
            </div>

            {/* --- EXPANDABLE ORB MODALS --- */}
            <AnimatePresence>
              {expanded && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden pointer-events-none">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExpanded(null)} className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-auto" />
                  
                  <motion.div layoutId={isOrbModal ? `orb-${expanded}` : `modal-${expanded}`} className="w-full max-w-4xl h-[85vh] max-h-212.5 flex flex-col pointer-events-auto z-10 overflow-hidden shadow-2xl border border-white/10 bg-[#0a0f16]/95 backdrop-blur-3xl rounded-3xl relative">
                    
                    <div className="relative z-10 flex items-center justify-between p-6 md:p-8 border-b border-white/10">
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        {expanded === 'agent' && <><Target className="text-emerald-500" /> Agent KPIs (Effort Metrics)</>}
                        {expanded === 'lead' && <><Activity className="text-orange-500" /> Lead Visibility</>}
                        {expanded === 'conv' && <><TrendingUp className="text-blue-500" /> Conversion Ratios</>}
                        {expanded === 'sold' && <><Car className="text-emerald-500" /> Sold Vehicles</>}
                        {expanded === 'pending' && <><Clock className="text-blue-500" /> Pending Deals</>}
                        {expanded === 'next' && <><User className="text-orange-500" /> Appointment Details</>}
                      </h2>
                      <button onClick={() => setExpanded(null)} className="p-2 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                        <X size={20} />
                      </button>
                    </div>

                    {/* Rendering the extracted modal components */}
                    {expanded === 'agent' && <AgentKPIModal triggerToast={triggerToast} />}
                    {expanded === 'lead' && <LeadVisibilityModal triggerToast={triggerToast} />}
                    {expanded === 'conv' && <ConversionRatiosModal triggerToast={triggerToast} />}
                    {expanded === 'sold' && <SoldVehiclesModal triggerToast={triggerToast} />}
                    {expanded === 'pending' && <CustomerDeepDiveModal type="pending" triggerToast={triggerToast} />}
                    {expanded === 'next' && <CustomerDeepDiveModal type="next" triggerToast={triggerToast} />}

                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      <AppointmentModal isOpen={isApptModalOpen} onClose={() => setIsApptModalOpen(false)} />

      {/* Global Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-300 flex items-center gap-3 bg-emerald-500/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400"
          >
            <CheckCircle2 size={18} />
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}