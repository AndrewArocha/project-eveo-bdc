import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, LayoutDashboard } from 'lucide-react';
import { InsightsWidgets, InsightsChat } from '../../components/insights/InsightsViews';
import { CURRENT_USER } from '../../data/mockDatabase';

type InsightsView = 'widgets' | 'chat';

export default function Insights() {
  const [view, setView] = useState<InsightsView>('widgets');
  const [chatInput, setChatInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut (Cmd/Ctrl + K) to jump into chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setView('chat');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && view === 'chat') {
        setView('widgets');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full w-full max-w-7xl mx-auto px-4 sm:px-8 md:pl-32 py-10 relative flex flex-col">
      
      {/* Header Area */}
      <div className="flex justify-between items-start mb-10 z-20">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Sparkles size={18} className="text-white" />
            </div>
            EVEO Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Your AI Chief of Staff. Review metrics or ask a direct question.</p>
        </div>

        {/* View Toggle */}
        <AnimatePresence>
          {view === 'chat' && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setView('widgets')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl text-xs font-bold transition-colors outline-none shadow-sm"
            >
              <LayoutDashboard size={14} /> Back to Dashboard
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Transition */}
      <div className="flex-1 relative w-full">
        <AnimatePresence mode="wait">
          {view === 'widgets' ? (
            <motion.div 
              key="widgets"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', y: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="h-full"
            >
              <InsightsWidgets />
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="h-full"
            >
              <InsightsChat />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The Morphing Command Bar */}
      <motion.div 
        layout 
        className={`fixed left-0 w-full z-50 transition-all duration-500 ease-in-out px-4 md:pl-28 ${view === 'widgets' ? 'bottom-8' : 'bottom-0 pb-6 pt-4 bg-gray-50 dark:bg-[#05080c]'}`}
      >
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-purple-500 to-indigo-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center bg-white dark:bg-[#0f141d] border border-gray-200 dark:border-white/10 rounded-full shadow-2xl p-2 pl-6">
            <Sparkles size={18} className="text-purple-500 mr-3 shrink-0" />
            <input 
              ref={inputRef}
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onFocus={() => setView('chat')}
              placeholder={`Ask EVEO to analyze ${CURRENT_USER}'s pipeline or draft a campaign...`} 
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none h-10"
            />
            <button 
              onClick={() => { if(view === 'widgets') setView('chat'); setChatInput(''); }}
              className={`p-3 rounded-full text-white transition-all outline-none ml-2 shrink-0 ${chatInput.length > 0 ? 'bg-orange-500 hover:bg-orange-600 scale-100' : 'bg-gray-300 dark:bg-white/10 scale-90'}`}
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </div>

          {/* Helper Tags (Only visible in widget mode) */}
          <AnimatePresence>
            {view === 'widgets' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute -top-10 w-full flex justify-center gap-3">
                <span className="text-[10px] bg-white/50 dark:bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 text-gray-500 font-bold uppercase tracking-widest hidden sm:block">Press Cmd + K to chat</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </motion.div>
  );
}