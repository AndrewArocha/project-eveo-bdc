import { apiRequest } from '../apiClient';

export interface InventoryImportJob {
  id: string;
  storeId: string;
  kind: 'inventory_csv';
  sourceName: string;
  status: 'processing' | 'completed' | 'completed_with_errors' | 'failed';
  totalRows: number;
  createdCount: number;
  observedCount: number;
  errorCount: number;
  rowErrors: Array<{ row: number; message: string }>;
  startedAt: string;
  completedAt: string | null;
  duplicateUpload?: boolean;
}

export const inventoryImportRepository = {
  list(storeId: string) {
    return apiRequest<InventoryImportJob[]>(`/inventory/imports?${new URLSearchParams({ storeId })}`);
  },
  upload(input: { storeId: string; fileName: string; csv: string }) {
    return apiRequest<InventoryImportJob>('/inventory/imports/csv', { method: 'POST', body: JSON.stringify(input) });
  },
};
