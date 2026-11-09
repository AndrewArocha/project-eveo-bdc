// src/components/settings/SettingsForms.tsx
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Monitor as Desktop, Smartphone, Volume2, Lock, ArrowRight, LoaderCircle, Plus, Trash2, UploadCloud } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';
import { useSettings } from '../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { ApiError } from '../../services/apiClient';
import { integrationRepository, type IntegrationProvider } from '../../services/integrations/integrationRepository';
import { inventoryImportRepository, type InventoryImportJob } from '../../services/inventory/inventoryImportRepository';
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
  const navigate = useNavigate();
  const { role } = useAuth();
  const { activeStoreId, stores } = useStoreAppearance();
  const [connections, setConnections] = useState<Awaited<ReturnType<typeof integrationRepository.list>>>([]);
  const [imports, setImports] = useState<InventoryImportJob[]>([]);
  const [provider, setProvider] = useState<IntegrationProvider>('net2phone');
  const [displayName, setDisplayName] = useState('');
  const [credentialName, setCredentialName] = useState('');
  const [credentialValue, setCredentialValue] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [scopes, setScopes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const refresh = useCallback(async () => {
    if (!activeStoreId) return;
    setIsLoading(true);
    setError('');
    try {
      const [nextConnections, nextImports] = await Promise.all([
        integrationRepository.list(activeStoreId),
        inventoryImportRepository.list(activeStoreId),
      ]);
      setConnections(nextConnections);
      setImports(nextImports);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Store integrations could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStoreId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addCredential = () => {
    const key = credentialName.trim();
    if (!key || !credentialValue) return;
    setCredentials((current) => ({ ...current, [key]: credentialValue }));
    setCredentialName('');
    setCredentialValue('');
  };

  const saveConnection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeStoreId || Object.keys(credentials).length === 0) {
      setError('Add at least one credential value before saving.');
      return;
    }
    setIsSaving(true);
    setError('');
    setFeedback('');
    try {
      await integrationRepository.save({
        storeId: activeStoreId, provider, displayName: displayName.trim() || provider,
        credentials, scopes: scopes.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setCredentials({});
      setDisplayName('');
      setScopes('');
      setFeedback('Credentials encrypted and stored. Provider synchronization is not enabled until the connector is configured.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Integration credentials could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const disableConnection = async (id: string) => {
    setError('');
    try {
      await integrationRepository.disable(id);
      setConnections((current) => current.map((connection) => connection.id === id ? { ...connection, status: 'disabled' } : connection));
      setFeedback('Integration disabled. Its encrypted credentials remain stored for audit and can be replaced by saving new credentials.');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Integration could not be disabled.');
    }
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeStoreId) return;
    if (!file.name.toLowerCase().endsWith('.csv') || file.size > 800_000) {
      setError('Choose a CSV file smaller than 800 KB.');
      return;
    }
    setIsSaving(true);
    setError('');
    setFeedback('');
    try {
      const job = await inventoryImportRepository.upload({ storeId: activeStoreId, fileName: file.name, csv: await file.text() });
      setImports((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setFeedback(job.duplicateUpload ? 'This exact file was already imported; no records were processed again.' : `Inventory import finished: ${job.createdCount} new vehicles, ${job.observedCount} existing vehicles checked, ${job.errorCount} row errors.`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Inventory CSV could not be imported.');
    } finally {
      setIsSaving(false);
    }
  };

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

      {(error || feedback) && <p role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-xs ${error ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>{error || feedback}</p>}
      <div className="rounded-2xl border border-gray-200 bg-white/50 p-4 dark:border-white/10 dark:bg-white/3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-sm font-bold text-gray-900 dark:text-white">Configured connections</h4><p className="mt-1 text-xs text-gray-500">{stores.find((store) => store.id === activeStoreId)?.name || 'Active store'}</p></div><button type="button" onClick={() => void refresh()} disabled={isLoading || !activeStoreId} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 disabled:opacity-50 dark:border-white/10 dark:text-gray-300">{isLoading ? <LoaderCircle size={14} className="animate-spin" /> : <ArrowRight size={14} />} Refresh</button></div>
        {connections.length === 0 ? <p className="py-4 text-xs text-gray-500">No integration credentials are stored for this store.</p> : <div className="divide-y divide-gray-200 dark:divide-white/5">{connections.map((connection) => <div key={connection.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10"><Lock size={15} className="text-orange-400" /></div><div className="min-w-0"><h5 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{connection.displayName}</h5><p className="truncate text-[10px] text-gray-500">{connection.provider} · Credentials stored encrypted · {connection.status.replaceAll('_', ' ')}</p></div></div>{connection.status !== 'disabled' && <button type="button" onClick={() => void disableConnection(connection.id)} className="min-h-9 rounded-lg border border-red-500/20 px-3 text-[10px] font-bold text-red-400">Disable</button>}</div>)}</div>}
      </div>

      <form onSubmit={(event) => void saveConnection(event)} className="grid gap-3 rounded-2xl border border-gray-200 bg-white/50 p-4 dark:border-white/10 dark:bg-white/3 sm:grid-cols-2 sm:p-5">
        <div className="sm:col-span-2"><h4 className="text-sm font-bold text-gray-900 dark:text-white">Store integration credentials</h4><p className="mt-1 text-xs text-gray-500">Secrets are encrypted by the API. Synchronization adapters require provider API access and configured scopes.</p></div>
        <label className="text-xs text-gray-500">Provider<select value={provider} onChange={(event) => setProvider(event.target.value as IntegrationProvider)} className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:border-white/10 dark:bg-[#0a0f16] dark:text-white"><option value="net2phone">Net2Phone</option><option value="dealercenter">DealerCenter</option><option value="gohighlevel">GoHighLevel / eFalcon</option><option value="website_inventory">Website inventory</option><option value="custom_api">Custom API</option></select></label>
        <label className="text-xs text-gray-500">Connection name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} placeholder="Main store inventory feed" className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:border-white/10 dark:bg-[#0a0f16] dark:text-white" /></label>
        <label className="text-xs text-gray-500">Credential field<input value={credentialName} onChange={(event) => setCredentialName(event.target.value)} maxLength={120} placeholder="api_key" className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:border-white/10 dark:bg-[#0a0f16] dark:text-white" /></label>
        <label className="text-xs text-gray-500">Credential value<input type="password" autoComplete="new-password" value={credentialValue} onChange={(event) => setCredentialValue(event.target.value)} maxLength={4000} placeholder="Secret is never shown again after saving" className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:border-white/10 dark:bg-[#0a0f16] dark:text-white" /></label>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">{Object.keys(credentials).map((key) => <span key={key} className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-orange-400/20 bg-orange-500/5 px-2.5 text-[10px] text-orange-200"><Lock size={12} />{key}<button type="button" onClick={() => setCredentials((current) => Object.fromEntries(Object.entries(current).filter(([item]) => item !== key)))} aria-label={`Remove ${key}`}><Trash2 size={12} /></button></span>)}<button type="button" onClick={addCredential} disabled={!credentialName.trim() || !credentialValue} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-xs font-semibold disabled:opacity-50 dark:border-white/10"><Plus size={14} />Add credential</button></div>
        <label className="text-xs text-gray-500 sm:col-span-2">Granted API scopes, if known<input value={scopes} onChange={(event) => setScopes(event.target.value)} placeholder="Comma-separated; document only scopes actually granted" className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:border-white/10 dark:bg-[#0a0f16] dark:text-white" /></label>
        <button type="submit" disabled={isSaving || !activeStoreId || Object.keys(credentials).length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white disabled:opacity-50 sm:col-span-2 sm:justify-self-start">{isSaving ? <LoaderCircle size={14} className="animate-spin" /> : <Lock size={14} />}Save encrypted credentials</button>
      </form>

      <section className="rounded-2xl border border-gray-200 bg-white/50 p-4 dark:border-white/10 dark:bg-white/3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-sm font-bold text-gray-900 dark:text-white">Manual inventory import</h4><p className="mt-1 text-xs text-gray-500">CSV up to 800 KB / 500 vehicles. Existing VINs become observations; conflicting values are queued for review.</p></div><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white"><UploadCloud size={15} />{isSaving ? 'Importing…' : 'Choose CSV'}<input type="file" accept=".csv,text/csv" disabled={isSaving || !activeStoreId} onChange={(event) => void importCsv(event)} className="sr-only" /></label></div>
        {imports.length === 0 ? <p className="text-xs text-gray-500">No CSV import jobs recorded for this store.</p> : <div className="space-y-3">{imports.slice(0, 5).map((job) => <div key={job.id} className="rounded-xl border border-gray-200 p-3 dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-2"><p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{job.sourceName}</p><span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{job.status.replaceAll('_', ' ')}</span></div><p className="mt-1 text-[10px] text-gray-500">{job.createdCount} created · {job.observedCount} checked · {job.errorCount} errors · {new Date(job.startedAt).toLocaleString()}</p>{job.rowErrors.length > 0 && <details className="mt-2 text-[10px] text-red-300"><summary className="cursor-pointer">Review row errors</summary><ul className="mt-1 list-inside list-disc">{job.rowErrors.slice(0, 5).map((item) => <li key={`${item.row}-${item.message}`}>Row {item.row}: {item.message}</li>)}</ul></details>}</div>)}</div>}
      </section>
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
