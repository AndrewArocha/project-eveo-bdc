import { apiRequest } from '../apiClient';
import type { ApiEmployeeRole, ApiTeamMember, ApiUserInvitation } from '../apiClient';

export const teamRepository = {
  listMembers(storeId: string) {
    return apiRequest<ApiTeamMember[]>(`/users?${new URLSearchParams({ storeId })}`);
  },
  listInvitations(storeId: string) {
    return apiRequest<ApiUserInvitation[]>(`/users/invitations?${new URLSearchParams({ storeId })}`);
  },
  invite(input: { email: string; role: ApiEmployeeRole; storeIds: string[] }) {
    return apiRequest<ApiUserInvitation>('/users/invitations', { method: 'POST', body: JSON.stringify(input) });
  },
  revokeInvitation(invitationId: string) {
    return apiRequest<{ id: string; status: 'revoked' }>(`/users/invitations/${encodeURIComponent(invitationId)}`, { method: 'DELETE' });
  },
  acceptInvitation(input: { token: string; name: string; password: string }) {
    return apiRequest<{ token: string; user: import('../apiClient').ApiUser }>('/auth/accept-invitation', {
      method: 'POST', body: JSON.stringify(input),
    });
  },
};
