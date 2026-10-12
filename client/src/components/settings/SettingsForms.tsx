import { motion } from 'framer-motion';
import { Monitor as Desktop, Smartphone, Link as LinkIcon, Phone, Volume2, Database, Lock, Users, Share2, Target } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';
import { useSettings } from '../../contexts/SettingsContext';
import { mockIntegrations } from '../../data/mockDatabase';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
          <ToggleRow label="Desktop Alerts" description="Get browser notifications when a new lead is assigned to you." enabled={true} onToggle={() => { }} />

          <div className="flex items-center gap-3 mb-2 mt-8"><Smartphone size={16} className="text-gray-500" /><h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-widest">Mobile Alerts</h4></div>
          <ToggleRow label="SMS Critical Alerts" description="Receive a text message when an appointment changes status." enabled={false} onToggle={() => { }} />
        </div>
      </div>
    </div>
  );
}

// --- 🌟 UPDATED: DYNAMIC INTEGRATIONS FORM ---
export function IntegrationsForm() {
  const formatMaskedKey = (val: string) => val.length > 8 ? `${val.substring(0, 8)}••••••••••••` : '••••••••••••••••';

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'CRM': return <Users size={16} className="text-blue-500" />;
      case 'Inventory': return <Database size={16} className="text-emerald-500" />;
      case 'Social': return <Share2 size={16} className="text-pink-500" />;
      case 'Lead Source': return <Target size={16} className="text-orange-500" />;
      case 'Telephony': return <Phone size={16} className="text-purple-500" />;
      default: return <LinkIcon size={16} className="text-gray-500" />;
    }
 };

 const navigate = useNavigate();
 const { role } = useAuth();

  return (
    <div className="relative z-10 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 dark:border-white/10 gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Third-Party API Connections</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">View active data pipelines syncing with your workspace.</p>
        </div>
        {(role === 'owner') ? (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-500 border border-orange-500/20 hover:border-orange-500/40 text-xs font-bold rounded-xl transition-all outline-none cursor-pointer shrink-0"
          >
            Manage in Admin <ArrowRight size={14} />
          </button>
        ) : (
          <span className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded border border-red-500/20 shrink-0">
            <Lock size={12} /> MANAGER ONLY
          </span>
        )}
      </div>

      <div className="bg-white/50 dark:bg-white/2 border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden">
        {mockIntegrations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No active integrations. Store Administrators must configure these in the Admin Portal.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-white/5">
            {mockIntegrations.map((integration) => (
              <div key={integration.id} className="p-6 flex flex-col gap-3 group transition-colors hover:bg-white/50 dark:hover:bg-white/2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
                    {getIntegrationIcon(integration.type)}
                  </div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">{integration.provider}</h4>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {integration.type === 'Inventory' ? 'FEED URL' : 'API KEY / TOKEN'}
                  </p>
                  <p className="font-mono text-gray-400 dark:text-gray-500 text-sm flex items-center gap-2">
                    <Lock size={12} className="text-gray-400" />
                    {formatMaskedKey(integration.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <strong className="text-gray-900 dark:text-white">Read-Only View:</strong> Full API keys and endpoints are hidden for security purposes. Only users with Manager or Owner privileges can modify these settings via the Admin Portal.
        </p>
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