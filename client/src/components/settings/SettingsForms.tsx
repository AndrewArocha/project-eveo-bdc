// src/components/settings/SettingsForms.tsx
import { motion } from 'framer-motion';
import { Monitor as Desktop, Smartphone, Link as LinkIcon, Phone, Volume2, Database, Lock, Users, Share2, Target, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';
import { useSettings } from '../../contexts/SettingsContext';
import { mockIntegrations } from '../../data/mockDatabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LiquidVolumeSlider from './LiquidVolumeSlider';

export function AppearanceForm() {
  const { settings, updateSetting } = useSettings();

  const handleToggle = (key: keyof typeof settings) => {
    soundEngine.click();
    updateSetting(key, !settings[key]);
  };

  return (
    <div className="relative z-10 flex flex-col gap-6">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Appearance &amp; Accessibility</h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5">Customize EVEO to accommodate your visual and physical needs.</p>

        <div className="flex flex-col">
          <ToggleRow label="High Contrast Mode" description="Increases border visibility and darkens translucent backgrounds." enabled={settings.highContrast} onToggle={() => handleToggle('highContrast')} />
          <ToggleRow label="Reduced Motion" description="Disables Framer Motion physics, spring animations, and continuous carousels." enabled={settings.reducedMotion} onToggle={() => handleToggle('reducedMotion')} />
          <ToggleRow label="Screen Reader Optimization" description="Forces strict ARIA labeling and bypasses non-essential visual graphs." enabled={settings.screenReader} onToggle={() => handleToggle('screenReader')} />

          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-white/10">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-widest mb-3">Workspace Layout</h4>
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
    <div className="relative z-10 flex flex-col gap-6">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Sound &amp; Alerts</h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5">Control how and when EVEO alerts you to new leads and schedule changes.</p>

        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 mb-2 mt-1">
            <Volume2 size={16} className="text-orange-500" />
            <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-widest">Sound Engine</h4>
          </div>
          <ToggleRow label="Enable App Sounds" description="Play audio cues for notifications, incoming leads, and UI clicks." enabled={settings.soundEnabled} onToggle={() => handleToggle('soundEnabled')} />

          {settings.soundEnabled && (
            <div className="py-3 pl-4 pr-2">
              <LiquidVolumeSlider
                label="Master Volume"
                value={settings.uiVolume}
                onChange={(uiVolume) => updateSetting('uiVolume', uiVolume)}
              />
            </div>
          )}

          <div className="flex items-center gap-2.5 mb-2 mt-6">
            <Desktop size={16} className="text-blue-400" />
            <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-widest">Push Notifications</h4>
          </div>
          <ToggleRow label="Desktop Alerts" description="Get browser notifications when a new lead is assigned to you." enabled={true} onToggle={() => {}} />

          <div className="flex items-center gap-2.5 mb-2 mt-6">
            <Smartphone size={16} className="text-emerald-400" />
            <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-widest">Mobile Alerts</h4>
          </div>
          <ToggleRow label="SMS Critical Alerts" description="Receive a text message when an appointment changes status." enabled={false} onToggle={() => {}} />
        </div>
      </div>
    </div>
  );
}

export function IntegrationsForm() {
  const formatMaskedKey = (val: string) => (val.length > 8 ? `${val.substring(0, 8)}••••••••••••` : '••••••••••••••••');

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
    <div className="relative z-10 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-200 dark:border-white/10 gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">Third-Party API Connections</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">View active data pipelines syncing with your workspace.</p>
        </div>
        {role === 'owner' ? (
          <button
            type="button"
            onClick={() => navigate('/admin/portal')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-orange-400 border border-white/10 text-xs font-bold rounded-xl transition-all outline-none cursor-pointer shrink-0"
          >
            Manage in Admin <ArrowRight size={14} />
          </button>
        ) : (
          <span className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/20 shrink-0">
            <Lock size={12} /> Owner Only
          </span>
        )}
      </div>

      <div className="bg-white/50 dark:bg-white/3 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-white/5">
          {mockIntegrations.map((integration) => (
            <div key={integration.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 group transition-colors hover:bg-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
                  {getIntegrationIcon(integration.type)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{integration.provider}</h4>
                  <p className="font-mono text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5 mt-0.5 truncate">
                    <Lock size={11} className="text-gray-400 shrink-0" />
                    {formatMaskedKey(integration.value)}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-wider shrink-0">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-white/10 last:border-0 gap-4">
      <div className="min-w-0">
        <p className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">{label}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors outline-none shrink-0 cursor-pointer ${enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/10'}`}
      >
        <motion.div layout className="absolute top-1 bottom-1 w-4 bg-white rounded-full shadow-xs" animate={{ left: enabled ? '28px' : '4px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}