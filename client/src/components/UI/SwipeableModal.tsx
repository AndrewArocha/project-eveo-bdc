import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface SwipeableModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  layoutId?: string;
  maxWidthClass?: string;
}

export default function SwipeableModal({
  isOpen,
  onClose,
  children,
  layoutId,
  maxWidthClass = "md:max-w-4xl"
}: SwipeableModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const mainScroll = document.getElementById('app-scroll-container');
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (mainScroll) mainScroll.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (mainScroll) mainScroll.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (mainScroll) mainScroll.style.overflow = '';
    };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  const glassClasses = `backdrop-blur-2xl bg-white/95 dark:bg-[#0a0f16]/90 border-t md:border border-white/40 dark:border-white/15 shadow-[0_-20px_60px_rgba(0,0,0,0.65)] md:shadow-[0_25px_70px_rgba(0,0,0,0.75)]`;

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const target = e.target as HTMLElement;
    // Never hijack clicks on interactive elements (like KEY, X, or month arrows!)
    if (target.closest('button, a, input, select, textarea, [role="button"]')) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    // Top ~20% of the modal (first 96px) initiates sheet drag
    if (offsetY <= 96) {
      dragControls.start(e);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-end md:items-center justify-center pointer-events-none md:p-10">
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs pointer-events-auto"
          />

          {/* The Modal / iOS Bottom Sheet */}
          <motion.div
            layoutId={layoutId}
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.8 }}
            drag={isMobile ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.9 }}
            onPointerDown={handleHeaderPointerDown}
            onDragEnd={(_event, info) => {
              if (info.offset.y > 110 || info.velocity.y > 350) {
                onClose();
              }
            }}
            className={`${glassClasses} w-full ${maxWidthClass} max-h-[90dvh] md:max-h-190 flex flex-col pointer-events-auto z-10 overflow-hidden rounded-t-3xl md:rounded-3xl relative`}
          >
            {/* Subtle Specular Glass Top Highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none z-30" />

            {/* Mobile Drag Pill Indicator */}
            {isMobile && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="w-full flex justify-center pt-3.5 pb-1 cursor-grab active:cursor-grabbing shrink-0 relative z-20 touch-none"
              >
                <div className="w-12 h-1.5 bg-gray-400/50 dark:bg-white/25 rounded-full" />
              </div>
            )}

            {/* Modal Content Wrapper */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative z-10">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}