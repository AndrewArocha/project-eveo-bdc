// src/pages/Dashboard/Settings.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Accessibility, Phone, Bell, Mail, Smartphone, Monitor as Desktop } from 'lucide-react';

type SettingsTab = 'appearance' | 'notifications' | 'integrations';
type UserRole = 'bdc' | 'sales' | 'manager';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [role, setRole] = useState<UserRole>('manager');

  // If a user is downgraded while on the integrations tab, kick them back to appearance
  useEffect(() => {
    if (role !== 'manager' && activeTab === 'integrations') {
      setActiveTab('appearance');
    }
  }, [role, activeTab]);

  const glassCardClasses = `
    backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 
    border border-white/50 dark:border-white/10 
    shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6),inset_0_-5px_15px_rgba(0,0,0,0.05)] 
    dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1),inset_0_-5px_15px_rgba(0,0,0,0.2)]
    rounded-3xl relative overflow-hidden
  `;

  // Dynamic Tabs based on RBAC
  const tabs = [
    { id: 'appearance', label: 'Appearance & A11y', icon: <Accessibility size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ] as { id: SettingsTab; label: string; icon: React.ReactNode }[];

  // Only Managers (or Master Admins) get to see the Integrations tab
  if (role === 'manager') {
    tabs.push({ id: 'integrations', label: 'API Integrations', icon: <LinkIcon size={18} /> });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-full w-full max-w-7xl mx-auto px-4 sm:px-8 md:pl-32 py-10 relative"
    >
      {/* Developer Role Toggler (Temporary tool for UI testing) */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-white/10">
        {(['bdc', 'sales', 'manager'] as UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${role === r ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Platform Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure accessibility, alerts, and system preferences.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          <AnimatePresence>
            {tabs.map((tab) => (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <TabButton 
                  active={activeTab === tab.id} 
                  onClick={() => setActiveTab(tab.id as SettingsTab)} 
                  icon={tab.icon} 
                  label={tab.label} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Content Area */}
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

// --- Forms ---

function AppearanceForm() {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Appearance & Accessibility</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Customize EVEO to accommodate your visual and physical needs.</p>
        
        <div className="flex flex-col">
          <ToggleRow label="High Contrast Mode" description="Increases border visibility and darkens translucent backgrounds." enabled={highContrast} onToggle={() => setHighContrast(!highContrast)} />
          <ToggleRow label="Reduced Motion" description="Disables Framer Motion physics, spring animations, and continuous carousels." enabled={reducedMotion} onToggle={() => setReducedMotion(!reducedMotion)} />
          <ToggleRow label="Screen Reader Optimization" description="Forces strict ARIA labeling and bypasses non-essential visual graphs." enabled={screenReader} onToggle={() => setScreenReader(!screenReader)} />
        </div>
      </div>
    </div>
  );
}

function NotificationsForm() {
  const [pushAlerts, setPushAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [emailRecap, setEmailRecap] = useState(true);

  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Notification Preferences</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Control how and when EVEO alerts you to new leads and schedule changes.</p>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2 mt-4">
            <Desktop size={16} className="text-gray-500" />
            <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-widest">Push Notifications</h4>
          </div>
          <ToggleRow label="Desktop Alerts" description="Get browser notifications when a new lead is assigned to you." enabled={pushAlerts} onToggle={() => setPushAlerts(!pushAlerts)} />
          
          <div className="flex items-center gap-3 mb-2 mt-8">
            <Smartphone size={16} className="text-gray-500" />
            <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-widest">Mobile Alerts</h4>
          </div>
          <ToggleRow label="SMS Critical Alerts" description="Receive a text message when an appointment changes status (e.g. Arrived)." enabled={smsAlerts} onToggle={() => setSmsAlerts(!smsAlerts)} />
          
          <div className="flex items-center gap-3 mb-2 mt-8">
            <Mail size={16} className="text-gray-500" />
            <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-widest">Email Digests</h4>
          </div>
          <ToggleRow label="Daily KPI Recap" description="Receive an end-of-day summary of your performance and conversion ratios." enabled={emailRecap} onToggle={() => setEmailRecap(!emailRecap)} />
        </div>
      </div>
    </div>
  );
}

function IntegrationsForm() {
  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Third-Party API Connections</h3>
          <span className="bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">Manager Only</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Configure your GoHighLevel webhooks and Net2Phone 3PCC credentials here.</p>
      </div>

      <div className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center"><LinkIcon size={16} /></div>
          <h4 className="font-bold text-gray-900 dark:text-white">GoHighLevel (eFalcon AI)</h4>
        </div>
        <div className="flex flex-col relative group">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-orange-500">Location API Key</label>
          <input type="password" defaultValue="ghl_loc_xxxx_yyyy_zzzz" className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2 text-base font-semibold focus:outline-none focus:border-orange-500" />
        </div>
      </div>

      <div className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Phone size={16} /></div>
          <h4 className="font-bold text-gray-900 dark:text-white">Net2Phone (3PCC Telephony)</h4>
        </div>
        <div className="flex flex-col relative group">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-orange-500">API Token</label>
          <input type="password" defaultValue="n2p_token_abc123" className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2 text-base font-semibold focus:outline-none focus:border-orange-500" />
        </div>
      </div>
    </div>
  );
}

// Reusable Utilities
function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange-500
      ${active ? 'bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)]' : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string, description: string, enabled: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-gray-200 dark:border-white/10 last:border-0">
      <div className="pr-4">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={onToggle} 
        className={`relative w-12 h-6 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 dark:focus-visible:ring-offset-[#0a0f16] shrink-0
          ${enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/10'}`}
      >
        <motion.div 
          layout 
          className="absolute top-1 bottom-1 w-4 bg-white rounded-full shadow-sm"
          animate={{ left: enabled ? "28px" : "4px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}