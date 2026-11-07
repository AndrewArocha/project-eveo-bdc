// src/data/stores/njx/reports/index.ts

export interface DailyBdcReportSnapshot {
  id: string;
  storeId: string;
  storeName: string;
  dateISO: string;         // e.g. '2026-10-27'
  displayDate: string;     // e.g. 'October 27'
  leadsMtd: number;        // e.g. 909
  appointmentsMade: number;// e.g. 2 (or 5 in floor rollup)
  appointmentsMtd: number; // e.g. 123
  callCount: number;       // e.g. 41 (single BDC rep)
  floorTotalCalls: number; // e.g. 214 (total BDC + floor calls Anthony cited)
  leadsContacted: number;  // e.g. 50 (actual humans who answered out of 214 calls)
  floorApptsBooked: number;// e.g. 5 (appointments booked from those 50 live contacts)
  emailCount: number;      // e.g. 36
  smsCount: number;        // e.g. 43
  dealsDelivered: number;  // e.g. 0
  carsDelivered: number;   // e.g. 23
  carsReadyForSale: number;// e.g. 109
  averageRatioBase: number;// e.g. 100
  inquiriesToDeliveriesRatio: number; // e.g. 2.5 (%)
  inventoryToDeliveryRatio: number;   // e.g. 21 (%)
  agentDailyCallTarget: number;       // 100 calls/shift
  avgMinutesPerCallCycle: number;     // 5 mins (sourcing + dial + talk + SMS/email + CRM log)
}

export interface ReportCrossReferenceDelta {
  previousDate: string;
  leadsMtdDelta: number;
  appointmentsMtdDelta: number;
  callCountDelta: number;
  emailCountDelta: number;
  smsCountDelta: number;
  carsDeliveredDelta: number;
  inventoryRatioDelta: number;
  inquiriesRatioDelta: number;
}

export interface ManagerCapacityRealityCheck {
  rawDialToApptPct: number;        // 5 / 214 = 2.3% (What Anthony mistakenly looks at)
  contactRatePct: number;          // 50 / 214 = 23.4% (Or <18% on raw cold leads)
  liveContactToApptPct: number;    // 5 / 50 = 10.0% (1 in 10 answered calls DOES book an appt!)
  shiftMinutesAvailable: number;   // 8 hours = 480 mins
  minutesPerCallWorkflow: number;  // 5 mins per full lead cycle
  maxSustainableCallsPerShift: number; // 96 - 100 calls max in 8h
  callsNeededFor15Appts: number;   // At 18% contact & 10% close = ~833 calls/day
  hoursNeededFor15Appts: number;   // 833 * 5m = 69.4 hours/day (4.2x - 8x over capacity)
  executiveVerdict: string;
}

export const NJX_HISTORICAL_REPORTS: DailyBdcReportSnapshot[] = [
  {
    id: 'rpt_njx_2026_10_27',
    storeId: 'njx',
    storeName: 'NJ Auto Xchange',
    dateISO: '2026-10-27',
    displayDate: 'October 27',
    leadsMtd: 909,
    appointmentsMade: 2,
    appointmentsMtd: 123,
    callCount: 41,
    floorTotalCalls: 214,
    leadsContacted: 50,
    floorApptsBooked: 5,
    emailCount: 36,
    smsCount: 43,
    dealsDelivered: 0,
    carsDelivered: 23,
    carsReadyForSale: 109,
    averageRatioBase: 100,
    inquiriesToDeliveriesRatio: 2.5,
    inventoryToDeliveryRatio: 21,
    agentDailyCallTarget: 100,
    avgMinutesPerCallCycle: 5,
  },
  {
    id: 'rpt_njx_2026_10_26',
    storeId: 'njx',
    storeName: 'NJ Auto Xchange',
    dateISO: '2026-10-26',
    displayDate: 'October 26',
    leadsMtd: 884,
    appointmentsMade: 4,
    appointmentsMtd: 121,
    callCount: 98,
    floorTotalCalls: 196,
    leadsContacted: 35,
    floorApptsBooked: 4,
    emailCount: 44,
    smsCount: 62,
    dealsDelivered: 2,
    carsDelivered: 23,
    carsReadyForSale: 111,
    averageRatioBase: 100,
    inquiriesToDeliveriesRatio: 2.6,
    inventoryToDeliveryRatio: 20.7,
    agentDailyCallTarget: 100,
    avgMinutesPerCallCycle: 5,
  },
  {
    id: 'rpt_njx_2026_10_25',
    storeId: 'njx',
    storeName: 'NJ Auto Xchange',
    dateISO: '2026-10-25',
    displayDate: 'October 25',
    leadsMtd: 851,
    appointmentsMade: 3,
    appointmentsMtd: 117,
    callCount: 92,
    floorTotalCalls: 185,
    leadsContacted: 33,
    floorApptsBooked: 3,
    emailCount: 39,
    smsCount: 55,
    dealsDelivered: 1,
    carsDelivered: 21,
    carsReadyForSale: 112,
    averageRatioBase: 100,
    inquiriesToDeliveriesRatio: 2.5,
    inventoryToDeliveryRatio: 18.8,
    agentDailyCallTarget: 100,
    avgMinutesPerCallCycle: 5,
  },
];

export function crossReferenceReports(
  current: DailyBdcReportSnapshot,
  previous?: DailyBdcReportSnapshot
): ReportCrossReferenceDelta | null {
  if (!previous) return null;
  return {
    previousDate: previous.displayDate,
    leadsMtdDelta: current.leadsMtd - previous.leadsMtd,
    appointmentsMtdDelta: current.appointmentsMtd - previous.appointmentsMtd,
    callCountDelta: current.callCount - previous.callCount,
    emailCountDelta: current.emailCount - previous.emailCount,
    smsCountDelta: current.smsCount - previous.smsCount,
    carsDeliveredDelta: current.carsDelivered - previous.carsDelivered,
    inventoryRatioDelta: Number((current.inventoryToDeliveryRatio - previous.inventoryToDeliveryRatio).toFixed(1)),
    inquiriesRatioDelta: Number((current.inquiriesToDeliveriesRatio - previous.inquiriesToDeliveriesRatio).toFixed(1)),
  };
}

export function computeManagerCapacityReality(
  report: DailyBdcReportSnapshot
): ManagerCapacityRealityCheck {
  const rawDialToApptPct = Number(
    ((report.floorApptsBooked / Math.max(1, report.floorTotalCalls)) * 100).toFixed(1)
  );
  const contactRatePct = Number(
    ((report.leadsContacted / Math.max(1, report.floorTotalCalls)) * 100).toFixed(1)
  );
  const liveContactToApptPct = Number(
    ((report.floorApptsBooked / Math.max(1, report.leadsContacted)) * 100).toFixed(1)
  );

  const shiftMinutesAvailable = 480; // 8-hour shift
  const minutesPerCallWorkflow = report.avgMinutesPerCallCycle || 5;
  const maxSustainableCallsPerShift = Math.floor(shiftMinutesAvailable / minutesPerCallWorkflow);

  // To get 15 appointments/day at current contact rate & 10% live conversion:
  const effectiveContactRate = Math.min(0.18, report.leadsContacted / Math.max(1, report.floorTotalCalls));
  const effectiveCloseRate = report.floorApptsBooked / Math.max(1, report.leadsContacted);
  const callsNeededFor15Appts = Math.round(15 / Math.max(0.01, effectiveContactRate * effectiveCloseRate));
  const hoursNeededFor15Appts = Number(((callsNeededFor15Appts * minutesPerCallWorkflow) / 60).toFixed(1));

  return {
    rawDialToApptPct,
    contactRatePct,
    liveContactToApptPct,
    shiftMinutesAvailable,
    minutesPerCallWorkflow,
    maxSustainableCallsPerShift,
    callsNeededFor15Appts,
    hoursNeededFor15Appts,
    executiveVerdict: `Out of ${report.floorTotalCalls} dials, ${report.leadsContacted} leads answered (${contactRatePct}% contact rate) and ${report.floorApptsBooked} booked an appointment — a ${liveContactToApptPct}% (1-in-10) live conversion rate. Because each full call workflow (sourcing + dial + talk + SMS + email) averages ${minutesPerCallWorkflow} mins, 100 calls already consumes 8.3 hours. Demanding 15+ daily appointments at sub-18% contact rates would require ~${callsNeededFor15Appts} dials (${hoursNeededFor15Appts} hours of phone labor per day), or 4x–8x over a single agent's physical 8-hour shift capacity.`,
  };
}

export function formatWhatsAppDailyReport(report: DailyBdcReportSnapshot): string {
  return `BDC Report
${report.displayDate}
🚘 ${report.storeName} 🚘

Leads MTD: ${report.leadsMtd}
Appointments made: ${report.appointmentsMade}
Appointments mtd: ${report.appointmentsMtd}
Call count: ${report.callCount}
Email count: ${report.emailCount}
SMS count: ${report.smsCount}
Deals delivered: ${report.dealsDelivered}
Inquiries to deliveries ratio: ${report.inquiriesToDeliveriesRatio}%
Average ratio: ${report.averageRatioBase} based on cars ready for sale
Cars Delivered: ${report.carsDelivered}
Inventory to Delivery ratio: ${report.inventoryToDeliveryRatio}% (Based on ${report.carsReadyForSale} cars ready for sale)`;
}