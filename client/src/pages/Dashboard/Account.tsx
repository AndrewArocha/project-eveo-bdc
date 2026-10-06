// src/pages/Dashboard/Account.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Camera, Mail, Smartphone, CheckCircle2, ChevronDown, Calendar, DollarSign, AlertCircle, Car, FileText, Target, Clock, Coffee } from 'lucide-react';
import SaveButton from '../../components/UI/SaveButton';
import InputField from '../../components/UI/InputField';
import TabButton from '../../components/UI/TabButton';
import SmartCalendar from '../../components/UI/SmartCalendar';

type AccountTab = 'profile' | 'security' | 'schedule' | 'payroll';
type UserRole = 'bdc' | 'sales' | 'manager';

export default function Account() {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const [role, setRole] = useState<UserRole>('bdc');

  const glassCardClasses = `
    backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 
    border border-white/50 dark:border-white/10 
    shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6),inset_0_-5px_15px_rgba(0,0,0,0.05)] 
    dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1),inset_0_-5px_15px_rgba(0,0,0,0.2)]
    rounded-3xl relative overflow-hidden
  `;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-full w-full max-w-7xl mx-auto px-4 sm:px-8 md:pl-32 py-10 relative">
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-white/10">
        {(['bdc', 'sales', 'manager'] as UserRole[]).map((r) => (
          <button 
            key={r} 
            onClick={() => {
              setRole(r);
              if (r === 'manager' && activeTab === 'payroll') setActiveTab('profile');
            }} 
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${role === r ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Account & Workplace</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your identity, schedule, and personal commission tracking.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="User Profile" />
          <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={18} />} label="Schedule & Time Off" />
          {role !== 'manager' && (
            <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={<DollarSign size={18} />} label="Commission Tracker" />
          )}
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={18} />} label="Security & 2FA" />
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`${glassCardClasses} p-6 sm:p-10`}>
              <div className="absolute top-0 left-0 w-full h-[30%] bg-linear-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none" />
              {activeTab === 'profile' && <ProfileForm />}
              {activeTab === 'schedule' && <ScheduleForm role={role} />}
              {activeTab === 'payroll' && role !== 'manager' && <PayrollForm role={role} />}
              {activeTab === 'security' && <SecurityForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileForm() {
  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div className="flex items-center gap-6 pb-8 border-b border-gray-200 dark:border-white/10">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-orange-400 to-orange-600 shadow-lg flex items-center justify-center text-white text-3xl font-black overflow-hidden border-2 border-white/20">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-white/30 rounded-[100%] pointer-events-none" />
            AH
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Camera size={14} /></button>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Andres Hernandez</h3>
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mt-1">BDC Agent</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        <InputField label="Full Name" defaultValue="Andres Hernandez" />
        <InputField label="Primary Email" defaultValue="andres@dealership.com" type="email" />
        <PhoneVerificationField />
        
        <div className="flex flex-col relative group opacity-75">
          <label className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            <span>Work Phone (Net2Phone)</span>
            <span className="text-orange-500">Managed by Admin</span>
          </label>
          <div className="relative">
            <input type="text" defaultValue="Ext. 104" disabled className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2 text-base font-semibold text-gray-900 dark:text-white disabled:cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <SaveButton label="Save Profile" />
      </div>
    </div>
  );
}

function ScheduleForm({ role }: { role: UserRole }) {
  const [hasSubmittedSchedule, setHasSubmittedSchedule] = useState(false);
  const [showCalendar, setShowCalendar] = useState<string | null>(null);
  const [expandShifts, setExpandShifts] = useState(false);
  
  const isManager = role === 'manager';

  const MOCK_COMPLETED_SHIFTS = [
    { date: 'Oct 5', hours: '9:00 AM - 6:00 PM', status: 'COMPLETE', overtime: true },
    { date: 'Oct 4', hours: '9:00 AM - 6:00 PM', status: 'COMPLETE', overtime: false },
    { date: 'Oct 2', hours: '10:00 AM - 4:00 PM', status: 'COMPLETE', overtime: false },
    { date: 'Oct 1', hours: '9:00 AM - 6:00 PM', status: 'MISSED', overtime: false },
  ];

  const TEAM_MEMBERS = [
    { name: 'Sarah J.', schedule: 'Sun - Fri', daysOff: 'Off Sat', pendingRequest: true },
    { name: 'Erick', schedule: 'Tue - Sat', daysOff: 'Off Sun & Mon', pendingRequest: false },
    { name: 'Michael T.', schedule: 'Wed - Sun', daysOff: 'Off Mon & Tue', pendingRequest: false },
  ];

  if (isManager) {
    return (
      <div className="relative z-10 flex flex-col gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Team Schedule Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Review agent schedules, verify completed shifts, and track requested days off.</p>
        </div>
        
        <div className="flex flex-col gap-4">
          {TEAM_MEMBERS.map(agent => (
            <div key={agent.name} className="bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 shrink-0 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center"><User size={18}/></div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{agent.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Today: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowCalendar(agent.name)} className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer">
                  {agent.pendingRequest && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse" />}
                  <Calendar size={14}/> See Details
                </button>
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 cursor-default">
                  <Clock size={14}/> {agent.schedule}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 cursor-default">
                  <Coffee size={14}/> {agent.daysOff}
                </div>
              </div>
            </div>
          ))}
        </div>
        <AnimatePresence>{showCalendar && <SmartCalendar agentName={showCalendar} role={role} onClose={() => setShowCalendar(null)} />}</AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Shift Management</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Your schedule feeds directly into the daily dealership KPI targets.</p>
      </div>

      {!hasSubmittedSchedule ? (
        <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 text-orange-500 mb-6"><AlertCircle size={20} /><h4 className="font-bold">Initial Schedule Setup Required</h4></div>
          <div className="grid grid-cols-1 gap-4 mb-6">
             {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
               <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 gap-2">
                 <span className="font-semibold text-gray-900 dark:text-white w-24">{day}</span>
                 <div className="flex gap-2 items-center">
                   <select className="bg-transparent border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-sm dark:text-white outline-none"><option>9:00 AM</option><option>OFF</option></select>
                   <span className="text-gray-500">to</span>
                   <select className="bg-transparent border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-sm dark:text-white outline-none"><option>6:00 PM</option><option>OFF</option></select>
                 </div>
               </div>
             ))}
          </div>
          <SaveButton label="Lock in Schedule" onClick={() => setHasSubmittedSchedule(true)} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-6 border border-gray-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 shrink-0 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 size={24}/></div>
               <div><h4 className="font-bold text-gray-900 dark:text-white">Schedule Locked</h4><p className="text-sm text-gray-500 mt-1">Mon-Fri (9AM-6PM), Sat (10AM-4PM)</p></div>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg shrink-0">Active</span>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-white/10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Schedule Tracking</h3>
              <button onClick={() => setShowCalendar('self')} className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500 self-start sm:self-auto cursor-pointer shadow-sm">
                See Detailed Schedule +
              </button>
            </div>
            
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Completed Shifts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {MOCK_COMPLETED_SHIFTS.slice(0, expandShifts ? undefined : 3).map((shift, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={i} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5 relative overflow-hidden shadow-sm">
                    {shift.overtime && <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse" title="Overtime Logged" />}
                    <p className="font-bold text-gray-900 dark:text-white">{shift.date}</p>
                    <p className="text-xs text-gray-500 mt-1">{shift.hours}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 inline-block px-2 py-0.5 rounded ${shift.status === 'COMPLETE' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-red-600 dark:text-red-400 bg-red-500/10'}`}>{shift.status}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {MOCK_COMPLETED_SHIFTS.length > 3 && (
              <button onClick={() => setExpandShifts(!expandShifts)} className="mt-4 text-xs font-bold text-gray-500 hover:text-orange-500 transition-colors uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded px-1">
                {expandShifts ? "Show Less" : `View All (${MOCK_COMPLETED_SHIFTS.length})`}
              </button>
            )}
          </div>
        </div>
      )}
      <AnimatePresence>{showCalendar && <SmartCalendar agentName={showCalendar} role={role} onClose={() => setShowCalendar(null)} />}</AnimatePresence>
    </div>
  );
}

function PayrollForm({ role }: { role: UserRole }) {
  const isBDC = role === 'bdc';
  
  const formatCurrency = (amount: number) => {
    if (isBDC) return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const payoutTotal = isBDC ? 1460000 : 2450;
  
  const metrics = isBDC ? [
    { label: 'Appointments Shown', count: '14 Shows', rate: '40,000 COP/ea', total: 560000, icon: <User size={16}/>, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Appointments Sold', count: '4 Sold', rate: '100,000 COP/ea', total: 400000, icon: <Car size={16}/>, color: 'text-blue-500', bg: 'bg-blue-500/10' }
  ] : [
    { label: 'Flats / Minimums', count: '4 Flats', rate: '$250/ea minimum', total: 1000, icon: <Car size={16}/>, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Gross Profit Split', count: 'Front/Back', rate: '20% Margin', total: 1450, icon: <Target size={16}/>, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  ];

  const bonusTier = isBDC ? { current: 14, target: 20, reward: '200,000 COP Bonus', label: 'Shows' } : { current: 4, target: 10, reward: '$500 Volume Bonus', label: 'Cars Sold' };

  const mockLedger = isBDC ? [
    { date: 'Oct 6', customer: 'Gordon Freeman', type: 'Show', amount: 40000, status: 'Funded' },
    { date: 'Oct 4', customer: 'Alyx Vance', type: 'Sold', amount: 100000, status: 'Pending' },
  ] : [
    { date: 'Oct 6', customer: 'Gordon Freeman', type: 'Flat', amount: 250, status: 'Funded' },
    { date: 'Oct 4', customer: 'Alyx Vance', type: 'Gross %', amount: 840, status: 'Pending' },
  ];

  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Private Commission Tracker</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">This data is private. Replace your spreadsheets and track your real-time earnings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-linear-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 rounded-3xl p-8 flex flex-col justify-center items-center shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-20"><DollarSign size={64}/></div>
           <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-2 z-10">Variable Payout</p>
           <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white z-10">{formatCurrency(payoutTotal)}</h2>
           <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 z-10">Period: Oct 1 - Oct 15</p>
        </div>

        <div className="flex flex-col gap-4">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200 dark:border-white/10 flex justify-between items-center gap-4">
               <div className="flex items-center gap-3">
                 <div className={`${metric.bg} ${metric.color} p-2 rounded-lg shrink-0`}>{metric.icon}</div>
                 <div><p className="text-sm font-bold text-gray-900 dark:text-white">{metric.label}</p><p className="text-xs text-gray-500">{metric.count} ({metric.rate})</p></div>
               </div>
               <p className="text-lg font-black text-gray-900 dark:text-white shrink-0">{formatCurrency(metric.total)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/5">
         <div className="flex justify-between items-end mb-4">
           <div><p className="text-sm font-bold text-gray-900 dark:text-white">Next Bonus Tier</p><p className="text-xs text-gray-500 mt-1">{bonusTier.target} {bonusTier.label} required for {bonusTier.reward}</p></div>
           <p className="text-lg font-black text-orange-500">{bonusTier.current} / {bonusTier.target}</p>
         </div>
         <div className="w-full bg-gray-200 dark:bg-white/10 h-3 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(bonusTier.current / bonusTier.target) * 100}%` }} />
         </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FileText size={18} className="text-gray-400"/> Commission Ledger</h3>
        <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-125">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4 text-right">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {mockLedger.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4 text-gray-500">{row.date}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{row.customer}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.type}</td>
                  <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(row.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${row.status === 'Funded' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SecurityForm() {
  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
          <InputField label="Current Password" type="password" />
          <InputField label="New Password" type="password" />
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Two-Factor Authentication (2FA)</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center"><Smartphone size={20}/></div>
              <div><p className="font-bold text-gray-900 dark:text-white">Authenticator App</p><p className="text-xs text-gray-500 leading-relaxed">Use Google Authenticator or Authy</p></div>
            </div>
            <span className="px-3 py-1 self-start sm:self-auto rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0">Enabled</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-500 flex items-center justify-center"><Mail size={20}/></div>
              <div><p className="font-bold text-gray-900 dark:text-white">Recovery Email</p><p className="text-xs text-gray-500 leading-relaxed">backup@personal.com</p></div>
            </div>
            <button className="text-xs font-bold self-start sm:self-auto text-gray-500 hover:text-orange-500 transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded px-1">Edit</button>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <SaveButton label="Update Security" />
      </div>
    </div>
  );
}

function PhoneVerificationField() {
  const [phone, setPhone] = useState("300 000 0000");
  const [isVerified, setIsVerified] = useState(true);

  return (
    <div className="flex flex-col relative group">
      <label className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-orange-500">
        <span>Personal Phone (SMS)</span>{!isVerified && <span className="text-red-500">Verification Required</span>}
      </label>
      <div className="relative flex items-center bg-transparent border-b border-gray-300 dark:border-white/20 py-1 transition-colors focus-within:border-orange-500">
        <div className="relative flex items-center text-gray-900 dark:text-white font-semibold pr-2 border-r border-gray-300 dark:border-white/20 mr-3">
          <select className="bg-transparent appearance-none outline-none cursor-pointer pl-1 pr-6 py-1 z-10"><option value="+1" className="text-black">🇺🇸 +1</option><option value="+57" className="text-black">🇨🇴 +57</option></select>
          <ChevronDown size={14} className="absolute right-1 pointer-events-none text-gray-400" />
        </div>
        <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setIsVerified(false); }} className="flex-1 bg-transparent py-1 text-base font-semibold text-gray-900 dark:text-white outline-none w-full min-w-0" />
        <div className="shrink-0 ml-2">
          {isVerified ? <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20"><CheckCircle2 size={14} /> Verified</span> : <button className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg border border-orange-500/20 transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Send OTP</button>}
        </div>
        <div className="absolute -bottom-px left-0 h-0.5 w-0 bg-orange-500 transition-all duration-300 group-focus-within:w-full" />
      </div>
    </div>
  );
}