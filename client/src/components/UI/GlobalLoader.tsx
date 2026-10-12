import { motion } from 'framer-motion';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

interface GlobalLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export default function GlobalLoader({ text = "Syncing with EVEO...", fullScreen = true }: GlobalLoaderProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-[#05080c]/90 backdrop-blur-md"
    : "w-full h-full min-h-[400px] flex flex-col items-center justify-center";

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className={containerClasses}
    >
      <div className="relative flex items-center justify-center mb-6">
        {/* Framer Motion Animated Rings */}
        <motion.div 
          animate={{ scale: [1, 1.8, 2.2], opacity: [0.6, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-16 h-16 rounded-full border-2 border-orange-500" 
        />
        <motion.div 
          animate={{ scale: [1, 1.4, 1.8], opacity: [0.8, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
          className="absolute w-16 h-16 rounded-full border-2 border-orange-500" 
        />
        
        {/* Core logo container */}
        <div className="relative z-10 w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.2)]">
          <motion.img 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            src={eveoSymbol} 
            alt="EVEO Loading" 
            className="w-8 h-8 dark:invert-0 invert" 
          />
        </div>
      </div>
      
      <motion.p 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-sm font-bold text-gray-500 uppercase tracking-widest"
      >
        {text}
      </motion.p>
    </motion.div>
  );
}