// src/data/stores/index.ts
import { type StoreData } from '../../types';
import { dkData } from './dk';
import { njxData, njxStoreModule } from './njx/index';
import { kiaData } from './kia';
import {
  NJX_HISTORICAL_REPORTS,
  type DailyBdcReportSnapshot,
  crossReferenceReports,
  computeManagerCapacityReality,
  formatWhatsAppDailyReport,
} from './njx/reports';
import { type UserExclusiveFolder } from './njx/users/usr_201_sarah';

export const STORE_DATA: Record<string, StoreData> = {
  njx: njxData,
  dk: dkData,
  kia: kiaData,
};

export function getStoreDataOrEmpty(storeId: string): StoreData {
  const data = STORE_DATA[storeId];
  if (data) return data;
  return { staff: [], leads: [], handoffs: [], appointments: [], sold: [], pending: [], bannerUrl: '' };
}

// Per-Store Daily Reports Registry (persisted in localStorage for daily additions)
const REPORTS_STORAGE_KEY = 'eveo_store_daily_reports_v1';

const DEFAULT_STORE_REPORTS: Record<string, DailyBdcReportSnapshot[]> = {
  njx: NJX_HISTORICAL_REPORTS,
  kia: [
    {
      id: 'rpt_kia_2026_10_27',
      storeId: 'kia',
      storeName: 'Northstar Kia',
      dateISO: '2026-10-27',
      displayDate: 'October 27',
      leadsMtd: 1120,
      appointmentsMade: 4,
      appointmentsMtd: 148,
      callCount: 62,
      floorTotalCalls: 240,
      leadsContacted: 43,
      floorApptsBooked: 5,
      emailCount: 41,
      smsCount: 58,
      dealsDelivered: 1,
      carsDelivered: 29,
      carsReadyForSale: 134,
      averageRatioBase: 100,
      inquiriesToDeliveriesRatio: 2.6,
      inventoryToDeliveryRatio: 21.6,
      agentDailyCallTarget: 100,
      avgMinutesPerCallCycle: 5,
    },
    {
      id: 'rpt_kia_2026_10_26',
      storeId: 'kia',
      storeName: 'Northstar Kia',
      dateISO: '2026-10-26',
      displayDate: 'October 26',
      leadsMtd: 1092,
      appointmentsMade: 5,
      appointmentsMtd: 144,
      callCount: 88,
      floorTotalCalls: 210,
      leadsContacted: 38,
      floorApptsBooked: 5,
      emailCount: 39,
      smsCount: 52,
      dealsDelivered: 2,
      carsDelivered: 28,
      carsReadyForSale: 135,
      averageRatioBase: 100,
      inquiriesToDeliveriesRatio: 2.6,
      inventoryToDeliveryRatio: 20.7,
      agentDailyCallTarget: 100,
      avgMinutesPerCallCycle: 5,
    },
  ],
  dk: [
    {
      id: 'rpt_dk_2026_10_27',
      storeId: 'dk',
      storeName: 'DK Auto Imports',
      dateISO: '2026-10-27',
      displayDate: 'October 27',
      leadsMtd: 640,
      appointmentsMade: 2,
      appointmentsMtd: 89,
      callCount: 48,
      floorTotalCalls: 165,
      leadsContacted: 29,
      floorApptsBooked: 3,
      emailCount: 28,
      smsCount: 35,
      dealsDelivered: 1,
      carsDelivered: 18,
      carsReadyForSale: 86,
      averageRatioBase: 100,
      inquiriesToDeliveriesRatio: 2.8,
      inventoryToDeliveryRatio: 20.9,
      agentDailyCallTarget: 100,
      avgMinutesPerCallCycle: 5,
    },
  ],
};

export function getStoreDailyReports(storeId: string): DailyBdcReportSnapshot[] {
  if (typeof window === 'undefined') return DEFAULT_STORE_REPORTS[storeId] || [];
  try {
    const saved = localStorage.getItem(`${REPORTS_STORAGE_KEY}_${storeId}`);
    if (saved) return JSON.parse(saved);
  } catch {
    // Fallback to defaults
  }
  return DEFAULT_STORE_REPORTS[storeId] || [];
}

export function saveStoreDailyReport(storeId: string, snapshot: DailyBdcReportSnapshot): DailyBdcReportSnapshot[] {
  const existing = getStoreDailyReports(storeId).filter((r) => r.dateISO !== snapshot.dateISO);
  const updated = [snapshot, ...existing];
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${REPORTS_STORAGE_KEY}_${storeId}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('eveo:daily-reports-updated', { detail: { storeId } }));
  }
  return updated;
}

export function getUserFolderById(storeId: string, userId: string): UserExclusiveFolder | undefined {
  if (storeId === 'njx') return njxStoreModule.getUserById(userId);
  return undefined;
}

export {
  crossReferenceReports,
  computeManagerCapacityReality,
  formatWhatsAppDailyReport,
  type DailyBdcReportSnapshot,
};

// Backwards Compatibility Exports
export const MOCK_LEADS = STORE_DATA['njx'].leads;
export const MOCK_HANDOFFS = STORE_DATA['njx'].handoffs;
export const MOCK_APPTS = STORE_DATA['njx'].appointments;
export const MOCK_SOLD = STORE_DATA['njx'].sold;
export const MOCK_PENDING = STORE_DATA['njx'].pending;
export const MOCK_AGENT_STATS = [
  { rep: 'Sarah J.', calls: 65, sms: 42, emails: 12, showroom: 5 },
  { rep: 'Erick', calls: 45, sms: 28, emails: 8, showroom: 4 },
  { rep: 'Michael T.', calls: 32, sms: 14, emails: 3, showroom: 3 },
];
