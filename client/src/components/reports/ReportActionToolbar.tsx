import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Mail, MessageCircle, ChevronDown, Sparkles, MessageSquare, Link as LinkIcon } from 'lucide-react';

interface ReportActionToolbarProps {
  onGeneratePDF: () => void;
  onShare: (method: string) => void;
}

export default function ReportActionToolbar({ onGeneratePDF, onShare }: ReportActionToolbarProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  return (
    <div className="relative z-10 shrink-0 flex items-center justify-between p-5 bg-[#0a0f16]/90 border-t border-white/10 w-full mt-auto">
      <span className="text-xs text-gray-500 font-medium">Data synced with Live Database</span>
      
      <div className="flex items-center gap-3 relative">
        <button 
          onClick={onGeneratePDF} 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-orange-500/20 to-orange-600/10 hover:from-orange-500/30 hover:to-orange-600/20 text-orange-400 text-xs font-bold transition-colors border border-orange-500/20 outline-none"
        >
          <Sparkles size={14} className="text-orange-500"/> AI Generate Report (PDF)
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowShareMenu(!showShareMenu)} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-bold transition-colors border border-blue-500/30 outline-none"
          >
            <Share2 size={14}/> Share <ChevronDown size={12}/>
          </button>

          <AnimatePresence>
            {showShareMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-2 w-48 bg-[#0f141d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-1 flex flex-col gap-1"
              >
                <button onClick={() => { setShowShareMenu(false); onShare('WhatsApp'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left">
                  <MessageCircle size={14} className="text-emerald-400"/> WhatsApp
                </button>
                <button onClick={() => { setShowShareMenu(false); onShare('Email'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left">
                  <Mail size={14} className="text-blue-400"/> Email
                </button>
                <button onClick={() => { setShowShareMenu(false); onShare('SMS'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left">
                  <MessageSquare size={14} className="text-purple-400"/> iMessage / SMS
                </button>
                <div className="h-px w-full bg-white/10 my-1" />
                <button onClick={() => { setShowShareMenu(false); onShare('Link'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left">
                  <LinkIcon size={14} className="text-gray-400"/> Copy Link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}