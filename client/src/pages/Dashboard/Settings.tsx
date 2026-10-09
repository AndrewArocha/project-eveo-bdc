import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Accessibility, Bell } from 'lucide-react';
import TabButton from '../../components/account/TabButton';
import { type UserRole } from '../../data/mockDatabase';
import { AppearanceForm, NotificationsForm, IntegrationsForm } from '../../components/settings/SettingsForms';

type SettingsTab = 'appearance' | 'notifications' | 'integrations';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [role, setRole] = useState<UserRole>('manager');

  useEffect(() => {
    if (role !== 'manager' && activeTab === 'integrations') setActiveTab('appearance');
  }, [role, activeTab]);

  const glassCardClasses = `backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 border border-white/50 dark:border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1)] rounded-3xl relative overflow-hidden`;

  const tabs = [
    { id: 'appearance', label: 'Appearance & A11y', icon: <Accessibility size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ] as { id: SettingsTab; label: string; icon: React.ReactNode }[];

  if (role === 'manager') tabs.push({ id: 'integrations', label: 'API Integrations', icon: <LinkIcon size={18} /> });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-full w-full max-w-7xl mx-auto px-4 sm:px-8 md:pl-32 py-10 relative">
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-white/10">
        {(['bdc', 'sales', 'manager'] as UserRole[]).map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${role === r ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}>{r}</button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Platform Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure accessibility, alerts, and system preferences.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          <AnimatePresence>
            {tabs.map((tab) => (
              <motion.div key={tab.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <TabButton active={activeTab === tab.id} onClick={() => setActiveTab(tab.id as SettingsTab)} icon={tab.icon} label={tab.label} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`${glassCardClasses} p-6 sm:p-10`}>
              <div className="absolute top-0 left-0 w-full h-[30%] bg-linear-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none" />
              {activeTab === 'appearance' && <AppearanceForm />}
              {activeTab === 'notifications' && <NotificationsForm />}
              {activeTab === 'integrations' && <IntegrationsForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}