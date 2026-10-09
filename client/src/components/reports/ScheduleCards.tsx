// src/components/ui/ScheduleCards.tsx
import { motion } from 'framer-motion';
import { Phone, MessageSquare, User, CalendarDays, ArrowRight, Clock } from 'lucide-react';

const glassCardClasses = `
  backdrop-blur-2xl bg-white/5 dark:bg-[#0a0f16]/40 
  border border-white/20 dark:border-white/10 
  shadow-[0_15px_30px_rgba(0,0,0,0.1),inset_0_1px_8px_rgba(255,255,255,0.2)] 
  dark:shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_1px_8px_rgba(255,255,255,0.1)]
  rounded-3xl relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 cursor-pointer group
`;

export function NextAppointmentCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.div layoutId="modal-next" onClick={onClick} className={`${glassCardClasses} p-8`}>
      <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
      <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
      
      <div className="relative z-10">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-6 flex items-center gap-2">
          <Clock size={12}/> Next Appointment
        </h4>
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white drop-shadow-sm">Alex Mercer</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">2:30 PM &bull; 2024 Mazda CX-5</p>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors pointer-events-none"><Phone size={14}/> Call</button>
          <button className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors pointer-events-none"><MessageSquare size={14}/> SMS</button>
          <button className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors pointer-events-none"><User size={14}/> Profile</button>
        </div>
      </div>
    </motion.div>
  );
}

export function MasterScheduleCard({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} className={`${glassCardClasses} p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
      <div className="absolute top-0 left-0 w-full h-[50%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-5">
        <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-2xl text-blue-500 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]">
          <CalendarDays size={28}/>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-sm">Master Schedule</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">View & Manage Appointments</p>
        </div>
      </div>

      <div className="relative z-10 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs flex justify-center items-center gap-2 group-hover:bg-white/10 transition-colors">
        Open Center <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
      </div>
    </div>
  );
}