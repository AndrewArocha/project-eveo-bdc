// src/pages/Reports.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Data ---
type ViewState = 'store-selection' | 'type-selection' | 'form-filling';
type ViewMode = 'carousel' | 'grid';
type ReportTypeId = 'bdc' | 'appointment' | 'lead-management' | 'lead-source';
type CompileState = 'idle' | 'compiling' | 'success';

interface Store {
  id: string;
  name: string;
  logoText: string;
  bgImage: string;
}

interface ReportType {
  id: ReportTypeId;
  title: string;
  description: string;
}

const STORES: Store[] = [
  { id: 'njx', name: 'NJ Auto Xchange', logoText: 'NJX', bgImage: 'from-[#1e3a8a]/20 to-[#0f172a]/80' },
  { id: 'dk', name: 'DK Auto Imports', logoText: 'DK', bgImage: 'from-[#7f1d1d]/20 to-[#000000]/80' },
  { id: 'kia', name: 'Northstar Kia', logoText: 'KIA', bgImage: 'from-[#374151]/20 to-[#4c0519]/80' }
];

const REPORT_TYPES: ReportType[] = [
  { id: 'bdc', title: 'BDC Report', description: 'Leads MTD, Appts, Calls, Emails & Delivery Ratios' },
  { id: 'appointment', title: 'Appointments', description: 'Same-day, Next-day, and Saturday tracking' },
  { id: 'lead-management', title: 'Lead Management', description: 'Total leads, Contact rates, and Sold rates' },
  { id: 'lead-source', title: 'Lead By Source', description: 'Granular breakdown of ratios per lead source' }
];

export default function Reports() {
  const [viewState, setViewState] = useState<ViewState>('store-selection');
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const [activeStoreIndex, setActiveStoreIndex] = useState(0);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);

  const storeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Handlers ---
  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setViewState('type-selection');
  };

  const handleTypeSelect = (type: ReportType) => {
    setSelectedType(type);
    setViewState('form-filling');
  };

  // --- Global Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewState === 'type-selection') {
            setViewState('store-selection');
        }
        return;
      }

      if (viewState === 'store-selection') {
        if (e.key === 'ArrowRight') {
          setActiveStoreIndex((prev) => (prev + 1) % STORES.length);
        } else if (e.key === 'ArrowLeft') {
          setActiveStoreIndex((prev) => (prev === 0 ? STORES.length - 1 : prev - 1));
        } else if (e.key === 'Enter') {
          handleStoreSelect(STORES[activeStoreIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, activeStoreIndex]);

  useEffect(() => {
    if (viewState === 'store-selection' && storeRefs.current[activeStoreIndex]) {
      storeRefs.current[activeStoreIndex]?.focus();
    }
  }, [activeStoreIndex, viewState]);

  const renderStoreSelection = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col items-center justify-center h-full w-full"
    >
      <div className="absolute top-10 left-12 z-20">
        <h1 className="text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-none">Reports</h1>
      </div>

      <div className="absolute top-12 right-12 z-20 flex items-center gap-4 bg-white/5 dark:bg-[#0a0f16]/50 backdrop-blur-xl p-1.5 rounded-full border border-gray-200 dark:border-white/10">
        <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-orange-500/20 text-orange-500' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>
        </button>
        <button
            onClick={() => setViewMode('carousel')}
            className={`p-2 rounded-full transition-all ${viewMode === 'carousel' ? 'bg-orange-500/20 text-orange-500' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M2 8v8M22 8v8" /></svg>
        </button>
      </div>

      <div className={`
        flex items-center justify-center w-full max-w-6xl px-12 transition-all duration-700
        ${viewMode === 'grid' ? 'flex-wrap gap-10 mt-10' : 'gap-8 md:gap-16 overflow-visible'}
      `}>
        <AnimatePresence mode="popLayout">
            {STORES.map((store, index) => {
            const isActive = index === activeStoreIndex && viewState === 'store-selection';

            return (
                <motion.div
                  key={store.id}
                  layoutId={`store-${store.id}`}
                  ref={(el) => { storeRefs.current[index] = el; }}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleStoreSelect(store)}
                  onMouseEnter={() => setActiveStoreIndex(index)}
                  className={`
                      relative flex flex-col items-center cursor-pointer outline-none group
                      ${viewMode === 'grid' ? 'w-32' : 'w-56 md:w-70'}
                  `}
                  animate={{
                      scale: isActive && viewMode === 'carousel' ? 1.05 : 1,
                      y: isActive && viewMode === 'carousel' ? -10 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                  <motion.div
                      className={`
                          relative overflow-hidden transition-all duration-500 ease-out z-10
                          bg-black/40 backdrop-blur-2xl border border-white/10
                          shadow-[0_16px_40px_rgba(0,0,0,0.3)]
                          group-hover:border-white/20 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                          ${viewMode === 'grid' ? 'w-32 h-32 rounded-full' : 'w-full aspect-3/4 rounded-[50%]'}
                      `}
                      animate={{
                          rotate: viewMode === 'carousel' ? 8 : 0
                      }}
                  >
                      <div className={`absolute inset-0 bg-linear-to-b ${store.bgImage} opacity-60 mix-blend-overlay`} />
                      <div className="absolute inset-px rounded-[inherit] border border-white/8 pointer-events-none" />

                      <motion.div
                          className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-12"
                          animate={{ translateX: ['-150%', '250%'] }}
                          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                      />
                  </motion.div>

                  <div className={`mt-8 h-8 flex items-center justify-center transition-all duration-300 ${isActive || viewMode === 'grid' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="h-full flex items-center justify-center font-bold text-gray-800 dark:text-gray-300 tracking-wider">
                          {store.logoText} LOGO
                      </div>
                  </div>
                </motion.div>
            );
            })}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-10 left-12 flex gap-6 items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100/50 dark:bg-[#0a0f16]/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-black">&larr;</span>
            <span className="flex items-center justify-center w-5 h-5 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-black">&rarr;</span>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center px-2 h-5 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-black text-[9px]">&crarr;</span>
            <span>Open</span>
          </div>
      </div>
    </motion.div>
  );

  const renderTypeModal = () => (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/60 dark:bg-[#05080c]/80 backdrop-blur-xl"
    >
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-end mb-8 px-2">
            <div>
                <p className="text-orange-500 font-bold tracking-widest uppercase text-xs mb-3">{selectedStore?.name}</p>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Select Report Protocol</h2>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black">Esc</span>
                <span>To Go Back</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORT_TYPES.map((type, idx) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleTypeSelect(type)}
              className="text-left p-8 rounded-4xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all hover:bg-white dark:hover:bg-white/10 group outline-none focus-visible:ring-2 focus-visible:ring-orange-500 backdrop-blur-md"
            >
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-500 transition-colors">{type.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{type.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col font-sans">
      <AnimatePresence mode="wait">
        {viewState === 'store-selection' && <motion.div key="stores" className="h-full w-full">{renderStoreSelection()}</motion.div>}
        {viewState === 'type-selection' && <motion.div key="types" className="absolute inset-0">{renderTypeModal()}</motion.div>}
        {viewState === 'form-filling' && selectedStore && selectedType && (
          <motion.div key="form" className="absolute inset-0 z-40 bg-gray-50 dark:bg-[#05080c] overflow-y-auto p-8 md:p-12 custom-scrollbar">
            <ReportWizard store={selectedStore} type={selectedType} onBack={() => setViewState('type-selection')} onFinish={() => setViewState('store-selection')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Custom Form Component with Compilation State & Validation ---
function ReportWizard({ store, type, onBack, onFinish }: { store: Store; type: ReportType; onBack: () => void, onFinish: () => void }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [compileState, setCompileState] = useState<CompileState>('idle');
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  // Unified Reset Handler
  const handleCloseAndReset = () => {
    setCompileState('idle');
    onFinish();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (compileState === 'success') {
                if (isCardExpanded) {
                    setIsCardExpanded(false);
                } else {
                    handleCloseAndReset();
                }
            } else if (compileState === 'idle') {
                onBack();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [compileState, isCardExpanded, onFinish, onBack]);

  const getFields = () => {
    switch (type.id) {
      case 'bdc':
        return [
          { id: 'leads', label: 'Leads MTD', type: 'number' },
          { id: 'apptsYest', label: 'Appts Yesterday', type: 'number' },
          { id: 'apptsMtd', label: 'Appts MTD', type: 'number' },
          { id: 'calls', label: 'Call Count', type: 'number' },
          { id: 'emails', label: 'Email Count', type: 'number' },
          { id: 'sms', label: 'SMS Count', type: 'number' },
          { id: 'deals', label: 'Deals Delivered', type: 'number' },
          { id: 'inqRatio', label: 'Inquiry/Delivery Ratio (%)', type: 'number' },
          { id: 'avgRatio', label: 'Average Ratio', type: 'number' },
          { id: 'cars', label: 'Cars Delivered', type: 'number' },
          { id: 'invRatio', label: 'Inventory/Delivery Ratio (%)', type: 'number' }
        ];
      case 'appointment':
        return [
          { id: 'sameDay', label: 'Same-day Appointments', type: 'number' },
          { id: 'nextDay', label: 'Next-day Appointments', type: 'number' },
          { id: 'sat', label: 'Saturday Appointments', type: 'number' }
        ];
      case 'lead-management':
        return [
          { id: 'totalLeads', label: 'Total Leads', type: 'number' },
          { id: 'contactRate', label: 'Contact Rate (%)', type: 'number' },
          { id: 'scheduleRate', label: 'Appt Schedule Rate (%)', type: 'number' },
          { id: 'completeRate', label: 'Appt Completed Rate (%)', type: 'number' },
          { id: 'soldRate', label: 'Sold Rate (%)', type: 'number' }
        ];
      case 'lead-source':
        return [
          { id: 'sourceName', label: 'Lead Source Name', type: 'text' },
          { id: 'srcTotal', label: 'Total Leads', type: 'number' },
          { id: 'srcContact', label: 'Contact Rate (%)', type: 'number' },
          { id: 'srcAppt', label: 'Appt/Lead Ratio (%)', type: 'number' },
          { id: 'srcSold', label: 'Sold Ratio (%)', type: 'number' }
        ];
      default: return [];
    }
  };

  const fields = getFields();
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Real-time validation check
  const isFormValid = fields.every((field) => {
      const val = formData[field.id];
      return val !== undefined && val.trim() !== '';
  });

  const handleShare = (platform: 'email' | 'whatsapp') => {
    let text = `*${type.title}*\n${reportDate}\n*${store.name}*\n\n`;
    fields.forEach(field => {
        const value = formData[field.id] || (field.type === 'number' ? '0' : '-');
        text += `${field.label}: ${value}\n`;
    });
    if (notes.trim()) { text += `\n*Operational Notes:*\n${notes}\n`; }
    text += `\n[Generated via Eveo Hub]`;

    if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else {
        const emailText = text.replace(/\*/g, '');
        window.open(`mailto:?subject=${encodeURIComponent(type.title + ' - ' + store.name)}&body=${encodeURIComponent(emailText)}`);
    }
  };

  const handleCompile = () => {
      if (!isFormValid) return;
      setCompileState('compiling');
      setTimeout(() => {
          setCompileState('success');
      }, 2500);
  };

  return (
    <>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-6xl mx-auto h-full flex flex-col">
            <header className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between border-b border-gray-200 dark:border-white/10 pb-8 gap-6">
                <div>
                <button onClick={onBack} className="text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2 transition-colors">
                    <span className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black text-[9px]">ESC</span> Back to Protocols
                </button>
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${store.bgImage} flex items-center justify-center shadow-lg border border-white/10`}>
                        <span className="text-white font-black text-xs">{store.logoText}</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{type.title}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{reportDate} &nbsp;&bull;&nbsp; {store.name}</p>
                    </div>
                </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                        <button onClick={() => handleShare('email')} className="px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-orange-500 transition-colors border-r border-gray-200 dark:border-white/10 outline-none" title="Share via Email">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={() => handleShare('whatsapp')} className="px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-emerald-500 transition-colors outline-none" title="Share via WhatsApp">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.347-.272.271-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </button>
                    </div>
                    <button
                        onClick={handleCompile}
                        disabled={!isFormValid || compileState !== 'idle'}
                        className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl font-bold transition-all outline-none
                            ${isFormValid
                                ? 'bg-orange-500 text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] cursor-pointer'
                                : 'bg-gray-300 dark:bg-white/10 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'}`}
                    >
                        {isFormValid ? 'Compile Data' : 'Data Required'}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12">
                {fields.map((field) => (
                    <div key={field.id} className="relative group">
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 transition-colors group-focus-within:text-orange-500">
                        {field.label}
                    </label>
                    <div className="relative">
                        <input
                        type={field.type}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="w-full bg-transparent border-b border-gray-300 dark:border-white/10 py-2 text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="-"
                        />
                        <motion.div
                        className="absolute -bottom-px left-0 h-0.5 w-0 bg-orange-500"
                        whileFocus={{ width: '100%' }}
                        />
                    </div>
                    </div>
                ))}
                </div>

                <div className="mt-20 mb-8 max-w-3xl">
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                        Operational Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent focus:border-orange-500/50 rounded-2xl p-6 text-gray-900 dark:text-white focus:outline-none transition-all resize-none h-32 text-lg shadow-sm"
                        placeholder="Drop any workflow insights or automation anomalies here..."
                    />
                </div>
            </div>
        </motion.div>

        {/* --- Compilation Modal Overlay --- */}
        <AnimatePresence>
            {compileState !== 'idle' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/60 dark:bg-[#05080c]/80 backdrop-blur-md"
                >
                    {/* Loading State */}
                    {compileState === 'compiling' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative w-24 h-24 mb-6">
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-orange-500/20 border-t-orange-500"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                                <motion.div
                                    className="absolute inset-2 rounded-full border-2 border-gray-400/20 dark:border-white/10 border-b-gray-400 dark:border-b-white"
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">Sync</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Aggregating Metrics</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-xs">Connecting to hub database and pushing payload to AI Insights engine...</p>
                        </motion.div>
                    )}

                    {/* Success State */}
                    {compileState === 'success' && (
                        <div className="flex flex-col items-center justify-center w-full h-full">
                            {!isCardExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    <span className="text-xs font-bold tracking-widest uppercase">Report Compiled</span>
                                </motion.div>
                            )}

                            <AnimatePresence mode="wait">
                                {!isCardExpanded ? (
                                    /* --- Preview Card --- */
                                    <motion.div
                                        key="preview-card"
                                        layoutId={`report-card-${store.id}-${type.id}`}
                                        onClick={() => setIsCardExpanded(true)}
                                        className="w-[320px] h-110 bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-[40px] shadow-2xl overflow-hidden relative group cursor-pointer"
                                    >
                                        <div className={`absolute top-0 w-full h-32 bg-linear-to-b ${store.bgImage} opacity-30`} />

                                        <div className="absolute inset-0 p-8 flex flex-col items-center text-center">
                                            <div className={`w-20 h-20 rounded-3xl bg-linear-to-br ${store.bgImage} flex items-center justify-center shadow-lg border border-white/10 mt-4 mb-6 shrink-0`}>
                                                <span className="text-white font-black text-xl">{store.logoText}</span>
                                            </div>

                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">{type.title}</h3>
                                            <p className="text-sm font-semibold text-orange-500 tracking-widest uppercase mb-6 shrink-0">{reportDate}</p>

                                            <div className="w-full flex justify-between px-4 text-left border-t border-gray-200 dark:border-white/10 pt-5">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{fields[0]?.label}</p>
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formData[fields[0]?.id] || '0'}</p>
                                                </div>
                                                {fields.length > 1 && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{fields[1]?.label}</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{formData[fields[1]?.id] || '0'}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* NEW: Operational Notes Preview */}
                                            {notes.trim() && (
                                                <div className="w-full mt-5 text-left px-4">
                                                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-3 relative overflow-hidden">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500/50" />
                                                        <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Notes</p>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 italic">
                                                            "{notes}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="bg-white/10 border border-white/20 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">Tap to Expand</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* --- Expanded Card Detail View --- */
                                    <motion.div
                                        key="expanded-card"
                                        layoutId={`report-card-${store.id}-${type.id}`}
                                        className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 rounded-[40px] shadow-2xl flex flex-col relative"
                                    >
                                        <div className="absolute -top-12 right-2 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            <span className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black">
                                                Esc
                                            </span>
                                            <span>To Go Back</span>
                                        </div>

                                        <div className="flex flex-col flex-1 overflow-hidden rounded-[38px] relative">
                                            <div className={`absolute top-0 w-full h-40 bg-linear-to-b ${store.bgImage} opacity-20`} />

                                            <div className="relative p-8 md:p-10 pb-6 flex items-start justify-between border-b border-gray-200 dark:border-white/10">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${store.bgImage} flex items-center justify-center shadow-lg border border-white/10`}>
                                                        <span className="text-white font-black text-sm">{store.logoText}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">{type.title}</h3>
                                                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{reportDate} &nbsp;&bull;&nbsp; {store.name}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setIsCardExpanded(false)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>

                                            <div className="relative p-8 md:p-10 overflow-y-auto custom-scrollbar flex-1">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                                    {fields.map((field) => (
                                                        <div key={field.id}>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-2">{field.label}</p>
                                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formData[field.id] || (field.type === 'number' ? '0' : '-')}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {notes.trim() && (
                                                    <div className="mt-12 p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-3">Operational Notes</p>
                                                        <p className="text-gray-800 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isCardExpanded && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mt-8 flex gap-4"
                                >
                                    <button
                                        onClick={handleCloseAndReset}
                                        className="px-6 py-3 rounded-xl border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                    >
                                        Close & Reset
                                    </button>
                                    <button
                                        className="px-6 py-3 rounded-xl bg-orange-500 text-white dark:text-black font-bold hover:bg-orange-600 dark:hover:bg-orange-400 transition-colors shadow-lg"
                                    >
                                        View in Insights
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
}