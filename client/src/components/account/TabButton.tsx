import React from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export default function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  const baseClasses = "w-full flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1.5 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-bold tracking-wide transition-all outline-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer select-none text-center sm:text-left";

  const activeClasses = active
    ? "bg-orange-500 text-white shadow-[0_6px_18px_rgba(249,115,22,0.35)]"
    : "text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white";

  return (
    <button type="button" onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      <span className="shrink-0">{icon}</span>
      <span className="truncate max-w-full">{label}</span>
    </button>
  );
}