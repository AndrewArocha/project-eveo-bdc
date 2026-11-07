// src/components/reports/ScheduleCards.tsx
import { useState, useEffect } from 'react';
import { getNextAppointment } from '../../utils/appointmentManager';
import { Phone, MessageSquare, User, CalendarDays, ArrowRight, Clock } from 'lucide-react';
import { playHover, playModalOpen } from '../../utils/soundEngine';

const glassCardClasses = `
  backdrop-blur-2xl bg-white/5 dark:bg-[#0a0f16]/40
  border border-white/20 dark:border-white/10
  shadow-[0_15px_30px_rgba(0,0,0,0.1),inset_0_1px_8px_rgba(255,255,255,0.2)]
  dark:shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_1px_8px_rgba(255,255,255,0.1)]
  rounded-3xl relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 active:scale-[0.99] cursor-pointer group select-none
`;

const FALLBACK_APPT = {
  customer: 'No Upcoming Appointments',
  time: 'Enjoy your day!',
  vehicle: 'Schedule clear',
};

export function NextAppointmentCard({ storeId, onClick }: { storeId: string; onClick: () => void }) {
  const [nextAppt, setNextAppt] = useState(FALLBACK_APPT);

  useEffect(() => {
    const fetchNextAppointment = () => {
      const appt = getNextAppointment(storeId);
      if (appt) {
        setNextAppt({
          customer: appt.customer || appt.name || 'Upcoming Client',
          time: appt.time,
          vehicle: appt.vehicle,
        });
      } else {
        setNextAppt(FALLBACK_APPT);
      }
    };

    fetchNextAppointment();
    window.addEventListener('appointmentsUpdated', fetchNextAppointment);
    return () => window.removeEventListener('appointmentsUpdated', fetchNextAppointment);
  }, [storeId]);

  const hasAppt = nextAppt.customer !== FALLBACK_APPT.customer;

  return (
    <div
      onMouseEnter={() => playHover()}
      onClick={() => {
        playModalOpen();
        onClick();
      }}
      className={`${glassCardClasses} p-5 sm:p-7`}
    >
      <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

      {hasAppt && (
        <div className="absolute top-5 right-5 sm:top-6 sm:right-6 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
      )}

      <div className="relative z-10">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-3 sm:mb-5 flex items-center gap-2">
          <Clock size={12} /> Next Appointment
        </h4>
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-xs truncate">
            {nextAppt.customer}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1 truncate">
            {nextAppt.time} &bull; {nextAppt.vehicle}
          </p>
        </div>

        <div className={`grid grid-cols-3 gap-2.5 transition-opacity duration-300 ${!hasAppt ? 'opacity-35' : 'opacity-100'}`}>
          <span className="py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5">
            <Phone size={13} /> Call
          </span>
          <span className="py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5">
            <MessageSquare size={13} /> SMS
          </span>
          <span className="py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5">
            <User size={13} /> Profile
          </span>
        </div>
      </div>
    </div>
  );
}

export function MasterScheduleCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onMouseEnter={() => playHover()}
      onClick={() => {
        playModalOpen();
        onClick();
      }}
      className={`${glassCardClasses} p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 h-full`}
    >
      <div className="absolute top-0 left-0 w-full h-[50%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3.5 min-w-0">
        <div className="p-3.5 bg-blue-500/20 border border-blue-500/30 rounded-2xl text-blue-500 group-hover:scale-105 group-hover:bg-blue-500/30 transition-all shadow-[inset_0_0_15px_rgba(59,130,246,0.2)] shrink-0">
          <CalendarDays size={22} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 drop-shadow-xs truncate">
            Master Schedule
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 truncate">
            View &amp; Manage Appts
          </p>
        </div>
      </div>

      <div className="relative z-10 ml-auto px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs flex justify-center items-center gap-1.5 group-hover:bg-white/10 transition-colors shrink-0">
        <span>Open Center</span>
        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform text-orange-500" />
      </div>
    </div>
  );
}