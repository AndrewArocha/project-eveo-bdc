import { ArrowRight } from 'lucide-react';

export function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] border border-white/5">
      <div className="mb-2">{icon}</div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1 text-center">{label}</p>
    </div>
  );
}

export function ClickableStatBox({ icon, label, value, onClick }: { icon: React.ReactNode, label: string, value: string | number, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 rounded-2xl shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] border border-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 group cursor-pointer w-full text-center">
      <div className="mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1 flex items-center justify-center gap-1 w-full">{label} <ArrowRight size={10} className="inline"/></p>
    </button>
  );
}

export function RatioBox({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl flex items-center justify-between border border-white/5 shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)]">
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">{label}</h4>
        <p className="text-xs text-gray-500 mt-1">{sub}</p>
      </div>
      <span className="text-3xl font-black text-white">{value}</span>
    </div>
  );
}