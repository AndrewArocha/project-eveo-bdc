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

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmModalProps) {
  const getColors = () => {
    switch (type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
      case 'success': return 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
      case 'info': return 'bg-blue-500 hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
      default: return 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-auto select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-xs"
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            className="relative w-full max-w-sm bg-[#0a0f16]/95 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-3"
          >
            <h3 className="text-lg sm:text-xl font-black text-white">{title}</h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{message}</p>
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                className="flex-1 min-h-11 py-2.5 rounded-xl font-bold text-xs text-gray-300 bg-white/8 hover:bg-white/15 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-gray-500 cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                className={`flex-1 min-h-11 py-2.5 rounded-xl font-bold text-xs text-white active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer ${getColors()}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}