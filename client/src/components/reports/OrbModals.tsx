import { demoStorage } from '../../services/demo/demoSession';
// src/components/reports/OrbModals.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageSquare,
  User,
  ArrowLeft,
  ExternalLink,
  Smartphone,
  Mail,
  Activity,
  Clock,
  Camera,
  Globe,
  MessageCircle,
} from 'lucide-react';
import {
  getStoreDataOrEmpty,
  resolveLegacyStoreDataKey,
  CURRENT_USER,
  LEGACY_DEMO_STORES,
  EVEO_GLOBAL_TEAM,
  getVisibleStoreRoster,
} from '../../data/mockDatabase';
import { getPersistentStoreData } from '../../services/liveActivity/liveActivityStore';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { StatBox, ClickableStatBox, RatioBox } from './ReportStats';
import ReportActionToolbar from './ReportActionToolbar';
import { type DealRecord } from '../../types';
import { getNextAppointment } from '../../utils/appointmentManager';

export type ArchiveCategory = 'inventory' | 'sold' | 'lead' | 'conv' | 'kpi' | 'bdc';

export interface ReportAuditAuthor {
  name: string;
  role: string;
  traceId: string;
}

export interface ArchivedReportRecord {
  id: string;
  storeId: string;
  storeName: string;
  category: ArchiveCategory;
  reportLabel: string;
  month: string;
  day: number;
  dateLabel: string;
  timeLabel: string;
  headlineValue: string;
  deltaLabel: string;
  summary: string;
  generatedBy: ReportAuditAuthor;
  shareLog: Array<{ sharedBy: string; role: string; method: string; time: string }>;
}

const ARCHIVE_KEY_PREFIX = 'eveo_generated_reports_archive_v4_';
const PERMISSIONS_KEY_PREFIX = 'eveo_report_export_perms_v1_';
const LIVE_ACTIVITY_MAP_KEY = 'eveo_dynamic_user_activity_v1';

// ============================================================================
// 0. DYNAMIC USER LIVE ACTIVITY TRACKER
// ============================================================================
export function setAgentLiveActivity(storeId: string, agentName: string, taskDescription: string) {
  try {
    const raw = demoStorage.getItem(LIVE_ACTIVITY_MAP_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[`${storeId}_${agentName}`] = taskDescription;
    demoStorage.setItem(LIVE_ACTIVITY_MAP_KEY, JSON.stringify(map));

    const storeStaff = getStoreDataOrEmpty(storeId).staff;
    if (storeStaff) {
      const staffMember = storeStaff.find((s) => s.name === agentName);
      if (staffMember) staffMember.liveActivity = taskDescription;
    }
    const globalMember = EVEO_GLOBAL_TEAM.find((u) => u.name === agentName);
    if (globalMember) globalMember.liveActivity = taskDescription;

    window.dispatchEvent(
      new CustomEvent('eveo:live-activity-updated', {
        detail: { storeId, agentName, liveActivity: taskDescription },
      })
    );
  } catch {
    // Ignore storage errors
  }
}

export function getAgentLiveActivity(storeId: string, agentName: string, fallback: string): string {
  try {
    const raw = demoStorage.getItem(LIVE_ACTIVITY_MAP_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      if (map[`${storeId}_${agentName}`]) return map[`${storeId}_${agentName}`];
    }
  } catch {
    // Ignore
  }
  return fallback;
}

// ============================================================================
// 1. FAST IN-MEMORY CACHED STORE TELEMETRY ENGINE
// ============================================================================
export interface LiveInventoryUnit {
  vin: string;
  vehicle: string;
  days: number;
  priceFormatted: string;
  priceNum: number;
  status: string;
  rep: string;
}

const telemetryCache: Record<string, { timestamp: number; data: ReturnType<typeof buildTelemetryRaw> }> = {};

export function invalidateTelemetryCache(storeId?: string) {
  if (storeId) delete telemetryCache[storeId];
  else Object.keys(telemetryCache).forEach((k) => delete telemetryCache[k]);
}

if (typeof window !== 'undefined') {
  window.addEventListener('eveo:pipeline-updated', () => invalidateTelemetryCache());
  window.addEventListener('appointmentsUpdated', () => invalidateTelemetryCache());
}

function buildTelemetryRaw(storeId: string) {
  const fallbackStore = getStoreDataOrEmpty(storeId);
  const store = getPersistentStoreData(storeId) || fallbackStore;
  const compatibilityStoreId = resolveLegacyStoreDataKey(storeId);
  const storeMeta = LEGACY_DEMO_STORES.find((s) => s.id === compatibilityStoreId) || { id: storeId, name: '', logoText: '', logoUrl: '', bannerUrl: '', themeGradient: '' };

  const leads = store.leads || [];
  const handoffs = store.handoffs || [];
  const appointments = store.appointments || [];
  const sold = store.sold || [];
  const pending = store.pending || [];
  const roster = getVisibleStoreRoster(storeId);

  const repStats = roster.map((member, idx) => {
    const repLeads = leads.filter((l) => l.assignee === member.name).length;
    const repAppts = appointments.filter((a) => a.rep === member.name).length;
    const repHandoffs = handoffs.filter((h) => h.rep === member.name).length;
    const repSold = sold.filter((s) => s.rep === member.name).length;
    const repPending = pending.filter((p) => p.rep === member.name).length;

    const maybeTarget = (member as { kpiTarget?: number }).kpiTarget;
    const baseTarget = typeof maybeTarget === 'number' ? maybeTarget : 0;

    const calls = repLeads * 8 + repAppts * 5 + baseTarget + idx * 3;
    const sms = repLeads * 5 + repAppts * 4 + Math.round(baseTarget * 0.6);
    const emails = repLeads * 2 + repAppts * 2 + repPending;
    const showroom = repHandoffs + repAppts + repSold;

    return {
      rep: member.name,
      role: String(member.role),
    liveActivity: getAgentLiveActivity(storeId, member.name, member.liveActivity || ''),
      calls,
      sms,
      emails,
      showroom,
      sold: repSold,
      pending: repPending,
      kpiTarget: baseTarget,
    };
  });

  const totals = repStats.reduce(
    (acc, r) => ({
      calls: acc.calls + r.calls,
      sms: acc.sms + r.sms,
      emails: acc.emails + r.emails,
      showroom: acc.showroom + r.showroom,
    }),
    { calls: 0, sms: 0, emails: 0, showroom: 0 }
  );

  const totalLeads = leads.length;
  const latestLead = leads[0] || null;
  const contactedLeadsCount = leads.filter((l) => {
    const st = String(l.status || '').toLowerCase();
    return st.includes('contact') || st.includes('appt');
  }).length;
  const apptSetLeadsCount = leads.filter((l) =>
    String(l.status || '').toLowerCase().includes('appt')
  ).length;

  const waitMinutesList = handoffs
    .map((h) => parseInt(String(h.waitTime || '0').replace(/[^0-9]/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const avgWaitMinutes =
    waitMinutesList.length > 0
      ? (waitMinutesList.reduce((a, b) => a + b, 0) / waitMinutesList.length).toFixed(1)
      : '0';

  const sourceBuckets: Record<string, number> = {
    'Website & Price Inquiry': 0,
    'Trade-In Appraisal': 0,
    'Social & Direct Walk-In': 0,
  };
  leads.forEach((l) => {
    const notesLower = String(l.notes || '').toLowerCase();
    if (notesLower.includes('trade') || notesLower.includes('compare')) {
      sourceBuckets['Trade-In Appraisal'] += 1;
    } else if (
      notesLower.includes('price') ||
      notesLower.includes('lease') ||
      notesLower.includes('ship')
    ) {
      sourceBuckets['Website & Price Inquiry'] += 1;
    } else {
      sourceBuckets['Social & Direct Walk-In'] += 1;
    }
  });

  const leadSources = Object.entries(sourceBuckets).map(([tag, count]) => ({
    tag,
    count,
    rate: totalLeads > 0 ? `${Math.round((count / totalLeads) * 100)}%` : '0%',
  }));

  const confirmedApptsCount = appointments.filter((a) =>
    String(a.status || '').toLowerCase().includes('confirm')
  ).length;

  const contactRatioPct =
    totalLeads > 0 ? Math.round((contactedLeadsCount / totalLeads) * 100) : 0;
  const apptConfirmRatioPct =
    appointments.length > 0
      ? Math.round((confirmedApptsCount / appointments.length) * 100)
      : 0;
  const totalPipelineVolume =
    totalLeads + appointments.length + pending.length + sold.length;
  const leadToDeliveryPct =
    totalPipelineVolume > 0
      ? Number(((sold.length / totalPipelineVolume) * 100).toFixed(1))
      : 0;

  const parseProfit = (p?: string) =>
    parseInt(String(p || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const totalGrossNum = sold.reduce((sum, d) => sum + parseProfit(d.profit), 0);
  const avgGrossNum = sold.length > 0 ? Math.round(totalGrossNum / sold.length) : 0;
  const topRep = sold[0]?.rep || roster[0]?.name || '';

  const allStoreVehicles = [
    ...leads.map((l, i) => ({
      vin: `${storeId.toUpperCase()}-LD-${100 + Number(l.id)}`,
      vehicle: l.vehicle,
      days: 14 + i * 19,
      priceNum: 28500 + i * 4200,
      status: 'Ready for Sale',
      rep: l.assignee,
    })),
    ...handoffs.map((h, i) => ({
      vin: `${storeId.toUpperCase()}-SH-${200 + Number(h.id)}`,
      vehicle: h.vehicle,
      days: 42 + i * 26,
      priceNum: 34900 + i * 5100,
      status: 'Showroom Demo',
      rep: h.rep,
    })),
    ...pending.map((p, i) => ({
      vin: `${storeId.toUpperCase()}-PD-${500 + Number(p.id)}`,
      vehicle: p.vehicle,
      days: 92 + i * 11,
      priceNum: 39200 + i * 3800,
      status: `Pending (${p.stage || 'F&I'})`,
      rep: p.rep || '',
    })),
  ];

  const inventoryUnits: LiveInventoryUnit[] = allStoreVehicles.map((u) => ({
    ...u,
    priceFormatted: `$${u.priceNum.toLocaleString()}`,
  }));

  const totalReadyUnits = inventoryUnits.length;
  const freshUnder30d = inventoryUnits.filter((u) => u.days < 30).length;
  const mid30to59d = inventoryUnits.filter((u) => u.days >= 30 && u.days < 60).length;
  const aged60to89d = inventoryUnits.filter((u) => u.days >= 60 && u.days < 90).length;
  const agedOver90d = inventoryUnits.filter((u) => u.days >= 90).length;
  const avgDaysInStock =
    totalReadyUnits > 0
      ? Math.round(inventoryUnits.reduce((s, u) => s + u.days, 0) / totalReadyUnits)
      : 0;
  const totalLotValueNum = inventoryUnits.reduce((s, u) => s + u.priceNum, 0);
  const inventoryTurnPct =
    totalReadyUnits + sold.length > 0
      ? Math.round((sold.length / (totalReadyUnits + sold.length)) * 100)
      : 0;

  // Response Time Histogram Buckets (<1m, 1-3m SLA, 3-5m, 5-10m, >15m)
  const responseHistogram = [
    { bucket: '<1m', count: confirmedApptsCount, withinSla: true },
    { bucket: '1–3m (SLA)', count: contactedLeadsCount, withinSla: true },
    { bucket: '3–5m', count: handoffs.length, withinSla: false },
    { bucket: '5–10m', count: pending.length, withinSla: false },
    { bucket: '>15m', count: waitMinutesList.filter((m) => m >= 6).length, withinSla: false },
  ];

  // Quarterly Stacked Lead Growth (Q1 -> Q2 -> Q3 -> Q4 Live)
  const webBase = sourceBuckets['Website & Price Inquiry'];
  const tradeBase = sourceBuckets['Trade-In Appraisal'];
  const socialBase = sourceBuckets['Social & Direct Walk-In'];
  const quarterlyLeadStacks = [
    { quarter: 'Q1', web: webBase * 2, trade: tradeBase * 2, social: socialBase * 2 },
    { quarter: 'Q2', web: webBase * 3, trade: tradeBase * 2, social: socialBase * 3 },
    { quarter: 'Q3', web: webBase * 4, trade: tradeBase * 3, social: socialBase * 4 },
    { quarter: 'Q4 (Live)', web: webBase * 5, trade: tradeBase * 4, social: socialBase * 5 },
  ];

  return {
    store,
    storeMeta,
    leads,
    handoffs,
    appointments,
    sold,
    pending,
    repStats,
    totals,
    totalLeads,
    latestLead,
    contactedLeadsCount,
    apptSetLeadsCount,
    confirmedApptsCount,
    avgWaitMinutes,
    leadSources,
    contactRatioPct,
    apptConfirmRatioPct,
    leadToDeliveryPct,
    totalGrossNum,
    avgGrossNum,
    topRep,
    inventoryUnits,
    totalReadyUnits,
    freshUnder30d,
    mid30to59d,
    aged60to89d,
    agedOver90d,
    avgDaysInStock,
    totalLotValueNum,
    inventoryTurnPct,
    responseHistogram,
    quarterlyLeadStacks,
  };
}

export function computeLiveStoreTelemetry(storeId: string) {
  const now = Date.now();
  const cached = telemetryCache[storeId];
  if (cached && now - cached.timestamp < 2000) {
    return cached.data;
  }
  const fresh = buildTelemetryRaw(storeId);
  telemetryCache[storeId] = { timestamp: now, data: fresh };
  return fresh;
}

// ============================================================================
// 2. NDA PERMISSION GATEKEEPER & USER ATTRIBUTION RESOLVER
// ============================================================================
export function resolveActiveReportAuthor(storeId: string, role?: string): ReportAuditAuthor {
  const activeRole = String(role || localStorage.getItem('eveo_role') || 'super_admin').toLowerCase();
  const storeStaff = (getPersistentStoreData(storeId) || getStoreDataOrEmpty(storeId))?.staff || [];

  let name = CURRENT_USER;
  if (activeRole === 'bdc') {
    name = EVEO_GLOBAL_TEAM.find((u) => u.role === 'bdc')?.name || 'Sofia';
  } else if (activeRole === 'sales') {
    name = storeStaff.find((s) => s.role === 'sales')?.name || storeStaff[0]?.name || 'Sales Rep';
  } else if (activeRole === 'manager') {
    name = storeStaff.find((s) => s.role === 'manager')?.name || 'Floor Manager';
  } else if (activeRole === 'owner') {
    name = EVEO_GLOBAL_TEAM.find((u) => u.role === 'owner')?.name || 'Store Owner';
  }

  const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
  const traceId = `EVEO-NDA-${storeId.toUpperCase()}-${hash}`;

  return {
    name,
    role: activeRole.toUpperCase().replace('_', ' '),
    traceId,
  };
}

export function getGrantedExportAgents(storeId: string): string[] {
  try {
    const raw = demoStorage.getItem(`${PERMISSIONS_KEY_PREFIX}${storeId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleAgentExportPermission(storeId: string, agentName: string): string[] {
  const current = getGrantedExportAgents(storeId);
  const next = current.includes(agentName)
    ? current.filter((n) => n !== agentName)
    : [...current, agentName];
  try {
    demoStorage.setItem(`${PERMISSIONS_KEY_PREFIX}${storeId}`, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('eveo:report-permissions-updated', { detail: { storeId } }));
  } catch {
    // Ignore
  }
  return next;
}

export function canCurrentUserExportReports(storeId: string, role?: string): boolean {
  const r = String(role || localStorage.getItem('eveo_role') || 'super_admin').toLowerCase();
  if (r === 'super_admin' || r === 'owner' || r === 'manager' || r === 'bdc_manager') {
    return true;
  }
  const author = resolveActiveReportAuthor(storeId, r);
  const grantedList = getGrantedExportAgents(storeId);
  return grantedList.includes(author.name);
}

// ============================================================================
// 3. ARCHIVE STORAGE
// ============================================================================
function seedInitialArchivedReports(storeId: string): ArchivedReportRecord[] {
  const t = computeLiveStoreTelemetry(storeId);
  const storeName = t.storeMeta.name;
  const defaultAuthor: ReportAuditAuthor = {
    name: CURRENT_USER,
    role: 'SUPER ADMIN',
    traceId: `EVEO-NDA-${storeId.toUpperCase()}-LIVE`,
  };

  return [
    {
      id: `arch_${storeId}_inv_oct27`,
      storeId,
      storeName,
      category: 'inventory',
      reportLabel: 'Frontline Inventory & Aging Audit',
      month: 'October',
      day: 27,
      dateLabel: 'October 27, 2026',
      timeLabel: '5:20 PM',
      headlineValue: `${t.totalReadyUnits} Units (${t.agedOver90d} >90d)`,
      deltaLabel: `$${t.totalLotValueNum.toLocaleString()} Value`,
      summary: `${t.totalReadyUnits} tracked units at ${storeName}: ${t.freshUnder30d} (<30d), ${t.mid30to59d} (30–59d), ${t.aged60to89d} (60–89d), and ${t.agedOver90d} over 90 days.`,
      generatedBy: { ...defaultAuthor, traceId: `EVEO-NDA-${storeId.toUpperCase()}-INV1` },
      shareLog: [],
    },
    {
      id: `arch_${storeId}_bdc_oct27`,
      storeId,
      storeName,
      category: 'bdc',
      reportLabel: 'Executive Daily BDC Report',
      month: 'October',
      day: 27,
      dateLabel: 'October 27, 2026',
      timeLabel: '6:15 PM',
      headlineValue: `${t.totalLeads} Leads • ${t.appointments.length} Appts`,
      deltaLabel: `${t.inventoryTurnPct}% Inv→Deliv`,
      summary: `Leads: ${t.totalLeads} • Appts: ${t.appointments.length} (${t.confirmedApptsCount} confirmed) • Calls: ${t.totals.calls} • Emails: ${t.totals.emails} • SMS: ${t.totals.sms} • Sold: ${t.sold.length}.`,
      generatedBy: { ...defaultAuthor, traceId: `EVEO-NDA-${storeId.toUpperCase()}-BDC1` },
      shareLog: [],
    },
    {
      id: `arch_${storeId}_sold_oct27`,
      storeId,
      storeName,
      category: 'sold',
      reportLabel: 'Sold Vehicles & Gross Ledger',
      month: 'October',
      day: 27,
      dateLabel: 'October 27, 2026',
      timeLabel: '5:50 PM',
      headlineValue: `${t.sold.length} Units Sold`,
      deltaLabel: `$${t.totalGrossNum.toLocaleString()} Gross`,
      summary: `${t.sold.length} vehicles delivered at ${storeName} ($${t.totalGrossNum.toLocaleString()} total gross; $${t.avgGrossNum.toLocaleString()} avg per unit).`,
      generatedBy: { ...defaultAuthor, traceId: `EVEO-NDA-${storeId.toUpperCase()}-SLD1` },
      shareLog: [],
    },
    {
      id: `arch_${storeId}_lead_oct27`,
      storeId,
      storeName,
      category: 'lead',
      reportLabel: 'Multi-Channel Lead Attribution',
      month: 'October',
      day: 27,
      dateLabel: 'October 27, 2026',
      timeLabel: '6:00 PM',
      headlineValue: `${t.totalLeads} Active Leads`,
      deltaLabel: `Q1→Q4 Stacked Growth`,
      summary: `${t.totalLeads} active leads (${t.contactedLeadsCount} contacted) • Latest: ${t.latestLead?.name || 'None'} (${t.latestLead?.vehicle || 'N/A'}).`,
      generatedBy: { ...defaultAuthor, traceId: `EVEO-NDA-${storeId.toUpperCase()}-LED1` },
      shareLog: [],
    },
    {
      id: `arch_${storeId}_conv_oct27`,
      storeId,
      storeName,
      category: 'conv',
      reportLabel: 'Stage-to-Stage Funnel Ratios',
      month: 'October',
      day: 27,
      dateLabel: 'October 27, 2026',
      timeLabel: '5:35 PM',
      headlineValue: `${t.contactRatioPct}% Contacted`,
      deltaLabel: `${t.apptConfirmRatioPct}% Confirmed`,
      summary: `${t.contactRatioPct}% Inquiry-to-Contact (${t.contactedLeadsCount}/${t.totalLeads}), ${t.apptConfirmRatioPct}% Appt Confirmation (${t.confirmedApptsCount}/${t.appointments.length}), ${t.leadToDeliveryPct}% Pipeline-to-Delivery.`,
      generatedBy: { ...defaultAuthor, traceId: `EVEO-NDA-${storeId.toUpperCase()}-CNV1` },
      shareLog: [],
    },
    {
      id: `arch_${storeId}_kpi_oct27`,
      storeId,
      storeName,
      category: 'kpi',
      reportLabel: 'Agent Activity & SLA Histogram',
      month: 'October',
      day: 27,
      dateLabel: 'October 27, 2026',
      timeLabel: '6:05 PM',
      headlineValue: `${t.totals.calls} Calls`,
      deltaLabel: `${t.avgWaitMinutes}m Avg SLA`,
      summary: `${t.totals.calls} Outbound Calls, ${t.totals.sms} SMS Sent, ${t.totals.emails} Emails, ${t.totals.showroom} Showroom Ups across ${t.repStats.length} reps.`,
      generatedBy: { ...defaultAuthor, traceId: `EVEO-NDA-${storeId.toUpperCase()}-KPI1` },
      shareLog: [],
    },
  ];
}

export function getStoreArchivedReports(storeId: string): ArchivedReportRecord[] {
  if (typeof window === 'undefined') return seedInitialArchivedReports(storeId);
  try {
    const raw = demoStorage.getItem(`${ARCHIVE_KEY_PREFIX}${storeId}`);
    if (raw) return JSON.parse(raw) as ArchivedReportRecord[];
  } catch {
    // Fallback
  }
  const seeded = seedInitialArchivedReports(storeId);
  try {
    demoStorage.setItem(`${ARCHIVE_KEY_PREFIX}${storeId}`, JSON.stringify(seeded));
  } catch {
    // Ignore
  }
  return seeded;
}

export function createArchivedReportSnapshot(
  storeId: string,
  category: ArchiveCategory,
  reportLabel: string,
  headlineValue: string,
  summary: string,
  roleOverride?: string
): ArchivedReportRecord {
  const storeName = LEGACY_DEMO_STORES.find((s) => s.id === resolveLegacyStoreDataKey(storeId))?.name || storeId.toUpperCase();
  const now = new Date();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = months[now.getMonth()] || 'October';
  const day = now.getDate() || 30;
  const timeLabel = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const generatedBy = resolveActiveReportAuthor(storeId, roleOverride);

  setAgentLiveActivity(storeId, generatedBy.name, `Generated ${reportLabel}`);

  const newRecord: ArchivedReportRecord = {
    id: `arch_${storeId}_${category}_${Date.now()}`,
    storeId,
    storeName,
    category,
    reportLabel,
    month,
    day,
    dateLabel: `${month} ${day}, ${now.getFullYear()}`,
    timeLabel,
    headlineValue,
    deltaLabel: `By ${generatedBy.name.split(' ')[0]}`,
    summary,
    generatedBy,
    shareLog: [],
  };

  const existing = getStoreArchivedReports(storeId);
  const updated = [newRecord, ...existing];
  try {
    demoStorage.setItem(`${ARCHIVE_KEY_PREFIX}${storeId}`, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('eveo:archive-updated', { detail: { storeId, record: newRecord } })
    );
  } catch {
    // Ignore
  }
  return newRecord;
}

export function getLatestOrSeedCategoryReport(
  storeId: string,
  category: ArchiveCategory
): ArchivedReportRecord {
  const all = getStoreArchivedReports(storeId);
  return all.find((r) => r.category === category) || all[0];
}

// ============================================================================
// 4. REPORT-SPECIFIC PDF CANVAS RENDERER (Pie, Histogram, Stacked Bar, Funnel!)
// ============================================================================
export function buildLaneSpecificPdfPayload(storeId: string, category: ArchiveCategory) {
  const t = computeLiveStoreTelemetry(storeId);

  switch (category) {
    case 'inventory':
      return {
        bannerTop: 'Inventory',
        bannerBottom: 'Audit',
        scope: `${t.storeMeta.name} • Lot Stock Composition Pie Chart & Aging Buckets`,
        kpis: [
          { label: 'Total Tracked Units', value: `${t.totalReadyUnits} Units`, sub: `$${t.totalLotValueNum.toLocaleString()} Active Valuation` },
          { label: 'Fresh Stock (<30d)', value: `${t.freshUnder30d} Units`, sub: `Avg Age: ${t.avgDaysInStock} Days` },
          { label: 'Aged 60–89 Days', value: `${t.aged60to89d} Units`, sub: 'Pre-Wholesale Alert Window' },
          { label: 'Aged Over 90 Days', value: `${t.agedOver90d} Units`, sub: `${t.inventoryTurnPct}% Inventory-to-Delivery Ratio` },
        ],
        chartTitle: `${t.storeMeta.name} — Inventory Aging Composition (Pie / Donut Distribution)`,
        achievements: [
          `${t.totalReadyUnits} active vehicles tracked in ${t.storeMeta.name}'s pipeline ($${t.totalLotValueNum.toLocaleString()} total value).`,
          `${t.freshUnder30d} units are in the fresh <30-day window with ${t.avgDaysInStock} average days in stock.`,
          `Current inventory-to-delivery ratio stands at ${t.inventoryTurnPct}% (${t.sold.length} delivered vs ${t.totalReadyUnits} active).`,
        ] as [string, string, string],
        targets: [
          { title: '90+ Day Aged Stock Action :', body: `Prioritize the ${t.agedOver90d} units over 90 days in stock for immediate showroom write-ups.` },
          { title: '60–89 Day Turn Protection :', body: `Match the ${t.aged60to89d} units in the 60–89 day bucket against active trade-in leads.` },
          { title: 'Pending F&I Clearance :', body: `Clear the ${t.pending.length} pending vehicles currently in ${t.storeMeta.name}'s desking queue.` },
        ],
      };

    case 'sold':
      return {
        bannerTop: 'Sold',
        bannerBottom: 'Ledger',
        scope: `${t.storeMeta.name} • Delivered Units Target vs. Actual Pacing & Gross Profit`,
        kpis: [
          { label: 'Delivered Units', value: `${t.sold.length} Units`, sub: `${t.pending.length} Additional Pending` },
          { label: 'Total Verified Gross', value: `$${t.totalGrossNum.toLocaleString()}`, sub: 'Combined Recorded Profit' },
          { label: 'Avg Gross / Unit', value: `$${t.avgGrossNum.toLocaleString()}`, sub: 'Per Delivered Vehicle' },
          { label: 'Lead Closing Rep', value: t.topRep, sub: `${t.storeMeta.name} Floor` },
        ],
        chartTitle: `${t.storeMeta.name} — Monthly Target vs. Actual Delivered Units`,
        achievements: [
          `Closed and delivered ${t.sold.length} vehicles generating $${t.totalGrossNum.toLocaleString()} in total gross profit.`,
          `Averaged $${t.avgGrossNum.toLocaleString()} gross profit per delivered vehicle at ${t.storeMeta.name}.`,
          `${t.pending.length} additional desked deals are currently queued in Pending status.`,
        ] as [string, string, string],
        targets: [
          { title: 'Convert Pending Queue to Delivered :', body: `Finalize stips on the ${t.pending.length} pending deals to book immediate gross.` },
          { title: 'Gross Margin Protection :', body: `Maintain >$${Math.max(2500, t.avgGrossNum).toLocaleString()} average gross per unit across upcoming showroom appointments.` },
          { title: 'Post-Delivery Referral Mining :', body: `Trigger 72-hour post-delivery check-ins with all ${t.sold.length} buyers.` },
        ],
      };

    case 'lead':
      return {
        bannerTop: 'Lead',
        bannerBottom: 'Growth',
        scope: `${t.storeMeta.name} • Quarterly Stacked Lead Growth (Q1 vs Q2 vs Q3 vs Q4 by Channel)`,
        kpis: [
          { label: 'Active Pipeline Leads', value: `${t.totalLeads} Leads`, sub: `${t.contactedLeadsCount} Engaged / Contacted` },
          { label: 'Appointments Set', value: `${t.appointments.length} Appts`, sub: `${t.confirmedApptsCount} Confirmed Visits` },
          { label: 'Lobby Wait Clock', value: `${t.avgWaitMinutes}m`, sub: `${t.handoffs.length} Active Showroom Handoffs` },
          { label: 'Latest Inquiry', value: t.latestLead?.name || 'None', sub: t.latestLead?.time || 'No recent leads' },
        ],
        chartTitle: `${t.storeMeta.name} — Quarterly Lead Growth Stacked by Source (Q1 → Q4)`,
        achievements: [
          `Tracking ${t.totalLeads} active leads in ${t.storeMeta.name}'s pipeline with ${t.contactedLeadsCount} already engaged.`,
          `Latest lead (${t.latestLead?.name || 'N/A'} — ${t.latestLead?.vehicle || 'N/A'}) logged ${t.latestLead?.time || 'recently'}.`,
          `Quarter-over-quarter stacked lead volume expanded across Website, Trade-In, and Social channels.`,
        ] as [string, string, string],
        targets: [
          { title: 'Uncontacted Lead Follow-Up :', body: `Immediately contact the ${Math.max(0, t.totalLeads - t.contactedLeadsCount)} new leads awaiting initial outreach.` },
          { title: 'Showroom Lobby SLA (<4m) :', body: `Ensure all ${t.handoffs.length} active showroom handoffs are claimed in under 4 minutes.` },
          { title: 'Pending Appointment Confirmation :', body: `Confirm the ${Math.max(0, t.appointments.length - t.confirmedApptsCount)} unconfirmed appointments on today's schedule.` },
        ],
      };

    case 'conv':
      return {
        bannerTop: 'Funnel',
        bannerBottom: 'Ratios',
        scope: `${t.storeMeta.name} • Horizontal Stage-to-Stage Conversion Drop-Off Funnel`,
        kpis: [
          { label: 'Inquiry → Contacted', value: `${t.contactRatioPct}%`, sub: `${t.contactedLeadsCount} / ${t.totalLeads} Active Leads` },
          { label: 'Appt Confirmation Rate', value: `${t.apptConfirmRatioPct}%`, sub: `${t.confirmedApptsCount} / ${t.appointments.length} Scheduled` },
          { label: 'Pending → Sold Ratio', value: `${t.sold.length} / ${t.pending.length + t.sold.length}`, sub: `${t.pending.length} Active Pending` },
          { label: 'Pipeline → Delivery', value: `${t.leadToDeliveryPct}%`, sub: `${t.sold.length} Sold / ${t.totalLeads + t.appointments.length + t.pending.length + t.sold.length} Total` },
        ],
        chartTitle: `${t.storeMeta.name} — Stage-to-Stage Pipeline Retention Funnel`,
        achievements: [
          `Contact ratio across active leads at ${t.storeMeta.name} is ${t.contactRatioPct}% (${t.contactedLeadsCount} of ${t.totalLeads}).`,
          `Appointment confirmation rate is ${t.apptConfirmRatioPct}% (${t.confirmedApptsCount} confirmed out of ${t.appointments.length}).`,
          `Pipeline-to-delivery conversion stands at ${t.leadToDeliveryPct}% with ${t.sold.length} finalized sales.`,
        ] as [string, string, string],
        targets: [
          { title: 'Lift Inquiry-to-Contact Ratio :', body: `Move contact ratio from ${t.contactRatioPct}% toward 75%+ by engaging new leads within 3 minutes.` },
          { title: 'Lock In 100% Appointment Confirmation :', body: `Confirm the remaining ${Math.max(0, t.appointments.length - t.confirmedApptsCount)} pending appointments prior to arrival.` },
          { title: 'Close Active Showroom Handoffs :', body: `Convert today's ${t.handoffs.length} showroom lobby visits into desked write-ups.` },
        ],
      };

    case 'bdc':
      return {
        bannerTop: 'BDC',
        bannerBottom: 'Master',
        scope: `${t.storeMeta.name} • Composite Executive Report (Q1–Q4 Stacked Leads + SLA Histogram + Inventory Pie)`,
        kpis: [
          { label: 'Active Leads & Appts', value: `${t.totalLeads} / ${t.appointments.length}`, sub: `${t.confirmedApptsCount} Appts Confirmed` },
          { label: 'Daily Outreach Touches', value: `${t.totals.calls + t.totals.sms + t.totals.emails}`, sub: `${t.totals.calls} Calls • ${t.totals.emails} Email • ${t.totals.sms} SMS` },
          { label: 'Deliveries & Ratio', value: `${t.sold.length} Sold`, sub: `${t.leadToDeliveryPct}% Inquiry-to-Delivery` },
          { label: 'Inventory → Delivery', value: `${t.inventoryTurnPct}%`, sub: `${t.sold.length} Sold / ${t.totalReadyUnits} Tracked Units` },
        ],
        chartTitle: `${t.storeMeta.name} — Multi-Chart Executive Composite (Lead Growth • SLA Histogram • Stock Mix)`,
        achievements: [
          `Logged ${t.totals.calls} calls, ${t.totals.emails} emails, and ${t.totals.sms} SMS across ${t.repStats.length} active reps for ${t.storeMeta.name}.`,
          `Set ${t.appointments.length} appointments (${t.confirmedApptsCount} confirmed) from ${t.totalLeads} active leads.`,
          `Delivered ${t.sold.length} vehicles against ${t.totalReadyUnits} tracked units (${t.inventoryTurnPct}% inventory-to-delivery ratio).`,
        ] as [string, string, string],
        targets: [
          { title: 'Contact Rate vs. Shift Capacity Physics :', body: `At 5 minutes per full call workflow, 100 calls equals 8.3 hours. Scaling beyond ${t.appointments.length} daily appointments requires warmer lead sources or additional BDC seats.` },
          { title: 'Confirm Remaining Appointments :', body: `Complete confirmation calls for the ${Math.max(0, t.appointments.length - t.confirmedApptsCount)} unconfirmed appointments.` },
          { title: 'Clear Showroom Handoff Queue :', body: `Assist floor managers on the ${t.handoffs.length} live showroom handoffs (${t.avgWaitMinutes}m avg wait).` },
        ],
      };

    case 'kpi':
    default:
      return {
        bannerTop: 'KPI',
        bannerBottom: 'Review',
        scope: `${t.storeMeta.name} • Response Time SLA Histogram & Rep Outreach Telemetry`,
        kpis: [
          { label: 'Outbound Calls', value: `${t.totals.calls} Calls`, sub: `Across ${t.repStats.length} Active Reps` },
          { label: 'SMS Sent', value: `${t.totals.sms} SMS`, sub: 'Active Pipeline Threads' },
          { label: 'Emails Sent', value: `${t.totals.emails} Emails`, sub: 'CRM Quotes & Follow-Ups' },
          { label: 'Avg Response SLA', value: `${t.avgWaitMinutes}m`, sub: `${t.handoffs.length} Active in Lobby` },
        ],
        chartTitle: `${t.storeMeta.name} — Response Time Distribution Histogram (<1m to >15m SLA)`,
        achievements: [
          `${t.storeMeta.name}'s roster (${t.repStats.map((r) => r.rep).join(', ')}) logged ${t.totals.calls} calls and ${t.totals.sms} SMS.`,
          `Handled ${t.totals.showroom} showroom ups and ${t.appointments.length} scheduled appointments.`,
          `Maintained ${t.avgWaitMinutes}m average lobby response time across active shifts.`,
        ] as [string, string, string],
        targets: [
          { title: 'Sub-3-Minute SLA Histogram Shift :', body: `Keep >85% of all initial lead responses inside the <1m and 1–3m histogram buckets.` },
          { title: 'Fast Lead Claiming :', body: `Keep showroom handoff wait times strictly below 4 minutes across all shifts.` },
          { title: 'Appointment Confirmation Hygiene :', body: `Verify that all ${t.appointments.length} scheduled visits have logged confirmation notes.` },
        ],
      };
  }
}

function jpegDataUrlToPdfBlob(jpegDataUrl: string, widthPx: number, heightPx: number): Blob {
  const base64 = jpegDataUrl.split(',')[1] || '';
  const binaryStr = atob(base64);
  const imgBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    imgBytes[i] = binaryStr.charCodeAt(i);
  }

  const pdfW = 595;
  const pdfH = 842;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let byteOffset = 0;

  const pushStr = (s: string) => {
    const arr = encoder.encode(s);
    chunks.push(arr);
    byteOffset += arr.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    byteOffset += b.length;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
  offsets.push(byteOffset);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offsets.push(byteOffset);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  offsets.push(byteOffset);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${pdfW} ${pdfH}] /Contents 5 0 R >>\nendobj\n`
  );
  offsets.push(byteOffset);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
  );
  pushBytes(imgBytes);
  pushStr('\nendstream\nendobj\n');

  const contentStream = `q\n${pdfW} 0 0 ${pdfH} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets.push(byteOffset);
  pushStr(
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
  );

  const xrefOffset = byteOffset;
  pushStr(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  offsets.forEach((off) => {
    pushStr(`${String(off).padStart(10, '0')} 00000 n \n`);
  });
  pushStr(
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  const pdfBuffer = new ArrayBuffer(byteOffset);
  const mergedView = new Uint8Array(pdfBuffer);
  let pos = 0;
  for (const chunk of chunks) {
    mergedView.set(chunk, pos);
    pos += chunk.length;
  }

  return new Blob([pdfBuffer], { type: 'application/pdf' });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}

// Helper to draw the report-specific chart onto the PDF canvas
function drawPdfCategoryChart(
  ctx: CanvasRenderingContext2D,
  category: ArchiveCategory,
  t: ReturnType<typeof computeLiveStoreTelemetry>,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  if (category === 'inventory') {
    // DONUT / PIE CHART FOR INVENTORY AGING BUCKETS
    const slices = [
      { label: '<30 Days (Fresh)', val: t.freshUnder30d, color: '#10b981' },
      { label: '30–59 Days (Mid)', val: t.mid30to59d, color: '#3b82f6' },
      { label: '60–89 Days (Aging)', val: t.aged60to89d, color: '#f59e0b' },
      { label: '90+ Days (Critical)', val: t.agedOver90d, color: '#ef4444' },
    ];
    const total = slices.reduce((s, item) => s + item.val, 0) || 1;
    const cx = x + 220;
    const cy = y + h / 2;
    const radius = 84;
    let startAngle = -Math.PI / 2;

    slices.forEach((sl) => {
      const angle = (sl.val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fillStyle = sl.color;
      ctx.fill();
      startAngle += angle;
    });

    // Inner Donut Cutout
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${t.totalReadyUnits}`, cx, cy + 4);
    ctx.font = '700 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('UNITS', cx, cy + 20);
    ctx.textAlign = 'left';

    // Right Legend Table
    slices.forEach((sl, idx) => {
      const ly = y + 42 + idx * 42;
      const pct = Math.round((sl.val / total) * 100);
      ctx.fillStyle = sl.color;
      ctx.fillRect(x + 410, ly - 12, 18, 18);
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${sl.label}`, x + 440, ly + 2);
      ctx.fillStyle = '#475569';
      ctx.font = '700 15px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${sl.val} Units (${pct}%)`, x + 760, ly + 2);
    });
    return;
  }

  if (category === 'lead') {
    // QUARTERLY STACKED BAR CHART (Q1 vs Q2 vs Q3 vs Q4 by Lead Source)
    const stacks = t.quarterlyLeadStacks;
    const maxStack = Math.max(1, ...stacks.map((s) => s.web + s.trade + s.social));
    const barW = 120;
    const gap = (w - 280 - stacks.length * barW) / (stacks.length + 1);

    stacks.forEach((st, i) => {
      const bx = x + 40 + gap + i * (barW + gap);
      const availH = h - 65;
      const hWeb = Math.round((st.web / maxStack) * availH);
      const hTrade = Math.round((st.trade / maxStack) * availH);
      const hSocial = Math.round((st.social / maxStack) * availH);
      const baseY = y + h - 32;

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(bx, baseY - hWeb, barW, hWeb);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(bx, baseY - hWeb - hTrade, barW, hTrade);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(bx, baseY - hWeb - hTrade - hSocial, barW, hSocial);

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${st.web + st.trade + st.social}`, bx + barW / 2, baseY - hWeb - hTrade - hSocial - 8);
      ctx.fillText(st.quarter, bx + barW / 2, y + h - 10);
    });
    ctx.textAlign = 'left';

    // Legend on Right
    const leg = [
      { label: 'Social & Walk-In', color: '#f97316' },
      { label: 'Trade-In Appraisal', color: '#10b981' },
      { label: 'Website & Price Inq', color: '#3b82f6' },
    ];
    leg.forEach((l, i) => {
      const ly = y + 60 + i * 38;
      ctx.fillStyle = l.color;
      ctx.fillRect(x + w - 220, ly - 12, 16, 16);
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(l.label, x + w - 194, ly + 1);
    });
    return;
  }

  if (category === 'kpi') {
    // RESPONSE TIME SLA HISTOGRAM (<1m, 1-3m SLA, 3-5m, 5-10m, >15m)
    const bins = t.responseHistogram;
    const maxCount = Math.max(1, ...bins.map((b) => b.count));
    const binW = 140;
    const startX = x + 70;

    bins.forEach((b, i) => {
      const bx = startX + i * (binW + 16);
      const bh = Math.max(18, Math.round((b.count / maxCount) * (h - 70)));
      const by = y + h - 34 - bh;

      ctx.fillStyle = b.withinSla ? '#10b981' : '#f59e0b';
      ctx.fillRect(bx, by, binW, bh);

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 15px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${b.count} leads`, bx + binW / 2, by - 8);
      ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(b.bucket, bx + binW / 2, y + h - 12);
    });

    // Vertical 3-Minute SLA Threshold Line
    const slaX = startX + 2 * (binW + 16) - 8;
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(slaX, y + 18);
    ctx.lineTo(slaX, y + h - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.font = '800 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('3m SLA Cutoff', slaX + 46, y + 28);
    ctx.textAlign = 'left';
    return;
  }

  if (category === 'conv') {
    // HORIZONTAL STAGE-TO-STAGE CONVERSION DROP-OFF FUNNEL
    const stages = [
      { label: '1. Inbound Inquiries', pct: 100, count: `${t.totalLeads} Leads`, color: '#3b82f6' },
      { label: '2. Contacted & Engaged', pct: t.contactRatioPct, count: `${t.contactedLeadsCount} Engaged`, color: '#0ea5e9' },
      { label: '3. Appointments Confirmed', pct: t.apptConfirmRatioPct, count: `${t.confirmedApptsCount} Confirmed`, color: '#f97316' },
      { label: '4. Final Vehicle Delivery', pct: Math.round(t.leadToDeliveryPct), count: `${t.sold.length} Delivered`, color: '#10b981' },
    ];
    stages.forEach((st, i) => {
      const ry = y + 22 + i * 50;
      const barMaxW = w - 340;
      const bw = Math.max(60, Math.round((st.pct / 100) * barMaxW));

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(st.label, x + 24, ry + 22);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + 240, ry + 4, barMaxW, 28);
      ctx.fillStyle = st.color;
      ctx.fillRect(x + 240, ry + 4, bw, 28);

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${st.pct}% (${st.count})`, x + 250 + bw, ry + 23);
    });
    return;
  }

  if (category === 'bdc') {
    // 3-CHART EXECUTIVE COMPOSITE FOR BDC MASTER REPORT!
    const colW = (w - 36) / 3;
    // Sub-chart 1: Q1-Q4 Stacked Lead Growth
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('1. Q1–Q4 Lead Growth (Stacked)', x + 16, y + 24);
    const stacks = t.quarterlyLeadStacks;
    const maxS = Math.max(1, ...stacks.map((s) => s.web + s.trade + s.social));
    stacks.forEach((st, i) => {
      const bx = x + 24 + i * 75;
      const avail = h - 70;
      const h1 = Math.round((st.web / maxS) * avail);
      const h2 = Math.round((st.trade / maxS) * avail);
      const h3 = Math.round((st.social / maxS) * avail);
      const by = y + h - 26;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(bx, by - h1, 46, h1);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(bx, by - h1 - h2, 46, h2);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(bx, by - h1 - h2 - h3, 46, h3);
      ctx.fillStyle = '#334155';
      ctx.font = '700 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(st.quarter.split(' ')[0], bx + 12, y + h - 10);
    });

    // Sub-chart 2: SLA Response Time Histogram
    const midX = x + colW + 18;
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('2. SLA Response Histogram', midX + 10, y + 24);
    const bins = t.responseHistogram;
    const maxB = Math.max(1, ...bins.map((b) => b.count));
    bins.forEach((b, i) => {
      const bx = midX + 14 + i * 62;
      const bh = Math.max(14, Math.round((b.count / maxB) * (h - 70)));
      ctx.fillStyle = b.withinSla ? '#10b981' : '#f59e0b';
      ctx.fillRect(bx, y + h - 26 - bh, 50, bh);
      ctx.fillStyle = '#334155';
      ctx.font = '700 10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(b.bucket.split(' ')[0], bx + 6, y + h - 10);
    });

    // Sub-chart 3: Inventory Aging Pie Chart
    const rightX = x + colW * 2 + 36;
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('3. Inventory Mix Pie', rightX + 10, y + 24);
    const slices = [
      { label: '<30d', val: t.freshUnder30d, color: '#10b981' },
      { label: '30-89d', val: t.mid30to59d + t.aged60to89d, color: '#3b82f6' },
      { label: '>90d', val: t.agedOver90d, color: '#ef4444' },
    ];
    const tot = slices.reduce((s, item) => s + item.val, 0) || 1;
    let ang = -Math.PI / 2;
    const pcx = rightX + 95;
    const pcy = y + h / 2 + 8;
    slices.forEach((sl) => {
      const a = (sl.val / tot) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(pcx, pcy);
      ctx.arc(pcx, pcy, 58, ang, ang + a);
      ctx.closePath();
      ctx.fillStyle = sl.color;
      ctx.fill();
      ang += a;
    });
    slices.forEach((sl, idx) => {
      const ly = y + 68 + idx * 34;
      ctx.fillStyle = sl.color;
      ctx.fillRect(rightX + 175, ly - 10, 12, 12);
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${sl.label}: ${sl.val}`, rightX + 194, ly);
    });
    return;
  }

  // SOLD CARS: Target vs. Actual Grouped Bar Chart
  const soldSeries = [
    { month: 'July', target: 15, actual: Math.max(1, t.sold.length) },
    { month: 'August', target: 15, actual: Math.max(1, t.sold.length + 1) },
    { month: 'September', target: 18, actual: Math.max(1, t.sold.length + 2) },
    { month: 'October (Live)', target: 20, actual: t.sold.length },
  ];
  const maxSold = 24;
  soldSeries.forEach((s, i) => {
    const groupX = x + 90 + i * 235;
    const th = Math.round((s.target / maxSold) * (h - 65));
    const ah = Math.round((s.actual / maxSold) * (h - 65));
    const baseY = y + h - 32;

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(groupX, baseY - th, 52, th);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(groupX + 58, baseY - ah, 52, ah);

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Goal: ${s.target}`, groupX + 26, baseY - th - 6);
    ctx.fillText(`Sold: ${s.actual}`, groupX + 84, baseY - ah - 6);
    ctx.fillText(s.month, groupX + 55, y + h - 10);
  });
  ctx.textAlign = 'left';
}

export async function generateRealPdfFile(record: ArchivedReportRecord): Promise<File> {
  const t = computeLiveStoreTelemetry(record.storeId);
  const pdfData = buildLaneSpecificPdfPayload(record.storeId, record.category);
  const canvas = document.createElement('canvas');
  const W = 1190;
  const H = 1684;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const padX = 56;
  const headerY = 48;
  const headerW = W - padX * 2;
  const headerH = 230;
  const bannerW = Math.round(headerW * 0.67);

  const bannerGrad = ctx.createLinearGradient(padX, headerY, padX + bannerW, headerY + headerH);
  bannerGrad.addColorStop(0, '#0f172a');
  bannerGrad.addColorStop(0.5, '#1e293b');
  bannerGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(padX, headerY, bannerW, headerH);

  ctx.fillStyle = 'rgba(147, 197, 253, 0.35)';
  ctx.beginPath();
  ctx.arc(padX + 40, headerY + headerH - 10, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(167, 216, 222, 0.35)';
  ctx.beginPath();
  ctx.arc(padX + bannerW - 55, headerY + 20, 64, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(pdfData.bannerTop, padX + 42, headerY + 88);
  ctx.fillText(pdfData.bannerBottom, padX + bannerW - 290, headerY + headerH - 36);

  const logoBoxX = padX + bannerW;
  const logoBoxW = headerW - bannerW;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(logoBoxX, headerY, logoBoxW, headerH);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(padX, headerY, headerW, headerH);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(record.storeName.toUpperCase(), logoBoxX + logoBoxW / 2, headerY + 105);
  ctx.fillStyle = '#ea580c';
  ctx.font = '800 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${record.dateLabel} • ${record.timeLabel}`, logoBoxX + logoBoxW / 2, headerY + 138);
  ctx.fillStyle = '#475569';
  ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Trace: ${record.generatedBy.traceId}`, logoBoxX + logoBoxW / 2, headerY + 165);
  ctx.textAlign = 'left';

  let curY = headerY + headerH + 46;
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${record.reportLabel} — Overview`, padX, curY);
  curY += 16;

  ctx.fillStyle = '#64748b';
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Scope: ${pdfData.scope}`, padX, curY + 12);
  curY += 32;

  const cardGap = 18;
  const cardW = (headerW - cardGap * 3) / 4;
  const cardH = 155;

  pdfData.kpis.forEach((kpi, idx) => {
    const cx = padX + idx * (cardW + cardGap);
    const topGrad = ctx.createLinearGradient(cx, curY, cx + cardW, curY);
    topGrad.addColorStop(0, '#cbd5e1');
    topGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = topGrad;
    ctx.fillRect(cx, curY, cardW, 56);

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(kpi.label, cx + 16, curY + 34);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx, curY + 62, cardW, cardH - 62);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(cx, curY, cardW, cardH);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 26px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(kpi.value, cx + 16, curY + 106);

    ctx.fillStyle = '#475569';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(kpi.sub, cx + 16, curY + 134);
  });

  // Draw the Report-Specific Chart (Pie, Stacked Bar, Histogram, Funnel, or 3-Chart Composite)
  curY += cardH + 48;
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 25px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(pdfData.chartTitle, padX, curY);
  curY += 18;

  const chartH = 240;
  drawPdfCategoryChart(ctx, record.category, t, padX, curY, headerW, chartH);

  curY += chartH + 48;
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 25px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Key Achievements & Live Store Telemetry', padX, curY);
  curY += 18;

  const achW = (headerW - cardGap * 2) / 3;
  const achH = 115;
  pdfData.achievements.forEach((ach, i) => {
    const ax = padX + i * (achW + cardGap);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(ax, curY, achW, achH);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(ax, curY, achW, achH);

    ctx.fillStyle = '#ea580c';
    ctx.font = '900 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`#${i + 1} VERIFIED METRIC`, ax + 16, curY + 28);

    ctx.fillStyle = '#1e293b';
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
    wrapCanvasText(ctx, ach, ax + 16, curY + 54, achW - 32, 20);
  });

  curY += achH + 46;
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 25px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Actionable Targets & Next Steps', padX, curY);
  curY += 18;

  pdfData.targets.forEach((tgt) => {
    const tGrad = ctx.createLinearGradient(padX, curY, padX + headerW, curY);
    tGrad.addColorStop(0, '#bbf7d0');
    tGrad.addColorStop(1, '#93c5fd');
    ctx.fillStyle = tGrad;
    ctx.fillRect(padX, curY, headerW, 38);

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`• ${tgt.title}`, padX + 18, curY + 25);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(padX, curY + 38, headerW, 52);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(padX, curY, headerW, 90);

    ctx.fillStyle = '#334155';
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
    wrapCanvasText(ctx, tgt.body, padX + 18, curY + 62, headerW - 36, 19);
    curY += 102;
  });

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.045)';
  ctx.font = '900 44px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`CONFIDENTIAL NDA • ${record.storeName.toUpperCase()}`, 0, -24);
  ctx.fillText(
    `GENERATED BY ${record.generatedBy.name.toUpperCase()} (${record.generatedBy.role}) • ${record.generatedBy.traceId}`,
    0,
    32
  );
  ctx.restore();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(padX, H - 64, headerW, 40);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 13px -apple-system, BlinkMacSystemFont, monospace';
  ctx.fillText(
    `NDA CHAIN OF CUSTODY • GENERATED BY: ${record.generatedBy.name.toUpperCase()} (${record.generatedBy.role}) • ${record.dateLabel} ${record.timeLabel} • TRACE: ${record.generatedBy.traceId}`,
    padX + 18,
    H - 39
  );

  const jpegUrl = canvas.toDataURL('image/jpeg', 0.92);
  const pdfBlob = jpegDataUrlToPdfBlob(jpegUrl, W, H);
  const safeStore = record.storeName.replace(/[^a-zA-Z0-9]/g, '_');
  const safeCat = record.category.toUpperCase();
  const filename = `${safeStore}_${safeCat}_Report_${record.generatedBy.traceId}.pdf`;

  return new File([pdfBlob], filename, { type: 'application/pdf' });
}

function triggerBrowserFileDownload(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadReportPdfFile(
  record: ArchivedReportRecord,
  triggerToast?: (msg: string) => void
) {
  const pdfFile = await generateRealPdfFile(record);
  triggerBrowserFileDownload(pdfFile);
  if (triggerToast) {
    triggerToast(`Downloaded ${pdfFile.name} (Watermarked: ${record.generatedBy.name})`);
  }
}

export async function executeReportShare(
  method: string,
  record: ArchivedReportRecord,
  triggerToast: (msg: string) => void
) {
  const sharer = resolveActiveReportAuthor(record.storeId);
  setAgentLiveActivity(record.storeId, sharer.name, `Shared ${record.reportLabel} via ${method}`);

  const all = getStoreArchivedReports(record.storeId);
  const updated = all.map((r) => {
    if (r.id !== record.id) return r;
    return {
      ...r,
      shareLog: [
        {
          sharedBy: sharer.name,
          role: sharer.role,
          method,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        },
        ...(r.shareLog || []),
      ],
    };
  });
  try {
    demoStorage.setItem(`${ARCHIVE_KEY_PREFIX}${record.storeId}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('eveo:archive-updated', { detail: { storeId: record.storeId } }));
  } catch {
    // Ignore
  }

  const reportLink = `${window.location.origin}/app/reports?store=${record.storeId}&reportId=${record.id}`;

  if (method === 'Link') {
    void navigator.clipboard.writeText(reportLink);
    triggerToast(`Vault link copied (NDA Trace: ${record.generatedBy.traceId})`);
    return;
  }

  const pdfFile = await generateRealPdfFile(record);

  const navWithShare = navigator as Navigator & {
    canShare?: (data?: { files?: File[] }) => boolean;
    share?: (data?: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };

  if (
    typeof navWithShare.share === 'function' &&
    typeof navWithShare.canShare === 'function' &&
    navWithShare.canShare({ files: [pdfFile] })
  ) {
    try {
      await navWithShare.share({
        files: [pdfFile],
        title: `${record.storeName} - ${record.reportLabel}`,
        text: `${record.storeName} • ${record.reportLabel} (${record.dateLabel}) • Generated by ${record.generatedBy.name} [${record.generatedBy.traceId}]`,
      });
      triggerToast(`Shared ${pdfFile.name} via ${method}!`);
      return;
    } catch {
      // Fallback below
    }
  }

  triggerBrowserFileDownload(pdfFile);
  const caption = `🚘 ${record.storeName} • ${record.reportLabel} (${record.dateLabel})\nPrimary Metric: ${record.headlineValue}\n${record.summary}\n🔒 NDA Trace: ${record.generatedBy.traceId} (Generated by ${record.generatedBy.name})\n📄 PDF File downloaded: ${pdfFile.name}`;

  if (method === 'WhatsApp') {
    window.location.href = `whatsapp://send?text=${encodeURIComponent(caption)}`;
    triggerToast(`PDF (${pdfFile.name}) downloaded & WhatsApp launched!`);
    return;
  }

  if (method === 'Email') {
    const subject = encodeURIComponent(
      `[CONFIDENTIAL PDF] ${record.storeName} - ${record.reportLabel} (${record.generatedBy.traceId})`
    );
    const body = encodeURIComponent(
      `Attach the downloaded PDF file (${pdfFile.name}) to this email.\n\n${caption}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    triggerToast(`PDF (${pdfFile.name}) downloaded! Attach it to the opened email.`);
    return;
  }

  if (method === 'SMS') {
    window.location.href = `sms:?&body=${encodeURIComponent(caption)}`;
    triggerToast(`PDF downloaded & SMS composer opened.`);
  }
}

interface ModalProps {
  triggerToast: (msg: string) => void;
}

function useLiveStoreTelemetry(storeId: string) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    window.addEventListener('eveo:pipeline-updated', sync);
    window.addEventListener('eveo:live-activity-updated', sync);
    return () => {
      window.removeEventListener('eveo:pipeline-updated', sync);
      window.removeEventListener('eveo:live-activity-updated', sync);
    };
  }, []);
  return computeLiveStoreTelemetry(storeId);
}

// ============================================================================
// LANE 1: INVENTORY REPORT MODAL
// ============================================================================
export function InventoryReportModal({ triggerToast }: ModalProps) {
  const { activeStoreId } = useStoreAppearance();
  const { role } = useAuth();
  const [invView, setInvView] = useState<'overview' | 'aged'>('overview');
  const t = useLiveStoreTelemetry(activeStoreId);

  const handleGenerate = () => {
    const rec = createArchivedReportSnapshot(
      activeStoreId,
      'inventory',
      'Frontline Inventory & Aging Audit',
      `${t.totalReadyUnits} Units (${t.agedOver90d} >90d)`,
      `${t.totalReadyUnits} tracked vehicles at ${t.storeMeta.name} ($${t.totalLotValueNum.toLocaleString()} value): ${t.freshUnder30d} (<30d), ${t.aged60to89d} (60–89d), ${t.agedOver90d} over 90 days.`,
      String(role)
    );
    void downloadReportPdfFile(rec, triggerToast);
  };

  const handleShare = (method: string) => {
    const existing = getLatestOrSeedCategoryReport(activeStoreId, 'inventory');
    void executeReportShare(method, existing, triggerToast);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between">
      <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col justify-center">
        {invView === 'overview' ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            <RatioBox
              label="Tracked Stock"
              value={`${t.totalReadyUnits}`}
              sub={`$${t.totalLotValueNum.toLocaleString()} Value`}
            />
            <RatioBox
              label="Fresh (<30d)"
              value={`${t.freshUnder30d}`}
              sub={`Avg: ${t.avgDaysInStock}d`}
            />
            <div
              onClick={() => setInvView('aged')}
              className="cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <RatioBox
                label="60–89 Days"
                value={`${t.aged60to89d}`}
                sub="Inspect VINs →"
              />
            </div>
            <div
              onClick={() => setInvView('aged')}
              className="cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <RatioBox
                label="Over 90 Days"
                value={`${t.agedOver90d}`}
                sub={`${t.inventoryTurnPct}% Turn`}
              />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full bg-[#0a0f16] border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-2.5 sm:p-3 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInvView('overview')}
                  className="p-1.5 bg-black border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                </button>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  {t.storeMeta.name} Stock Roster
                </h3>
              </div>
              <span className="text-[10px] font-bold text-red-400 uppercase">
                {t.agedOver90d} &gt;90d
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3.5 py-2">Vehicle</th>
                    <th className="px-3.5 py-2">Value</th>
                    <th className="px-3.5 py-2 text-right">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {t.inventoryUnits.map((u) => (
                    <tr key={u.vin} className="hover:bg-white/5 transition-colors">
                      <td className="px-3.5 py-2">
                        <span className="font-bold text-white block">{u.vehicle}</span>
                        <span className="text-[10px] font-mono text-gray-500">{u.vin}</span>
                      </td>
                      <td className="px-3.5 py-2 font-bold text-gray-300">{u.priceFormatted}</td>
                      <td className="px-3.5 py-2 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            u.days >= 90
                              ? 'bg-red-500/20 text-red-400'
                              : u.days >= 60
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {u.days}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
      <ReportActionToolbar onGeneratePDF={handleGenerate} onShare={handleShare} />
    </div>
  );
}

// ============================================================================
// LANE 2: EXECUTIVE BDC MASTER REPORT (Compact 2x2 Grid on Mobile & Desktop)
// ============================================================================
export function ExecutiveBdcMasterModal({ triggerToast }: ModalProps) {
  const { activeStoreId } = useStoreAppearance();
  const { role } = useAuth();
  const t = useLiveStoreTelemetry(activeStoreId);

  const handleGenerate = () => {
    const rec = createArchivedReportSnapshot(
      activeStoreId,
      'bdc',
      'Executive Daily BDC Report',
      `${t.totalLeads} Leads • ${t.appointments.length} Appts`,
      `Leads: ${t.totalLeads} • Appts: ${t.appointments.length} (${t.confirmedApptsCount} confirmed) • Calls: ${t.totals.calls} • Emails: ${t.totals.emails} • SMS: ${t.totals.sms} • Delivered: ${t.sold.length} (${t.inventoryTurnPct}% Inv→Deliv).`,
      String(role)
    );
    void downloadReportPdfFile(rec, triggerToast);
  };

  const handleShare = (method: string) => {
    const existing = getLatestOrSeedCategoryReport(activeStoreId, 'bdc');
    void executeReportShare(method, existing, triggerToast);
  };

  const totalTouches = t.totals.calls + t.totals.sms + t.totals.emails;

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between">
      <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col justify-center gap-2.5 sm:gap-3.5">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          <RatioBox
            label="Active Leads"
            value={`${t.totalLeads}`}
            sub={`Inq→Deliv: ${t.leadToDeliveryPct}%`}
          />
          <RatioBox
            label="Appointments"
            value={`${t.confirmedApptsCount}/${t.appointments.length}`}
            sub={`${t.apptConfirmRatioPct}% Confirmed`}
          />
          <RatioBox
            label="Outreach"
            value={`${totalTouches}`}
            sub={`${t.totals.calls}C • ${t.totals.sms}S • ${t.totals.emails}E`}
          />
          <RatioBox
            label="Inv → Delivery"
            value={`${t.inventoryTurnPct}%`}
            sub={`${t.sold.length} Sold / ${t.totalReadyUnits} Stock`}
          />
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-gray-300 font-medium truncate">
            <strong className="text-orange-400">Shift Pacing:</strong> {t.totals.calls} calls &rarr;{' '}
            {t.contactedLeadsCount}/{t.totalLeads} contacted ({t.contactRatioPct}%)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400 shrink-0">
            {t.repStats.length} Reps
          </span>
        </div>
      </div>
      <ReportActionToolbar onGeneratePDF={handleGenerate} onShare={handleShare} />
    </div>
  );
}

// ============================================================================
// LANE 3: AGENT KPIs MODAL
// ============================================================================
export function AgentKPIModal({ triggerToast }: ModalProps) {
  const { activeStoreId } = useStoreAppearance();
  const { role } = useAuth();
  const [agentView, setAgentView] = useState<
    'overview' | 'calls' | 'sms' | 'emails' | 'showroom'
  >('overview');
  const t = useLiveStoreTelemetry(activeStoreId);

  const handleGenerate = () => {
    const rec = createArchivedReportSnapshot(
      activeStoreId,
      'kpi',
      'Agent Activity & SLA Histogram',
      `${t.totals.calls} Calls`,
      `${t.totals.calls} Outbound Calls, ${t.totals.sms} SMS Sent, ${t.totals.emails} Emails, ${t.totals.showroom} Showroom Ups across ${t.repStats.length} reps at ${t.storeMeta.name}.`,
      String(role)
    );
    void downloadReportPdfFile(rec, triggerToast);
  };

  const handleShare = (method: string) => {
    const existing = getLatestOrSeedCategoryReport(activeStoreId, 'kpi');
    void executeReportShare(method, existing, triggerToast);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between">
      <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col justify-center">
        {agentView === 'overview' ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5"
          >
            <ClickableStatBox
              icon={<Phone className="text-blue-500" />}
              label="Calls Made"
              value={t.totals.calls}
              onClick={() => setAgentView('calls')}
            />
            <ClickableStatBox
              icon={<MessageSquare className="text-emerald-500" />}
              label="SMS Sent"
              value={t.totals.sms}
              onClick={() => setAgentView('sms')}
            />
            <ClickableStatBox
              icon={<Mail className="text-orange-500" />}
              label="Emails"
              value={t.totals.emails}
              onClick={() => setAgentView('emails')}
            />
            <ClickableStatBox
              icon={<Smartphone className="text-purple-500" />}
              label="Showroom"
              value={t.totals.showroom}
              onClick={() => setAgentView('showroom')}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full bg-[#0a0f16] border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-2.5 sm:p-3 border-b border-white/10 bg-white/5 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setAgentView('overview')}
                className="p-1.5 bg-black border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
              </button>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                {t.storeMeta.name} &bull; {agentView} Breakdown
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3.5 py-2">Rep</th>
                    <th className="px-3.5 py-2">Live Activity</th>
                    <th className="px-3.5 py-2 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {t.repStats.map((stat) => (
                    <tr key={stat.rep} className="hover:bg-white/5 transition-colors">
                      <td className="px-3.5 py-2 font-bold text-white flex items-center gap-2">
                        <User size={13} className="text-gray-500" /> {stat.rep}
                      </td>
                      <td className="px-3.5 py-2 text-[11px] text-gray-400 truncate max-w-40">
                        {stat.liveActivity}
                      </td>
                      <td className="px-3.5 py-2 text-right font-black text-emerald-400">
                        {stat[agentView]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
      <ReportActionToolbar onGeneratePDF={handleGenerate} onShare={handleShare} />
    </div>
  );
}

// ============================================================================
// LANE 4: LEAD VISIBILITY MODAL
// ============================================================================
export function LeadVisibilityModal({ triggerToast }: ModalProps) {
  const { activeStoreId } = useStoreAppearance();
  const { role } = useAuth();
  const [leadView, setLeadView] = useState<'overview' | 'sources'>('overview');
  const t = useLiveStoreTelemetry(activeStoreId);

  const handleGenerate = () => {
    const rec = createArchivedReportSnapshot(
      activeStoreId,
      'lead',
      'Multi-Channel Lead Attribution',
      `${t.totalLeads} Active Leads`,
      `${t.totalLeads} active pipeline leads at ${t.storeMeta.name} (${t.contactedLeadsCount} contacted, ${t.avgWaitMinutes}m avg lobby wait).`,
      String(role)
    );
    void downloadReportPdfFile(rec, triggerToast);
  };

  const handleShare = (method: string) => {
    const existing = getLatestOrSeedCategoryReport(activeStoreId, 'lead');
    void executeReportShare(method, existing, triggerToast);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between">
      <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col justify-center">
        {leadView === 'overview' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
            <ClickableStatBox
              icon={<Activity className="text-orange-500" />}
              label="Active Leads"
              value={t.totalLeads}
              onClick={() => setLeadView('sources')}
            />
            <StatBox
              icon={<Clock className="text-blue-500" />}
              label="Avg Lobby Wait"
              value={`${t.avgWaitMinutes}m`}
            />
            <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center p-3.5 sm:p-5 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-sm sm:text-base font-black text-white text-center truncate max-w-full">
                {t.latestLead?.name || 'No Leads Yet'}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">
                {t.latestLead ? `Latest (${t.latestLead.time})` : 'Pipeline Clear'}
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full bg-[#0a0f16] border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-2.5 sm:p-3 border-b border-white/10 bg-white/5 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setLeadView('overview')}
                className="p-1.5 bg-black border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
              </button>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                {t.storeMeta.name} Lead Breakdown
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3.5 py-2">Source Channel</th>
                    <th className="px-3.5 py-2">Leads</th>
                    <th className="px-3.5 py-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {t.leadSources.map((s, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-3.5 py-2 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" /> {s.tag}
                      </td>
                      <td className="px-3.5 py-2 text-gray-300 font-bold">{s.count}</td>
                      <td className="px-3.5 py-2 text-right font-black text-emerald-400">
                        {s.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
      <ReportActionToolbar onGeneratePDF={handleGenerate} onShare={handleShare} />
    </div>
  );
}

// ============================================================================
// LANE 5: CONVERSION RATIOS MODAL (2x2 Grid on Both Mobile & Desktop!)
// ============================================================================
export function ConversionRatiosModal({ triggerToast }: ModalProps) {
  const { activeStoreId } = useStoreAppearance();
  const { role } = useAuth();
  const [convView, setConvView] = useState<'overview' | 'tags'>('overview');
  const t = useLiveStoreTelemetry(activeStoreId);

  const handleGenerate = () => {
    const rec = createArchivedReportSnapshot(
      activeStoreId,
      'conv',
      'Stage-to-Stage Funnel Ratios',
      `${t.contactRatioPct}% Contacted`,
      `${t.contactRatioPct}% Contacted (${t.contactedLeadsCount}/${t.totalLeads}), ${t.apptConfirmRatioPct}% Confirmed Appts (${t.confirmedApptsCount}/${t.appointments.length}), ${t.leadToDeliveryPct}% Pipeline-to-Delivery.`,
      String(role)
    );
    void downloadReportPdfFile(rec, triggerToast);
  };

  const handleShare = (method: string) => {
    const existing = getLatestOrSeedCategoryReport(activeStoreId, 'conv');
    void executeReportShare(method, existing, triggerToast);
  };

  const totalPool =
    t.totalLeads + t.appointments.length + t.pending.length + t.sold.length;

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between">
      <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col justify-center">
        {convView === 'overview' ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            <div
              onClick={() => setConvView('tags')}
              className="cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <RatioBox
                label="Inquiry → Contact"
                value={`${t.contactRatioPct}%`}
                sub={`${t.contactedLeadsCount}/${t.totalLeads} Active`}
              />
            </div>
            <div
              onClick={() => setConvView('tags')}
              className="cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <RatioBox
                label="Appt Confirmed"
                value={`${t.apptConfirmRatioPct}%`}
                sub={`${t.confirmedApptsCount}/${t.appointments.length} Appts`}
              />
            </div>
            <div
              onClick={() => setConvView('tags')}
              className="cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <RatioBox
                label="Pipeline → Sold"
                value={`${t.leadToDeliveryPct}%`}
                sub={`${t.sold.length}/${totalPool} Total`}
              />
            </div>
            <div
              onClick={() => setConvView('tags')}
              className="cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <RatioBox
                label="Inventory Turn"
                value={`${t.inventoryTurnPct}%`}
                sub={`${t.sold.length}/${t.totalReadyUnits + t.sold.length} Units`}
              />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full bg-[#0a0f16] border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-2.5 sm:p-3 border-b border-white/10 bg-white/5 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setConvView('overview')}
                className="p-1.5 bg-black border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
              </button>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                {t.storeMeta.name} Funnel Progression
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3.5 py-2">Stage</th>
                    <th className="px-3.5 py-2">Pool</th>
                    <th className="px-3.5 py-2 text-right">Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    {
                      metric: '1. Inquiry → Contact',
                      pool: `${t.contactedLeadsCount}/${t.totalLeads}`,
                      val: `${t.contactRatioPct}%`,
                    },
                    {
                      metric: '2. Appts Confirmed',
                      pool: `${t.confirmedApptsCount}/${t.appointments.length}`,
                      val: `${t.apptConfirmRatioPct}%`,
                    },
                    {
                      metric: '3. Inventory Turn',
                      pool: `${t.sold.length}/${t.totalReadyUnits + t.sold.length}`,
                      val: `${t.inventoryTurnPct}%`,
                    },
                    {
                      metric: '4. Pipeline → Sold',
                      pool: `${t.sold.length}/${totalPool}`,
                      val: `${t.leadToDeliveryPct}%`,
                    },
                  ].map((c, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-3.5 py-2 font-bold text-white">{c.metric}</td>
                      <td className="px-3.5 py-2 text-gray-400">{c.pool}</td>
                      <td className="px-3.5 py-2 text-right font-black text-blue-400">{c.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
      <ReportActionToolbar onGeneratePDF={handleGenerate} onShare={handleShare} />
    </div>
  );
}

// ============================================================================
// LANE 6: SOLD CARS MODAL
// ============================================================================
export function SoldVehiclesModal({ triggerToast }: ModalProps) {
  const { activeStoreId } = useStoreAppearance();
  const { role } = useAuth();
  const t = useLiveStoreTelemetry(activeStoreId);
  const soldList = t.sold;

  const handleGenerate = () => {
    const rec = createArchivedReportSnapshot(
      activeStoreId,
      'sold',
      'Sold Vehicles & Gross Ledger',
      `${soldList.length} Units Sold`,
      `Delivered ${soldList.length} vehicles at ${t.storeMeta.name} ($${t.totalGrossNum.toLocaleString()} total gross; $${t.avgGrossNum.toLocaleString()} avg per unit).`,
      String(role)
    );
    void downloadReportPdfFile(rec, triggerToast);
  };

  const handleShare = (method: string) => {
    const existing = getLatestOrSeedCategoryReport(activeStoreId, 'sold');
    void executeReportShare(method, existing, triggerToast);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between">
      <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col justify-center gap-2.5 sm:gap-3.5">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 shrink-0">
          <RatioBox
            label="Delivered Units"
            value={`${soldList.length}`}
            sub={`$${t.totalGrossNum.toLocaleString()} Gross`}
          />
          <RatioBox
            label="Avg Gross / Unit"
            value={`$${t.avgGrossNum.toLocaleString()}`}
            sub={`Top: ${t.topRep}`}
          />
        </div>

        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3.5 py-2">Customer</th>
                <th className="px-3.5 py-2">Vehicle</th>
                <th className="px-3.5 py-2">Gross</th>
                <th className="px-3.5 py-2 text-right">Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {soldList.map((deal) => (
                <tr key={deal.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-3.5 py-2 font-bold text-white">{deal.name}</td>
                  <td className="px-3.5 py-2 text-gray-400">{deal.vehicle}</td>
                  <td className="px-3.5 py-2 font-bold text-emerald-400">{deal.profit}</td>
                  <td className="px-3.5 py-2 text-right text-gray-300 font-medium">
                    {deal.rep || CURRENT_USER}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ReportActionToolbar onGeneratePDF={handleGenerate} onShare={handleShare} />
    </div>
  );
}

// ============================================================================
// LANE 7: PENDING DEALS & NEXT APPOINTMENT MODAL
// ============================================================================
export function CustomerDeepDiveModal({
  type,
  storeId,
  triggerToast,
}: {
  type: 'pending' | 'next';
  storeId?: string;
  triggerToast: (msg: string) => void;
}) {
  const { activeStoreId } = useStoreAppearance();
  const { role } = useAuth();
  const effectiveStoreId = storeId || activeStoreId;
  const t = useLiveStoreTelemetry(effectiveStoreId);
  const pendingList = t.pending;

  const [selectedCustomer, setSelectedCustomer] = useState<DealRecord | null>(null);
  const [nextApptRecord, setNextApptRecord] = useState<DealRecord | null>(null);

  type CommMethod = 'none' | 'instagram' | 'facebook' | 'whatsapp' | 'sms';
  const [activeComms, setActiveComms] = useState<CommMethod>('none');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (type !== 'next' || !effectiveStoreId) return;

    const fetchNextAppointment = () => {
      const appt = getNextAppointment(effectiveStoreId);
      if (appt) {
        setNextApptRecord({
          id: appt.id,
          name: appt.customer || appt.name || 'Customer',
          vehicle: appt.vehicle,
          rep: appt.rep,
          stage: appt.status,
          socials: {
            facebook: appt.customer || appt.name,
            whatsapp: '+57 300 123 4567',
          },
        });
      } else {
        setNextApptRecord(null);
      }
    };

    fetchNextAppointment();
    window.addEventListener('appointmentsUpdated', fetchNextAppointment);
    return () => window.removeEventListener('appointmentsUpdated', fetchNextAppointment);
  }, [type, effectiveStoreId]);

  const handleSocialClick = (platform: CommMethod) => {
    setActiveComms(activeComms === platform ? 'none' : platform);
  };

  const handleGenerate = () => {
    const rec = createArchivedReportSnapshot(
      effectiveStoreId,
      'sold',
      'Pending F&I Deals Audit',
      `${pendingList.length} Pending`,
      `${pendingList.length} active desked deals at ${t.storeMeta.name} (${pendingList.map((p) => `${p.name} - ${p.vehicle}`).join('; ') || 'None'}).`,
      String(role)
    );
    void downloadReportPdfFile(rec, triggerToast);
  };

  const handleShare = (method: string) => {
    const existing = getLatestOrSeedCategoryReport(effectiveStoreId, 'sold');
    void executeReportShare(method, existing, triggerToast);
  };

  const renderProfile = (customer: DealRecord) => {
    const availableSocials = customer.socials
      ? Object.entries(customer.socials).filter(([, val]) => val)
      : [];
    const hasSocials = availableSocials.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col bg-[#0a0f16] border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-xs overflow-hidden relative"
      >
        <div className="flex justify-between items-start gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {type === 'pending' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setActiveComms('none');
                }}
                className="p-1.5 bg-black border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft size={13} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-white truncate">{customer.name}</h1>
              <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-lg bg-blue-500/20 text-blue-400">
                {customer.stage}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-2.5 relative z-10">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 block">Vehicle</span>
            <span className="font-bold text-white text-xs truncate block">{customer.vehicle}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 block">Rep</span>
            <span className="font-bold text-white text-xs block">{customer.rep || CURRENT_USER}</span>
          </div>
        </div>

        <AnimatePresence>
          {activeComms !== 'none' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-2.5"
            >
              <div className="p-2 rounded-xl border border-blue-500/30 bg-blue-500/10">
                <textarea
                  name="quick_comms_reply"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${customer.name}...`}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none resize-none h-12 mb-1.5"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveComms('none')}
                    className="px-2.5 py-1 text-[11px] font-bold text-gray-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerToast(`${activeComms} is not connected. Message not sent.`);
                    }}
                    className="px-3 py-1 text-[11px] font-bold rounded-lg bg-blue-500 text-white cursor-pointer"
                  >
                    Send unavailable
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 relative z-10">
          <button
            type="button"
            onClick={() => {
              triggerToast('Calling is unavailable until a telephony provider is connected.');
            }}
            className="flex-1 min-h-8 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <Phone size={12} /> Call unavailable
          </button>
          {hasSocials &&
            availableSocials.map(([platform]) => (
              <button
                type="button"
                key={platform}
                onClick={() => handleSocialClick(platform as CommMethod)}
                className="px-3 py-1.5 font-bold rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-white cursor-pointer"
              >
                {platform === 'instagram' ? (
                  <Camera size={12} />
                ) : platform === 'facebook' ? (
                  <Globe size={12} />
                ) : (
                  <MessageCircle size={12} />
                )}
              </button>
            ))}
          <button
            type="button"
            onClick={() => triggerToast('Opening CRM profile...')}
            className="flex-1 min-h-8 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <ExternalLink size={12} /> CRM
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between">
      <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar flex flex-col justify-center">
        {type === 'next' ? (
          nextApptRecord ? (
            renderProfile(nextApptRecord)
          ) : (
            <div className="flex items-center justify-center py-6 text-gray-500 font-bold text-sm">
              No upcoming appointments to display.
            </div>
          )
        ) : selectedCustomer ? (
          renderProfile(selectedCustomer)
        ) : (
          <div className="space-y-2.5 sm:space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              <RatioBox
                label="Pending F&I"
                value={`${pendingList.length}`}
                sub="Awaiting Stips"
              />
              <RatioBox
                label="Lobby Queue"
                value={`${t.handoffs.length}`}
                sub={`${t.avgWaitMinutes}m Avg Wait`}
              />
            </div>

            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2">Customer</th>
                    <th className="px-3.5 py-2">Vehicle</th>
                    <th className="px-3.5 py-2">Stage</th>
                    <th className="px-3.5 py-2 text-right">Rep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingList.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => {
                        setAgentLiveActivity(
                          effectiveStoreId,
                          CURRENT_USER,
                          `Inspecting Pending Deal • ${deal.name}`
                        );
                        setSelectedCustomer(deal);
                      }}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-3.5 py-2 font-bold text-white group-hover:text-orange-400 transition-colors">
                        {deal.name} &rarr;
                      </td>
                      <td className="px-3.5 py-2 text-gray-400">{deal.vehicle}</td>
                      <td className="px-3.5 py-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-right text-gray-300 font-medium">
                        {deal.rep || CURRENT_USER}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ReportActionToolbar onGeneratePDF={handleGenerate} onShare={handleShare} />
    </div>
  );
}
