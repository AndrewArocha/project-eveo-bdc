const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').trim().replace(/\/$/, '');
export const apiBaseUrl = API_BASE_URL;

export function authHeaders(headers: HeadersInit = {}) {
  const result = new Headers(headers);
  const token = localStorage.getItem('eveo_token');
  if (token) result.set('Authorization', `Bearer ${token}`);
  return result;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  weeklySchedule?: Record<string, { start: string; end: string }>;
  role: 'owner' | 'manager' | 'bdc' | 'sales';
  dealerAccountId: string;
  storeIds: string[];
  createdAt: string;
}

export type ApiEmployeeRole = Exclude<ApiUser['role'], 'owner'>;
export interface ApiTeamMember extends Omit<ApiUser, 'createdAt'> { createdAt: string; }
export interface ApiUserInvitation {
  id: string;
  email: string;
  role: ApiEmployeeRole;
  storeIds: string[];
  status: 'pending' | 'accepted' | 'revoked';
  expiresAt: string;
  createdAt: string;
  token?: string;
}

export interface CustomerRecord {
  _id: string;
  storeId?: string | null;
  name: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  duplicate?: boolean;
}

export interface ApiStore {
  id: string;
  name: string;
  code: string;
  website: string;
  phone: string;
  address: string;
  timezone: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  data: T;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('eveo_token');
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('The EVEO server could not be reached. Check the API URL and try again.', 0);
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => null)) as
    | (ApiEnvelope<T> & { error?: { message?: string } })
    | null;
  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? `The request failed (${response.status}).`, response.status);
  }
  if (!payload || !('data' in payload)) throw new ApiError('The server returned an invalid response.', response.status);
  return payload.data;
}
