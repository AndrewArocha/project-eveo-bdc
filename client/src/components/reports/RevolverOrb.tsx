import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RevolverOrbProps {
  report: {
    id: string;
    label: string;
    value: string | null;
    progress?: number;
    color: string;
    ring: string;
  };
  pos: { top: string; left: string; scale: number };
  isCenter: boolean;
  layoutId?: string;
  onClick: () => void;
}

export default function RevolverOrb({ report, pos, isCenter, layoutId, onClick }: RevolverOrbProps) {
  // SVG Progress Ring Logic
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    if (report.progress !== undefined) {
      const timer = setTimeout(() => {
        setOffset(circumference - (report.progress! / 100) * circumference);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [report.progress, circumference]);

  const getColors = (pct: number) => {
    if (pct <= 25) return { stroke: 'text-red-500', glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' };
    if (pct <= 50) return { stroke: 'text-orange-500', glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' };
    if (pct <= 75) return { stroke: 'text-yellow-400', glow: 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' };
    return { stroke: 'text-emerald-500', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' };
  };

  return (
    <motion.div 
      layoutId={layoutId}
      initial={false}
      animate={{ top: pos.top, left: pos.left, scale: pos.scale, x: '-50%', y: '-50%' }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onClick={onClick}
      className={`absolute flex flex-col items-center justify-center rounded-full border-2 ${report.ring} bg-linear-to-b ${report.color} shadow-2xl backdrop-blur-xl cursor-pointer hover:scale-105 transition-transform`}
      style={{ width: '160px', height: '160px' }}
    >
      {/* The Dynamic Progress Ring (Layered UNDER the glass shine) */}
      {report.progress !== undefined && (
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none overflow-visible z-0">
          <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
          <circle 
            cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" 
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
            className={`transition-all duration-1000 ease-out ${getColors(report.progress).stroke} ${getColors(report.progress).glow}`} 
          />
        </svg>
      )}

      {/* The Glassmorphism Shine Effects (Layered ON TOP) */}
      <div className="absolute inset-0 rounded-full bg-linear-to-tr from-white/5 to-transparent pointer-events-none z-10" />
      <div className="absolute top-2 right-4 w-12 h-6 bg-white/10 rounded-full blur-md pointer-events-none transform -rotate-45 z-10" />
      
      {/* Text Content */}
      <span className={`text-[10px] font-bold uppercase tracking-widest text-center px-4 z-20 ${isCenter ? 'text-orange-500' : 'text-gray-400'}`}>
        {report.label}
      </span>
      {report.value && (
        <span className="text-3xl font-black text-white mt-1 drop-shadow-md z-20">{report.value}</span>
      )}
    </motion.div>
  );
}