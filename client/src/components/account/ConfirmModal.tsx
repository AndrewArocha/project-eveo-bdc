import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'success' | 'danger' | 'info';
}

export default function ConfirmModal({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, type = 'warning' }: ConfirmModalProps) {
  const getColors = () => {
    switch(type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
      case 'success': return 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
      case 'info': return 'bg-blue-500 hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
      default: return 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); onCancel(); }} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-[#0a0f16]/95 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
          >
            <h3 className="text-xl font-black text-white">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={(e) => { e.stopPropagation(); onCancel(); }} className="flex-1 py-2.5 rounded-xl font-bold text-xs text-gray-300 bg-white/5 hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gray-500">
                {cancelText}
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onConfirm(); }} className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white ${getColors()}`}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}