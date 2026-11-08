import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, BarChart3, CalendarDays, Clock3, LoaderCircle, Save, X } from 'lucide-react';
import { ApiError } from '../../services/apiClient';
import { reportRepository, type StoreKpiMetric, type StoreKpiSnapshot, type StoreKpiSnapshotReference, type StoreKpiSummary } from '../../services/reports/reportRepository';

interface Props {
  storeId: string;
  role: string;
}

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateAtStoreTimeZone(dateValue: string, timeZone: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const desired = Date.UTC(year, month - 1, day);
  let instant = desired;
  for (let i = 0; i < 2; i += 1) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(instant));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    instant = desired - (represented - instant);
  }
  return new Date(instant);
}

function safeTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return value;
  } catch {
    return 'UTC';
  }
}

function buildPeriod(storeId: string, startDate: string, endDate: string, timeZone: string) {
  const exclusiveEnd = new Date(`${endDate}T00:00:00Z`);
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
  return {
    storeId,
    startAt: dateAtStoreTimeZone(startDate, timeZone).toISOString(),
    endAt: dateAtStoreTimeZone(localDate(exclusiveEnd), timeZone).toISOString(),
  };
}

function metricValue(metric: StoreKpiMetric) {
  if (metric.value === null) return 'No eligible appointments';
  return metric.unit === 'percentage' ? `${metric.value.toFixed(1)}%` : new Intl.NumberFormat().format(metric.value);
}

export default function StoreKpiPanel({ storeId, role }: Props) {
  const canRead = ['owner', 'manager', 'bdc'].includes(role);
  const canSave = role === 'owner' || role === 'manager';
  const today = useMemo(() => new Date(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => { const date = new Date(today); date.setDate(date.getDate() - 29); return localDate(date); });
  const [endDate, setEndDate] = useState(() => localDate(today));
  const [summary, setSummary] = useState<StoreKpiSummary | null>(null);
  const [snapshots, setSnapshots] = useState<StoreKpiSnapshotReference[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<StoreKpiSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [storeTimeZone, setStoreTimeZone] = useState('UTC');
  const dialogRef = useRef<HTMLElement>(null);
  const summaryRequestId = useRef(0);

  const loadSummary = useCallback(async () => {
    if (!storeId || !startDate || !endDate) return;
    const requestId = summaryRequestId.current + 1;
    summaryRequestId.current = requestId;
    setIsLoading(true);
    setError('');
    try {
      const result = await reportRepository.getStoreSummary(buildPeriod(storeId, startDate, endDate, storeTimeZone));
      if (summaryRequestId.current !== requestId) return;
      setSummary(result);
      setStoreTimeZone(safeTimeZone(result.storeTimeZone || 'UTC'));
    } catch (cause) {
      if (summaryRequestId.current === requestId) setError(cause instanceof ApiError ? cause.message : 'Store metrics could not be loaded.');
    } finally {
      if (summaryRequestId.current === requestId) setIsLoading(false);
    }
  }, [endDate, startDate, storeId, storeTimeZone]);

  const loadSnapshots = useCallback(async () => {
    try {
      setSnapshots(await reportRepository.listStoreSnapshots(storeId));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Saved report snapshots could not be loaded.');
    }
  }, [storeId]);

  useEffect(() => {
    if (!isOpen || !canRead) return;
    void loadSummary();
    if (canSave) void loadSnapshots();
  }, [canRead, canSave, isOpen, loadSnapshots, loadSummary]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstControl = dialogRef.current?.querySelector<HTMLElement>('button, input, [tabindex="0"]');
    firstControl?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]') ?? []);
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  const handleSaveSnapshot = async () => {
    if (!startDate || !endDate || startDate > endDate) {
      setError('Choose a valid date range before saving the report.');
      return;
    }
    setIsSaving(true);
    setError('');
    setFeedback('');
    try {
      const snapshot = await reportRepository.createStoreSnapshot(buildPeriod(storeId, startDate, endDate, storeTimeZone));
      const reference: StoreKpiSnapshotReference = {
        id: snapshot.id, storeId: snapshot.storeId, reportType: snapshot.reportType,
        periodStart: snapshot.periodStart, periodEnd: snapshot.periodEnd, storeTimeZone: snapshot.storeTimeZone,
        generatedAt: snapshot.generatedAt, generatedByUserId: snapshot.generatedByUserId,
        definitionVersion: snapshot.definitionVersion,
      };
      setSnapshots((current) => [reference, ...current.filter((item) => item.id !== snapshot.id)]);
      setSelectedSnapshot(snapshot);
      setFeedback('Saved an immutable snapshot of these metrics and their source references.');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'The report snapshot could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSnapshot = async (snapshotId: string) => {
    setError('');
    try {
      setSelectedSnapshot(await reportRepository.getStoreSnapshot(snapshotId));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'The saved report snapshot could not be loaded.');
    }
  };

  const displayedSummary = selectedSnapshot || summary;
  if (!canRead) return null;

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="fixed right-4 top-16 z-50 inline-flex min-h-10 items-center gap-2 rounded-full border border-orange-400/30 bg-[#101820]/95 px-4 text-xs font-bold text-orange-200 shadow-xl backdrop-blur-xl transition hover:border-orange-300/60 hover:bg-[#17212b] sm:right-20 sm:top-5" aria-haspopup="dialog" aria-expanded={isOpen}>
        <BarChart3 size={15} aria-hidden="true" /> Live KPIs
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="store-kpi-title" className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-white/10 bg-[#080d13] p-5 text-white shadow-2xl sm:p-7">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-400">Verified operational data</p>
                <h2 id="store-kpi-title" className="mt-1 text-xl font-black sm:text-2xl">Store KPI summary</h2>
                <p className="mt-1 text-xs text-gray-400">Date boundaries use the store timezone ({storeTimeZone}); end date is inclusive.</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-gray-300 transition hover:bg-white/10" aria-label="Close KPI summary"><X size={18} /></button>
            </header>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-xs text-gray-400">From
                <span className="mt-1 flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3"><CalendarDays size={15} aria-hidden="true" /><input aria-label="Report start date" type="date" value={startDate} max={endDate} onChange={(event) => { setStartDate(event.target.value); setSelectedSnapshot(null); }} className="min-w-0 flex-1 bg-transparent text-sm text-white [color-scheme:dark]" /></span>
              </label>
              <label className="text-xs text-gray-400">Through
                <span className="mt-1 flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3"><CalendarDays size={15} aria-hidden="true" /><input aria-label="Report end date" type="date" value={endDate} min={startDate} max={localDate(new Date())} onChange={(event) => { setEndDate(event.target.value); setSelectedSnapshot(null); }} className="min-w-0 flex-1 bg-transparent text-sm text-white [color-scheme:dark]" /></span>
              </label>
              <button type="button" onClick={() => void loadSummary()} disabled={isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-60">{isLoading ? <LoaderCircle size={15} className="animate-spin" /> : <Activity size={15} />} Refresh</button>
            </div>

            {(error || feedback) && <p role={error ? 'alert' : 'status'} className={`mt-4 rounded-lg border px-3 py-2.5 text-xs ${error ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>{error || feedback}</p>}

            {displayedSummary && <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500"><span>Definition v{displayedSummary.definitionVersion}</span><span>Calculated {new Date(displayedSummary.generatedAt).toLocaleString()}</span>{selectedSnapshot && <button type="button" onClick={() => setSelectedSnapshot(null)} className="text-orange-300 underline">Return to live values</button>}</div>}

            {isLoading && !displayedSummary ? <p className="mt-12 flex items-center justify-center gap-2 text-sm text-gray-400"><LoaderCircle size={18} className="animate-spin" /> Calculating store metrics…</p> : displayedSummary && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {displayedSummary.metrics.map((metric) => <MetricCard key={metric.key} metric={metric} />)}
              </div>
            )}

            {displayedSummary?.employeeMetrics && displayedSummary.employeeMetrics.length > 0 && <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d141c]">
              <div className="border-b border-white/5 px-4 py-3"><h3 className="text-sm font-bold">Employee activity</h3><p className="mt-1 text-[10px] text-gray-500">Counts use current lead and appointment assignments during the period, plus activity events attributed to the actor. Assignment history is not available yet.</p></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-[11px]"><thead className="text-[9px] uppercase tracking-wider text-gray-500"><tr><th scope="col" className="px-4 py-2.5">Employee</th><th scope="col" className="px-3 py-2.5 text-right">Leads assigned</th><th scope="col" className="px-3 py-2.5 text-right">Appointments assigned</th><th scope="col" className="px-4 py-2.5 text-right">Activities logged</th></tr></thead><tbody className="divide-y divide-white/5">{displayedSummary.employeeMetrics.map((employee) => <tr key={employee.userId}><th scope="row" className="px-4 py-3 font-semibold text-gray-200">{employee.name}<span className="ml-2 text-[9px] font-normal uppercase tracking-wider text-gray-500">{employee.role}</span></th><td className="px-3 py-3 text-right tabular-nums text-gray-300">{employee.assignedLeads}</td><td className="px-3 py-3 text-right tabular-nums text-gray-300">{employee.assignedAppointments}</td><td className="px-4 py-3 text-right tabular-nums text-gray-300">{employee.activitiesLogged}</td></tr>)}</tbody></table></div>
            </section>}

            {canSave && <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="text-sm font-bold">Saved snapshots</h3><p className="mt-1 text-[11px] text-gray-500">Each snapshot preserves its values, formulas, and sampled source records.</p></div>
                {canSave && <button type="button" onClick={() => void handleSaveSnapshot()} disabled={isSaving || !summary || !startDate || !endDate || startDate > endDate || Boolean(error)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-400/30 px-3 text-xs font-bold text-orange-200 transition hover:bg-orange-400/10 disabled:opacity-50">{isSaving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />} Save current snapshot</button>}
              </div>
              {snapshots.length ? <div className="mt-3 flex flex-wrap gap-2">{snapshots.map((snapshot) => <button key={snapshot.id} type="button" onClick={() => void handleSelectSnapshot(snapshot.id)} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[11px] transition ${selectedSnapshot?.id === snapshot.id ? 'border-orange-400/50 bg-orange-500/10 text-orange-100' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}><Clock3 size={13} />{new Date(snapshot.periodStart).toLocaleDateString()} · {new Date(snapshot.generatedAt).toLocaleDateString()}</button>)}</div> : <p className="mt-3 text-xs text-gray-500">No saved report snapshots for this store yet.</p>}
            </section>}
          </section>
        </div>
      )}
    </>
  );
}

function MetricCard({ metric }: { metric: StoreKpiMetric }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#0d141c] p-4">
      <div className="flex items-start justify-between gap-3"><div><h3 className="text-xs font-semibold text-gray-300">{metric.label}</h3><p className="mt-2 text-2xl font-black tracking-tight text-white">{metricValue(metric)}</p>{metric.numerator !== undefined && metric.denominator !== undefined && <p className="mt-1 text-[10px] text-gray-500">{metric.numerator} of {metric.denominator} eligible appointments</p>}</div><Activity size={15} className="mt-0.5 shrink-0 text-orange-400" aria-hidden="true" /></div>
      <details className="mt-3 border-t border-white/5 pt-2">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[10px] font-semibold text-orange-200"><AlertCircle size={12} aria-hidden="true" />Formula and sources ({metric.sourceCount})</summary>
        <p className="mt-2 text-[10px] leading-relaxed text-gray-400">{metric.formula}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-gray-500">{metric.measurementNote}</p>
        {metric.sourceRecords.length > 0 && <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-[10px] text-gray-400">{metric.sourceRecords.slice(0, 10).map((source) => <li key={source.id} className="flex justify-between gap-3"><span className="truncate">{source.label}{source.status ? ` · ${source.status}` : ''}</span><time dateTime={source.occurredAt} className="shrink-0 text-gray-600">{new Date(source.occurredAt).toLocaleDateString()}</time></li>)}</ul>}
        {metric.sourcesTruncated && <p className="mt-1 text-[10px] text-gray-500">Showing a sample of {metric.sourceCount} source records.</p>}
      </details>
    </article>
  );
}
