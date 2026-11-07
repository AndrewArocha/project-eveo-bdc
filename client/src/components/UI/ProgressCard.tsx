// src/components/UI/ProgressCard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { playHover, playModalOpen } from '../../utils/soundEngine';

interface ProgressCardProps {
  title: string;
  percentage: number;
  trend: string;
  onClick: () => void;
  layoutId: string;
}

export default function ProgressCard({ title, percentage, trend, onClick, layoutId }: ProgressCardProps) {
  const getColors = (pct: number) => {
    if (pct <= 25) return { stroke: 'text-red-500', glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' };
    if (pct <= 50) return { stroke: 'text-orange-500', glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' };
    if (pct <= 75) return { stroke: 'text-yellow-400', glow: 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' };
    return { stroke: 'text-emerald-500', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' };
  };

  const colors = getColors(percentage);
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  const glassClasses = `backdrop-blur-2xl bg-white/5 dark:bg-[#0a0f16]/40 border border-white/20 dark:border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.1),inset_0_1px_8px_rgba(255,255,255,0.2)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_1px_8px_rgba(255,255,255,0.1)]`;

  return (
    <motion.div
      layoutId={layoutId}
      onMouseEnter={() => playHover()}
      onClick={() => {
        playModalOpen();
        onClick();
      }}
      className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between min-h-28 sm:min-h-40 relative overflow-hidden transition-all outline-none cursor-pointer active:scale-[0.98] hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-orange-500 group select-none ${glassClasses}`}
    >
      <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl" />

      <div className="flex items-center justify-between gap-2 z-10 w-full flex-1 relative">
        <div className="flex flex-col justify-between h-full min-w-0 flex-1">
          <h3 className="text-[9px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2 flex items-center gap-1.5 drop-shadow-xs text-gray-500 dark:text-gray-400">
            <Target size={13} className="shrink-0 text-emerald-500" />
            <span className="truncate">{title}</span>
          </h3>

          <p className="text-[10px] sm:text-xs font-bold tracking-wider drop-shadow-xs text-gray-500 dark:text-gray-400 mt-auto flex items-center gap-1">
            <span className="truncate">{trend}</span>
            <span className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-orange-500 shrink-0 text-[10px]">
              &rarr;
            </span>
          </p>
        </div>

        <div className="relative w-12 h-12 sm:w-18 sm:h-18 flex items-center justify-center shrink-0">
          <svg aria-hidden="true" viewBox="0 0 84 84" className="w-full h-full -rotate-90 overflow-visible">
            <circle cx="42" cy="42" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200 dark:text-white/10" />
            <circle
              cx="42" cy="42" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${colors.stroke} ${colors.glow}`}
            />
          </svg>
          <div className="absolute inset-1.5 sm:inset-2 rounded-full backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 flex items-center justify-center shadow-inner">
            <span className="text-[11px] sm:text-sm font-black tabular-nums text-gray-900 dark:text-white drop-shadow-md">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}