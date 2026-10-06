import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

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
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    const timer = setTimeout(() => { setOffset(circumference - (percentage / 100) * circumference); }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  const glassClasses = `backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 border border-white/50 dark:border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6),inset_0_-5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1),inset_0_-5px_15px_rgba(0,0,0,0.2)]`;

  return (
    <motion.div layoutId={layoutId} onClick={onClick} className={`p-6 rounded-3xl flex flex-col justify-between min-h-40 relative overflow-hidden transition-all outline-none cursor-pointer hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-orange-500 group ${glassClasses}`}>
      <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none rounded-t-3xl" />
      <div className="flex justify-between items-start z-10 w-full h-full relative">
        <div className="flex flex-col justify-between h-full">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 drop-shadow-sm text-gray-500 dark:text-gray-400"><Target size={14}/> {title}</h3>
          <p className="text-xs font-bold tracking-wider drop-shadow-sm text-gray-500 dark:text-gray-400 mt-auto">{trend} <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-orange-500">Expand &rarr;</span></p>
        </div>
        <div className="relative w-21 h-21 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
             <circle cx="42" cy="42" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200 dark:text-white/10" />
             <circle cx="42" cy="42" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`transition-all duration-1000 ease-out ${colors.stroke} ${colors.glow}`} />
          </svg>
          <div className="absolute inset-2 rounded-full backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 flex items-center justify-center shadow-inner"><span className="text-base font-black text-gray-900 dark:text-white drop-shadow-md">{percentage}%</span></div>
        </div>
      </div>
    </motion.div>
  );
}