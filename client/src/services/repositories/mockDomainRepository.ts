import { createLegacyDemoSeed } from '../../data/demo/legacyDemoSeed';
import type {
  ActivityEventRecord,
  AppointmentRecord,
  Customer,
  DealerAccount,
  DealerAccountApplication,
  DomainShowroomEvent,
  DomainShowroomVisit,
  EveoDomainSnapshot,
  ImportJob,
  InventoryDiscrepancy,
  InventoryFieldConflict,
  InventorySourceObservation,
  InventoryVehicle,
  KpiAggregate,
  LeadRecord,
  MongoId,
  PlatformUser,
  ReportSnapshot,
  SavedReportView,
  StoreMembership,
  StoreRecord,
  StoreUser,
  UserInvitation,
  UserPresenceRecord,
} from '../../types/domain';
import type {
  AcceptStoreInvitationInput,
  AddStoreInput,
  AppendShowroomEventInput,
  AssignShowroomVisitInput,
  ApproveDealerApplicationInput,
  ApproveDealerApplicationResult,
  CreateActivityEventInput,
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
  CreateCustomerInput,
  CreateInventoryVehicleInput,
  CreateKpiAggregateInput,
  CreateLeadInput,
  CreateReportSnapshotInput,
  CreateSavedReportViewInput,
  CreateShowroomVisitInput,
  EveoDomainRepository,
  InviteStoreUserInput,
  RecordInventoryObservationInput,
  ResolveInventoryDiscrepancyInput,
  SetPresenceInput,
  SubmitDealerApplicationInput,
  TogglePlatformStoreAssignmentInput,
  ResolveVehicleAvailabilityInput,
} from './domainRepository';

export const EVEO_DOMAIN_STORAGE_KEY = 'eveo_domain_repository_v1';
export const EVEO_DOMAIN_UPDATED_EVENT = 'eveo:domain-updated';

export interface DomainStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryDomainStorage implements DomainStorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

export class DomainRepositoryError extends Error {
  readonly code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'FORBIDDEN' | 'STORAGE_CORRUPT' | 'UNSUPPORTED_SCHEMA';

  constructor(
    message: string,
    code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'FORBIDDEN' | 'STORAGE_CORRUPT' | 'UNSUPPORTED_SCHEMA'
  ) {
    super(message);
    this.code = code;
    this.name = 'DomainRepositoryError';
  }
}

let idCounter = 0;
let repositoryInstanceCounter = 0;

function createLocalId(prefix: string): MongoId {
  idCounter += 1;
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, '') || `${Date.now().toString(36)}${idCounter.toString(36)}`;
  return `local_${prefix}_${random}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function requireText(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) throw new DomainRepositoryError(`${fieldName} is required.`, 'VALIDATION_ERROR');
  return normalized;
}

function isValidVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
}

function toLowerEmail(value: string): string {
  return requireText(value, 'Email').toLowerCase();
}

function safeStorage(): DomainStorageLike {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Storage can be blocked by browser privacy settings; use memory for this session.
  }
  return new MemoryDomainStorage();
}

function ensureSchema(value: unknown): EveoDomainSnapshot {
  if (!value || typeof value !== 'object') {
    throw new DomainRepositoryError('Stored EVEO domain data is not a valid object.', 'STORAGE_CORRUPT');
  }
  const record = value as Partial<EveoDomainSnapshot>;
  if (record.schemaVersion !== 1) {
    throw new DomainRepositoryError(
      `Unsupported EVEO domain schema version: ${String(record.schemaVersion)}. Export or migrate the stored data before continuing.`,
      'UNSUPPORTED_SCHEMA'
    );
  }
  const collectionKeys: Array<keyof EveoDomainSnapshot> = [
    'dealerAccounts', 'stores', 'platformUsers', 'storeUsers', 'storeMemberships',
    'platformStoreAssignments', 'invitations', 'dealerApplications', 'customers',
    'inventoryVehicles', 'inventoryObservations', 'inventoryDiscrepancies', 'leads',
    'appointments', 'deals', 'showroomVisits', 'showroomEvents', 'userPresence',
    'activityEvents', 'kpiDefinitions', 'kpiAggregates', 'reportSnapshots',
    'integrationConnections', 'inventorySourceConfigs', 'importJobs', 'savedReportViews',
    'subscriptions', 'paymentMethodReferences',
  ];
  for (const key of collectionKeys) {
    if (!Array.isArray(record[key])) {
      throw new DomainRepositoryError(`Stored EVEO domain data is missing the ${String(key)} collection.`, 'STORAGE_CORRUPT');
    }
  }
  return record as EveoDomainSnapshot;
}

function assertBelongsToStore<T extends { id: MongoId; storeId: MongoId }>(
  records: T[],
  recordId: MongoId | undefined,
  storeId: MongoId,
  entityName: string
): T | undefined {
  if (!recordId) return undefined;
  const record = records.find((item) => item.id === recordId);
  if (!record) throw new DomainRepositoryError(`${entityName} was not found.`, 'NOT_FOUND');
  if (record.storeId !== storeId) throw new DomainRepositoryError(`${entityName} does not belong to this store.`, 'FORBIDDEN');
  return record;
}


export function createMockEveoRepository(storage: DomainStorageLike = safeStorage()): EveoDomainRepository {
  const listeners = new Set<(snapshot: EveoDomainSnapshot) => void>();
  repositoryInstanceCounter += 1;
  const instanceId = `domain_repository_${repositoryInstanceCounter}`;

  const readState = (): EveoDomainSnapshot => {
    const raw = storage.getItem(EVEO_DOMAIN_STORAGE_KEY);
    if (!raw) {
      const seeded = createLegacyDemoSeed();
      storage.setItem(EVEO_DOMAIN_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    try {
      return ensureSchema(JSON.parse(raw) as unknown);
    } catch (error) {
      if (error instanceof DomainRepositoryError) throw error;
      throw new DomainRepositoryError('Unable to parse stored EVEO domain data. The original data was preserved.', 'STORAGE_CORRUPT');
    }
  };

  const writeState = (state: EveoDomainSnapshot): void => {
    storage.setItem(EVEO_DOMAIN_STORAGE_KEY, JSON.stringify(state));
    const snapshot = clone(state);
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch {
        // A subscriber must not prevent persistence or notifications to others.
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVEO_DOMAIN_UPDATED_EVENT, {
        detail: { schemaVersion: 1, sourceId: instanceId },
      }));
    }
  };

  const updateState = <T>(mutator: (state: EveoDomainSnapshot) => T): T => {
    const state = readState();
    const result = mutator(state);
    writeState(state);
    return result;
  };

  const getStoreContext = (state: EveoDomainSnapshot, storeId: MongoId) => {
    const store = state.stores.find((item) => item.id === storeId);
    if (!store) throw new DomainRepositoryError('Store was not found.', 'NOT_FOUND');
    const dealerAccount = state.dealerAccounts.find((item) => item.id === store.dealerAccountId);
    if (!dealerAccount) throw new DomainRepositoryError('Store has no valid DealerAccount.', 'STORAGE_CORRUPT');
    return { store, dealerAccount };
  };

  const repository: EveoDomainRepository = {
    async getSnapshot() {
      return clone(readState());
    },

    subscribe(callback) {
      listeners.add(callback);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== EVEO_DOMAIN_STORAGE_KEY) return;
        try { callback(clone(readState())); } catch { /* Preserve caller state if storage is corrupt. */ }
      };
      const onDomainUpdate = (event: Event) => {
        const detail = (event as CustomEvent<{ sourceId?: string }>).detail;
        if (detail?.sourceId === instanceId) return;
        try { callback(clone(readState())); } catch { /* Preserve caller state if storage is corrupt. */ }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', onStorage);
        window.addEventListener(EVEO_DOMAIN_UPDATED_EVENT, onDomainUpdate);
      }
      return () => {
        listeners.delete(callback);
        if (typeof window !== 'undefined') {
          window.removeEventListener('storage', onStorage);
          window.removeEventListener(EVEO_DOMAIN_UPDATED_EVENT, onDomainUpdate);
        }
      };
    },

    async listStores(dealerAccountId) {
      return clone(readState().stores.filter((store) => !dealerAccountId || store.dealerAccountId === dealerAccountId));
    },

    async listPlatformUsers(): Promise<PlatformUser[]> {
      return clone(readState().platformUsers);
    },

    async togglePlatformStoreAssignment(input: TogglePlatformStoreAssignmentInput) {
      updateState((state) => {
        const platformUser = state.platformUsers.find((user) => user.id === input.platformUserId);
        if (!platformUser) throw new DomainRepositoryError('EVEO employee was not found.', 'NOT_FOUND');
        const { store, dealerAccount } = getStoreContext(state, input.storeId);
        const current = state.platformStoreAssignments.find((assignment) =>
          assignment.platformUserId === platformUser.id && assignment.storeId === store.id,
        );
        const timestamp = nowIso();
        if (current?.status === 'active') {
          current.status = 'revoked';
          current.updatedAt = timestamp;
          current.endsAt = timestamp;
        } else if (current) {
          current.status = 'active';
          current.startsAt = timestamp;
          current.endsAt = undefined;
          current.assignedByUserId = input.assignedByUserId;
          current.updatedAt = timestamp;
        } else {
          state.platformStoreAssignments.push({
            id: createLocalId('platform_assignment'),
            platformUserId: platformUser.id,
            dealerAccountId: dealerAccount.id,
            storeId: store.id,
            assignedByUserId: input.assignedByUserId,
            status: 'active',
            startsAt: timestamp,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      });
    },

    async listStoreUsers(storeId) {
      const state = readState();
      const memberships = state.storeMemberships.filter((membership) => membership.storeId === storeId && membership.status === 'active');
      const userIds = new Set(memberships.map((membership) => membership.storeUserId));
      return clone(state.storeUsers.filter((user) => userIds.has(user.id) && user.status === 'active'));
    },

    async submitDealerApplication(input: SubmitDealerApplicationInput) {
      const locations = input.locations || [];
      if (locations.length === 0) throw new DomainRepositoryError('At least one dealership location is required.', 'VALIDATION_ERROR');
      if (!input.requestedMultiStore && locations.length > 1) {
        throw new DomainRepositoryError('A single-store application can only include one location.', 'VALIDATION_ERROR');
      }
      const submittedAt = nowIso();
      return updateState((state) => {
        const application: DealerAccountApplication = {
          id: createLocalId('dealer_application'),
          legalBusinessName: requireText(input.legalBusinessName, 'Legal business name'),
          requestedAccountName: requireText(input.requestedAccountName, 'Account name'),
          contactName: requireText(input.contactName, 'Contact name'),
          contactEmail: toLowerEmail(input.contactEmail),
          contactPhone: requireText(input.contactPhone, 'Contact phone'),
          websiteUrl: input.websiteUrl?.trim() || undefined,
          requestedMultiStore: input.requestedMultiStore,
          locations: locations.map((location) => ({
            ...location,
            storeName: requireText(location.storeName, 'Store name'),
            phone: requireText(location.phone, 'Store phone'),
            email: toLowerEmail(location.email),
            address: requireText(location.address, 'Store address'),
            city: requireText(location.city, 'Store city'),
            countryCode: requireText(location.countryCode, 'Country code').toUpperCase(),
          })),
          status: 'submitted',
          verification: { websiteReviewStatus: 'not_checked' },
          createdAt: submittedAt,
          updatedAt: submittedAt,
        };
        state.dealerApplications.unshift(application);
        return clone(application);
      });
    },

    async approveDealerApplication(input: ApproveDealerApplicationInput): Promise<ApproveDealerApplicationResult> {
      return updateState((state) => {
        const application = state.dealerApplications.find((item) => item.id === input.applicationId);
        if (!application) throw new DomainRepositoryError('Dealer application was not found.', 'NOT_FOUND');
        if (application.status === 'approved') throw new DomainRepositoryError('Dealer application has already been approved.', 'CONFLICT');
        if (application.status === 'rejected' || application.status === 'withdrawn') {
          throw new DomainRepositoryError('This dealer application cannot be approved.', 'CONFLICT');
        }

        const createdAt = nowIso();
        const dealerAccountId = createLocalId('dealer_account');
        const dealerAccount: DealerAccount = {
          id: dealerAccountId,
          accountCode: requireText(input.accountCode, 'Account code').toUpperCase(),
          legalName: application.legalBusinessName,
          displayName: application.requestedAccountName,
          status: 'approved',
          multiStoreEnabled: application.requestedMultiStore,
          customerSharingEnabled: false,
          createdAt,
          updatedAt: createdAt,
        };

        const prefix = requireText(input.storeCodePrefix, 'Store code prefix').toUpperCase();
        const stores: StoreRecord[] = application.locations.map((location, index) => {
          const suffix = application.locations.length === 1 ? '' : `-${String(index + 1).padStart(2, '0')}`;
          return {
            id: createLocalId('store'),
            dealerAccountId,
            storeCode: `${prefix}${suffix}`,
            name: location.storeName,
            websiteUrl: location.websiteUrl || application.websiteUrl,
            phone: location.phone,
            email: location.email,
            address: location.address,
            city: location.city,
            region: location.region,
            countryCode: location.countryCode,
            timeZone: location.timeZone || 'UTC',
            status: 'pending_setup',
            isPrimary: index === 0,
            createdAt,
            updatedAt: createdAt,
          };
        });

        for (const store of stores) {
          const duplicateCode = state.stores.some((item) => item.dealerAccountId === dealerAccountId && item.storeCode === store.storeCode);
          if (duplicateCode) throw new DomainRepositoryError(`Store code ${store.storeCode} already exists.`, 'CONFLICT');
        }

        const firstStore = stores[0];
        const ownerInvitation: UserInvitation = {
          id: createLocalId('invitation'),
          audience: 'dealer_owner',
          email: application.contactEmail,
          dealerAccountId,
          storeId: firstStore.id,
          role: 'dealer_owner',
          invitedByUserId: input.reviewedByUserId,
          tokenHash: `demo-token-${createLocalId('token')}`,
          status: 'pending',
          expiresAt: new Date(Date.now() + (input.initialOwnerInvitationExpiresInDays ?? 7) * 86_400_000).toISOString(),
          createdAt,
          updatedAt: createdAt,
        };

        state.dealerAccounts.push(dealerAccount);
        state.stores.push(...stores);
        state.invitations.push(ownerInvitation);
        application.status = 'approved';
        application.reviewedByUserId = input.reviewedByUserId;
        application.reviewedAt = createdAt;
        application.updatedAt = createdAt;

        return { dealerAccount: clone(dealerAccount), stores: clone(stores), ownerInvitation: clone(ownerInvitation) };
      });
    },

    async addStore(input: AddStoreInput) {
      return updateState((state) => {
        const account = state.dealerAccounts.find((item) => item.id === input.dealerAccountId);
        if (!account) throw new DomainRepositoryError('DealerAccount was not found.', 'NOT_FOUND');
        if (!account.multiStoreEnabled) throw new DomainRepositoryError('This account is not configured for multi-store access.', 'FORBIDDEN');
        const storeCode = requireText(input.storeCode, 'Store code').toUpperCase();
        if (state.stores.some((store) => store.dealerAccountId === account.id && store.storeCode === storeCode)) {
          throw new DomainRepositoryError(`Store code ${storeCode} already exists in this DealerAccount.`, 'CONFLICT');
        }
        const timestamp = nowIso();
        const store: StoreRecord = {
          id: createLocalId('store'),
          dealerAccountId: account.id,
          storeCode,
          name: requireText(input.name, 'Store name'),
          websiteUrl: input.websiteUrl?.trim() || undefined,
          phone: input.phone?.trim() || undefined,
          email: input.email ? toLowerEmail(input.email) : undefined,
          address: input.address?.trim() || undefined,
          city: input.city?.trim() || undefined,
          region: input.region?.trim() || undefined,
          countryCode: (input.countryCode || 'US').toUpperCase(),
          timeZone: input.timeZone || 'UTC',
          status: 'pending_setup',
          isPrimary: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.stores.push(store);
        return clone(store);
      });
    },

    async inviteStoreUser(input: InviteStoreUserInput) {
      return updateState((state) => {
        const store = state.stores.find((item) => item.id === input.storeId && item.dealerAccountId === input.dealerAccountId);
        if (!store) throw new DomainRepositoryError('Store was not found in this DealerAccount.', 'NOT_FOUND');
        const email = toLowerEmail(input.email);
        const pendingDuplicate = state.invitations.some((invite) => invite.email === email && invite.storeId === store.id && invite.status === 'pending');
        if (pendingDuplicate) throw new DomainRepositoryError('A pending invitation already exists for this email and store.', 'CONFLICT');
        const timestamp = nowIso();
        const invitation: UserInvitation = {
          id: createLocalId('invitation'),
          audience: 'store_employee',
          email,
          dealerAccountId: input.dealerAccountId,
          storeId: input.storeId,
          role: input.role,
          invitedByUserId: input.invitedByUserId,
          tokenHash: `demo-token-${createLocalId('token')}`,
          status: 'pending',
          expiresAt: new Date(Date.now() + (input.expiresInDays ?? 7) * 86_400_000).toISOString(),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.invitations.unshift(invitation);
        return clone(invitation);
      });
    },

    async acceptStoreInvitation(input: AcceptStoreInvitationInput) {
      const result = updateState((state): { user?: StoreUser; expired?: true } => {
        const invitation = state.invitations.find((item) => item.tokenHash === input.tokenHash);
        if (!invitation) throw new DomainRepositoryError('Invitation token is invalid.', 'NOT_FOUND');
        if (invitation.status !== 'pending') throw new DomainRepositoryError('Invitation is no longer active.', 'CONFLICT');
        if (Date.parse(invitation.expiresAt) <= Date.now()) {
          invitation.status = 'expired';
          invitation.updatedAt = nowIso();
          return { expired: true };
        }
        if (invitation.audience !== 'store_employee' && invitation.audience !== 'dealer_owner') {
          throw new DomainRepositoryError('This invitation is not for a store employee.', 'VALIDATION_ERROR');
        }
        const store = state.stores.find((item) => item.id === invitation.storeId);
        if (!store || !invitation.dealerAccountId) throw new DomainRepositoryError('Invitation store context is invalid.', 'STORAGE_CORRUPT');
        const existingUser = state.storeUsers.find((user) => user.email.toLowerCase() === invitation.email.toLowerCase() && user.dealerAccountId === invitation.dealerAccountId);
        if (existingUser) throw new DomainRepositoryError('A store user with this email already exists in the DealerAccount.', 'CONFLICT');
        const membershipCount = state.storeMemberships.filter((membership) => membership.storeId === store.id).length + 1;
        const timestamp = nowIso();
        const role = invitation.role as StoreUser['role'];
        const user: StoreUser = {
          id: createLocalId('store_user'),
          dealerAccountId: invitation.dealerAccountId,
          employeeCode: `${store.storeCode}-${String(membershipCount).padStart(3, '0')}`,
          fullName: requireText(input.fullName, 'Full name'),
          email: invitation.email,
          role,
          status: 'active',
          primaryStoreId: store.id,
          phone: input.phone?.trim() || undefined,
          settings: {},
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const membership: StoreMembership = {
          id: createLocalId('store_membership'),
          dealerAccountId: invitation.dealerAccountId,
          storeId: store.id,
          storeUserId: user.id,
          role,
          isPrimary: true,
          grantedByUserId: invitation.invitedByUserId,
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.storeUsers.push(user);
        state.storeMemberships.push(membership);
        invitation.status = 'accepted';
        invitation.acceptedAt = timestamp;
        invitation.updatedAt = timestamp;
        if (invitation.audience === 'dealer_owner') {
          const account = state.dealerAccounts.find((item) => item.id === invitation.dealerAccountId);
          if (account) {
            account.ownerStoreUserId = user.id;
            account.updatedAt = timestamp;
          }
        }
        return { user: clone(user) };
      });
      if (result.expired) throw new DomainRepositoryError('Invitation has expired.', 'CONFLICT');
      if (!result.user) throw new DomainRepositoryError('Unable to accept the invitation.', 'STORAGE_CORRUPT');
      return result.user;
    },

    async listCustomers(storeId) {
      const state = readState();
      const { dealerAccount } = getStoreContext(state, storeId);
      return clone(state.customers.filter((customer) =>
        customer.storeId === storeId ||
        (dealerAccount.customerSharingEnabled && customer.dealerAccountId === dealerAccount.id && customer.sharingScope === 'dealer_account')
      ));
    },

    async createCustomer(input: CreateCustomerInput) {
      return updateState((state) => {
        const { store, dealerAccount } = getStoreContext(state, input.storeId);
        const sharingScope = input.sharingScope || 'store_only';
        if (sharingScope === 'dealer_account' && !dealerAccount.customerSharingEnabled) {
          throw new DomainRepositoryError('Customer sharing is disabled for this DealerAccount.', 'FORBIDDEN');
        }
        const timestamp = nowIso();
        const customer: Customer = {
          id: createLocalId('customer'),
          dealerAccountId: dealerAccount.id,
          storeId: store.id,
          firstName: requireText(input.firstName, 'First name'),
          lastName: requireText(input.lastName, 'Last name'),
          phone: input.phone?.trim() || undefined,
          email: input.email ? toLowerEmail(input.email) : undefined,
          preferredContactMethod: input.preferredContactMethod,
          sharingScope,
          createdByUserId: input.createdByUserId,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.customers.unshift(customer);
        return clone(customer);
      });
    },

    async listInventoryVehicles(storeId) {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.inventoryVehicles.filter((vehicle) => vehicle.storeId === storeId));
    },

    async createInventoryVehicle(input: CreateInventoryVehicleInput) {
      return updateState((state) => {
        const { store, dealerAccount } = getStoreContext(state, input.storeId);
        const vin = requireText(input.vin, 'VIN').toUpperCase();
        if (!isValidVin(vin)) throw new DomainRepositoryError('VIN must contain 17 valid alphanumeric characters.', 'VALIDATION_ERROR');
        if (state.inventoryVehicles.some((vehicle) => vehicle.storeId === store.id && vehicle.vin === vin)) {
          throw new DomainRepositoryError('A vehicle with this VIN already exists in this store.', 'CONFLICT');
        }
        const timestamp = nowIso();
        const vehicle: InventoryVehicle = {
          id: createLocalId('inventory_vehicle'),
          dealerAccountId: dealerAccount.id,
          storeId: store.id,
          vin,
          stockNumber: input.stockNumber?.trim() || undefined,
          year: input.year,
          make: input.make?.trim() || undefined,
          model: input.model?.trim() || undefined,
          trim: input.trim?.trim() || undefined,
          displayName: requireText(input.displayName, 'Vehicle display name'),
          mileage: input.mileage,
          bodyStyle: input.bodyStyle?.trim() || undefined,
          exteriorColor: input.exteriorColor?.trim() || undefined,
          interiorColor: input.interiorColor?.trim() || undefined,
          photoUrls: input.photoUrls || [],
          sourceObservationIds: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.inventoryVehicles.unshift(vehicle);
        return clone(vehicle);
      });
    },

    async recordInventoryObservation(input: RecordInventoryObservationInput) {
      return updateState((state) => {
        const { store, dealerAccount } = getStoreContext(state, input.storeId);
        const vehicle = state.inventoryVehicles.find((item) => item.id === input.inventoryVehicleId && item.storeId === store.id);
        if (!vehicle) throw new DomainRepositoryError('Inventory vehicle was not found in this store.', 'NOT_FOUND');
        if (input.observedPrice && input.observedPrice.amount < 0) {
          throw new DomainRepositoryError('Observed price cannot be negative.', 'VALIDATION_ERROR');
        }
        const timestamp = nowIso();
        const observation: InventorySourceObservation = {
          id: createLocalId('inventory_observation'),
          dealerAccountId: dealerAccount.id,
          storeId: store.id,
          inventoryVehicleId: vehicle.id,
          sourceType: input.sourceType,
          sourceName: requireText(input.sourceName, 'Source name'),
          sourceRecordId: input.sourceRecordId,
          observedAt: timestamp,
          observedStatus: input.observedStatus,
          observedPrice: input.observedPrice,
          observedMileage: input.observedMileage,
          observedPhotoUrls: input.observedPhotoUrls,
          rawPayload: input.rawPayload,
          importJobId: input.importJobId,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const previous = state.inventoryObservations.filter((item) => item.inventoryVehicleId === vehicle.id && item.sourceName !== observation.sourceName);
        const conflicts: InventoryFieldConflict[] = [];
        for (const existing of previous) {
          if (existing.observedStatus && observation.observedStatus && existing.observedStatus !== observation.observedStatus) {
            conflicts.push({ field: 'availabilityStatus', observationIds: [existing.id, observation.id], observedValues: [existing.observedStatus, observation.observedStatus] });
          }
          if (existing.observedPrice && observation.observedPrice && (
            existing.observedPrice.amount !== observation.observedPrice.amount || existing.observedPrice.currency !== observation.observedPrice.currency
          )) {
            conflicts.push({ field: 'price', observationIds: [existing.id, observation.id], observedValues: [existing.observedPrice, observation.observedPrice] });
          }
          if (existing.observedMileage !== undefined && observation.observedMileage !== undefined && existing.observedMileage !== observation.observedMileage) {
            conflicts.push({ field: 'mileage', observationIds: [existing.id, observation.id], observedValues: [existing.observedMileage, observation.observedMileage] });
          }
        }
        if (vehicle.availabilityResolution && observation.observedStatus && vehicle.availabilityResolution.status !== observation.observedStatus) {
          conflicts.push({
            field: 'availabilityStatus',
            observationIds: [observation.id],
            observedValues: [vehicle.availabilityResolution.status, observation.observedStatus],
          });
        }
        if (vehicle.resolvedPrice && observation.observedPrice && (
          vehicle.resolvedPrice.amount !== observation.observedPrice.amount || vehicle.resolvedPrice.currency !== observation.observedPrice.currency
        )) {
          conflicts.push({
            field: 'price',
            observationIds: [observation.id],
            observedValues: [vehicle.resolvedPrice, observation.observedPrice],
          });
        }

        state.inventoryObservations.unshift(observation);
        vehicle.sourceObservationIds = [...vehicle.sourceObservationIds, observation.id];
        vehicle.updatedAt = timestamp;

        let discrepancies: InventoryDiscrepancy[] = [];
        if (conflicts.length > 0) {
          const discrepancy: InventoryDiscrepancy = {
            id: createLocalId('inventory_discrepancy'),
            dealerAccountId: dealerAccount.id,
            storeId: store.id,
            inventoryVehicleId: vehicle.id,
            conflicts,
            status: 'open',
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          state.inventoryDiscrepancies.unshift(discrepancy);
          discrepancies = [discrepancy];
        }
        return { observation: clone(observation), discrepancies: clone(discrepancies) };
      });
    },

    async listInventoryDiscrepancies(storeId) {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.inventoryDiscrepancies.filter((item) => item.storeId === storeId && item.status === 'open'));
    },

    async resolveInventoryDiscrepancy(input: ResolveInventoryDiscrepancyInput) {
      return updateState((state) => {
        const discrepancy = state.inventoryDiscrepancies.find((item) => item.id === input.discrepancyId);
        if (!discrepancy) throw new DomainRepositoryError('Inventory discrepancy was not found.', 'NOT_FOUND');
        if (discrepancy.status !== 'open') throw new DomainRepositoryError('Inventory discrepancy is already closed.', 'CONFLICT');
        const vehicle = state.inventoryVehicles.find((item) => item.id === discrepancy.inventoryVehicleId);
        if (!vehicle) throw new DomainRepositoryError('Discrepancy vehicle was not found.', 'STORAGE_CORRUPT');
        const timestamp = nowIso();
        const manualObservation: InventorySourceObservation = {
          id: createLocalId('inventory_observation'),
          dealerAccountId: discrepancy.dealerAccountId,
          storeId: discrepancy.storeId,
          inventoryVehicleId: vehicle.id,
          sourceType: 'manual',
          sourceName: 'Human discrepancy resolution',
          observedAt: timestamp,
          observedStatus: input.status,
          observedPrice: input.price,
          observedMileage: input.mileage,
          rawPayload: { resolutionNote: requireText(input.note, 'Resolution note') },
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.inventoryObservations.unshift(manualObservation);
        vehicle.sourceObservationIds.push(manualObservation.id);
        if (input.status) {
          vehicle.availabilityResolution = {
            status: input.status,
            resolvedByUserId: input.resolvedByUserId,
            resolvedAt: timestamp,
            note: input.note.trim(),
            basedOnObservationIds: [...new Set(discrepancy.conflicts.flatMap((item) => item.observationIds).concat(manualObservation.id))],
          };
        }
        if (input.price) vehicle.resolvedPrice = { ...input.price, resolvedByUserId: input.resolvedByUserId, resolvedAt: timestamp };
        if (input.mileage !== undefined) vehicle.resolvedMileage = { value: input.mileage, resolvedByUserId: input.resolvedByUserId, resolvedAt: timestamp };
        vehicle.updatedAt = timestamp;
        discrepancy.status = 'resolved';
        discrepancy.resolutionNote = input.note.trim();
        discrepancy.resolvedByUserId = input.resolvedByUserId;
        discrepancy.resolvedAt = timestamp;
        discrepancy.updatedAt = timestamp;
        return clone(discrepancy);
      });
    },

    async resolveVehicleAvailability(input: ResolveVehicleAvailabilityInput) {
      return updateState((state) => {
        const { store, dealerAccount } = getStoreContext(state, input.storeId);
        const vehicle = state.inventoryVehicles.find((item) => item.id === input.inventoryVehicleId && item.storeId === store.id);
        if (!vehicle) throw new DomainRepositoryError('Inventory vehicle was not found in this store.', 'NOT_FOUND');
        const note = requireText(input.note, 'Resolution note');
        const timestamp = nowIso();
        const observation: InventorySourceObservation = {
          id: createLocalId('inventory_observation'),
          dealerAccountId: dealerAccount.id,
          storeId: store.id,
          inventoryVehicleId: vehicle.id,
          sourceType: 'manual',
          sourceName: 'Human availability resolution',
          observedAt: timestamp,
          observedStatus: input.status,
          rawPayload: { resolutionNote: note },
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.inventoryObservations.unshift(observation);
        vehicle.sourceObservationIds = [...vehicle.sourceObservationIds, observation.id];
        vehicle.availabilityResolution = {
          status: input.status,
          resolvedByUserId: input.resolvedByUserId,
          resolvedAt: timestamp,
          note,
          basedOnObservationIds: [...vehicle.sourceObservationIds],
        };
        vehicle.updatedAt = timestamp;

        // A human decision resolves only availability conflicts. Price, mileage,
        // and photo conflicts remain open until separately reviewed.
        for (const discrepancy of state.inventoryDiscrepancies) {
          if (discrepancy.inventoryVehicleId !== vehicle.id || discrepancy.status !== 'open') continue;
          discrepancy.conflicts = discrepancy.conflicts.filter((conflict) => conflict.field !== 'availabilityStatus');
          if (discrepancy.conflicts.length === 0) {
            discrepancy.status = 'resolved';
            discrepancy.resolutionNote = note;
            discrepancy.resolvedByUserId = input.resolvedByUserId;
            discrepancy.resolvedAt = timestamp;
          }
          discrepancy.updatedAt = timestamp;
        }
        return clone(vehicle);
      });
    },

    async listLeads(storeId) {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.leads.filter((lead) => lead.storeId === storeId));
    },

    async createLead(input: CreateLeadInput) {
      return updateState((state) => {
        const { store, dealerAccount } = getStoreContext(state, input.storeId);
        assertBelongsToStore(state.customers, input.customerId, store.id, 'Customer');
        assertBelongsToStore(state.inventoryVehicles, input.inventoryVehicleId, store.id, 'Inventory vehicle');
        const timestamp = nowIso();
        const lead: LeadRecord = {
          id: createLocalId('lead'),
          dealerAccountId: dealerAccount.id,
          storeId: store.id,
          customerId: input.customerId,
          customerNameSnapshot: requireText(input.customerNameSnapshot, 'Customer name'),
          phoneSnapshot: input.phoneSnapshot?.trim() || undefined,
          emailSnapshot: input.emailSnapshot ? toLowerEmail(input.emailSnapshot) : undefined,
          vehicleOfInterest: input.vehicleOfInterest?.trim() || undefined,
          inventoryVehicleId: input.inventoryVehicleId,
          source: input.source?.trim() || undefined,
          status: 'new',
          assignedPlatformUserId: input.assignedPlatformUserId,
          assignedStoreUserId: input.assignedStoreUserId,
          notes: input.notes?.trim() || undefined,
          createdByUserId: input.createdByUserId,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.leads.unshift(lead);
        return clone(lead);
      });
    },

    async listAppointments(storeId) {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.appointments.filter((appointment) => appointment.storeId === storeId));
    },

    async createAppointment(input: CreateAppointmentInput) {
      return updateState((state) => {
        const { store, dealerAccount } = getStoreContext(state, input.storeId);
        assertBelongsToStore(state.customers, input.customerId, store.id, 'Customer');
        assertBelongsToStore(state.leads, input.leadId, store.id, 'Lead');
        assertBelongsToStore(state.inventoryVehicles, input.inventoryVehicleId, store.id, 'Inventory vehicle');
        const timestamp = nowIso();
        const appointment: AppointmentRecord = {
          id: createLocalId('appointment'),
          dealerAccountId: dealerAccount.id,
          storeId: store.id,
          customerId: input.customerId,
          leadId: input.leadId,
          customerNameSnapshot: requireText(input.customerNameSnapshot, 'Customer name'),
          phoneSnapshot: input.phoneSnapshot?.trim() || undefined,
          inventoryVehicleId: input.inventoryVehicleId,
          vehicleSnapshot: input.vehicleSnapshot?.trim() || undefined,
          scheduledAt: input.scheduledAt,
          status: input.status || 'pending_confirmation',
          assignedPlatformUserId: input.assignedPlatformUserId,
          assignedStoreUserId: input.assignedStoreUserId,
          notes: input.notes?.trim() || undefined,
          createdByUserId: input.createdByUserId,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.appointments.unshift(appointment);
        return clone(appointment);
      });
    },

    async updateAppointmentStatus(input: UpdateAppointmentStatusInput) {
      return updateState((state) => {
        const { store } = getStoreContext(state, input.storeId);
        const appointment = state.appointments.find((item) => item.id === input.appointmentId && item.storeId === store.id);
        if (!appointment) throw new DomainRepositoryError('Appointment was not found in this store.', 'NOT_FOUND');
        if (appointment.status === 'cancelled') throw new DomainRepositoryError('A cancelled appointment cannot be changed.', 'CONFLICT');
        appointment.status = input.status;
        appointment.updatedAt = nowIso();
        return clone(appointment);
      });
    },

    async listDeals(storeId) {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.deals.filter((deal) => deal.storeId === storeId));
    },

    async listShowroomVisits(storeId) {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.showroomVisits.filter((visit) => visit.storeId === storeId));
    },

    async createShowroomVisit(input: CreateShowroomVisitInput) {
      return updateState((state) => {
        const { store, dealerAccount } = getStoreContext(state, input.storeId);
        assertBelongsToStore(state.customers, input.customerId, store.id, 'Customer');
        assertBelongsToStore(state.storeUsers.flatMap((user) => state.storeMemberships.filter((membership) => membership.storeUserId === user.id && membership.status === 'active').map((membership) => ({ id: user.id, storeId: membership.storeId }))), input.assignedStoreUserId, store.id, 'Assigned showroom representative');
        assertBelongsToStore(state.leads, input.leadId, store.id, 'Lead');
        assertBelongsToStore(state.appointments, input.appointmentId, store.id, 'Appointment');
        assertBelongsToStore(state.inventoryVehicles, input.vehicleOfInterestId, store.id, 'Vehicle of interest');
        assertBelongsToStore(state.inventoryVehicles, input.tradeInVehicleId, store.id, 'Trade-in vehicle');
        const linkedAppointment = input.appointmentId
          ? state.appointments.find((appointment) => appointment.id === input.appointmentId && appointment.storeId === store.id)
          : undefined;
        if (input.appointmentId && !linkedAppointment) {
          throw new DomainRepositoryError('Appointment was not found in this store.', 'NOT_FOUND');
        }
        const timestamp = nowIso();
        if (linkedAppointment && linkedAppointment.status !== 'cancelled' && linkedAppointment.status !== 'sold') {
          linkedAppointment.status = 'arrived';
          linkedAppointment.updatedAt = timestamp;
        }
        const visit: DomainShowroomVisit = {
          id: createLocalId('showroom_visit'),
          dealerAccountId: dealerAccount.id,
          storeId: store.id,
          customerId: input.customerId,
          leadId: input.leadId,
          appointmentId: input.appointmentId,
          assignedStoreUserId: input.assignedStoreUserId,
          checkedInByUserId: input.checkedInByUserId,
          status: 'active',
          vehicleOfInterestId: input.vehicleOfInterestId,
          tradeInVehicleId: input.tradeInVehicleId,
          notes: input.notes?.trim() || undefined,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const event: DomainShowroomEvent = {
          id: createLocalId('showroom_event'),
          dealerAccountId: dealerAccount.id,
          storeId: store.id,
          visitId: visit.id,
          type: 'customer_greeted',
          actorUserId: input.checkedInByUserId,
          occurredAt: timestamp,
          message: 'Customer checked in and greeted.',
          metadata: {
            checkedInByName: input.checkedInByName || '',
            assignedStoreUserName: input.assignedStoreUserName || '',
            vehicleOfInterest: input.vehicleOfInterestSnapshot ?? null,
            tradeIn: input.tradeInSnapshot ?? null,
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.showroomVisits.unshift(visit);
        state.showroomEvents.unshift(event);
        return clone(visit);
      });
    },

    async appendShowroomEvent(input: AppendShowroomEventInput) {
      return updateState((state) => {
        const visit = state.showroomVisits.find((item) => item.id === input.visitId);
        if (!visit) throw new DomainRepositoryError('Showroom visit was not found.', 'NOT_FOUND');
        if (visit.status === 'completed' || visit.status === 'cancelled') {
          throw new DomainRepositoryError('This showroom visit is closed.', 'CONFLICT');
        }
        const timestamp = nowIso();
        const event: DomainShowroomEvent = {
          id: createLocalId('showroom_event'),
          dealerAccountId: visit.dealerAccountId,
          storeId: visit.storeId,
          visitId: visit.id,
          type: input.type,
          actorUserId: input.actorUserId,
          occurredAt: timestamp,
          message: requireText(input.message, 'Event message'),
          metadata: input.metadata,
          mediaAssetIds: input.mediaAssetIds,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        if (input.type === 'handoff_requested') visit.status = 'handoff_requested';
        if (input.type === 'visit_completed') {
          visit.status = 'completed';
          visit.completedAt = timestamp;
        }
        visit.updatedAt = timestamp;
        state.showroomEvents.unshift(event);
        return clone(event);
      });
    },

    async assignShowroomVisit(input: AssignShowroomVisitInput) {
      return updateState((state) => {
        const { store } = getStoreContext(state, input.storeId);
        const visit = state.showroomVisits.find((item) => item.id === input.visitId && item.storeId === store.id);
        if (!visit) throw new DomainRepositoryError('Showroom visit was not found in this store.', 'NOT_FOUND');
        if (visit.status === 'completed' || visit.status === 'cancelled') {
          throw new DomainRepositoryError('This showroom visit is already closed.', 'CONFLICT');
        }
        const hasMembership = state.storeMemberships.some((membership) =>
          membership.storeId === store.id && membership.storeUserId === input.assignedStoreUserId && membership.status === 'active',
        );
        if (!hasMembership) throw new DomainRepositoryError('The selected representative is not assigned to this store.', 'FORBIDDEN');
        const timestamp = nowIso();
        visit.assignedStoreUserId = input.assignedStoreUserId;
        if (visit.status === 'handoff_requested') visit.status = 'active';
        visit.updatedAt = timestamp;
        state.showroomEvents.unshift({
          id: createLocalId('showroom_event'),
          dealerAccountId: visit.dealerAccountId,
          storeId: visit.storeId,
          visitId: visit.id,
          type: 'visit_claimed',
          actorUserId: input.actorUserId,
          occurredAt: timestamp,
          message: `${requireText(input.actorName, 'Actor name')} assigned this visit to a salesperson.`,
          metadata: { assignedStoreUserName: input.actorName },
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        return clone(visit);
      });
    },

    async setPresence(input: SetPresenceInput) {
      return updateState((state) => {
        const storeContext = input.storeId ? getStoreContext(state, input.storeId) : undefined;
        const timestamp = nowIso();
        const existing = state.userPresence.find((item) => item.userId === input.userId && item.sessionId === input.sessionId);
        const ttlSeconds = Math.min(Math.max(input.ttlSeconds ?? 120, 30), 300);
        if (existing) {
          existing.dealerAccountId = storeContext?.store.dealerAccountId;
          existing.storeId = input.storeId;
          existing.activityCode = requireText(input.activityCode, 'Activity code');
          existing.activityLabel = requireText(input.activityLabel, 'Activity label');
          existing.state = input.state || 'working';
          existing.lastSeenAt = timestamp;
          existing.expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
          existing.updatedAt = timestamp;
          return clone(existing);
        }
        const presence: UserPresenceRecord = {
          id: createLocalId('presence'),
          dealerAccountId: storeContext?.store.dealerAccountId,
          storeId: input.storeId,
          userId: input.userId,
          userKind: input.userKind,
          sessionId: requireText(input.sessionId, 'Session ID'),
          activityCode: requireText(input.activityCode, 'Activity code'),
          activityLabel: requireText(input.activityLabel, 'Activity label'),
          state: input.state || 'working',
          startedAt: timestamp,
          lastSeenAt: timestamp,
          expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.userPresence.push(presence);
        return clone(presence);
      });
    },

    async clearPresence(userId, sessionId) {
      updateState((state) => {
        state.userPresence = state.userPresence.filter((item) => item.userId !== userId || item.sessionId !== sessionId);
      });
    },

    async listPresence(storeId) {
      const state = readState();
      const now = Date.now();
      return clone(state.userPresence.filter((presence) => Date.parse(presence.expiresAt) > now && (!storeId || presence.storeId === storeId)));
    },

    async appendActivityEvent(input: CreateActivityEventInput) {
      return updateState((state) => {
        const storeContext = input.storeId ? getStoreContext(state, input.storeId) : undefined;
        const timestamp = nowIso();
        const event: ActivityEventRecord = {
          id: createLocalId('activity_event'),
          dealerAccountId: storeContext?.store.dealerAccountId,
          storeId: input.storeId,
          actorUserId: input.actorUserId,
          actorKind: input.actorKind,
          activityCode: requireText(input.activityCode, 'Activity code'),
          category: input.category,
          title: requireText(input.title, 'Activity title'),
          description: input.description?.trim() || undefined,
          entityType: input.entityType,
          entityId: input.entityId,
          occurredAt: timestamp,
          metadata: input.metadata,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.activityEvents.unshift(event);
        return clone(event);
      });
    },

    async listActivityEvents(storeId, limit = 50) {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.activityEvents.filter((event) => event.storeId === storeId).slice(0, Math.max(1, Math.min(limit, 200))));
    },

    async saveKpiAggregate(input: CreateKpiAggregateInput) {
      return updateState((state) => {
        getStoreContext(state, input.storeId);
        const timestamp = nowIso();
        const existingIndex = state.kpiAggregates.findIndex((item) =>
          item.storeId === input.storeId && item.scope === input.scope && item.userId === input.userId &&
          item.metricKey === input.metricKey && item.periodStart === input.periodStart && item.periodEnd === input.periodEnd &&
          item.definitionVersion === input.definitionVersion
        );
        const aggregate: KpiAggregate = {
          ...input,
          id: existingIndex >= 0 ? state.kpiAggregates[existingIndex].id : createLocalId('kpi_aggregate'),
          calculatedAt: input.calculatedAt || timestamp,
          createdAt: existingIndex >= 0 ? state.kpiAggregates[existingIndex].createdAt : timestamp,
          updatedAt: timestamp,
        };
        if (existingIndex >= 0) state.kpiAggregates[existingIndex] = aggregate;
        else state.kpiAggregates.unshift(aggregate);
        return clone(aggregate);
      });
    },

    async saveReportSnapshot(input: CreateReportSnapshotInput) {
      return updateState((state) => {
        getStoreContext(state, input.storeId);
        const timestamp = nowIso();
        const snapshot: ReportSnapshot = {
          ...input,
          id: createLocalId('report_snapshot'),
          generatedAt: input.generatedAt || timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.reportSnapshots.unshift(snapshot);
        return clone(snapshot);
      });
    },

    async listReportSnapshots(storeId, reportType) {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.reportSnapshots.filter((snapshot) => snapshot.storeId === storeId && (!reportType || snapshot.reportType === reportType)));
    },

    async createSavedReportView(input: CreateSavedReportViewInput) {
      return updateState((state) => {
        getStoreContext(state, input.storeId);
        const timestamp = nowIso();
        const savedView: SavedReportView = {
          id: createLocalId('saved_report_view'),
          ownerUserId: input.ownerUserId,
          storeId: input.storeId,
          name: requireText(input.name, 'Saved view name'),
          reportType: input.reportType,
          filters: input.filters || {},
          isPinned: input.isPinned ?? false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        state.savedReportViews.unshift(savedView);
        return clone(savedView);
      });
    },

    async listSavedReportViews(ownerUserId) {
      const state = readState();
      return clone(state.savedReportViews.filter((view) => view.ownerUserId === ownerUserId));
    },

    async listImportJobs(storeId): Promise<ImportJob[]> {
      const state = readState();
      getStoreContext(state, storeId);
      return clone(state.importJobs.filter((job) => job.storeId === storeId));
    },
  };

  return repository;
}

/** Shared mock instance for the client shell. Replace with an authenticated API adapter in Phase 2. */
export const eveoDomainRepository = createMockEveoRepository();
