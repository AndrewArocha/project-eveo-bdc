import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode, WheelEvent } from 'react';
import { Activity, BarChart3, CalendarDays, CarFront, CircleDollarSign, FileDown, Gauge, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { apiInventoryRepository, type ApiInventoryVehicle } from '../../services/inventory/apiInventoryRepository';
import { apiOperationalRepository, type ApiAppointment, type ApiLead } from '../../services/operational/apiOperationalRepository';
import { apiLiveActivityRepository } from '../../services/liveActivity/apiLiveActivityRepository';
import type { LiveFeedPost } from '../../services/liveActivity/liveActivityStore';
import StoreKpiPanel from '../../components/reports/StoreKpiPanel';
import AppointmentModal from '../../components/reports/AppointmentModal';
import SwipeableModal from '../../components/UI/SwipeableModal';

type ReportId = 'bdc_master' | 'inventory' | 'sold' | 'lead' | 'conv' | 'pending' | 'agent';
interface ReportDefinition { id: ReportId; label: string; icon: ReactNode; description: string; color: string; }
const REPORTS: ReportDefinition[] = [
  { id: 'bdc_master', label: 'Store overview', icon: <Gauge size={18} />, description: 'Current source-backed store activity.', color: 'orange' },
  { id: 'inventory', label: 'Inventory', icon: <CarFront size={18} />, description: 'Tracked units by current inventory status.', color: 'emerald' },
  { id: 'sold', label: 'Sold cars', icon: <CircleDollarSign size={18} />, description: 'Units marked sold or delivered in inventory.', color: 'amber' },
  { id: 'lead', label: 'Lead flow', icon: <Activity size={18} />, description: 'Saved leads by current pipeline stage.', color: 'orange' },
  { id: 'conv', label: 'Conversion', icon: <BarChart3 size={18} />, description: 'Lead stage distribution. Gross and close rates require a connected sales source.', color: 'blue' },
  { id: 'pending', label: 'Pending deals', icon: <CalendarDays size={18} />, description: 'Appointments by current confirmation and visit state.', color: 'purple' },
  { id: 'agent', label: 'Agent activity', icon: <Users size={18} />, description: 'Recorded activity events by staff member.', color: 'sky' },
];

interface ReportData {
  leads: ApiLead[];
  appointments: ApiAppointment[];
  inventory: ApiInventoryVehicle[];
  activity: LiveFeedPost[];
}

interface ReportSnapshot {
  generatedAt: string;
  headline: number;
  metrics: { leads: number; appointments: number; readyInventory: number; activityEvents: number };
  series: Array<{ label: string; value: number }>;
}

interface SavedReport {
  id: string;
  reportId: ReportId;
  label: string;
  generatedAt: string;
  snapshot: ReportSnapshot;
}

const EMPTY_DATA: ReportData = { leads: [], appointments: [], inventory: [], activity: [] };

function toSeries(items: Array<{ label: string; value: number }>) {
  return items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
}

function reportSeries(id: ReportId, data: ReportData) {
  if (id === 'lead' || id === 'conv') {
    const labels: Record<string, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', appointment_set: 'Appointment set', nurture: 'Nurture', lost: 'Lost', converted: 'Converted' };
    const counts = new Map<string, number>();
    data.leads.forEach((lead) => counts.set(lead.status, (counts.get(lead.status) || 0) + 1));
    return toSeries([...counts].map(([status, value]) => ({ label: labels[status] || status.replaceAll('_', ' '), value })));
  }
  if (id === 'inventory') {
    const counts = new Map<string, number>();
    data.inventory.forEach((vehicle) => counts.set(vehicle.status, (counts.get(vehicle.status) || 0) + 1));
    return toSeries([...counts].map(([status, value]) => ({ label: status.replaceAll('_', ' '), value })));
  }
  if (id === 'sold') {
    const sold = data.inventory.filter((vehicle) => vehicle.status === 'SOLD' || vehicle.status === 'DELIVERED');
    const delivered = sold.filter((vehicle) => vehicle.status === 'DELIVERED').length;
    return toSeries([{ label: 'Sold', value: sold.length - delivered }, { label: 'Delivered', value: delivered }]);
  }
  if (id === 'pending') {
    const counts = new Map<string, number>();
    data.appointments.forEach((appointment) => counts.set(appointment.status, (counts.get(appointment.status) || 0) + 1));
    return toSeries([...counts].map(([status, value]) => ({ label: status.replaceAll('_', ' '), value })));
  }
  const byActor = new Map<string, number>();
  data.activity.forEach((event) => byActor.set(event.agentName, (byActor.get(event.agentName) || 0) + 1));
  return toSeries([...byActor].map(([label, value]) => ({ label, value })).slice(0, 10));
}

function reportHeadline(id: ReportId, data: ReportData) {
  if (id === 'inventory') return data.inventory.filter((vehicle) => vehicle.status === 'READY_FOR_SALE').length;
  if (id === 'sold') return data.inventory.filter((vehicle) => vehicle.status === 'SOLD' || vehicle.status === 'DELIVERED').length;
  if (id === 'lead') return data.leads.length;
  if (id === 'conv') return data.leads.filter((lead) => lead.status === 'converted').length;
  if (id === 'pending') return data.appointments.filter((appointment) => appointment.status === 'pending_confirmation').length;
  if (id === 'agent') return data.activity.length;
  return data.leads.length + data.appointments.length + data.inventory.length + data.activity.length;
}

function createReportSnapshot(report: ReportDefinition, data: ReportData): ReportSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    headline: reportHeadline(report.id, data),
    metrics: {
      leads: data.leads.length,
      appointments: data.appointments.length,
      readyInventory: data.inventory.filter((vehicle) => vehicle.status === 'READY_FOR_SALE').length,
      activityEvents: data.activity.length,
    },
    series: reportSeries(report.id, data),
  };
}

function buildLiveSummaryPdf(storeName: string, report: ReportDefinition, snapshot: ReportSnapshot) {
  const now = new Date(snapshot.generatedAt);
  const generated = now.toLocaleString();
  const series = snapshot.series;
  const headline = snapshot.headline;
  const safeText = (text: string) => text.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/[\\()]/g, '\\$&');
  const text = (x: number, y: number, size: number, value: string, color = '0.12 0.16 0.22') => `BT /F1 ${size} Tf ${color} rg ${x} ${y} Td (${safeText(value)}) Tj ET`;
  const rect = (x: number, y: number, w: number, h: number, color: string) => `${color} rg ${x} ${y} ${w} ${h} re f`;
  const commands = [
    rect(0, 690, 595, 152, '0.04 0.07 0.11'),
    text(42, 784, 11, 'EVEO  /  DEALERSHIP REPORT', '1 0.48 0.02'),
    text(42, 748, 25, report.label, '1 1 1'),
    text(42, 722, 12, storeName, '0.86 0.89 0.93'),
    text(42, 670, 11, `Generated ${generated}`),
    text(42, 624, 10, report.description, '0.32 0.37 0.43'),
  ];
  const metrics = [
    { label: 'LEADS', value: String(snapshot.metrics.leads) },
    { label: 'APPOINTMENTS', value: String(snapshot.metrics.appointments) },
    { label: 'READY INVENTORY', value: String(snapshot.metrics.readyInventory) },
    { label: 'ACTIVITY EVENTS', value: String(snapshot.metrics.activityEvents) },
  ];
  metrics.forEach((metric, index) => {
    const x = 42 + index * 129;
    commands.push(rect(x, 520, 116, 78, '0.95 0.96 0.97'));
    commands.push(text(x + 10, 578, 8, metric.label, '0.38 0.43 0.48'));
    commands.push(text(x + 10, 544, 23, metric.value));
  });
  commands.push(text(42, 480, 15, `Selected report total: ${headline}`));
  commands.push(text(42, 450, 10, 'Breakdown from live EVEO records:'));
  series.slice(0, 12).forEach((item, index) => {
    const y = 420 - index * 24;
    commands.push(text(52, y, 10, `${item.label}: ${item.value}`));
    commands.push(rect(235, y - 2, Math.min(250, item.value * 18), 8, '0.98 0.36 0.02'));
  });
  commands.push(rect(42, 80, 511, 1, '0.82 0.84 0.87'));
  commands.push(text(42, 60, 9, 'Figures reflect records stored in EVEO at generation time. Unconnected data sources are not estimated.', '0.38 0.43 0.48'));
  commands.push(text(42, 43, 9, 'Confidential dealership operations report', '0.38 0.43 0.48'));
  const stream = commands.join('\n');
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  let byteOffset = 0;
  const offsets: number[] = [];
  const add = (value: string) => { const bytes = encoder.encode(value); parts.push(bytes); byteOffset += bytes.length; };
  add('%PDF-1.4\n%EVEO\n');
  offsets.push(byteOffset); add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offsets.push(byteOffset); add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  offsets.push(byteOffset); add('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
  offsets.push(byteOffset); add('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  const streamBytes = encoder.encode(stream);
  offsets.push(byteOffset); add(`5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`); parts.push(streamBytes); byteOffset += streamBytes.length; add('\nendstream\nendobj\n');
  const xrefOffset = byteOffset;
  add(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  const bytes = new Uint8Array(byteOffset);
  let cursor = 0;
  for (const part of parts) { bytes.set(part, cursor); cursor += part.length; }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${storeName.replace(/[^a-z0-9]+/gi, '-')}-${report.id}-${now.toISOString().slice(0, 10)}.pdf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function LiveReports() {
  const { role, user } = useAuth();
  const { activeStore, activeStoreId, setActiveStoreId, stores } = useStoreAppearance();
  const [data, setData] = useState<ReportData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    if (!activeStoreId) { setData(EMPTY_DATA); return; }
    setIsLoading(true);
    try {
      const [leads, appointments, inventory, activity] = await Promise.all([
        apiOperationalRepository.listLeads(activeStoreId),
        apiOperationalRepository.listAppointments(activeStoreId),
        apiInventoryRepository.list(activeStoreId),
        apiLiveActivityRepository.list(activeStoreId),
      ]);
      setData({ leads, appointments, inventory, activity });
      setError('');
    } catch (cause) {
      setData(EMPTY_DATA);
      setError(cause instanceof Error ? cause.message : 'Live dealership records could not be loaded.');
    } finally { setIsLoading(false); }
  }, [activeStoreId]);

  useEffect(() => {
    void refresh();
    const sync = () => { void refresh(); };
    const names = ['eveo:operational-updated', 'appointmentsUpdated', 'eveo:store-inventory-updated', 'eveo:live-feed-updated'];
    names.forEach((name) => window.addEventListener(name, sync));
    const timer = window.setInterval(sync, 10000);
    return () => { names.forEach((name) => window.removeEventListener(name, sync)); window.clearInterval(timer); };
  }, [refresh]);

  const archiveKey = `eveo_live_report_archive_v1_${activeStoreId}`;
  useEffect(() => {
    const loadArchive = () => {
      try {
        const raw = localStorage.getItem(archiveKey);
        setSavedReports(raw ? (JSON.parse(raw) as SavedReport[]) : []);
      } catch { setSavedReports([]); }
    };
    loadArchive();
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ storeId?: string }>).detail;
      if (!detail?.storeId || detail.storeId === activeStoreId) loadArchive();
    };
    window.addEventListener('eveo:live-report-archive-updated', sync);
    return () => window.removeEventListener('eveo:live-report-archive-updated', sync);
  }, [activeStoreId, archiveKey]);

  const report = REPORTS[rotationIndex];
  const series = useMemo(() => reportSeries(report.id, data), [report.id, data]);
  const reportTotal = reportHeadline(report.id, data);
  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    if (Math.abs(event.deltaY) < 10) return;
    setRotationIndex((current) => (current + (event.deltaY > 0 ? 1 : REPORTS.length - 1)) % REPORTS.length);
  };
  const download = () => {
    const snapshot = createReportSnapshot(report, data);
    buildLiveSummaryPdf(activeStore.name || 'EVEO Store', report, snapshot);
    const record: SavedReport = {
      id: `${activeStoreId}-${Date.now()}`,
      reportId: report.id,
      label: report.label,
      generatedAt: snapshot.generatedAt,
      snapshot,
    };
    const next = [record, ...savedReports].slice(0, 40);
    setSavedReports(next);
    try {
      localStorage.setItem(archiveKey, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('eveo:live-report-archive-updated', { detail: { storeId: activeStoreId } }));
    } catch { /* The PDF still downloads if browser storage is unavailable. */ }
    setToast('Live report PDF downloaded and added to Generated Reports.');
    window.setTimeout(() => setToast(''), 3500);
  };

  return (
    <main className="min-h-dvh w-full px-4 pb-12 pt-24 text-gray-900 dark:text-white sm:px-6 md:pl-32 md:pt-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">Dealership workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Reports</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{activeStore.name || 'Your store'} · live records</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsScheduleOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"><CalendarDays size={15} className="text-orange-600 dark:text-orange-400" /> Master schedule</button>
            <button type="button" onClick={() => setIsArchiveOpen(true)} disabled={!activeStoreId} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Generated reports <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] dark:bg-white/10">{savedReports.length}</span></button>
            <button type="button" onClick={download} disabled={isLoading || !activeStoreId} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"><FileDown size={15} /> Generate &amp; download PDF</button>
            <button type="button" onClick={() => void refresh()} className="min-h-11 rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Refresh</button>
          </div>
        </header>

        {stores.length > 1 && <nav aria-label="Choose a store" className="mb-5 flex gap-2 overflow-x-auto pb-1">{stores.map((store) => <button key={store.id} type="button" aria-pressed={store.id === activeStoreId} onClick={() => setActiveStoreId(store.id)} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${store.id === activeStoreId ? 'border-orange-500/50 bg-orange-500/10 text-orange-800 dark:text-orange-300' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'}`}>{store.name}</button>)}</nav>}
        {error && <p role="alert" className="mb-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
        {!activeStoreId && <p className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">No store is available for this account yet.</p>}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_6.5rem]" aria-label="Report explorer">
          <div className="min-w-0 space-y-4">
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Live totals">
              <MetricTile icon={<Users size={16} />} label="Leads" value={data.leads.length} isLoading={isLoading} />
              <MetricTile icon={<CalendarDays size={16} />} label="Appointments" value={data.appointments.length} isLoading={isLoading} />
              <MetricTile icon={<CarFront size={16} />} label="Ready inventory" value={data.inventory.filter((vehicle) => vehicle.status === 'READY_FOR_SALE').length} isLoading={isLoading} />
              <MetricTile icon={<Activity size={16} />} label="Activity events" value={data.activity.length} isLoading={isLoading} />
            </section>

            <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:p-7">
              <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-700 dark:text-orange-300">{report.icon}</span>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">Live report · {rotationIndex + 1} of {REPORTS.length}</p><h2 className="mt-1 text-xl font-semibold tracking-tight">{report.label}</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{report.description}</p></div>
                </div>
                <div className="flex items-center gap-2"><span className="text-3xl font-semibold tabular-nums">{isLoading ? '…' : reportTotal}</span><button type="button" onClick={() => setIsChartOpen(true)} aria-haspopup="dialog" className="min-h-10 rounded-xl border border-gray-300 px-3 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10">Open chart</button></div>
              </header>
              <LiveBars series={series} isLoading={isLoading} />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400"><span>Source: EVEO records for {activeStore.name || 'this store'}</span><span>{user?.name || 'Signed-in user'} · {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
            </article>

            <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
              <div><h2 className="text-sm font-semibold">Verified KPI snapshots</h2><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Source-backed metrics, date ranges, and saved report snapshots.</p></div>
              {['owner', 'manager', 'bdc'].includes(role) && activeStoreId && <StoreKpiPanel key={`${activeStoreId}-${role}`} storeId={activeStoreId} role={role} />}
            </section>
          </div>

          <nav onWheel={handleWheel} aria-label="Report revolver" className="flex items-center justify-center gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-[#0a0f16] lg:h-[28rem] lg:flex-col lg:overflow-hidden lg:py-5">
            {REPORTS.map((item, index) => {
              const distance = Math.min(Math.abs(index - rotationIndex), REPORTS.length - Math.abs(index - rotationIndex));
              const selected = index === rotationIndex;
              return <button key={item.id} type="button" title={item.label} aria-label={`Show ${item.label} report`} aria-current={selected ? 'page' : undefined} onClick={() => setRotationIndex(index)} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all lg:h-14 lg:w-14 ${selected ? 'scale-110 border-orange-500 bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.28)]' : `border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-300 hover:text-orange-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-white ${distance > 2 ? 'lg:opacity-50' : ''}`}`}>{item.icon}</button>;
            })}
            <span className="hidden text-[9px] text-gray-500 lg:block">Scroll to rotate</span>
          </nav>
        </section>
      </div>

      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-[#101722] px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{toast}</div>}
      <AppointmentModal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} storeId={activeStoreId} />
      <SwipeableModal isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} maxWidthClass="md:max-w-3xl">
        <section className="max-h-[85dvh] overflow-y-auto bg-white p-5 text-gray-900 dark:bg-[#0a0f16] dark:text-white sm:p-7" aria-labelledby="live-report-archive-title">
          <header className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">{activeStore.name}</p><h2 id="live-report-archive-title" className="mt-1 text-2xl font-semibold tracking-tight">Generated Reports</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Saved report summaries contain source totals and charts, not customer-level records.</p></div><button type="button" onClick={() => setIsArchiveOpen(false)} aria-label="Close generated reports" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-700 dark:border-white/15 dark:text-white"><X size={18} /></button></header>
          <div className="mt-5 space-y-2">{savedReports.length ? savedReports.map((saved) => {
            const savedDefinition = REPORTS.find((item) => item.id === saved.reportId) || REPORTS[0];
            return <article key={saved.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold">{saved.label}</h3><time className="mt-1 block text-xs text-gray-600 dark:text-gray-400">{new Date(saved.generatedAt).toLocaleString()} · {saved.snapshot.headline} records</time><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{saved.snapshot.series.map((item) => `${item.label}: ${item.value}`).join(' · ') || 'No records in this report at generation time.'}</p></div><button type="button" onClick={() => buildLiveSummaryPdf(activeStore.name || 'EVEO Store', savedDefinition, saved.snapshot)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-3 text-xs font-semibold text-white hover:bg-orange-700"><FileDown size={14} /> Download PDF</button></article>;
          }) : <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 dark:border-white/15 dark:text-gray-400">No reports saved yet. Generate a report to add its live snapshot to this vault.</p>}</div>
        </section>
      </SwipeableModal>
      <SwipeableModal isOpen={isChartOpen} onClose={() => setIsChartOpen(false)} maxWidthClass="md:max-w-3xl">
        <section className="max-h-[85dvh] overflow-y-auto bg-white p-5 text-gray-900 dark:bg-[#0a0f16] dark:text-white sm:p-7" aria-labelledby="report-chart-title">
          <header className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">Live chart · {activeStore.name}</p><h2 id="report-chart-title" className="mt-1 text-2xl font-semibold tracking-tight">{report.label}</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{report.description}</p></div><button type="button" onClick={() => setIsChartOpen(false)} aria-label="Close chart" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-700 dark:border-white/15 dark:text-white"><X size={18} /></button></header>
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/4"><p className="text-xs text-gray-600 dark:text-gray-400">{isLoading ? 'Refreshing live records…' : `${reportTotal} current records in this report.`}</p><LiveBars series={series} isLoading={isLoading} large /></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{series.length ? series.map((item) => <div key={item.label} className="flex min-h-12 items-center justify-between rounded-xl border border-gray-200 bg-white px-3 dark:border-white/10 dark:bg-black/10"><span className="text-sm text-gray-700 dark:text-gray-200">{item.label}</span><strong className="tabular-nums">{item.value}</strong></div>) : <p className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600 dark:border-white/15 dark:text-gray-400">No records in this category yet. New records will appear here after they are saved.</p>}</div>
          {(report.id === 'conv' || report.id === 'sold') && <p className="mt-4 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Gross profit and full sales close rates are shown only when EVEO has a connected verified sales source. This report does not estimate missing dealership data.</p>}
        </section>
      </SwipeableModal>
    </main>
  );
}

function MetricTile({ icon, label, value, isLoading }: { icon: ReactNode; label: string; value: number; isLoading: boolean }) {
  return <article className="min-h-27 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:p-5"><div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="text-orange-600 dark:text-orange-400">{icon}</span><h2 className="text-xs font-semibold">{label}</h2></div><p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{isLoading ? '…' : value}</p></article>;
}

function LiveBars({ series, isLoading, large = false }: { series: Array<{ label: string; value: number }>; isLoading: boolean; large?: boolean }) {
  if (isLoading) return <div className={`mt-5 grid ${large ? 'h-56' : 'h-36'} place-items-center rounded-2xl bg-gray-50 text-sm text-gray-500 dark:bg-white/4 dark:text-gray-400`}>Updating live records…</div>;
  if (!series.length) return <div className={`mt-5 grid ${large ? 'h-56' : 'h-36'} place-items-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-white/15 dark:text-gray-400`}>No records to chart yet.</div>;
  const maximum = Math.max(1, ...series.map((item) => item.value));
  return <div className={`mt-5 space-y-3 ${large ? 'py-3' : 'py-1'}`} role="img" aria-label={`Chart with ${series.length} categories`}>
    {series.slice(0, large ? 12 : 6).map((item) => <div key={item.label} className="grid grid-cols-[minmax(5.5rem,8rem)_1fr_2.5rem] items-center gap-3"><span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300" title={item.label}>{item.label}</span><span className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/8"><span className="block h-full rounded-full bg-linear-to-r from-orange-600 to-amber-400" style={{ width: `${Math.max(3, (item.value / maximum) * 100)}%` }} /></span><strong className="text-right text-xs tabular-nums text-gray-800 dark:text-white">{item.value}</strong></div>)}
  </div>;
}
