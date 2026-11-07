import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Calendar, DollarSign, Building2, Camera } from 'lucide-react';
import TabButton from '../../components/account/TabButton';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { ProfileForm, ScheduleForm, PayrollForm, SecurityForm } from '../../components/account/AccountForms';

type AccountTab = 'profile' | 'security' | 'schedule' | 'payroll';

export default function Account() {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const { role } = useAuth();
  const { activeStore } = useStoreAppearance();
  const [avatarImg, setAvatarImg] = useState<string | null>(localStorage.getItem('eveo_avatar'));
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleAvatarUpdate = () => setAvatarImg(localStorage.getItem('eveo_avatar'));
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarImg(result);
      localStorage.setItem('eveo_avatar', result);
      window.dispatchEvent(new Event('avatarUpdated'));
    };
    reader.readAsDataURL(file);
  };

  // Managers do not have access to Payroll/Disbursements
  const showPayrollTab = role !== 'manager';
  const currentTab: AccountTab = (!showPayrollTab && activeTab === 'payroll') ? 'profile' : activeTab;

  const glassCardClasses = `backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 border border-white/50 dark:border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1)] rounded-3xl relative overflow-hidden`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-full w-full max-w-6xl mx-auto px-4 sm:px-8 md:pl-32 pt-4 sm:pt-8 pb-10 relative overflow-x-hidden select-none sm:select-auto"
    >
      {/* Compact, Visual-First Identity Header (Direct Avatar Upload Orb built right in!) */}
      <div className={`${glassCardClasses} p-4 sm:p-5 mb-5 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            onClick={() => avatarInputRef.current?.click()}
            title="Tap to change profile photo"
            className="relative group cursor-pointer shrink-0"
          >
            <input
              id="header-avatar-upload"
              name="header_avatar_upload"
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              aria-label="Upload profile avatar"
              className="hidden"
            />
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-radial-[at_30%_25%] from-orange-400 via-orange-600 to-orange-950 shadow-[inset_0_2px_6px_rgba(255,255,255,0.45),0_6px_16px_rgba(249,115,22,0.3)] flex items-center justify-center text-white text-lg font-black overflow-hidden border border-white/25 relative transition-transform group-hover:scale-105 active:scale-95">
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[68%] h-[34%] bg-white/30 rounded-full pointer-events-none z-20" />
              {avatarImg ? (
                <img src={avatarImg} alt="Andres Hernandez Avatar" className="w-full h-full object-cover relative z-10" />
              ) : (
                <span className="relative z-10">AH</span>
              )}
            </div>
            {/* Mini 3D Glass Camera Orb */}
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#0a0f16] border border-white/25 text-orange-400 flex items-center justify-center shadow-md z-30 group-hover:scale-110 transition-transform">
              <Camera size={11} />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                Andres Hernandez
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase tracking-widest shrink-0">
                {role.replace('_', ' ')}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
              <Building2 size={12} className="text-orange-500 shrink-0" />
              <span className="truncate font-semibold">{activeStore.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] shrink-0" title="Active Roster" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation + Active Surface */}
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
        {/* Compact Segmented Pill Bar on Mobile / Sidebar on Desktop */}
        <div className={`w-full lg:w-56 shrink-0 grid ${showPayrollTab ? 'grid-cols-4' : 'grid-cols-3'} lg:flex lg:flex-col gap-1.5 p-1.5 lg:p-0 rounded-2xl bg-white/40 dark:bg-white/4 lg:bg-transparent dark:lg:bg-transparent border border-gray-200/60 dark:border-white/10 lg:border-transparent`}>
          <TabButton
            active={currentTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            icon={<User size={17} />}
            label="Profile"
          />
          <TabButton
            active={currentTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
            icon={<Calendar size={17} />}
            label="Schedule"
          />
          {showPayrollTab && (
            <TabButton
              active={currentTab === 'payroll'}
              onClick={() => setActiveTab('payroll')}
              icon={<DollarSign size={17} />}
              label={role === 'owner' ? "Payouts" : "Earnings"}
            />
          )}
          <TabButton
            active={currentTab === 'security'}
            onClick={() => setActiveTab('security')}
            icon={<Shield size={17} />}
            label="Security"
          />
        </div>

        {/* Active Tab Surface */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentTab}-${role}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`${glassCardClasses} p-4 sm:p-7`}
            >
              <div className="absolute top-0 left-0 w-full h-28 bg-linear-to-b from-white/25 dark:from-white/5 to-transparent pointer-events-none" />
              {currentTab === 'profile' && <ProfileForm />}
              {currentTab === 'schedule' && <ScheduleForm role={role} />}
              {currentTab === 'payroll' && showPayrollTab && <PayrollForm role={role} />}
              {currentTab === 'security' && <SecurityForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}