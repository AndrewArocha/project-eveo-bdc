import { useState, type ReactNode } from 'react';
import { FolderClock } from 'lucide-react';
import SwipeableModal from '../UI/SwipeableModal';
import type { computeLiveStoreTelemetry } from './OrbModals';

export type ReportChartId =
  | 'inventory'
  | 'sold'
  | 'lead'
  | 'conv'
  | 'pending'
  | 'agent'
  | 'bdc_master';

export interface ReportChartMeta {
  icon: ReactNode;
  chartTitle: string;
  chartBadge: string;
}

interface ChartCardProps {
  reportId: ReportChartId;
  meta: ReportChartMeta;
  telemetry: ReturnType<typeof computeLiveStoreTelemetry>;
  compact?: boolean;
  onOpenArchive: () => void;
}

type LeadSeriesKey = 'web' | 'trade' | 'social';

const LEAD_SERIES: Array<{
  key: LeadSeriesKey;
  label: string;
  color: string;
}> = [
  { key: 'web', label: 'Web', color: '#38bdf8' },
  { key: 'trade', label: 'Trade-In', color: '#34d399' },
  { key: 'social', label: 'Social / Walk-In', color: '#fb923c' },
];

export default function ChartCard({
  reportId,
  meta,
  telemetry: t,
  compact = false,
  onOpenArchive,
}: ChartCardProps) {
  return (
    <section
      aria-label={`${meta.chartTitle} chart`}
      className={`${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      } eveo-report-chart relative overflow-hidden rounded-3xl border border-gray-200 bg-linear-to-b from-white via-gray-50 to-gray-100 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-linear-to-b dark:from-white/7 dark:via-[#0a0f16]/85 dark:to-[#070a0f]/95 dark:shadow-[0_18px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.14)]`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-orange-400">
            {meta.icon}
            <span className="truncate">{meta.chartTitle}</span>
          </span>
          <p className="truncate text-[10px] font-medium text-gray-600 dark:text-gray-500">
            {meta.chartBadge}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenArchive}
          className="flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-gray-200 px-2.5 text-[10px] font-semibold text-gray-700 transition-colors hover:bg-gray-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 dark:bg-white/6 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <FolderClock size={11} className="text-orange-400" />
          <span>Vault</span>
        </button>
      </div>

      {reportId === 'inventory' && <InventoryDonut telemetry={t} />}

      {reportId === 'agent' && <ResponseHistogram telemetry={t} />}

      {(reportId === 'lead' || reportId === 'bdc_master') && (
        <StackedQuarterChart stacks={t.quarterlyLeadStacks} />
      )}

      {reportId === 'conv' && <ConversionFunnel telemetry={t} />}

      {(reportId === 'sold' || reportId === 'pending') && (
        <PacingBars reportId={reportId} telemetry={t} />
      )}
    </section>
  );
}

function InventoryDonut({
  telemetry: t,
}: {
  telemetry: ReturnType<typeof computeLiveStoreTelemetry>;
}) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const slices = [
    { label: '<30d Fresh', value: t.freshUnder30d, color: '#10b981' },
    { label: '30–59d Mid', value: t.mid30to59d, color: '#38bdf8' },
    { label: '60–89d Watch', value: t.aged60to89d, color: '#f59e0b' },
    { label: '>90d Aged', value: t.agedOver90d, color: '#ef4444' },
  ];
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 31;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="relative h-[104px] w-[104px] shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="rgba(100,116,139,0.22)"
            strokeWidth="8"
          />
          {total > 0 &&
            slices.map((slice) => {
              if (slice.value <= 0) return null;
              const portion = slice.value / total;
              const dash = portion * circumference;
              const offset = -accumulated * circumference;
              accumulated += portion;

              return (
                <circle
                  key={slice.label}
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={hoveredSlice === slice.label ? 11 : 8}
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={offset}
                  className={`cursor-pointer transition-all duration-200 ${hoveredSlice && hoveredSlice !== slice.label ? 'opacity-30' : hoveredSlice === slice.label ? 'drop-shadow-[0_0_6px_currentColor]' : 'opacity-90'}`}
                  onMouseEnter={() => setHoveredSlice(slice.label)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onFocus={() => setHoveredSlice(slice.label)}
                  onBlur={() => setHoveredSlice(null)}
                  tabIndex={0}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-black leading-none text-gray-950 tabular-nums dark:text-white">
            {t.totalReadyUnits}
          </span>
          <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">
            Units
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 border-l border-gray-200 pl-3 dark:border-white/8">
        {slices.map((slice) => (
          <div key={slice.label} onMouseEnter={() => setHoveredSlice(slice.label)} onMouseLeave={() => setHoveredSlice(null)} className={`flex min-w-0 items-center justify-between gap-1.5 rounded-md px-1.5 py-1 transition-colors ${hoveredSlice === slice.label ? 'bg-gray-200 dark:bg-white/7' : ''}`}>
            <span className="flex min-w-0 items-center gap-1.5 truncate text-[9px] font-medium text-gray-700 dark:text-gray-400">
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className={`shrink-0 font-mono text-[10px] tabular-nums ${hoveredSlice === slice.label ? 'font-black text-gray-950 dark:text-white' : 'font-semibold text-gray-600 dark:text-gray-400'}`}>
              {slice.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponseHistogram({
  telemetry: t,
}: {
  telemetry: ReturnType<typeof computeLiveStoreTelemetry>;
}) {
  const [hoveredBucket, setHoveredBucket] = useState<string | null>(null);
  const bins = t.responseHistogram;
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));

  return (
    <div className="pt-1">
      <div className="grid h-[88px] grid-cols-5 items-end gap-2 px-1">
        {bins.map((bin, index) => {
          const height = Math.max(2, (bin.count / maxCount) * 100);

          return (
            <div key={bin.bucket} onMouseEnter={() => setHoveredBucket(bin.bucket)} onMouseLeave={() => setHoveredBucket(null)} className="flex h-full min-w-0 flex-col items-center justify-end gap-1">
              <span className={`text-[9px] font-bold tabular-nums ${hoveredBucket === bin.bucket ? 'text-gray-950 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {bin.count}
              </span>
              <div className="flex h-12 w-full items-end overflow-hidden rounded-md bg-white/5">
                <div
                  style={{ height: `${height}%` }}
                  className={`w-full rounded-sm transition-[height,filter,opacity] duration-300 ${hoveredBucket === bin.bucket ? 'brightness-125 saturate-150 drop-shadow-[0_0_7px_rgba(249,115,22,0.45)]' : hoveredBucket ? 'opacity-35' : ''} ${
                    bin.withinSla
                      ? 'bg-linear-to-t from-emerald-700 to-emerald-400'
                      : 'bg-linear-to-t from-amber-700 to-amber-400'
                  }`}
                  title={`${bin.bucket}: ${bin.count}`}
                />
              </div>
              <span
                className={`max-w-full truncate text-[8px] font-semibold ${
                  index === 1 ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-500'
                }`}
              >
                {bin.bucket.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-right text-[8px] font-medium text-gray-600 dark:text-gray-600">
        SLA threshold: 3 minutes
      </p>
    </div>
  );
}

function StackedQuarterChart({
  stacks,
}: {
  stacks: ReturnType<typeof computeLiveStoreTelemetry>['quarterlyLeadStacks'];
}) {
  const [hovered, setHovered] = useState<{
    quarter: string;
    series: LeadSeriesKey;
  } | null>(null);

  const maxTotal = Math.max(
    1,
    ...stacks.map((stack) => stack.web + stack.trade + stack.social)
  );
  const selectedQuarter = stacks.find((stack) => stack.quarter === hovered?.quarter);

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_minmax(6.75rem,0.78fr)] items-stretch gap-3 pt-1"
      onMouseLeave={() => setHovered(null)}
    >
      <div className="grid min-w-0 grid-cols-4 items-end gap-2">
        {stacks.map((stack) => {
          const total = stack.web + stack.trade + stack.social;
          const isQuarterActive = hovered?.quarter === stack.quarter;
          const segments: Array<{
            key: LeadSeriesKey;
            value: number;
            color: string;
          }> = [
            { key: 'social', value: stack.social, color: '#fb923c' },
            { key: 'trade', value: stack.trade, color: '#34d399' },
            { key: 'web', value: stack.web, color: '#38bdf8' },
          ];

          return (
            <div
              key={stack.quarter}
              className="flex min-w-0 flex-col items-center justify-end gap-1"
            >
              <span
                className={`text-[9px] font-bold tabular-nums transition-colors ${
                  isQuarterActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                {total}
              </span>

              <div className="flex h-[68px] w-full max-w-10 flex-col justify-end overflow-hidden rounded-md bg-white/5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]">
                {segments.map((segment) => {
                  const isSegmentActive =
                    hovered?.quarter === stack.quarter && hovered.series === segment.key;
                  const isDimmed = hovered !== null && !isSegmentActive;
                  const height = total > 0 ? (segment.value / maxTotal) * 100 : 0;

                  return (
                    <button
                      key={segment.key}
                      type="button"
                      aria-label={`${stack.quarter}, ${segment.key}: ${segment.value}`}
                      title={`${stack.quarter} · ${segment.key}: ${segment.value}`}
                      onMouseEnter={() =>
                        setHovered({ quarter: stack.quarter, series: segment.key })
                      }
                      onFocus={() =>
                        setHovered({ quarter: stack.quarter, series: segment.key })
                      }
                      onBlur={() => setHovered(null)}
                      style={{
                        height: `${height}%`,
                        minHeight: segment.value > 0 ? '2px' : 0,
                        backgroundColor: segment.color,
                      }}
                      className={`w-full shrink-0 cursor-crosshair outline-none transition-[filter,opacity] duration-150 focus-visible:brightness-125 ${
                        isSegmentActive
                          ? 'brightness-125 saturate-150 drop-shadow-[0_0_7px_rgba(255,255,255,0.32)]'
                          : isDimmed
                            ? 'opacity-35'
                            : 'opacity-90 hover:brightness-110'
                      }`}
                    />
                  );
                })}
              </div>

              <span
                className={`max-w-full truncate text-[9px] transition-colors ${
                  isQuarterActive
                    ? 'font-black text-white drop-shadow-[0_0_7px_rgba(255,255,255,0.35)]'
                    : 'font-semibold text-gray-500'
                }`}
              >
                {stack.quarter}
              </span>
            </div>
          );
        })}
      </div>

      <aside className="flex min-w-0 flex-col justify-center gap-2 border-l border-white/8 pl-3">
        <div className="mb-0.5 min-w-0">
          <p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-gray-500">
            {selectedQuarter ? selectedQuarter.quarter : 'All quarters'}
          </p>
          <p className="truncate text-[9px] font-semibold text-gray-400">
            {selectedQuarter ? 'Selected mix' : 'Source totals'}
          </p>
        </div>

        {LEAD_SERIES.map((series) => {
          const value = selectedQuarter
            ? selectedQuarter[series.key]
            : stacks.reduce((sum, stack) => sum + stack[series.key], 0);
          const isActive = hovered?.series === series.key;

          return (
            <div
              key={series.key}
              onMouseEnter={() =>
                setHovered((current) =>
                  current
                    ? { ...current, series: series.key }
                    : null
                )
              }
              className={`flex min-w-0 items-center justify-between gap-1 rounded-md px-1.5 py-1 transition-all ${
                isActive
                  ? 'bg-white/7'
                  : 'opacity-70'
              }`}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-[2px] transition-shadow ${
                    isActive ? 'shadow-[0_0_9px_currentColor]' : ''
                  }`}
                  style={{ backgroundColor: series.color, color: series.color }}
                />
                <span
                  className={`truncate text-[9px] transition-colors ${
                    isActive ? 'font-bold text-white' : 'font-medium text-gray-400'
                  }`}
                >
                  {series.label}
                </span>
              </span>
              <span
                className={`shrink-0 font-mono text-[10px] tabular-nums transition-all ${
                  isActive
                    ? 'font-black text-white drop-shadow-[0_0_7px_rgba(255,255,255,0.4)]'
                    : 'font-semibold text-gray-400'
                }`}
              >
                {value}
              </span>
            </div>
          );
        })}
      </aside>
    </div>
  );
}

function ConversionFunnel({
  telemetry: t,
}: {
  telemetry: ReturnType<typeof computeLiveStoreTelemetry>;
}) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const pipelineRecords =
    t.totalLeads + t.appointments.length + t.pending.length + t.sold.length;

  const stages = [
    {
      label: 'Inquiries',
      value: t.totalLeads,
      percentage: t.totalLeads > 0 ? 100 : 0,
      detail: `${t.totalLeads} leads`,
      color: 'from-sky-500 to-sky-300',
    },
    {
      label: 'Contacted',
      value: t.contactedLeadsCount,
      percentage: t.contactRatioPct,
      detail: `${t.contactedLeadsCount} of ${t.totalLeads} leads · ${t.contactRatioPct}%`,
      color: 'from-blue-600 to-blue-300',
    },
    {
      label: 'Confirmed appointments',
      value: t.confirmedApptsCount,
      percentage: t.apptConfirmRatioPct,
      detail: `${t.confirmedApptsCount} of ${t.appointments.length} appointments · ${t.apptConfirmRatioPct}%`,
      color: 'from-orange-600 to-amber-300',
    },
    {
      label: 'Delivered',
      value: t.sold.length,
      percentage: t.leadToDeliveryPct,
      detail: `${t.sold.length} of ${pipelineRecords} pipeline records · ${t.leadToDeliveryPct}%`,
      color: 'from-emerald-600 to-emerald-300',
    },
  ];

  return (
    <div className="space-y-2.5 py-1">
      {stages.map((stage) => (
        <div key={stage.label} onMouseEnter={() => setHoveredStage(stage.label)} onMouseLeave={() => setHoveredStage(null)} onFocus={() => setHoveredStage(stage.label)} onBlur={() => setHoveredStage(null)} tabIndex={0} className={`space-y-1 rounded-md px-1.5 py-1 transition-colors outline-none ${hoveredStage === stage.label ? 'bg-gray-200 dark:bg-white/7' : ''}`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[9px] font-semibold text-gray-700 dark:text-gray-300">
              {stage.label}
            </span>
            <span className="shrink-0 text-[9px] font-bold text-gray-950 tabular-nums dark:text-white">
              {hoveredStage === stage.label ? stage.detail : `${stage.value} ${stage.label === 'Inquiries' ? 'leads' : stage.label === 'Confirmed appointments' ? 'appointments' : stage.value === 1 ? 'record' : 'records'}`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-300 dark:bg-white/7">
            <div
              style={{ width: `${Math.max(stage.percentage > 0 ? 1.5 : 0, Math.min(100, stage.percentage))}%` }}
              className={`h-full rounded-full bg-linear-to-r ${stage.color} shadow-[0_0_9px_rgba(255,255,255,0.1)] transition-[width,filter] duration-300 ${hoveredStage === stage.label ? 'brightness-125 saturate-150 drop-shadow-[0_0_7px_rgba(255,255,255,0.4)]' : hoveredStage ? 'opacity-35' : ''}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PacingBars({
  reportId,
  telemetry: t,
}: {
  reportId: 'sold' | 'pending';
  telemetry: ReturnType<typeof computeLiveStoreTelemetry>;
}) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);
  const bars =
    reportId === 'sold'
      ? [
          { label: 'Jul', percentage: 60, value: Math.max(1, t.sold.length - 1) },
          { label: 'Aug', percentage: 72, value: t.sold.length },
          { label: 'Sep', percentage: 84, value: t.sold.length + 1 },
          { label: 'Oct Goal', percentage: 100, value: 20 },
          {
            label: 'Live Sold',
            percentage: Math.min(100, Math.max(25, t.sold.length * 25)),
            value: t.sold.length,
          },
        ]
      : [
          { label: 'Leads', percentage: Math.min(100, t.totalLeads * 25), value: t.totalLeads },
          {
            label: 'Appts',
            percentage: Math.min(100, t.appointments.length * 30),
            value: t.appointments.length,
          },
          { label: 'Lobby', percentage: Math.min(100, t.handoffs.length * 30), value: t.handoffs.length },
          { label: 'Pending', percentage: Math.min(100, t.pending.length * 35), value: t.pending.length },
        ];

  return (
    <>
    <div
      className="grid h-[88px] items-end gap-2.5 px-1 pt-1"
      style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}
    >
      {bars.map((bar, index) => (
            <div key={bar.label} onMouseEnter={() => setHoveredBar(bar.label)} onMouseLeave={() => setHoveredBar(null)} className="flex h-full min-w-0 flex-col items-center justify-end gap-1">
          <span className={`text-[9px] font-bold tabular-nums ${hoveredBar === bar.label ? 'text-gray-950 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            {bar.value}
          </span>
          <div className="flex h-11 w-full items-end overflow-hidden rounded-md bg-white/5">
            <button
              type="button"
              aria-label={`${bar.label}: ${bar.value}${reportId === 'pending' ? ', open list' : ''}`}
              title={`${bar.label}: ${bar.value}`}
              onClick={() => { if (reportId === 'pending') setSelectedBar(bar.label); }}
              style={{ height: `${bar.percentage}%` }}
              className={`w-full rounded-t-sm outline-none transition-[height,filter,opacity] duration-150 focus-visible:brightness-125 ${index === bars.length - 1 ? 'bg-linear-to-t from-orange-600 to-amber-300' : 'bg-linear-to-t from-sky-600 to-sky-300'} ${hoveredBar === bar.label ? 'brightness-125 saturate-150 drop-shadow-[0_0_7px_rgba(255,255,255,0.4)]' : hoveredBar ? 'opacity-35' : ''} ${reportId === 'pending' ? 'cursor-pointer' : 'cursor-crosshair'}`}
            />
          </div>
          <button type="button" onClick={() => { if (reportId === 'pending') setSelectedBar(bar.label); }} className={`max-w-full truncate text-[8px] font-semibold ${reportId === 'pending' ? 'cursor-pointer hover:text-orange-500' : 'cursor-default'} ${hoveredBar === bar.label ? 'text-gray-950 dark:text-white' : 'text-gray-600 dark:text-gray-500'}`}>
            {bar.label}
          </button>
        </div>
      ))}
    </div>
      {reportId === 'pending' && <PendingListModal selectedBar={selectedBar} telemetry={t} onClose={() => setSelectedBar(null)} />}
    </>
  );
}

function PendingListModal({ selectedBar, telemetry, onClose }: { selectedBar: string | null; telemetry: ReturnType<typeof computeLiveStoreTelemetry>; onClose: () => void }) {
  const title = selectedBar === 'Leads' ? 'Leads' : selectedBar === 'Appts' ? 'Appointments' : selectedBar === 'Lobby' ? 'Lobby visits' : 'Pending deals';
  const items = selectedBar === 'Leads' ? telemetry.leads.map((item) => ({ id: item.id, name: item.name, detail: item.vehicle }))
    : selectedBar === 'Appts' ? telemetry.appointments.map((item) => ({ id: item.id, name: item.name, detail: `${item.vehicle} · ${item.time}` }))
      : selectedBar === 'Lobby' ? telemetry.handoffs.map((item) => ({ id: item.id, name: item.name, detail: `${item.vehicle} · ${item.waitTime}` }))
        : telemetry.pending.map((item) => ({ id: item.id, name: item.name, detail: `${item.vehicle} · ${item.stage}` }));
  return (
    <SwipeableModal isOpen={selectedBar !== null} onClose={onClose} maxWidthClass="md:max-w-xl">
      <div className="flex h-full min-h-0 flex-col text-gray-900 dark:text-white">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Pending deals overview</p><h2 className="mt-1 text-xl font-black">{title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close list" className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold hover:bg-gray-100 dark:border-white/10 dark:hover:bg-white/10">Close</button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4 dark:bg-black/20">
          {items.length ? items.map((item) => <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#0a0f16]"><p className="text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{item.detail || 'Details not available'}</p></article>) : <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-[#0a0f16] dark:text-gray-400">No {title.toLowerCase()} in this sample.</p>}
        </div>
      </div>
    </SwipeableModal>
  );
}
