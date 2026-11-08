import { useCallback, useEffect, useState } from 'react';
import { Database, LoaderCircle, PlugZap, RefreshCw } from 'lucide-react';
import { ApiError } from '../../services/apiClient';
import { integrationRepository, type IntegrationConnection } from '../../services/integrations/integrationRepository';

export default function IntegrationConnectionsPanel({ storeId }: { storeId: string }) {
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!storeId) { setConnections([]); return; }
    setIsLoading(true);
    setError('');
    try {
      setConnections(await integrationRepository.list(storeId));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Integration status could not be loaded.');
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const statusLabel = (connection: IntegrationConnection) => ({
    pending_configuration: 'Setup incomplete', connected: 'Connected', error: 'Needs attention', disabled: 'Disabled',
  })[connection.status];

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:p-7" aria-labelledby="integration-status-heading">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-4 dark:border-white/10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">Connections</p>
          <h2 id="integration-status-heading" className="mt-1 flex items-center gap-2 text-lg font-semibold"><PlugZap size={18} className="text-orange-500" /> Data integrations</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Only integrations saved to this store account are listed here.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={isLoading || !storeId} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">
          {isLoading ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">{error}</p>}
      {isLoading && connections.length === 0 ? <p className="flex items-center gap-2 py-6 text-xs text-gray-500"><LoaderCircle size={14} className="animate-spin" /> Checking saved integrations…</p> : connections.length ? (
        <div className="mt-4 divide-y divide-gray-100 dark:divide-white/5">
          {connections.map((connection) => (
            <article key={connection.id} className="flex items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-orange-500 dark:bg-white/5"><Database size={17} /></span>
                <div className="min-w-0"><h3 className="truncate text-sm font-semibold">{connection.displayName}</h3><p className="mt-1 truncate text-[11px] text-gray-500">{connection.provider.replaceAll('_', ' ')}</p></div>
              </div>
              <div className="shrink-0 text-right"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${connection.status === 'connected' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : connection.status === 'error' ? 'bg-red-500/10 text-red-700 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300'}`}>{statusLabel(connection)}</span>{connection.lastSyncedAt && <p className="mt-1 text-[10px] text-gray-500">Last sync {new Date(connection.lastSyncedAt).toLocaleString()}</p>}</div>
            </article>
          ))}
        </div>
      ) : !error ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-5 dark:border-white/10">
          <p className="text-sm font-semibold">No saved integrations</p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">Website inventory sync uses the website saved in the store registry. Connector credentials will appear here after a supported provider connection has been securely configured.</p>
        </div>
      ) : null}
    </section>
  );
}
