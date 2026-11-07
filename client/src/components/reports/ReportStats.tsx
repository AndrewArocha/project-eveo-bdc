// src/components/reports/ReportStats.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

export function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] border border-gray-200 dark:border-white/5">
      <div className="mb-2">{icon}</div>
      <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 mt-1 text-center">{label}</p>
    </div>
  );
}

export function ClickableStatBox({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center p-5 sm:p-6 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-[0.98] rounded-2xl shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] border border-gray-200 dark:border-white/5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 group cursor-pointer w-full text-center"
    >
      <div className="mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 mt-1 flex items-center justify-center gap-1 w-full">
        <span>{label}</span> <ArrowRight size={10} className="inline shrink-0 text-orange-500" />
      </p>
    </button>
  );
}

export function RatioBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gray-50 dark:bg-white/5 p-5 sm:p-6 rounded-2xl flex items-center justify-between gap-4 border border-gray-200 dark:border-white/5 shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)]">
      <div className="min-w-0">
        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 truncate">{label}</h4>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{sub}</p>
      </div>
      <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums shrink-0">{value}</span>
    </div>
  );
}

export default StatBox;