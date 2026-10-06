// src/pages/Dashboard/Account.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Camera, Save, Mail, Smartphone, CheckCircle2, ChevronDown } from 'lucide-react';

type AccountTab = 'profile' | 'security';

export default function Account() {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');

  const glassCardClasses = `
    backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 
    border border-white/50 dark:border-white/10 
    shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6),inset_0_-5px_15px_rgba(0,0,0,0.05)] 
    dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1),inset_0_-5px_15px_rgba(0,0,0,0.2)]
    rounded-3xl relative overflow-hidden
  `;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-full w-full max-w-7xl mx-auto px-4 sm:px-8 md:pl-32 py-10"
    >
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Account</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your identity, contact routing, and security.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="User Profile" />
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={18} />} label="Security & 2FA" />
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`${glassCardClasses} p-6 sm:p-10`}
            >
              <div className="absolute top-0 left-0 w-full h-[30%] bg-linear-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none" />
              {activeTab === 'profile' && <ProfileForm />}
              {activeTab === 'security' && <SecurityForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// --- Forms ---

function ProfileForm() {
  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div className="flex items-center gap-6 pb-8 border-b border-gray-200 dark:border-white/10">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-orange-400 to-orange-600 shadow-lg flex items-center justify-center text-white text-3xl font-black overflow-hidden border-2 border-white/20">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-white/30 rounded-[100%] pointer-events-none" />
            AH
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Camera size={14} />
          </button>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Andres Hernandez</h3>
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mt-1">BDC Manager</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        <InputField label="Full Name" defaultValue="Andres Hernandez" />
        <InputField label="Primary Email" defaultValue="admin@dealership.com" type="email" />
        
        {/* Secure dual-phone setup */}
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
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Authenticator App</p>
                <p className="text-xs text-gray-500 leading-relaxed">Use Google Authenticator or Authy</p>
              </div>
            </div>
            <span className="px-3 py-1 self-start sm:self-auto rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0">Enabled</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-500 flex items-center justify-center"><Mail size={20}/></div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Recovery Email</p>
                <p className="text-xs text-gray-500 leading-relaxed">backup@personal.com</p>
              </div>
            </div>
            <button className="text-xs font-bold self-start sm:self-auto text-gray-500 hover:text-orange-500 transition-colors shrink-0">Edit</button>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <SaveButton label="Update Security" />
      </div>
    </div>
  );
}

// --- Specialized Phone Component ---

function PhoneVerificationField() {
  const originalNumber = "300 000 0000";
  const [phone, setPhone] = useState(originalNumber);
  const [country, setCountry] = useState("+57");
  const [isVerified, setIsVerified] = useState(true);

  // If they type a new number, immediately revoke the 'Verified' status
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val !== originalNumber) {
      setIsVerified(false);
    } else {
      setIsVerified(true);
    }
  };

  return (
    <div className="flex flex-col relative group">
      <label className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-orange-500">
        <span>Personal Phone (SMS)</span>
        {!isVerified && <span className="text-red-500">Verification Required</span>}
      </label>
      
      <div className="relative flex items-center bg-transparent border-b border-gray-300 dark:border-white/20 py-1 transition-colors focus-within:border-orange-500">
        {/* Country Selector */}
        <div className="relative flex items-center text-gray-900 dark:text-white font-semibold pr-2 border-r border-gray-300 dark:border-white/20 mr-3">
          <select 
            value={country}
            onChange={(e) => { setCountry(e.target.value); setIsVerified(false); }}
            className="bg-transparent appearance-none outline-none cursor-pointer pl-1 pr-6 py-1 z-10"
          >
            <option value="+1" className="text-black">🇺🇸 +1</option>
            <option value="+57" className="text-black">🇨🇴 +57</option>
          </select> {/* <-- Fixed the stray closing tag here! */}
          <ChevronDown size={14} className="absolute right-1 pointer-events-none text-gray-400" />
        </div>

        {/* Number Input */}
        <input 
          type="tel" 
          value={phone}
          onChange={handlePhoneChange}
          placeholder="000 000 0000"
          className="flex-1 bg-transparent py-1 text-base font-semibold text-gray-900 dark:text-white outline-none w-full min-w-0" 
        />

        {/* Verification Status Badge / Button */}
        <div className="shrink-0 ml-2">
          {isVerified ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 size={14} /> Verified
            </span>
          ) : (
            <button className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg border border-orange-500/20 transition-colors shadow-sm">
              Send OTP
            </button>
          )}
        </div>

        <div className="absolute -bottom-px left-0 h-0.5 w-0 bg-orange-500 transition-all duration-300 group-focus-within:w-full" />
      </div>
      
      {!isVerified && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
          A verification code will be sent to confirm this device for recovery and alerts.
        </p>
      )}
    </div>
  );
}

// --- Reusable Utilities ---

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
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

function InputField({ label, defaultValue, type = "text", disabled = false }: { label: string, defaultValue?: string, type?: string, disabled?: boolean }) {
  return (
    <div className="flex flex-col relative group">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-orange-500">
        {label}
      </label>
      <div className="relative">
        <input 
          type={type} 
          defaultValue={defaultValue} 
          disabled={disabled} 
          className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2 text-base font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
        />
        {!disabled && (
          <div className="absolute -bottom-px left-0 h-0.5 w-0 bg-orange-500 transition-all duration-300 group-focus-within:w-full" />
        )}
      </div>
    </div>
  );
}

function SaveButton({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 dark:focus-visible:ring-offset-[#0a0f16]">
      <Save size={18} /> {label}
    </button>
  );
}