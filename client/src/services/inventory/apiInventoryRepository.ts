import { apiRequest } from '../apiClient';

export type InventoryStatus = 'READY_FOR_SALE' | 'PENDING' | 'DELIVERED';

export interface InventoryDiscrepancy {
  _id: string;
  field: string;
  currentValue: unknown;
  observedValue: unknown;
  source: string;
  status: 'open' | 'resolved';
  resolution?: 'accepted_source' | 'kept_current' | 'custom';
  resolvedValue?: unknown;
}

export interface ApiInventoryVehicle {
  _id: string;
  dealerAccountId: string;
  storeId: string;
  vin: string;
  stockNumber: string;
  vehicle: string;
  make: string;
  model: string;
  trim: string;
  modelYear: number | null;
  mileage: number | null;
  price: number;
  condition: 'NEW' | 'USED' | 'CERTIFIED_PRE_OWNED';
  status: InventoryStatus;
  photos: string[];
  sourceObservations: Array<{ source: string; observedAt: string }>;
  discrepancies: InventoryDiscrepancy[];
  createdAt: string;
  updatedAt: string;
  duplicate?: boolean;
}

export interface CreateInventoryVehicleInput {
  storeId: string;
  vin: string;
  vehicle: string;
  price?: number;
  status?: InventoryStatus;
}

export const apiInventoryRepository = {
  list(storeId: string, filters: { status?: InventoryStatus; search?: string } = {}) {
    const params = new URLSearchParams({ storeId });
    if (filters.status) params.set('status', filters.status);
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    return apiRequest<ApiInventoryVehicle[]>(`/inventory?${params.toString()}`);
  },
  create(input: CreateInventoryVehicleInput) {
    return apiRequest<ApiInventoryVehicle>('/inventory', { method: 'POST', body: JSON.stringify(input) });
  },
  update(id: string, input: Partial<Pick<ApiInventoryVehicle, 'stockNumber' | 'vehicle' | 'make' | 'model' | 'trim' | 'modelYear' | 'mileage' | 'price' | 'condition' | 'status' | 'photos'>>) {
    return apiRequest<ApiInventoryVehicle>(`/inventory/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  recordObservation(id: string, input: { source: string; values: Record<string, string | number | null> }) {
    return apiRequest<ApiInventoryVehicle>(`/inventory/${encodeURIComponent(id)}/observations`, { method: 'POST', body: JSON.stringify(input) });
  },
  resolveDiscrepancy(id: string, discrepancyId: string, input: { resolution: 'accepted_source' | 'kept_current' | 'custom'; value?: string | number | null }) {
    return apiRequest<ApiInventoryVehicle>(`/inventory/${encodeURIComponent(id)}/discrepancies/${encodeURIComponent(discrepancyId)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
};
