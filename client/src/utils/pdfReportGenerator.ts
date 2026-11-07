// src/utils/pdfReportGenerator.ts
import { STORES, getStoreDataOrEmpty } from '../data/mockDatabase';
import defaultBanner from '../images/defaultBanner.avif';

export type ReportType = 'agent' | 'lead' | 'conv' | 'sold' | 'pending';
export type ArchiveCategory = 'KPI' | 'Sold' | 'Lead' | 'Inventory';
export type ArchiveMonth = 'June' | 'July' | 'September' | 'October';

export interface GeneratedReportRecord {
  id: string;
  storeId: string;
  storeName: string;
  reportType: ReportType;
  category: ArchiveCategory;
  month: ArchiveMonth;
  day: number;
  createdAtTime: string;
  headlineValue: string;
  numericMetric: number;
  previousMetric: number;
  deltaPct: number;
  summary: string;
  metricsBreakdown: Array<{ label: string; value: string }>;
}

const ARCHIVE_STORAGE_KEY = 'eveo_generated_reports_archive_v1';

export function mapReportTypeToArchiveCategory(reportId: ReportType): ArchiveCategory {
  if (reportId === 'agent') return 'KPI';
  if (reportId === 'sold') return 'Sold';
  if (reportId === 'lead') return 'Lead';
  return 'Inventory'; // 'conv' & 'pending'
}

function seedStoreArchive(storeId: string): GeneratedReportRecord[] {
  if (!STORES.some((store) => store.id === storeId)) return [];
  const storeObj = STORES.find((s) => s.id === storeId)!;
  const storeName = storeObj.name;

  const baseSeeds: Omit<GeneratedReportRecord, 'storeId' | 'storeName'>[] = [
    // KPI Reports (June, July, September, October)
    { id: `kpi_jun_14_${storeId}`, reportType: 'agent', category: 'KPI', month: 'June', day: 14, createdAtTime: '5:30 PM', headlineValue: '74% SLA', numericMetric: 74, previousMetric: 68, deltaPct: 8.8, summary: 'Outbound BDC call pacing reached 168 dials with 74% daily goal completion.', metricsBreakdown: [{ label: 'Calls', value: '168' }, { label: 'SMS', value: '92' }, { label: 'Appts Set', value: '4' }] },
    { id: `kpi_jul_22_${storeId}`, reportType: 'agent', category: 'KPI', month: 'July', day: 22, createdAtTime: '6:00 PM', headlineValue: '81% SLA', numericMetric: 81, previousMetric: 74, deltaPct: 9.5, summary: 'Contact-to-appointment conversion rose to 9.2% across 190 dials.', metricsBreakdown: [{ label: 'Calls', value: '190' }, { label: 'SMS', value: '110' }, { label: 'Appts Set', value: '5' }] },
    { id: `kpi_sep_19_${storeId}`, reportType: 'agent', category: 'KPI', month: 'September', day: 19, createdAtTime: '6:15 PM', headlineValue: '89% SLA', numericMetric: 89, previousMetric: 81, deltaPct: 9.8, summary: 'Sub-3m response clock enforced on 91% of inbound leads.', metricsBreakdown: [{ label: 'Calls', value: '204' }, { label: 'SMS', value: '124' }, { label: 'Appts Set', value: '6' }] },
    { id: `kpi_oct_26_${storeId}`, reportType: 'agent', category: 'KPI', month: 'October', day: 26, createdAtTime: '5:45 PM', headlineValue: '92% SLA', numericMetric: 92, previousMetric: 89, deltaPct: 3.4, summary: '196 floor dials, 35 live contacts, 4 verified appointments.', metricsBreakdown: [{ label: 'Calls', value: '196' }, { label: 'Contacts', value: '35' }, { label: 'Appts Set', value: '4' }] },
    { id: `kpi_oct_27_${storeId}`, reportType: 'agent', category: 'KPI', month: 'October', day: 27, createdAtTime: '6:10 PM', headlineValue: '96% SLA', numericMetric: 96, previousMetric: 92, deltaPct: 4.3, summary: '214 floor dials, 50 live contacts, 5 verified appointments (10% live close).', metricsBreakdown: [{ label: 'Calls', value: '214' }, { label: 'Contacts', value: '50' }, { label: 'Appts Set', value: '5' }] },
    { id: `kpi_oct_27_b_${storeId}`, reportType: 'agent', category: 'KPI', month: 'October', day: 27, createdAtTime: '8:05 PM', headlineValue: '98% SLA', numericMetric: 98, previousMetric: 96, deltaPct: 2.1, summary: 'Evening shift wrap-up: 100% confirmation rate achieved for next-day visits.', metricsBreakdown: [{ label: 'Calls', value: '228' }, { label: 'Confirmed', value: '100%' }, { label: 'Leads MTD', value: '909' }] },

    // Sold Reports
    { id: `sold_jun_30_${storeId}`, reportType: 'sold', category: 'Sold', month: 'June', day: 30, createdAtTime: '7:00 PM', headlineValue: '12 Units', numericMetric: 12, previousMetric: 10, deltaPct: 20.0, summary: '12 units delivered in June with $2,950 avg front/back gross.', metricsBreakdown: [{ label: 'Delivered', value: '12' }, { label: 'Avg Gross', value: '$2,950' }, { label: 'Turn Ratio', value: '16%' }] },
    { id: `sold_jul_31_${storeId}`, reportType: 'sold', category: 'Sold', month: 'July', day: 31, createdAtTime: '7:15 PM', headlineValue: '15 Units', numericMetric: 15, previousMetric: 12, deltaPct: 25.0, summary: '15 units delivered in July (+25% MoM growth).', metricsBreakdown: [{ label: 'Delivered', value: '15' }, { label: 'Avg Gross', value: '$3,180' }, { label: 'Turn Ratio', value: '18%' }] },
    { id: `sold_sep_30_${storeId}`, reportType: 'sold', category: 'Sold', month: 'September', day: 30, createdAtTime: '6:50 PM', headlineValue: '19 Units', numericMetric: 19, previousMetric: 15, deltaPct: 26.7, summary: '19 units delivered in September led by SUV & EV demand.', metricsBreakdown: [{ label: 'Delivered', value: '19' }, { label: 'Avg Gross', value: '$3,340' }, { label: 'Turn Ratio', value: '20%' }] },
    { id: `sold_oct_27_${storeId}`, reportType: 'sold', category: 'Sold', month: 'October', day: 27, createdAtTime: '6:30 PM', headlineValue: '23 Units', numericMetric: 23, previousMetric: 19, deltaPct: 21.1, summary: '23 units delivered MTD against 109 ready-for-sale units (21% ratio).', metricsBreakdown: [{ label: 'Delivered MTD', value: '23' }, { label: 'Ready Stock', value: '109' }, { label: 'Inv Ratio', value: '21%' }] },

    // Lead Reports
    { id: `lead_jun_20_${storeId}`, reportType: 'lead', category: 'Lead', month: 'June', day: 20, createdAtTime: '4:15 PM', headlineValue: '640 Leads', numericMetric: 640, previousMetric: 590, deltaPct: 8.5, summary: 'Multi-channel inbound volume reached 640 inquiries.', metricsBreakdown: [{ label: 'Leads MTD', value: '640' }, { label: 'Avg SLA', value: '3m 40s' }, { label: 'Appts MTD', value: '88' }] },
    { id: `lead_jul_25_${storeId}`, reportType: 'lead', category: 'Lead', month: 'July', day: 25, createdAtTime: '5:00 PM', headlineValue: '720 Leads', numericMetric: 720, previousMetric: 640, deltaPct: 12.5, summary: 'Instagram DM and Walk-in QR lifted monthly leads to 720.', metricsBreakdown: [{ label: 'Leads MTD', value: '720' }, { label: 'Avg SLA', value: '3m 12s' }, { label: 'Appts MTD', value: '102' }] },
    { id: `lead_sep_28_${storeId}`, reportType: 'lead', category: 'Lead', month: 'September', day: 28, createdAtTime: '5:30 PM', headlineValue: '845 Leads', numericMetric: 845, previousMetric: 720, deltaPct: 17.4, summary: '845 leads captured with 115 appointments booked.', metricsBreakdown: [{ label: 'Leads MTD', value: '845' }, { label: 'Avg SLA', value: '2m 55s' }, { label: 'Appts MTD', value: '115' }] },
    { id: `lead_oct_27_${storeId}`, reportType: 'lead', category: 'Lead', month: 'October', day: 27, createdAtTime: '6:00 PM', headlineValue: '909 Leads', numericMetric: 909, previousMetric: 845, deltaPct: 7.6, summary: '909 leads MTD, 123 appointments MTD, 2.5% inquiry-to-delivery ratio.', metricsBreakdown: [{ label: 'Leads MTD', value: '909' }, { label: 'Appts MTD', value: '123' }, { label: 'Inq→Deliv', value: '2.5%' }] },

    // Inventory & Conversion Reports
    { id: `inv_jun_28_${storeId}`, reportType: 'conv', category: 'Inventory', month: 'June', day: 28, createdAtTime: '3:45 PM', headlineValue: '38% Turn', numericMetric: 38, previousMetric: 34, deltaPct: 11.8, summary: 'Frontline inventory turn at 38% with 58% appointment show rate.', metricsBreakdown: [{ label: 'Contact Rate', value: '42%' }, { label: 'Show Rate', value: '58%' }, { label: 'Inv Turn', value: '38%' }] },
    { id: `inv_jul_29_${storeId}`, reportType: 'conv', category: 'Inventory', month: 'July', day: 29, createdAtTime: '4:20 PM', headlineValue: '41% Turn', numericMetric: 41, previousMetric: 38, deltaPct: 7.9, summary: 'Show rate climbed to 63% after BDC double-confirm workflow.', metricsBreakdown: [{ label: 'Contact Rate', value: '45%' }, { label: 'Show Rate', value: '63%' }, { label: 'Inv Turn', value: '41%' }] },
    { id: `inv_sep_29_${storeId}`, reportType: 'conv', category: 'Inventory', month: 'September', day: 29, createdAtTime: '5:10 PM', headlineValue: '44% Turn', numericMetric: 44, previousMetric: 41, deltaPct: 7.3, summary: '66% verified show ratio across 109 frontline units.', metricsBreakdown: [{ label: 'Contact Rate', value: '47%' }, { label: 'Show Rate', value: '66%' }, { label: 'Inv Turn', value: '44%' }] },
    { id: `inv_oct_27_${storeId}`, reportType: 'conv', category: 'Inventory', month: 'October', day: 27, createdAtTime: '6:20 PM', headlineValue: '45% Turn', numericMetric: 45, previousMetric: 44, deltaPct: 2.3, summary: '48% contact rate, 68% show rate, and 45% 45-day inventory turnover.', metricsBreakdown: [{ label: 'Contact Rate', value: '48%' }, { label: 'Show Rate', value: '68%' }, { label: 'Inv Turn', value: '45%' }] },
  ];

  return baseSeeds.map((item) => ({
    ...item,
    storeId,
    storeName,
  }));
}

export function getStoreGeneratedReports(storeId: string): GeneratedReportRecord[] {
  if (typeof window === 'undefined') return seedStoreArchive(storeId);
  try {
    const key = `${ARCHIVE_STORAGE_KEY}_${storeId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const seeded = seedStoreArchive(storeId);
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  } catch {
    return seedStoreArchive(storeId);
  }
}

export function createNewGeneratedReportSnapshot(
  storeId: string,
  reportType: ReportType
): GeneratedReportRecord {
  const existing = getStoreGeneratedReports(storeId);
  const storeObj = STORES.find((s) => s.id === storeId) || { id: storeId, name: '', logoText: '', logoUrl: '', bannerUrl: '', themeGradient: '' };
  const storeData = getStoreDataOrEmpty(storeId);
  const hasDemoData = STORES.some((store) => store.id === storeId);
  const category = mapReportTypeToArchiveCategory(reportType);

  const sameCat = existing.filter((r) => r.category === category);
  const prev = sameCat[sameCat.length - 1];

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const day = now.getDate() || 30;

  let headlineValue = hasDemoData ? '97% SLA' : '0';
  let numericMetric = hasDemoData ? 97 : 0;
  let summary = hasDemoData
    ? `Live snapshot generated for ${storeObj.name}: ${storeData.leads.length} active pipeline leads, ${storeData.appointments.length} scheduled visits.`
    : 'No operational records are available for this store yet.';
  let metricsBreakdown = [
    { label: 'Active Leads', value: String(storeData.leads.length) },
    { label: 'Appts on Deck', value: String(storeData.appointments.length) },
    { label: 'Delivered MTD', value: hasDemoData ? '23' : '0' },
  ];

  if (category === 'Sold') {
    numericMetric = (hasDemoData ? 23 : 0) + storeData.sold.length;
    headlineValue = `${numericMetric} Units`;
    summary = hasDemoData ? `Live Sold Roster snapshot: ${numericMetric} delivered units vs 109 ready-for-sale vehicles.` : `${numericMetric} delivered units.`;
    metricsBreakdown = [
      { label: 'Delivered Units', value: String(numericMetric) },
      { label: 'Pending F&I', value: String(storeData.pending.length) },
      { label: 'Inv→Deliv Ratio', value: hasDemoData ? '21%' : '0%' },
    ];
  } else if (category === 'Lead') {
    numericMetric = (hasDemoData ? 909 : 0) + storeData.leads.length;
    headlineValue = `${numericMetric} Leads`;
    summary = hasDemoData ? `Live Lead Attribution snapshot: ${numericMetric} MTD leads with <3m average response SLA.` : `${numericMetric} leads.`;
    metricsBreakdown = [
      { label: 'Leads MTD', value: String(numericMetric) },
      { label: 'Appts MTD', value: hasDemoData ? '123' : '0' },
      { label: 'Response Clock', value: hasDemoData ? '2m 48s' : '0' },
    ];
  } else if (category === 'Inventory') {
    numericMetric = hasDemoData ? 46 : 0;
    headlineValue = hasDemoData ? '46% Turn' : '0';
    summary = hasDemoData ? `Live Funnel & Inventory snapshot: 48% contact rate, 68% show rate, 46% frontline turnover.` : 'No inventory records are available for this store yet.';
    metricsBreakdown = [
      { label: 'Contact Ratio', value: hasDemoData ? '48%' : '0%' },
      { label: 'Show Ratio', value: hasDemoData ? '68%' : '0%' },
      { label: 'Stock Turn', value: hasDemoData ? '46%' : '0%' },
    ];
  }

  const previousMetric = prev ? prev.numericMetric : numericMetric - 3;
  const deltaPct = Number(
    (((numericMetric - previousMetric) / Math.max(1, previousMetric)) * 100).toFixed(1)
  );

  const created: GeneratedReportRecord = {
    id: `gen_${category.toLowerCase()}_${Date.now()}`,
    storeId,
    storeName: storeObj.name,
    reportType,
    category,
    month: 'October',
    day,
    createdAtTime: timeStr,
    headlineValue,
    numericMetric,
    previousMetric,
    deltaPct,
    summary,
    metricsBreakdown,
  };

  const nextList = [...existing, created];
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${ARCHIVE_STORAGE_KEY}_${storeId}`, JSON.stringify(nextList));
    window.dispatchEvent(new CustomEvent('eveo:reports-archive-updated', { detail: { storeId } }));
  }
  return created;
}

export function getReportHistoricalComparison(storeId: string, reportType: ReportType) {
  const all = getStoreGeneratedReports(storeId);
  const category = mapReportTypeToArchiveCategory(reportType);
  const catReports = all.filter((r) => r.category === category);

  const months: ArchiveMonth[] = ['June', 'July', 'September', 'October'];
  const points = months.map((m) => {
    const inMonth = catReports.filter((r) => r.month === m);
    const last = inMonth[inMonth.length - 1];
    return {
      label: m.slice(0, 3),
      fullMonth: m,
      value: last ? last.numericMetric : 0,
      count: inMonth.length,
    };
  });

  // Live current standing point
  const latestVal = points[points.length - 1]?.value || 50;
  const firstVal = points[0]?.value || 40;
  const liveNowVal = Math.round(latestVal * 1.04);
  const overallGrowthPct = Number(
    (((liveNowVal - firstVal) / Math.max(1, firstVal)) * 100).toFixed(1)
  );

  return {
    category,
    unitSuffix:
      category === 'KPI'
        ? '%'
        : category === 'Sold'
          ? ' units'
          : category === 'Lead'
            ? ''
            : '%',
    points: [...points, { label: 'Live', fullMonth: 'October' as ArchiveMonth, value: liveNowVal, count: 1 }],
    overallGrowthPct,
    totalSavedCount: catReports.length,
  };
}

export function exportPersonalizedReportPDF(
  storeId: string,
  reportId: ReportType,
  existingRecord?: GeneratedReportRecord
): GeneratedReportRecord {
  const record = existingRecord || createNewGeneratedReportSnapshot(storeId, reportId);
  const storeObj = STORES.find((s) => s.id === storeId) || { id: storeId, name: '', logoText: '', logoUrl: '', bannerUrl: '', themeGradient: '' };
  const storeData = getStoreDataOrEmpty(storeId);

  const bannerSrc = storeObj.bannerUrl || storeData.bannerUrl || (STORES.some((store) => store.id === storeId) ? defaultBanner : '');
  const logoSrc = storeObj.logoUrl || '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${storeObj.name} - ${record.category} Review (${record.month} ${record.day})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #111827; width: 794px; margin: 0 auto; padding: 28px 36px; }
    @page { size: A4 portrait; margin: 10mm; }
    .top-header { display: flex; width: 100%; height: 180px; border: 1px solid #e5e7eb; margin-bottom: 20px; overflow: hidden; }
    .banner-left { position: relative; width: 67%; height: 100%; background: #111827; overflow: hidden; }
    .banner-left img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7); }
    .banner-title-top { position: absolute; top: 20px; left: 30px; font-size: 48px; font-weight: 900; color: #fff; }
    .banner-title-bottom { position: absolute; bottom: 20px; right: 24px; font-size: 46px; font-weight: 900; color: #fff; }
    .logo-right { width: 33%; height: 100%; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; text-align: center; border-left: 1px solid #e5e7eb; }
    .logo-right img { max-width: 80%; max-height: 72px; object-fit: contain; margin-bottom: 6px; }
    .logo-wordmark { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
    h2 { font-size: 18px; font-weight: 800; margin: 14px 0 10px; color: #111827; }
    .overview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
    .ov-top { padding: 14px; background: linear-gradient(90deg, #b0b3b8 0%, #f3f4f6 100%); font-size: 12px; font-weight: 800; height: 64px; display: flex; align-items: center; }
    .ov-bot { padding: 14px; background: #f5f6f8; font-size: 10.5px; color: #374151; line-height: 1.45; min-height: 78px; }
    .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
    .metric-box { padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; text-align: center; }
    .metric-box strong { display: block; font-size: 24px; font-weight: 900; color: #1d4ed8; }
    .metric-box span { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; }
    .target-item { border: 1px solid #e5e7eb; margin-bottom: 10px; }
    .target-head { padding: 12px 18px; background: linear-gradient(90deg, #bbf7d0 0%, #93c5fd 100%); font-size: 11px; font-weight: 800; }
    .target-body { padding: 12px 18px; background: #f5f6f8; font-size: 10.5px; color: #374151; }
  </style>
</head>
<body>
  <div class="top-header">
    <div class="banner-left">
      <img src="${bannerSrc}" alt="Banner" />
      <div class="banner-title-top">${record.category}</div>
      <div class="banner-title-bottom">Review</div>
    </div>
    <div class="logo-right">
      ${logoSrc ? `<img src="${logoSrc}" alt="${storeObj.name}" />` : ''}
      <div class="logo-wordmark">${storeObj.name}</div>
      <div style="font-size:10px;color:#64748b;margin-top:4px;">${record.month} ${record.day}, 2026 &bull; ${record.createdAtTime}</div>
    </div>
  </div>

  <h2>Overview</h2>
  <div class="overview-grid">
    <div><div class="ov-top">Overall Business Performance</div><div class="ov-bot">${record.summary}</div></div>
    <div><div class="ov-top">Timeframe &amp; Delta</div><div class="ov-bot">${record.month} ${record.day}, 2026 (${record.createdAtTime})<br/><strong>${record.deltaPct >= 0 ? '+' : ''}${record.deltaPct}% vs prior report</strong></div></div>
    <div><div class="ov-top">Headline Standing</div><div class="ov-bot"><strong>${record.headlineValue}</strong><br/>Verified in EVEO Archive</div></div>
  </div>

  <h2>Key Telemetry Breakdown</h2>
  <div class="metrics-row">
    ${record.metricsBreakdown.map((m) => `<div class="metric-box"><strong>${m.value}</strong><span>${m.label}</span></div>`).join('')}
  </div>

  <h2>Future Improvement Target</h2>
  <div class="target-item">
    <div class="target-head">&bull; Lead Source &amp; SLA Continuity :</div>
    <div class="target-body">Maintain sub-3-minute response SLAs and cross-reference aged inventory against archived CRM leads daily.</div>
  </div>
  <div class="target-item">
    <div class="target-head">&bull; Shift Capacity Optimization :</div>
    <div class="target-body">Balance 100-call shift targets with automated SMS confirmation workflows to maximize live contact-to-appointment conversion.</div>
  </div>
</body>
</html>`;

  // Render inside a popup-safe hidden iframe and trigger print/save-as-PDF
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 350);
  }

  return record;
}

export function shareGeneratedReport(
  storeId: string,
  reportType: ReportType,
  method: 'WhatsApp' | 'Email' | 'SMS' | 'Link',
  existingRecord?: GeneratedReportRecord
): { record: GeneratedReportRecord; shareUrl: string } {
  const record = existingRecord || createNewGeneratedReportSnapshot(storeId, reportType);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://eveo.app';
  const shareUrl = `${origin}/app/reports?store=${storeId}&archive=${record.category}&month=${record.month}&day=${record.day}&reportId=${record.id}`;

  const shareText = `EVEO ${record.category} Report (${record.storeName} • ${record.month} ${record.day}): ${record.headlineValue} (${record.deltaPct >= 0 ? '+' : ''}${record.deltaPct}% vs prior). View full interactive report & PDF: ${shareUrl}`;

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    void navigator.clipboard.writeText(shareUrl);
  }

  if (method === 'WhatsApp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  } else if (method === 'Email') {
    const subject = `EVEO ${record.category} Report — ${record.storeName} (${record.month} ${record.day})`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
  } else if (method === 'SMS') {
    window.location.href = `sms:?&body=${encodeURIComponent(shareText)}`;
  }

  return { record, shareUrl };
}
