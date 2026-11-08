import { useCallback, useEffect, useState } from 'react';
import type {
  ActivityEventRecord,
  AppointmentRecord,
  Customer,
  DealRecordEntity,
  DomainShowroomVisit,
  InventoryDiscrepancy,
  InventorySourceObservation,
  InventoryVehicle,
  LeadRecord,
  PlatformUser,
  StoreUser,
  UserPresenceRecord,
} from '../types/domain';
import {
  eveoDomainRepository,
  type CreateAppointmentInput,
  type CreateCustomerInput,
  type CreateInventoryVehicleInput,
  type CreateLeadInput,
  type RecordInventoryObservationInput,
  type UpdateAppointmentStatusInput,
  type ResolveVehicleAvailabilityInput,
} from '../services/repositories';

export interface StoreDomainData {
  customers: Customer[];
  inventoryVehicles: InventoryVehicle[];
  inventoryObservations: InventorySourceObservation[];
  inventoryDiscrepancies: InventoryDiscrepancy[];
  leads: LeadRecord[];
  appointments: AppointmentRecord[];
  deals: DealRecordEntity[];
  showroomVisits: DomainShowroomVisit[];
  activityEvents: ActivityEventRecord[];
  presence: UserPresenceRecord[];
  storeUsers: StoreUser[];
  assignedPlatformUsers: PlatformUser[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createCustomer: (input: Omit<CreateCustomerInput, 'storeId'>) => Promise<Customer>;
  createInventoryVehicle: (input: Omit<CreateInventoryVehicleInput, 'storeId'>) => Promise<InventoryVehicle>;
  recordInventoryObservation: (input: Omit<RecordInventoryObservationInput, 'storeId'>) => Promise<{ observation: InventorySourceObservation; discrepancies: InventoryDiscrepancy[] }>;
  resolveVehicleAvailability: (input: Omit<ResolveVehicleAvailabilityInput, 'storeId'>) => Promise<InventoryVehicle>;
  createLead: (input: Omit<CreateLeadInput, 'storeId'>) => Promise<LeadRecord>;
  createAppointment: (input: Omit<CreateAppointmentInput, 'storeId'>) => Promise<AppointmentRecord>;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentRecord['status']) => Promise<AppointmentRecord>;
}

const EMPTY: Omit<StoreDomainData, 'reload' | 'createCustomer' | 'createInventoryVehicle' | 'recordInventoryObservation' | 'resolveVehicleAvailability' | 'createLead' | 'createAppointment' | 'updateAppointmentStatus'> = {
  customers: [],
  inventoryVehicles: [],
  inventoryObservations: [],
  inventoryDiscrepancies: [],
  leads: [],
  appointments: [],
  deals: [],
  showroomVisits: [],
  activityEvents: [],
  presence: [],
  storeUsers: [],
  assignedPlatformUsers: [],
  isLoading: true,
  error: null,
};

/**
 * Store-scoped operational data hook. Screens subscribe to the repository
 * rather than reading localStorage or dealership-specific fixture modules.
 */
export function useStoreDomainData(storeId: string): StoreDomainData {
  const [data, setData] = useState(EMPTY);

  const reload = useCallback(async () => {
    if (!storeId) {
      setData({ ...EMPTY, isLoading: false });
      return;
    }
    setData((previous) => ({ ...previous, isLoading: true, error: null }));
    try {
      const [customers, inventoryVehicles, inventoryDiscrepancies, leads, appointments, deals, showroomVisits, activityEvents, presence, storeUsers, snapshot] = await Promise.all([
        eveoDomainRepository.listCustomers(storeId),
        eveoDomainRepository.listInventoryVehicles(storeId),
        eveoDomainRepository.listInventoryDiscrepancies(storeId),
        eveoDomainRepository.listLeads(storeId),
        eveoDomainRepository.listAppointments(storeId),
        eveoDomainRepository.listDeals(storeId),
        eveoDomainRepository.listShowroomVisits(storeId),
        eveoDomainRepository.listActivityEvents(storeId, 50),
        eveoDomainRepository.listPresence(storeId),
        eveoDomainRepository.listStoreUsers(storeId),
        eveoDomainRepository.getSnapshot(),
      ]);
      const inventoryObservations = snapshot.inventoryObservations.filter((item) => item.storeId === storeId);
      const store = snapshot.stores.find((item) => item.id === storeId);
      const assignedPlatformIds = new Set(snapshot.platformStoreAssignments
        .filter((assignment) => assignment.storeId === storeId && assignment.status === 'active')
        .map((assignment) => assignment.platformUserId));
      const assignedPlatformUsers = snapshot.platformUsers.filter((user) => assignedPlatformIds.has(user.id) && user.status === 'active');
      if (store) {
        setData({
          customers,
          inventoryVehicles,
          inventoryObservations,
          inventoryDiscrepancies,
          leads,
          appointments,
          deals,
          showroomVisits,
          activityEvents,
          presence,
          storeUsers,
          assignedPlatformUsers,
          isLoading: false,
          error: null,
        });
      } else {
        setData({ ...EMPTY, isLoading: false, error: 'The selected store is not present in the EVEO domain registry.' });
      }
    } catch (error) {
      setData((previous) => ({
        ...previous,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load this store’s operational data.',
      }));
    }
  }, [storeId]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!active) return;
      void reload();
    };
    void reload();
    const unsubscribe = eveoDomainRepository.subscribe(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [reload]);

  const createCustomer = useCallback(async (input: Omit<CreateCustomerInput, 'storeId'>) => {
    const result = await eveoDomainRepository.createCustomer({ ...input, storeId });
    await reload();
    return result;
  }, [reload, storeId]);

  const createInventoryVehicle = useCallback(async (input: Omit<CreateInventoryVehicleInput, 'storeId'>) => {
    const result = await eveoDomainRepository.createInventoryVehicle({ ...input, storeId });
    await reload();
    return result;
  }, [reload, storeId]);

  const recordInventoryObservation = useCallback(async (input: Omit<RecordInventoryObservationInput, 'storeId'>) => {
    const result = await eveoDomainRepository.recordInventoryObservation({ ...input, storeId });
    await reload();
    return result;
  }, [reload, storeId]);

  const resolveVehicleAvailability = useCallback(async (input: Omit<ResolveVehicleAvailabilityInput, 'storeId'>) => {
    const result = await eveoDomainRepository.resolveVehicleAvailability({ ...input, storeId });
    await reload();
    return result;
  }, [reload, storeId]);

  const createLead = useCallback(async (input: Omit<CreateLeadInput, 'storeId'>) => {
    const result = await eveoDomainRepository.createLead({ ...input, storeId });
    await reload();
    return result;
  }, [reload, storeId]);

  const createAppointment = useCallback(async (input: Omit<CreateAppointmentInput, 'storeId'>) => {
    const result = await eveoDomainRepository.createAppointment({ ...input, storeId });
    await reload();
    return result;
  }, [reload, storeId]);

  const updateAppointmentStatus = useCallback(async (appointmentId: string, status: AppointmentRecord['status']) => {
    const result = await eveoDomainRepository.updateAppointmentStatus({ storeId, appointmentId, status } as UpdateAppointmentStatusInput);
    await reload();
    return result;
  }, [reload, storeId]);

  return {
    ...data,
    reload,
    createCustomer,
    createInventoryVehicle,
    recordInventoryObservation,
    resolveVehicleAvailability,
    createLead,
    createAppointment,
    updateAppointmentStatus,
  };
}

export default useStoreDomainData;
