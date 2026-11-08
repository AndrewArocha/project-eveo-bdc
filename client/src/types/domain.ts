/**
 * EVEO canonical domain contracts (v1).
 *
 * IDs are serialized as strings in the client. In production they are MongoDB
 * ObjectIds serialized by the API; human-readable employee/store codes are
 * separate fields and must never be used as database foreign keys.
 */
export type MongoId = string;
export type IsoDateTime = string;
export type CurrencyCode = 'USD' | 'COP';
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface DomainEntity {
  id: MongoId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export type DealerAccountStatus =
  | 'pending_review'
  | 'approved'
  | 'trial'
  | 'active'
  | 'suspended'
  | 'cancelled'
  | 'deletion_pending'
  | 'closed';

export interface DealerAccount extends DomainEntity {
  accountCode: string;
  legalName: string;
  displayName: string;
  status: DealerAccountStatus;
  ownerStoreUserId?: MongoId;
  billingEmail?: string;
  billingContactName?: string;
  multiStoreEnabled: boolean;
  customerSharingEnabled: boolean;
  trialStartedAt?: IsoDateTime;
  trialEndsAt?: IsoDateTime;
  cancelledAt?: IsoDateTime;
  reactivationUntil?: IsoDateTime;
  dataRetentionPolicyId?: MongoId;
  isDemoData?: boolean;
}

export type StoreLifecycleStatus = 'pending_setup' | 'active' | 'suspended' | 'closed';

export interface StoreRecord extends DomainEntity {
  dealerAccountId: MongoId;
  /** Human-readable unique code inside EVEO, e.g. NJX. */
  storeCode: string;
  name: string;
  legalName?: string;
  websiteUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  countryCode: string;
  /** IANA timezone used to define this store's business day and reporting windows. */
  timeZone: string;
  logoUrl?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  status: StoreLifecycleStatus;
  isPrimary: boolean;
  isDemoData?: boolean;
}

export type PlatformUserRole =
  | 'super_admin'
  | 'platform_owner'
  | 'platform_admin'
  | 'bdc_manager'
  | 'bdc_rep'
  | 'accounting'
  | 'support';

export type PlatformUserStatus = 'invited' | 'active' | 'suspended' | 'deactivated';

export interface PlatformUser extends DomainEntity {
  employeeCode: string;
  fullName: string;
  email: string;
  role: PlatformUserRole;
  status: PlatformUserStatus;
  avatarUrl?: string;
  phone?: string;
  preferredCurrency?: CurrencyCode;
  settings?: Record<string, JsonValue>;
  isDemoData?: boolean;
}

export type StoreEmployeeRole =
  | 'dealer_owner'
  | 'general_manager'
  | 'sales_manager'
  | 'sales_rep'
  | 'finance_manager'
  | 'finance'
  | 'store_bdc'
  | 'inventory_manager';

export type StoreUserStatus = 'invited' | 'active' | 'suspended' | 'deactivated';

/** One dealership identity. Additional store access is granted through StoreMembership. */
export interface StoreUser extends DomainEntity {
  dealerAccountId: MongoId;
  employeeCode: string;
  fullName: string;
  email: string;
  role: StoreEmployeeRole;
  status: StoreUserStatus;
  primaryStoreId: MongoId;
  avatarUrl?: string;
  phone?: string;
  wageAmount?: number;
  wageCurrency?: CurrencyCode;
  commissionPlanId?: MongoId;
  settings?: Record<string, JsonValue>;
  isDemoData?: boolean;
}

export interface StoreMembership extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  storeUserId: MongoId;
  role: StoreEmployeeRole;
  isPrimary: boolean;
  grantedByUserId: MongoId;
  status: 'active' | 'revoked';
}

/** Cross-tenant access for an EVEO employee is explicit and auditable. */
export interface PlatformStoreAssignment extends DomainEntity {
  platformUserId: MongoId;
  dealerAccountId: MongoId;
  storeId: MongoId;
  assignedByUserId: MongoId;
  status: 'active' | 'revoked';
  startsAt: IsoDateTime;
  endsAt?: IsoDateTime;
}

export type InvitationAudience = 'dealer_owner' | 'store_employee' | 'platform_employee';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface UserInvitation extends DomainEntity {
  audience: InvitationAudience;
  email: string;
  dealerAccountId?: MongoId;
  storeId?: MongoId;
  role: PlatformUserRole | StoreEmployeeRole;
  invitedByUserId: MongoId;
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: IsoDateTime;
  acceptedAt?: IsoDateTime;
}

export interface DealerApplicationLocation {
  storeName: string;
  websiteUrl?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region?: string;
  countryCode: string;
  timeZone?: string;
}

export type DealerApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';

export interface DealerAccountApplication extends DomainEntity {
  legalBusinessName: string;
  requestedAccountName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl?: string;
  requestedMultiStore: boolean;
  locations: DealerApplicationLocation[];
  status: DealerApplicationStatus;
  verification: {
    emailVerifiedAt?: IsoDateTime;
    phoneVerifiedAt?: IsoDateTime;
    websiteReviewStatus: 'not_checked' | 'pending' | 'verified' | 'failed';
    notes?: string;
  };
  reviewedByUserId?: MongoId;
  reviewedAt?: IsoDateTime;
  rejectionReason?: string;
}

export type CustomerSharingScope = 'store_only' | 'dealer_account';

export interface Customer extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  preferredContactMethod?: 'phone' | 'sms' | 'email' | 'whatsapp';
  sharingScope: CustomerSharingScope;
  externalReferences?: Array<{ system: string; externalId: string }>;
  createdByUserId: MongoId;
  isDemoData?: boolean;
}

export type VehicleAvailabilityStatus = 'available' | 'pending' | 'sold' | 'delivered' | 'unavailable';
export type InventorySourceType = 'website' | 'api' | 'xml' | 'csv' | 'dms' | 'manual' | 'webhook' | 'demo_fixture';

export interface VehicleAvailabilityResolution {
  status: VehicleAvailabilityStatus;
  resolvedByUserId: MongoId;
  resolvedAt: IsoDateTime;
  note: string;
  basedOnObservationIds: MongoId[];
}

/** Canonical vehicle specifications; source observations never silently overwrite an adjudicated value. */
export interface InventoryVehicle extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  vin: string;
  stockNumber?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  displayName: string;
  mileage?: number;
  bodyStyle?: string;
  exteriorColor?: string;
  interiorColor?: string;
  photoUrls: string[];
  resolvedPrice?: { amount: number; currency: CurrencyCode; resolvedByUserId: MongoId; resolvedAt: IsoDateTime };
  resolvedMileage?: { value: number; resolvedByUserId: MongoId; resolvedAt: IsoDateTime };
  availabilityResolution?: VehicleAvailabilityResolution;
  sourceObservationIds: MongoId[];
  isDemoData?: boolean;
}

export interface InventorySourceObservation extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  inventoryVehicleId: MongoId;
  sourceType: InventorySourceType;
  sourceName: string;
  sourceRecordId?: string;
  observedAt: IsoDateTime;
  observedStatus?: VehicleAvailabilityStatus;
  observedPrice?: { amount: number; currency: CurrencyCode };
  observedMileage?: number;
  observedPhotoUrls?: string[];
  rawPayload?: JsonValue;
  importJobId?: MongoId;
  isDemoData?: boolean;
}

export interface InventoryFieldConflict {
  field: 'availabilityStatus' | 'price' | 'mileage' | 'photos';
  observationIds: MongoId[];
  observedValues: JsonValue[];
}

export interface InventoryDiscrepancy extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  inventoryVehicleId: MongoId;
  conflicts: InventoryFieldConflict[];
  status: 'open' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  resolvedByUserId?: MongoId;
  resolvedAt?: IsoDateTime;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'appointment_set' | 'nurture' | 'lost' | 'converted';

export interface LeadRecord extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  customerId?: MongoId;
  customerNameSnapshot: string;
  phoneSnapshot?: string;
  emailSnapshot?: string;
  vehicleOfInterest?: string;
  inventoryVehicleId?: MongoId;
  source?: string;
  status: LeadStatus;
  assignedPlatformUserId?: MongoId;
  assignedStoreUserId?: MongoId;
  notes?: string;
  createdByUserId?: MongoId;
  legacyStatus?: string;
  legacyTimeLabel?: string;
  isDemoData?: boolean;
}

export type AppointmentStatus = 'pending_confirmation' | 'confirmed' | 'arrived' | 'showed' | 'no_show' | 'cancelled' | 'sold';

export interface AppointmentRecord extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  customerId?: MongoId;
  leadId?: MongoId;
  customerNameSnapshot: string;
  phoneSnapshot?: string;
  inventoryVehicleId?: MongoId;
  vehicleSnapshot?: string;
  scheduledAt?: IsoDateTime;
  legacyTimeLabel?: string;
  status: AppointmentStatus;
  assignedPlatformUserId?: MongoId;
  assignedStoreUserId?: MongoId;
  notes?: string;
  createdByUserId?: MongoId;
  legacyStatus?: string;
  isDemoData?: boolean;
}

export type DealStage = 'pending' | 'negotiation' | 'trade_appraisal' | 'credit_application' | 'financing' | 'sold' | 'delivered' | 'cancelled';

export interface DealRecordEntity extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  customerId?: MongoId;
  leadId?: MongoId;
  appointmentId?: MongoId;
  inventoryVehicleId?: MongoId;
  customerNameSnapshot: string;
  vehicleSnapshot: string;
  assignedStoreUserId?: MongoId;
  stage: DealStage;
  frontGross?: { amount: number; currency: CurrencyCode };
  backendGross?: { amount: number; currency: CurrencyCode };
  totalGross?: { amount: number; currency: CurrencyCode };
  soldAt?: IsoDateTime;
  deliveredAt?: IsoDateTime;
  sourceSystem?: string;
  isDemoData?: boolean;
}

export type DomainShowroomVisitStatus = 'active' | 'handoff_requested' | 'completed' | 'cancelled';
export type DomainShowroomEventType =
  | 'customer_greeted'
  | 'visit_claimed'
  | 'walkaround_started'
  | 'media_added'
  | 'test_drive_started'
  | 'test_drive_completed'
  | 'handoff_requested'
  | 'bdc_contact_logged'
  | 'note_added'
  | 'visit_completed';

export interface DomainShowroomVisit extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  customerId: MongoId;
  leadId?: MongoId;
  appointmentId?: MongoId;
  assignedStoreUserId: MongoId;
  checkedInByUserId: MongoId;
  status: DomainShowroomVisitStatus;
  vehicleOfInterestId?: MongoId;
  tradeInVehicleId?: MongoId;
  notes?: string;
  completedAt?: IsoDateTime;
}

export interface DomainShowroomEvent extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  visitId: MongoId;
  type: DomainShowroomEventType;
  actorUserId: MongoId;
  occurredAt: IsoDateTime;
  message: string;
  metadata?: Record<string, JsonValue>;
  mediaAssetIds?: MongoId[];
}

export type PresenceActivityState = 'working' | 'idle' | 'away';

/** Ephemeral current state; deliberately separate from persisted completed activity events. */
export interface UserPresenceRecord extends DomainEntity {
  dealerAccountId?: MongoId;
  storeId?: MongoId;
  userId: MongoId;
  userKind: 'platform_user' | 'store_user';
  sessionId: string;
  activityCode: string;
  activityLabel: string;
  state: PresenceActivityState;
  startedAt: IsoDateTime;
  lastSeenAt: IsoDateTime;
  expiresAt: IsoDateTime;
}

export type ActivityActorKind = 'platform_user' | 'store_user' | 'system' | 'eveo_agent';

export interface ActivityEventRecord extends DomainEntity {
  dealerAccountId?: MongoId;
  storeId?: MongoId;
  actorUserId?: MongoId;
  actorKind: ActivityActorKind;
  activityCode: string;
  category: 'lead' | 'appointment' | 'showroom' | 'inventory' | 'deal' | 'report' | 'account' | 'system' | 'ai';
  title: string;
  description?: string;
  entityType?: string;
  entityId?: MongoId;
  occurredAt: IsoDateTime;
  metadata?: Record<string, JsonValue>;
  isDemoData?: boolean;
}


export type ActivityPriority = 1 | 2 | 3;
export type ActivityCategory =
  | 'showroom'
  | 'inventory'
  | 'appointment'
  | 'ai_high_intent'
  | 'lead'
  | 'account'
  | 'contact'
  | 'report'
  | 'bulk'
  | 'ai_scan';

/** Presentation-ready activity event used by the live activity feed. */
export interface LiveActivityEvent {
  id: string;
  agentName: string;
  initials: string;
  avatarUrl?: string | null;
  isAiAgent?: boolean;
  isDemoData?: boolean;
  priority: ActivityPriority;
  category: ActivityCategory;
  title: string;
  coalescedCount?: number;
  route?: string;
  timestamp: number;
}

export interface ActivityActionDefinition {
  code: string;
  label: string;
  allowedActorKinds: ActivityActorKind[];
  allowedRoles: Array<PlatformUserRole | StoreEmployeeRole>;
  module: 'hub' | 'showroom' | 'reports' | 'inventory' | 'account' | 'settings';
  presenceLabel: string;
  enabled: boolean;
}

export interface KpiDefinition extends DomainEntity {
  key: string;
  label: string;
  description: string;
  scope: 'user' | 'store';
  eligibleRoles: Array<PlatformUserRole | StoreEmployeeRole>;
  numeratorLabel: string;
  denominatorLabel?: string;
  unit: 'count' | 'percentage' | 'currency' | 'minutes' | 'ratio';
  definitionVersion: number;
  enabled: boolean;
}

export interface KpiAggregate extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  scope: 'user' | 'store';
  userId?: MongoId;
  metricKey: string;
  numerator?: number;
  denominator?: number;
  value: number;
  unit: KpiDefinition['unit'];
  periodStart: IsoDateTime;
  periodEnd: IsoDateTime;
  storeTimeZone: string;
  definitionVersion: number;
  sourceEventIds: MongoId[];
  calculatedAt: IsoDateTime;
  isDemoData?: boolean;
}

export type ReportSnapshotType = 'bdc_daily' | 'bdc_monthly' | 'sales_activity' | 'inventory' | 'showroom' | 'user_kpi' | 'store_kpi' | 'executive';

export interface ReportSnapshot extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  reportType: ReportSnapshotType;
  periodStart: IsoDateTime;
  periodEnd: IsoDateTime;
  storeTimeZone: string;
  generatedAt: IsoDateTime;
  generatedByUserId?: MongoId;
  sourceSystem?: string;
  sourceImportJobId?: MongoId;
  definitionVersion?: number;
  payload: JsonValue;
  isDemoData?: boolean;
}

export type IntegrationProvider = 'dealercenter' | 'gohighlevel' | 'website_inventory' | 'custom_api' | 'sftp' | 'manual';
export type IntegrationConnectionStatus = 'pending' | 'connected' | 'error' | 'disabled';

export interface IntegrationConnection extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  provider: IntegrationProvider;
  displayName: string;
  status: IntegrationConnectionStatus;
  externalAccountId?: string;
  credentialReference?: string;
  settings: Record<string, JsonValue>;
  lastSuccessfulSyncAt?: IsoDateTime;
  lastErrorAt?: IsoDateTime;
  lastErrorCode?: string;
}

export type InventoryFeedFormat = 'api_json' | 'xml_url' | 'csv_url' | 'webhook' | 'sftp' | 'manual_upload' | 'website_catalog';

export interface InventorySourceConfig extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  name: string;
  format: InventoryFeedFormat;
  endpoint?: string;
  credentialReference?: string;
  mappingProfileId: string;
  syncEnabled: boolean;
  syncIntervalMinutes?: number;
  lastAttemptAt?: IsoDateTime;
  lastSuccessfulSyncAt?: IsoDateTime;
}

export type ImportJobStatus = 'queued' | 'processing' | 'completed' | 'completed_with_warnings' | 'failed' | 'cancelled';

export interface ImportIssue {
  rowNumber?: number;
  externalRecordId?: string;
  field?: string;
  code: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface ImportJob extends DomainEntity {
  dealerAccountId: MongoId;
  storeId: MongoId;
  sourceConfigId?: MongoId;
  sourceSystem: string;
  fileName?: string;
  format: InventoryFeedFormat | 'pdf' | 'json';
  status: ImportJobStatus;
  startedAt?: IsoDateTime;
  completedAt?: IsoDateTime;
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsUnchanged: number;
  issues: ImportIssue[];
  createdByUserId?: MongoId;
}

export interface SavedReportView extends DomainEntity {
  /** Required owner reference: this is the user-owned resource for the Phase 2 CRUD requirement. */
  ownerUserId: MongoId;
  storeId: MongoId;
  name: string;
  reportType: ReportSnapshotType;
  filters: Record<string, JsonValue>;
  isPinned: boolean;
}

export interface SubscriptionRecord extends DomainEntity {
  dealerAccountId: MongoId;
  planCode: string;
  billingInterval: 'monthly' | 'annual';
  status: 'incomplete' | 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused';
  currentPeriodStart?: IsoDateTime;
  currentPeriodEnd?: IsoDateTime;
  trialStartedAt?: IsoDateTime;
  trialEndsAt?: IsoDateTime;
  paymentProviderCustomerId?: string;
  paymentProviderSubscriptionId?: string;
}

export interface PaymentMethodReference extends DomainEntity {
  dealerAccountId: MongoId;
  provider: string;
  providerPaymentMethodId: string;
  brand?: string;
  lastFour?: string;
  expirationMonth?: number;
  expirationYear?: number;
  isDefault: boolean;
  /** No PAN, CVC or raw card credentials belong in EVEO. */
}

export interface EveoDomainSnapshot {
  schemaVersion: 1;
  dealerAccounts: DealerAccount[];
  stores: StoreRecord[];
  platformUsers: PlatformUser[];
  storeUsers: StoreUser[];
  storeMemberships: StoreMembership[];
  platformStoreAssignments: PlatformStoreAssignment[];
  invitations: UserInvitation[];
  dealerApplications: DealerAccountApplication[];
  customers: Customer[];
  inventoryVehicles: InventoryVehicle[];
  inventoryObservations: InventorySourceObservation[];
  inventoryDiscrepancies: InventoryDiscrepancy[];
  leads: LeadRecord[];
  appointments: AppointmentRecord[];
  deals: DealRecordEntity[];
  showroomVisits: DomainShowroomVisit[];
  showroomEvents: DomainShowroomEvent[];
  userPresence: UserPresenceRecord[];
  activityEvents: ActivityEventRecord[];
  kpiDefinitions: KpiDefinition[];
  kpiAggregates: KpiAggregate[];
  reportSnapshots: ReportSnapshot[];
  integrationConnections: IntegrationConnection[];
  inventorySourceConfigs: InventorySourceConfig[];
  importJobs: ImportJob[];
  savedReportViews: SavedReportView[];
  subscriptions: SubscriptionRecord[];
  paymentMethodReferences: PaymentMethodReference[];
}

export interface PageRequest {
  page?: number;
  pageSize?: number;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
