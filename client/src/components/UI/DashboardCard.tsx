import { motion } from 'framer-motion';

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

export default function DashboardCard({ title, value, trend, titleColor = 'text-gray-500', icon, dotColor, pingColor, borderGlow, onClick, layoutId }: DashboardCardProps) {
  const baseClasses = borderGlow || 'bg-white/40 dark:bg-[#0a0f16]/40 border-white/50 dark:border-white/10';
  const glassClasses = `backdrop-blur-xl border shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6),inset_0_-5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1),inset_0_-5px_15px_rgba(0,0,0,0.2)]`;
  const cursorStyle = layoutId === 'none' ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-orange-500 group';

  return (
    <motion.div {...(layoutId !== 'none' && { layoutId })} onClick={layoutId !== 'none' ? onClick : undefined} className={`p-6 rounded-3xl flex flex-col justify-between min-h-40 relative overflow-hidden transition-all outline-none ${glassClasses} ${baseClasses} ${cursorStyle}`}>
      <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none rounded-t-3xl" />
      {dotColor && (
        <div className="absolute top-5 right-5 flex h-2.5 w-2.5 z-10">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor || dotColor}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`}></span>
        </div>
      )}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 z-10 drop-shadow-sm ${titleColor}`}>{icon} {title}</h3>
        <p className="text-3xl font-black text-gray-900 dark:text-white mb-4 z-10 drop-shadow-md">{value}</p>
      </div>
      <p className="text-xs font-bold tracking-wider z-10 flex items-center justify-between drop-shadow-sm text-gray-500 dark:text-gray-400">
        {trend} {layoutId !== 'none' && <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">Expand &rarr;</span>}
      </p>
    </motion.div>
  );
}