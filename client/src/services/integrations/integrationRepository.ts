import { apiRequest } from '../apiClient';

export type IntegrationProvider = 'net2phone' | 'dealercenter' | 'gohighlevel' | 'website_inventory' | 'custom_api';
export interface IntegrationConnection {
  id: string;
  storeId: string | null;
  provider: IntegrationProvider;
  displayName: string;
  status: 'pending_configuration' | 'connected' | 'error' | 'disabled';
  credentialsConfigured: boolean;
  scopes: string[];
  lastSyncedAt: string | null;
  lastError: string;
  createdAt: string;
  updatedAt: string;
}

export const integrationRepository = {
  list(storeId: string) {
    return apiRequest<IntegrationConnection[]>(`/integrations?${new URLSearchParams({ storeId })}`);
  },
  save(input: { storeId: string; provider: IntegrationProvider; displayName: string; credentials: Record<string, string>; scopes: string[] }) {
    return apiRequest<IntegrationConnection>('/integrations', { method: 'POST', body: JSON.stringify(input) });
  },
  disable(id: string) {
    return apiRequest<IntegrationConnection>(`/integrations/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
