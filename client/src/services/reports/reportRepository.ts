import { apiRequest } from '../apiClient';

export interface KpiSourceRecord {
  id: string;
  label: string;
  occurredAt: string;
  status?: string;
}

export interface StoreKpiMetric {
  key: string;
  label: string;
  unit: 'count' | 'percentage';
  value: number | null;
  numerator?: number;
  denominator?: number;
  formula: string;
  measurementNote: string;
  sourceCount: number;
  sourceRecords: KpiSourceRecord[];
  sourcesTruncated: boolean;
}

export interface StoreKpiSummary {
  reportType: 'store_kpi';
  definitionVersion: number;
  storeId: string;
  storeTimeZone: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  metrics: StoreKpiMetric[];
}

export interface StoreKpiSnapshot extends StoreKpiSummary {
  id: string;
  generatedByUserId: string;
}

export interface StoreKpiSnapshotReference {
  id: string;
  storeId: string;
  reportType: 'store_kpi';
  periodStart: string;
  periodEnd: string;
  storeTimeZone: string;
  generatedAt: string;
  generatedByUserId: string;
  definitionVersion: number;
}

function query(period: { storeId: string; startAt: string; endAt: string }) {
  return new URLSearchParams(period).toString();
}

export const reportRepository = {
  getStoreSummary(period: { storeId: string; startAt: string; endAt: string }) {
    return apiRequest<StoreKpiSummary>(`/reports/summary?${query(period)}`);
  },
  listStoreSnapshots(storeId: string) {
    return apiRequest<StoreKpiSnapshotReference[]>(`/reports/snapshots?${new URLSearchParams({ storeId })}`);
  },
  getStoreSnapshot(snapshotId: string) {
    return apiRequest<StoreKpiSnapshot>(`/reports/snapshots/${encodeURIComponent(snapshotId)}`);
  },
  createStoreSnapshot(period: { storeId: string; startAt: string; endAt: string }) {
    return apiRequest<StoreKpiSnapshot>('/reports/snapshots', { method: 'POST', body: JSON.stringify(period) });
  },
};
