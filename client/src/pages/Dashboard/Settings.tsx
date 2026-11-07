// src/pages/Dashboard/Settings.tsx
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Accessibility, Bell, ShieldAlert, Check, ChevronDown, Volume2, Smartphone } from 'lucide-react';
import TabButton from '../../components/account/TabButton';
import { AppearanceForm, NotificationsForm, IntegrationsForm } from '../../components/settings/SettingsForms';
import { useAuth } from '../../contexts/AuthContext';
import LiquidVolumeSlider from '../../components/settings/LiquidVolumeSlider';
import { EVEO_GLOBAL_TEAM, STORES, updateEveoBdcStoreAssignment } from '../../data/mockDatabase';
import {
  getAudioPreferences,
  updateAudioPreferences,
  playWoodBlockAlert,
  playSocialMediaChime,
} from '../../utils/soundEngine';

type SettingsTab = 'appearance' | 'notifications' | 'integrations' | 'super_bdc';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [, setTick] = useState(0);
  const { role } = useAuth();
  const [audioPrefs, setAudioPrefs] = useState(() => getAudioPreferences());

  const roleStr = String(role).toLowerCase();
  const showIntegrations = roleStr === 'owner' || roleStr === 'super_admin';
  const showSuperBdcPortal = roleStr === 'super_admin';
  const bdcAgents = EVEO_GLOBAL_TEAM.filter((u) => u.role === 'bdc');

  useEffect(() => {
    const refreshRosterAndStores = () => setTick((tick) => tick + 1);

    window.addEventListener('eveo:bdc-roster-updated', refreshRosterAndStores);
    window.addEventListener('eveo:store-metadata-updated', refreshRosterAndStores);
    window.addEventListener('eveo:stores-updated', refreshRosterAndStores);

    return () => {
      window.removeEventListener('eveo:bdc-roster-updated', refreshRosterAndStores);
      window.removeEventListener('eveo:store-metadata-updated', refreshRosterAndStores);
      window.removeEventListener('eveo:stores-updated', refreshRosterAndStores);
    };
  }, []);

  const glassCardClasses = `backdrop-blur-2xl bg-white/40 dark:bg-[#0a0f16]/40 border border-white/50 dark:border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_1px_8px_rgba(255,255,255,0.1)] rounded-3xl relative overflow-visible`;

  const handlePrefUpdate = (patch: Partial<typeof audioPrefs>) => {
    const updated = updateAudioPreferences(patch);
    setAudioPrefs(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-full w-full max-w-6xl mx-auto px-4 sm:px-8 md:pl-32 pt-6 sm:pt-10 pb-12 relative select-none sm:select-auto"
    >
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Configure accessibility, audio telemetry, ambient hub music, and mobile haptics.
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="w-full lg:w-60 shrink-0 grid grid-cols-2 lg:flex lg:flex-col gap-1.5 p-1.5 lg:p-0 rounded-2xl bg-white/40 dark:bg-white/4 lg:bg-transparent dark:lg:bg-transparent border border-gray-200/60 dark:border-white/10 lg:border-transparent">
          <TabButton
            active={activeTab === 'appearance'}
            onClick={() => setActiveTab('appearance')}
            icon={<Accessibility size={17} />}
            label="Appearance"
          />
          <TabButton
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            icon={<Bell size={17} />}
            label="Alerts & Audio"
          />
          {showIntegrations && (
            <TabButton
              active={activeTab === 'integrations'}
              onClick={() => setActiveTab('integrations')}
              icon={<LinkIcon size={17} />}
              label="Integrations (TPI)"
            />
          )}
          {showSuperBdcPortal && (
            <TabButton
              active={activeTab === 'super_bdc'}
              onClick={() => setActiveTab('super_bdc')}
              icon={<ShieldAlert size={17} />}
              label="EVEO BDC Roster"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`${glassCardClasses} p-5 sm:p-8`}
            >
              <div className="absolute top-0 left-0 w-full h-[35%] bg-linear-to-b from-white/25 dark:from-white/5 to-transparent pointer-events-none" />
              {activeTab === 'appearance' && <AppearanceForm />}

              {activeTab === 'notifications' && (
                <div className="space-y-6 relative z-10">
                  <NotificationsForm />

                  {/* Ambient Hub Music & Mobile Vibration Haptics Card */}
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                      <Volume2 size={16} /> Ambient Hub Music &amp; Mobile Haptics
                    </h3>

                    {/* Ambient Hum Toggle + Volume Slider */}
                    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-white/7 via-[#0b1018]/65 to-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(0,0,0,0.2)] space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-sm font-bold text-white block">
                            Ambient Hub Background Hum
                          </span>
                          <span className="text-xs text-gray-400">
                            Plays subtle background atmosphere throughout the workspace.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handlePrefUpdate({ ambientEnabled: !audioPrefs.ambientEnabled })
                          }
                          className={`px-4 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                            audioPrefs.ambientEnabled
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
                        >
                          {audioPrefs.ambientEnabled ? 'Active' : 'Muted'}
                        </button>
                      </div>

                      <LiquidVolumeSlider
                        label="Ambient Volume"
                        value={audioPrefs.ambientVolume}
                        onChange={(ambientVolume) => handlePrefUpdate({ ambientVolume })}
                      />
                    </div>

                    {/* Mobile WoodKnock Vibration Toggle */}
                    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-white/7 via-[#0b1018]/65 to-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(0,0,0,0.2)] flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Smartphone size={18} className="text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-bold text-white block">
                            Mobile Haptic Vibration on WoodKnock Alerts
                          </span>
                          <span className="text-xs text-gray-400">
                            Vibrates phone on high-SLA alerts, unconfirmed appts, and sold-car blocks.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handlePrefUpdate({ vibrationEnabled: !audioPrefs.vibrationEnabled })
                        }
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all shrink-0 ${
                          audioPrefs.vibrationEnabled
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {audioPrefs.vibrationEnabled ? 'Vibrate ON' : 'Vibrate OFF'}
                      </button>
                    </div>

                    {/* Preview Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => playWoodBlockAlert()}
                        className="px-4 py-2 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-xs font-bold text-red-300 cursor-pointer"
                      >
                        Test WoodKnock + Vibration
                      </button>
                      <button
                        type="button"
                        onClick={() => playSocialMediaChime()}
                        className="px-4 py-2 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-xs font-bold text-sky-300 cursor-pointer"
                      >
                        Test SocialMediaChime
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && showIntegrations && <IntegrationsForm />}

              {activeTab === 'super_bdc' && showSuperBdcPortal && (
                <div className="relative z-10 space-y-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block mb-1">
                      Super Admin Exclusive
                    </span>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                      EVEO Global BDC Store Assignments
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      BDC agents belong strictly to EVEO. Toggle which dealership accounts each BDC agent is assigned to manage.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {bdcAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="relative rounded-2xl bg-linear-to-br from-white/7 via-[#0b1018]/70 to-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(0,0,0,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <h3 className="text-sm font-black text-white">{agent.name}</h3>
                          <p className="text-xs text-gray-400">{agent.schedule} • {agent.liveActivity}</p>
                        </div>
                        <StoreAssignmentDropdown
                          stores={STORES}
                          selectedStoreIds={agent.assignedStoreIds || []}
                          onToggleStore={(storeId) => {
                            updateEveoBdcStoreAssignment(Number(agent.id), storeId);
                            setTick((tick) => tick + 1);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

interface StoreAssignmentDropdownProps {
  stores: typeof STORES;
  selectedStoreIds: string[];
  onToggleStore: (storeId: string) => void;
}

function StoreAssignmentDropdown({
  stores,
  selectedStoreIds,
  onToggleStore,
}: StoreAssignmentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedStores = stores.filter((store) => selectedStoreIds.includes(store.id));

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative z-20 w-full sm:w-64 shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="group flex w-full items-center justify-between gap-3 rounded-xl bg-linear-to-b from-white/10 via-white/5 to-black/20 px-3.5 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_18px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-colors hover:from-white/13 hover:via-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
            Store access
          </span>
          <span className="mt-0.5 block truncate text-xs font-bold text-white">
            {selectedStores.length === 0
              ? 'No stores assigned'
              : selectedStores.length === 1
                ? selectedStores[0].name
                : `${selectedStores.length} stores assigned`}
          </span>
          <span className="mt-0.5 block truncate text-[10px] font-medium text-gray-500">
            {selectedStores.length > 0
              ? selectedStores.map((store) => store.logoText).join(' · ')
              : 'Select one or more dealerships'}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-orange-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="group"
          aria-label="Assigned dealership stores"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-full min-w-64 overflow-hidden rounded-2xl bg-linear-to-b from-[#151b24]/98 via-[#0a0f16]/98 to-[#06090e]/98 p-2 shadow-[0_22px_55px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/10 backdrop-blur-2xl"
        >
          <div className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-400">
            Assign dealerships
          </div>

          {stores.length === 0 ? (
            <p className="px-3 py-4 text-xs text-gray-500">No stores are available.</p>
          ) : (
            stores.map((store) => {
              const isAssigned = selectedStoreIds.includes(store.id);

              return (
                <button
                  key={store.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isAssigned}
                  onClick={() => onToggleStore(store.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 ${
                    isAssigned
                      ? 'bg-orange-500/12 text-white'
                      : 'text-gray-400 hover:bg-white/6 hover:text-white'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold">{store.name}</span>
                    <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wider text-gray-500">
                      {store.logoText} · {store.id}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                      isAssigned
                        ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                        : 'bg-white/6 text-transparent'
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                </button>
              );
            })
          )}

          <div className="mt-1 flex items-center justify-between border-t border-white/8 px-3 pt-2">
            <span className="text-[10px] font-medium text-gray-500">
              {selectedStores.length} of {stores.length} selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-orange-300 transition-colors hover:bg-orange-500/10 hover:text-orange-200"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
