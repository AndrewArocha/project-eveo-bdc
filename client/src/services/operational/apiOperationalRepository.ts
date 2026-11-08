import { apiRequest } from '../apiClient';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'appointment_set' | 'nurture' | 'lost' | 'converted';
export type AppointmentStatus = 'pending_confirmation' | 'confirmed' | 'arrived' | 'showed' | 'no_show' | 'cancelled' | 'sold';

export interface ApiLead {
  _id: string;
  dealerAccountId: string;
  storeId: string;
  customerId: string | null;
  customerNameSnapshot: string;
  phoneSnapshot: string;
  emailSnapshot: string;
  vehicleOfInterest: string;
  inventoryVehicleId: string | null;
  source: string;
  status: LeadStatus;
  assignedPlatformUserId: string | null;
  assignedStoreUserId: string | null;
  notes: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateLeadInput = Pick<ApiLead, 'storeId' | 'customerNameSnapshot'> & Partial<Pick<ApiLead,
  'customerId' | 'phoneSnapshot' | 'emailSnapshot' | 'vehicleOfInterest' | 'inventoryVehicleId' | 'source' |
  'assignedPlatformUserId' | 'assignedStoreUserId' | 'notes'>>;

export interface ApiAppointment {
  _id: string;
  dealerAccountId: string;
  storeId: string;
  customerId: string | null;
  leadId: string | null;
  customerNameSnapshot: string;
  phoneSnapshot: string;
  inventoryVehicleId: string | null;
  vehicleSnapshot: string;
  scheduledAt: string | null;
  status: AppointmentStatus;
  assignedPlatformUserId: string | null;
  assignedStoreUserId: string | null;
  notes: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

function notifyStoreOperationalUpdate(storeId: string) {
  window.dispatchEvent(new CustomEvent('eveo:operational-updated', { detail: { storeId } }));
  window.dispatchEvent(new CustomEvent('appointmentsUpdated', { detail: { storeId } }));
}

export type CreateAppointmentInput = Pick<ApiAppointment, 'storeId' | 'customerNameSnapshot'> & Partial<Pick<ApiAppointment,
  'customerId' | 'leadId' | 'phoneSnapshot' | 'inventoryVehicleId' | 'vehicleSnapshot' | 'scheduledAt' | 'status' |
  'assignedPlatformUserId' | 'assignedStoreUserId' | 'notes'>>;

export const apiOperationalRepository = {
  listLeads(storeId: string) {
    return apiRequest<ApiLead[]>(`/leads?${new URLSearchParams({ storeId })}`);
  },
  createLead(input: CreateLeadInput) {
    return apiRequest<ApiLead>('/leads', { method: 'POST', body: JSON.stringify(input) }).then((lead) => {
      notifyStoreOperationalUpdate(input.storeId);
      return lead;
    });
  },
  updateLead(storeId: string, leadId: string, input: Partial<Pick<ApiLead, 'status' | 'assignedPlatformUserId' | 'assignedStoreUserId' | 'notes'>>) {
    const query = new URLSearchParams({ storeId });
    return apiRequest<ApiLead>(`/leads/${encodeURIComponent(leadId)}?${query}`, {
      method: 'PATCH', body: JSON.stringify(input),
    }).then((lead) => {
      notifyStoreOperationalUpdate(storeId);
      return lead;
    });
  },
  listAppointments(storeId: string) {
    return apiRequest<ApiAppointment[]>(`/appointments?${new URLSearchParams({ storeId })}`);
  },
  createAppointment(input: CreateAppointmentInput) {
    return apiRequest<ApiAppointment>('/appointments', { method: 'POST', body: JSON.stringify(input) }).then((appointment) => {
      notifyStoreOperationalUpdate(input.storeId);
      return appointment;
    });
  },
  updateAppointmentStatus(storeId: string, appointmentId: string, status: AppointmentStatus) {
    const query = new URLSearchParams({ storeId });
    return apiRequest<ApiAppointment>(`/appointments/${encodeURIComponent(appointmentId)}/status?${query}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then((appointment) => {
      notifyStoreOperationalUpdate(storeId);
      return appointment;
    });
  },
};
