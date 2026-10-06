import React from 'react';

export default function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  const baseClasses = "w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange-500";
  const activeClasses = active 
    ? "bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)]" 
    : "text-gray-500 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white";

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      {icon} {label}
    </button>
  );
}