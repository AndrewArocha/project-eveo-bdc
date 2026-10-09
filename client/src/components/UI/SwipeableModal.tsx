import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SwipeableModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  layoutId?: string;
}

export default function SwipeableModal({ isOpen, onClose, children, layoutId }: SwipeableModalProps) {
  // Detect if user is on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const glassClasses = `backdrop-blur-xl bg-white/90 dark:bg-[#0a0f16]/95 border border-white/50 dark:border-white/20 shadow-2xl`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center pointer-events-none md:p-12">
          {/* Background Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
          />
          
          {/* The Modal / Bottom Sheet */}
          <motion.div 
            layoutId={layoutId}
            // If mobile, slide up from bottom. If desktop, scale up in center.
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
            
            // --- UPDATED DRAG LOGIC ---
            // Enable dragging ONLY on mobile
            drag={isMobile ? "y" : false}
            // Allow dragging down infinitely (no bottom constraint), but prevent dragging up past 0 (the top).
            dragConstraints={{ top: 0 }} 
            // High elasticity allows it to follow the finger 1:1 when dragged downwards.
            dragElastic={{ top: 0, bottom: 1 }} 
            onDragEnd={(event, info) => {
              // Close if the user flicks it down fast (>400 velocity) OR drags it down a significant distance (>150px)
              if (info.offset.y > 150 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className={`${glassClasses} w-full md:max-w-5xl h-[85vh] md:max-h-200 flex flex-col pointer-events-auto z-10 overflow-hidden 
              rounded-t-3xl md:rounded-3xl relative`}
          >
            {/* Mobile Drag Handle */}
            {isMobile && (
              <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0 relative z-20">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full" />
              </div>
            )}
            
            {/* The actual content (HubModals, OrbModals, etc) goes here */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}