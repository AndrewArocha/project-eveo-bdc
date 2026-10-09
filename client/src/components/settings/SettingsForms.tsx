import { motion } from 'framer-motion';
import { Monitor as Desktop, Smartphone, Link as LinkIcon, Phone, Volume2 } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';
import { useSettings } from '../../contexts/SettingsContext';

export function AppearanceForm() {
  const { settings, updateSetting } = useSettings();

  const handleToggle = (key: keyof typeof settings) => {
    soundEngine.click();
    updateSetting(key, !settings[key]);
  };

  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Appearance & Accessibility</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Customize EVEO to accommodate your visual and physical needs.</p>
        
        <div className="flex flex-col">
          <ToggleRow label="High Contrast Mode" description="Increases border visibility and darkens translucent backgrounds." enabled={settings.highContrast} onToggle={() => handleToggle('highContrast')} />
          <ToggleRow label="Reduced Motion" description="Disables Framer Motion physics, spring animations, and continuous carousels." enabled={settings.reducedMotion} onToggle={() => handleToggle('reducedMotion')} />
          <ToggleRow label="Screen Reader Optimization" description="Forces strict ARIA labeling and bypasses non-essential visual graphs." enabled={settings.screenReader} onToggle={() => handleToggle('screenReader')} />
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
             <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-widest mb-4">Workspace Layout</h4>
             <ToggleRow label="Compact UI Mode" description="Reduces padding and shrinks text sizes to fit more data on screen." enabled={settings.compactMode} onToggle={() => handleToggle('compactMode')} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsForm() {
  const { settings, updateSetting } = useSettings();

  const handleToggle = (key: keyof typeof settings) => {
    soundEngine.click();
    updateSetting(key, !settings[key]);
  };

  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sound & Alerts</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Control how and when EVEO alerts you to new leads and schedule changes.</p>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2 mt-2"><Volume2 size={16} className="text-gray-500" /><h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-widest">Sound Engine</h4></div>
          <ToggleRow label="Enable App Sounds" description="Play audio cues for notifications, incoming leads, and UI clicks." enabled={settings.soundEnabled} onToggle={() => handleToggle('soundEnabled')} />
          
          {settings.soundEnabled && (
            <div className="py-4 pl-4 pr-2 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Master Volume</span>
              <input type="range" min="0" max="1" step="0.1" value={settings.uiVolume} onChange={(e) => updateSetting('uiVolume', parseFloat(e.target.value))} className="w-32 accent-orange-500 cursor-pointer" />
            </div>
          )}

          <div className="flex items-center gap-3 mb-2 mt-8"><Desktop size={16} className="text-gray-500" /><h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-widest">Push Notifications</h4></div>
          <ToggleRow label="Desktop Alerts" description="Get browser notifications when a new lead is assigned to you." enabled={true} onToggle={() => {}} />
          
          <div className="flex items-center gap-3 mb-2 mt-8"><Smartphone size={16} className="text-gray-500" /><h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-widest">Mobile Alerts</h4></div>
          <ToggleRow label="SMS Critical Alerts" description="Receive a text message when an appointment changes status." enabled={false} onToggle={() => {}} />
        </div>
      </div>
    </div>
  );
}

export function IntegrationsForm() {
  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Third-Party API Connections</h3>
          <span className="bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">Manager Only</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Configure your GoHighLevel webhooks and Net2Phone credentials here.</p>
      </div>

      <div className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center"><LinkIcon size={16} /></div><h4 className="font-bold text-gray-900 dark:text-white">GoHighLevel</h4></div>
        <div className="flex flex-col relative group"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-orange-500">Location API Key</label><input type="password" defaultValue="ghl_loc_xxxx_yyyy_zzzz" className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2 font-semibold outline-none focus:border-orange-500" /></div>
      </div>

      <div className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Phone size={16} /></div><h4 className="font-bold text-gray-900 dark:text-white">Net2Phone</h4></div>
        <div className="flex flex-col relative group"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-orange-500">API Token</label><input type="password" defaultValue="n2p_token_abc123" className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2 font-semibold outline-none focus:border-orange-500" /></div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string, description: string, enabled: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-gray-200 dark:border-white/10 last:border-0">
      <div className="pr-4">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      <button onClick={onToggle} className={`relative w-12 h-6 rounded-full transition-colors outline-none shrink-0 ${enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/10'}`}>
        <motion.div layout className="absolute top-1 bottom-1 w-4 bg-white rounded-full shadow-sm" animate={{ left: enabled ? "28px" : "4px" }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}