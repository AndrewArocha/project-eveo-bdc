// src/components/UI/GlassActionOrb.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type OrbTone = 'orange' | 'emerald' | 'teal' | 'blue' | 'purple' | 'red' | 'amber' | 'neutral';

interface GlassActionOrbProps {
  icon: React.ReactNode;
  tooltip: string;
  subTooltip?: string;
  tone?: OrbTone;
  onClick?: () => void;
  pulseDot?: 'red' | 'orange' | 'emerald' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  badgeText?: string;
  className?: string;
}

const TONE_CLASSES: Record<OrbTone, string> = {
  orange:
    'bg-radial-[at_30%_25%] from-orange-400/40 via-orange-500/20 to-orange-950/60 border-orange-400/50 text-orange-300 shadow-[inset_0_2px_5px_rgba(255,255,255,0.35),inset_0_-2px_6px_rgba(249,115,22,0.4),0_4px_12px_rgba(249,115,22,0.2)]',
  emerald:
    'bg-radial-[at_30%_25%] from-emerald-400/40 via-emerald-500/20 to-emerald-950/60 border-emerald-400/50 text-emerald-300 shadow-[inset_0_2px_5px_rgba(255,255,255,0.35),inset_0_-2px_6px_rgba(16,185,129,0.4),0_4px_12px_rgba(16,185,129,0.2)]',
  teal:
    'bg-radial-[at_30%_25%] from-teal-400/40 via-teal-500/20 to-teal-950/60 border-teal-400/45 text-teal-300 shadow-[inset_0_2px_5px_rgba(255,255,255,0.35),inset_0_-2px_6px_rgba(20,184,166,0.4)]',
  blue:
    'bg-radial-[at_30%_25%] from-blue-400/40 via-blue-500/20 to-blue-950/60 border-blue-400/50 text-blue-300 shadow-[inset_0_2px_5px_rgba(255,255,255,0.35),inset_0_-2px_6px_rgba(59,130,246,0.4)]',
  purple:
    'bg-radial-[at_30%_25%] from-purple-400/45 via-purple-500/25 to-purple-950/65 border-purple-400/55 text-purple-300 shadow-[inset_0_2px_5px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(168,85,247,0.45),0_4px_12px_rgba(168,85,247,0.25)]',
  red:
    'bg-radial-[at_30%_25%] from-red-400/45 via-red-500/25 to-red-950/65 border-red-400/55 text-red-300 shadow-[inset_0_2px_5px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(239,68,68,0.5),0_4px_12px_rgba(239,68,68,0.25)]',
  amber:
    'bg-radial-[at_30%_25%] from-amber-300/40 via-amber-500/20 to-amber-950/60 border-amber-400/50 text-amber-200 shadow-[inset_0_2px_5px_rgba(255,255,255,0.35),inset_0_-2px_6px_rgba(245,158,11,0.4)]',
  neutral:
    'bg-radial-[at_30%_25%] from-white/20 via-white/8 to-black/60 border-white/20 text-gray-200 shadow-[inset_0_2px_5px_rgba(255,255,255,0.25),0_4px_10px_rgba(0,0,0,0.3)]',
};

const DOT_COLORS = {
  red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]',
  orange: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]',
  emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]',
  purple: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,1)]',
};

export default function GlassActionOrb({
  icon,
  tooltip,
  subTooltip,
  tone = 'neutral',
  onClick,
  pulseDot,
  size = 'md',
  badgeText,
  className = '',
}: GlassActionOrbProps) {
  const [showTip, setShowTip] = useState(false);
  const [armedForSecondTap, setArmedForSecondTap] = useState(false);
  const lastPointerType = useRef<string>('mouse');
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTip(false);
        setArmedForSecondTap(false);
      }
    };
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    lastPointerType.current = e.pointerType;
  };

  const handleTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Touch / Mobile behavior: 1st tap shows tooltip, 2nd tap fires onClick!
    if (lastPointerType.current === 'touch') {
      if (!armedForSecondTap) {
        setShowTip(true);
        setArmedForSecondTap(true);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          setShowTip(false);
          setArmedForSecondTap(false);
        }, 2600);
        return;
      }
      // Second tap!
      setShowTip(false);
      setArmedForSecondTap(false);
      if (onClick) onClick();
      return;
    }

    // Desktop mouse click: immediate execution
    if (onClick) onClick();
  };

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
        ? 'w-11 h-11 text-sm'
        : 'w-9 h-9 text-xs';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => {
        if (lastPointerType.current === 'mouse') setShowTip(true);
      }}
      onMouseLeave={() => {
        if (lastPointerType.current === 'mouse') setShowTip(false);
      }}
    >
      <button
        type="button"
        aria-label={tooltip}
        onClick={handleTrigger}
        className={`${sizeClasses} ${TONE_CLASSES[tone]} ${
          badgeText ? 'w-auto px-2.5 gap-1.5' : ''
        } rounded-full border backdrop-blur-xl flex items-center justify-center relative overflow-visible transition-all duration-200 active:scale-90 hover:scale-108 outline-none ${
          onClick ? 'cursor-pointer' : 'cursor-default'
        } ${armedForSecondTap ? 'ring-2 ring-white scale-108' : ''}`}
      >
        {/* 3D Specular Orb Glare */}
        <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[65%] h-[34%] rounded-full bg-linear-to-b from-white/45 to-transparent pointer-events-none" />

        <span className="relative z-10 flex items-center justify-center">{icon}</span>
        {badgeText && <span className="relative z-10 text-[10px] font-black tracking-tight">{badgeText}</span>}

        {/* High-Intent Pulsating Dot */}
        {pulseDot && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-20">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${DOT_COLORS[pulseDot]}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-[#0a0f16] ${DOT_COLORS[pulseDot]}`} />
          </span>
        )}
      </button>

      {/* Floating Glass Tooltip */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 z-300 pointer-events-none min-w-16 px-3.5 py-2 rounded-xl bg-[#101722] border border-white/30 backdrop-blur-2xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] whitespace-nowrap text-center"
          >
            <p className="text-[13px] font-semibold text-white leading-tight">{tooltip}</p>
            {subTooltip && <p className="text-[11px] font-medium text-gray-200 mt-1">{subTooltip}</p>}
            {armedForSecondTap && onClick && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300 mt-1">
                Tap again to open &rarr;
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
