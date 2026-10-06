import { Save } from 'lucide-react';

export default function SaveButton({ label, onClick }: { label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 dark:focus-visible:ring-offset-[#0a0f16]">
      <Save size={18} /> {label}
    </button>
  );
}