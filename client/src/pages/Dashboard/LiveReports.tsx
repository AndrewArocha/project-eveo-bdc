import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, CalendarDays, CarFront, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { apiInventoryRepository } from '../../services/inventory/apiInventoryRepository';
import { apiOperationalRepository } from '../../services/operational/apiOperationalRepository';
import { apiLiveActivityRepository } from '../../services/liveActivity/apiLiveActivityRepository';
import StoreKpiPanel from '../../components/reports/StoreKpiPanel';

interface LiveCounts {
  leads: number;
  appointments: number;
  awaitingConfirmation: number;
  readyInventory: number;
  recentActivity: number;
}

export default function LiveReports() {
  const { role, user } = useAuth();
  const { activeStore, activeStoreId, setActiveStoreId, stores } = useStoreAppearance();
  const [counts, setCounts] = useState<LiveCounts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!activeStoreId) {
      setCounts(null);
      return;
    }
    setIsLoading(true);
    try {
      const [leads, appointments, inventory, activity] = await Promise.all([
        apiOperationalRepository.listLeads(activeStoreId),
        apiOperationalRepository.listAppointments(activeStoreId),
        apiInventoryRepository.list(activeStoreId),
        apiLiveActivityRepository.list(activeStoreId),
      ]);
      setCounts({
        leads: leads.length,
        appointments: appointments.length,
        awaitingConfirmation: appointments.filter((appointment) => appointment.status === 'pending_confirmation').length,
        readyInventory: inventory.filter((vehicle) => vehicle.status === 'READY_FOR_SALE').length,
        recentActivity: activity.length,
      });
      setError('');
    } catch (cause) {
      setCounts(null);
      setError(cause instanceof Error ? cause.message : 'Live dealership records could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStoreId]);

  useEffect(() => {
    void refresh();
    const sync = () => { void refresh(); };
    window.addEventListener('eveo:operational-updated', sync);
    window.addEventListener('appointmentsUpdated', sync);
    window.addEventListener('eveo:store-inventory-updated', sync);
    window.addEventListener('eveo:live-feed-updated', sync);
    const timer = window.setInterval(sync, 10000);
    return () => {
      window.removeEventListener('eveo:operational-updated', sync);
      window.removeEventListener('appointmentsUpdated', sync);
      window.removeEventListener('eveo:store-inventory-updated', sync);
      window.removeEventListener('eveo:live-feed-updated', sync);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const canReadKpis = ['owner', 'manager', 'bdc'].includes(role);

  return (
    <main className="min-h-dvh w-full px-4 pb-12 pt-24 text-gray-900 dark:text-white sm:px-6 md:pl-32 md:pt-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">Dealership workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Reports</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">Live records from {activeStore.name || 'your store'}; figures refresh as dealership activity is saved.</p>
          </div>
          <p className="text-xs text-gray-500">Signed in as {user?.name || 'Dealership team'}</p>
        </header>

        {stores.length > 1 && (
          <nav aria-label="Choose a store" className="mb-6 flex flex-wrap gap-2">
            {stores.map((store) => (
              <button key={store.id} type="button" aria-pressed={store.id === activeStoreId} onClick={() => setActiveStoreId(store.id)} className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${store.id === activeStoreId ? 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'}`}>
                {store.name}
              </button>
            ))}
          </nav>
        )}

        {error && <p role="alert" className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</p>}
        {!activeStoreId && <p className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">No store is available for this account yet.</p>}

        <section aria-label="Live dealership metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile icon={<Users size={17} />} label="Leads" value={counts?.leads} description="Saved pipeline records" isLoading={isLoading} />
          <MetricTile icon={<CalendarDays size={17} />} label="Appointments" value={counts?.appointments} description={counts ? `${counts.awaitingConfirmation} awaiting confirmation` : 'Saved schedule records'} isLoading={isLoading} />
          <MetricTile icon={<CarFront size={17} />} label="Ready inventory" value={counts?.readyInventory} description="Marked ready for sale" isLoading={isLoading} />
          <MetricTile icon={<Activity size={17} />} label="Activity events" value={counts?.recentActivity} description="Recorded in EVEO" isLoading={isLoading} />
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:p-7">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">Verified operational data</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">Store KPI summary</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Review source-backed lead, appointment, activity, and sales metrics for a date range. Values without a connected source are reported as unavailable.</p>
          </div>
          {canReadKpis && activeStoreId ? <StoreKpiPanel key={`${activeStoreId}-${role}`} storeId={activeStoreId} role={role} /> : canReadKpis ? null : <p className="mt-4 text-xs text-gray-500">KPI reports are available to owners, managers, and BDC employees.</p>}
        </section>
      </div>
    </main>
  );
}

function MetricTile({ icon, label, value, description, isLoading }: { icon: ReactNode; label: string; value?: number; description: string; isLoading: boolean }) {
  return (
    <article className="min-h-32 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:p-5">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="text-orange-500">{icon}</span><h2 className="text-xs font-semibold">{label}</h2></div>
      <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">{isLoading && value === undefined ? '…' : value === undefined ? '—' : value}</p>
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{description}</p>
    </article>
  );
}
