// src/components/UI/DashboardCard.tsx
import { motion } from 'framer-motion';
import { playHover, playModalOpen } from '../../utils/soundEngine';

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend: string;
  titleColor?: string;
  icon: React.ReactNode;
  dotColor?: string;
  pingColor?: string;
  borderGlow?: string;
  onClick?: () => void;
  layoutId: string;
}

export default function DashboardCard({
  title,
  value,
  trend,
  titleColor = 'text-gray-500',
  icon,
  dotColor,
  pingColor,
  borderGlow,
  onClick,
  layoutId
}: DashboardCardProps) {
  const baseClasses = borderGlow || 'bg-white dark:bg-[#0a0f16]/80 border-gray-200 dark:border-white/10';
  const glassClasses = `backdrop-blur-xl border shadow-sm dark:shadow-[0_14px_32px_rgba(0,0,0,0.28)]`;
  const isInteractive = layoutId !== 'none';
  const cursorStyle = isInteractive
    ? 'cursor-pointer active:scale-[0.98] hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-orange-500 group'
    : 'cursor-default';

  return (
    <motion.div
      {...(isInteractive && { layoutId })}
      onMouseEnter={() => isInteractive && playHover()}
      onClick={() => {
        if (!isInteractive || !onClick) return;
        playModalOpen();
        onClick();
      }}
      className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between min-h-28 sm:min-h-40 relative overflow-hidden transition-all outline-none select-none ${glassClasses} ${baseClasses} ${cursorStyle}`}
    >
      <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl" />

      {dotColor && (
        <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 flex h-2 w-2 sm:h-2.5 sm:w-2.5 z-10">
          {pingColor && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`} />}
          <span className={`relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 ${dotColor}`} />
        </div>
      )}

      <div className="relative z-10">
        <h3 className={`text-[9px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 drop-shadow-xs pr-4 ${titleColor}`}>
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </h3>
        <p className="text-2xl sm:text-3xl font-black tabular-nums text-gray-900 dark:text-white mb-1 sm:mb-4 drop-shadow-md leading-tight">
          {value}
        </p>
      </div>

      <p className="text-[10px] sm:text-xs font-bold tracking-wider z-10 flex items-center justify-between gap-1 drop-shadow-xs text-gray-500 dark:text-gray-400">
        <span className="truncate">{trend}</span>
        {isInteractive && (
          <span className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-orange-500 shrink-0 text-[10px] sm:text-[11px]">
            <span className="hidden sm:inline">Expand </span>&rarr;
          </span>
        )}
      </p>
    </motion.div>
  );
}
