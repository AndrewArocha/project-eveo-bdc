import React from 'react';

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export default function StatBox({ icon, label, value }: StatBoxProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 rounded-2xl min-w-30 shadow-inner border border-gray-200 dark:border-white/5">
      <div className="mb-2">{icon}</div>
      <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{label}</p>
    </div>
  );
}