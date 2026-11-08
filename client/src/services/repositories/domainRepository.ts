import type {
  ActivityEventRecord,
  AppointmentRecord,
  Customer,
  DealerAccount,
  DealerAccountApplication,
  DealerApplicationLocation,
  DealRecordEntity,
  DomainShowroomEvent,
  DomainShowroomEventType,
  DomainShowroomVisit,
  EveoDomainSnapshot,
  ImportJob,
  InventoryDiscrepancy,
  InventorySourceObservation,
  InventorySourceType,
  InventoryVehicle,
  KpiAggregate,
  LeadRecord,
  MongoId,
  PlatformUser,
  ReportSnapshot,
  SavedReportView,
  StoreEmployeeRole,
  StoreRecord,
  StoreUser,
  UserInvitation,
  UserPresenceRecord,
  VehicleAvailabilityStatus,
} from '../../types/domain';

export interface SubmitDealerApplicationInput {
  legalBusinessName: string;
  requestedAccountName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl?: string;
  requestedMultiStore: boolean;
  locations: DealerApplicationLocation[];
}

export interface ApproveDealerApplicationInput {
  applicationId: MongoId;
  reviewedByUserId: MongoId;
  accountCode: string;
  storeCodePrefix: string;
  initialOwnerInvitationExpiresInDays?: number;
}

export interface AddStoreInput {
  dealerAccountId: MongoId;
  storeCode: string;
  name: string;
  websiteUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  countryCode?: string;
  timeZone?: string;
  createdByUserId: MongoId;
}

export interface InviteStoreUserInput {
  dealerAccountId: MongoId;
  storeId: MongoId;
  email: string;
  role: StoreEmployeeRole;
  invitedByUserId: MongoId;
  expiresInDays?: number;
}

export interface AcceptStoreInvitationInput {
  tokenHash: string;
  fullName: string;
  phone?: string;
}

export interface CreateCustomerInput {
  storeId: MongoId;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  preferredContactMethod?: Customer['preferredContactMethod'];
  sharingScope?: Customer['sharingScope'];
  createdByUserId: MongoId;
}

export interface CreateInventoryVehicleInput {
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
  photoUrls?: string[];
}

export interface RecordInventoryObservationInput {
  storeId: MongoId;
  inventoryVehicleId: MongoId;
  sourceType: InventorySourceType;
  sourceName: string;
  sourceRecordId?: string;
  observedStatus?: VehicleAvailabilityStatus;
  observedPrice?: { amount: number; currency: 'USD' | 'COP' };
  observedMileage?: number;
  observedPhotoUrls?: string[];
  rawPayload?: InventorySourceObservation['rawPayload'];
  importJobId?: MongoId;
}

export interface ResolveInventoryDiscrepancyInput {
  discrepancyId: MongoId;
  resolvedByUserId: MongoId;
  note: string;
  status?: VehicleAvailabilityStatus;
  price?: { amount: number; currency: 'USD' | 'COP' };
  mileage?: number;
}

export interface CreateLeadInput {
  storeId: MongoId;
  customerId?: MongoId;
  customerNameSnapshot: string;
  phoneSnapshot?: string;
  emailSnapshot?: string;
  vehicleOfInterest?: string;
  inventoryVehicleId?: MongoId;
  source?: string;
  assignedPlatformUserId?: MongoId;
  assignedStoreUserId?: MongoId;
  notes?: string;
  createdByUserId?: MongoId;
}

export interface UpdateAppointmentStatusInput {
  storeId: MongoId;
  appointmentId: MongoId;
  status: AppointmentRecord['status'];
}

export interface CreateAppointmentInput {
  storeId: MongoId;
  customerId?: MongoId;
  leadId?: MongoId;
  customerNameSnapshot: string;
  phoneSnapshot?: string;
  inventoryVehicleId?: MongoId;
  vehicleSnapshot?: string;
  scheduledAt?: string;
  status?: AppointmentRecord['status'];
  assignedPlatformUserId?: MongoId;
  assignedStoreUserId?: MongoId;
  notes?: string;
  createdByUserId?: MongoId;
}

export interface CreateShowroomVisitInput {
  storeId: MongoId;
  customerId: MongoId;
  assignedStoreUserId: MongoId;
  checkedInByUserId: MongoId;
  leadId?: MongoId;
  appointmentId?: MongoId;
  vehicleOfInterestId?: MongoId;
  tradeInVehicleId?: MongoId;
  notes?: string;
  assignedStoreUserName?: string;
  checkedInByName?: string;
  vehicleOfInterestSnapshot?: import('../../types/domain').JsonValue;
  tradeInSnapshot?: import('../../types/domain').JsonValue;
}

export interface AssignShowroomVisitInput {
  storeId: MongoId;
  visitId: MongoId;
  assignedStoreUserId: MongoId;
  actorUserId: MongoId;
  actorName: string;
}

export interface AppendShowroomEventInput {
  visitId: MongoId;
  type: DomainShowroomEventType;
  actorUserId: MongoId;
  message: string;
  metadata?: DomainShowroomEvent['metadata'];
  mediaAssetIds?: MongoId[];
}

export interface SetPresenceInput {
  userId: MongoId;
  userKind: UserPresenceRecord['userKind'];
  sessionId: string;
  storeId?: MongoId;
  activityCode: string;
  activityLabel: string;
  state?: UserPresenceRecord['state'];
  ttlSeconds?: number;
}

export interface CreateActivityEventInput {
  storeId?: MongoId;
  actorUserId?: MongoId;
  actorKind: ActivityEventRecord['actorKind'];
  activityCode: string;
  category: ActivityEventRecord['category'];
  title: string;
  description?: string;
  entityType?: string;
  entityId?: MongoId;
  metadata?: ActivityEventRecord['metadata'];
}

export interface CreateKpiAggregateInput extends Omit<KpiAggregate, 'id' | 'createdAt' | 'updatedAt' | 'calculatedAt'> {
  calculatedAt?: string;
}

export interface CreateReportSnapshotInput extends Omit<ReportSnapshot, 'id' | 'createdAt' | 'updatedAt' | 'generatedAt'> {
  generatedAt?: string;
}

export interface CreateSavedReportViewInput {
  ownerUserId: MongoId;
  storeId: MongoId;
  name: string;
  reportType: SavedReportView['reportType'];
  filters?: SavedReportView['filters'];
  isPinned?: boolean;
}


export interface TogglePlatformStoreAssignmentInput {
  platformUserId: MongoId;
  storeId: MongoId;
  assignedByUserId: MongoId;
}

export interface ResolveVehicleAvailabilityInput {
  storeId: MongoId;
  inventoryVehicleId: MongoId;
  status: VehicleAvailabilityStatus;
  resolvedByUserId: MongoId;
  note: string;
}

export interface ApproveDealerApplicationResult {
  dealerAccount: DealerAccount;
  stores: StoreRecord[];
  ownerInvitation: UserInvitation;
}

export interface DomainRepositorySubscription {
  subscribe(callback: (snapshot: EveoDomainSnapshot) => void): () => void;
}

/**
 * Repository contract used by the client shell. The mock implementation is
 * for local development only; all authorization and validation must be
 * repeated by the Phase 2 API before production use.
 */
export interface EveoDomainRepository extends DomainRepositorySubscription {
  getSnapshot(): Promise<EveoDomainSnapshot>;
  listStores(dealerAccountId?: MongoId): Promise<StoreRecord[]>;
  listPlatformUsers(): Promise<PlatformUser[]>;
  togglePlatformStoreAssignment(input: TogglePlatformStoreAssignmentInput): Promise<void>;
  listStoreUsers(storeId: MongoId): Promise<StoreUser[]>;
  submitDealerApplication(input: SubmitDealerApplicationInput): Promise<DealerAccountApplication>;
  approveDealerApplication(input: ApproveDealerApplicationInput): Promise<ApproveDealerApplicationResult>;
  addStore(input: AddStoreInput): Promise<StoreRecord>;
  inviteStoreUser(input: InviteStoreUserInput): Promise<UserInvitation>;
  acceptStoreInvitation(input: AcceptStoreInvitationInput): Promise<StoreUser>;
  listCustomers(storeId: MongoId): Promise<Customer[]>;
  createCustomer(input: CreateCustomerInput): Promise<Customer>;
  listInventoryVehicles(storeId: MongoId): Promise<InventoryVehicle[]>;
  createInventoryVehicle(input: CreateInventoryVehicleInput): Promise<InventoryVehicle>;
  recordInventoryObservation(input: RecordInventoryObservationInput): Promise<{ observation: InventorySourceObservation; discrepancies: InventoryDiscrepancy[] }>;
  listInventoryDiscrepancies(storeId: MongoId): Promise<InventoryDiscrepancy[]>;
  resolveInventoryDiscrepancy(input: ResolveInventoryDiscrepancyInput): Promise<InventoryDiscrepancy>;
  resolveVehicleAvailability(input: ResolveVehicleAvailabilityInput): Promise<InventoryVehicle>;
  listLeads(storeId: MongoId): Promise<LeadRecord[]>;
  createLead(input: CreateLeadInput): Promise<LeadRecord>;
  listAppointments(storeId: MongoId): Promise<AppointmentRecord[]>;
  createAppointment(input: CreateAppointmentInput): Promise<AppointmentRecord>;
  updateAppointmentStatus(input: UpdateAppointmentStatusInput): Promise<AppointmentRecord>;
  listDeals(storeId: MongoId): Promise<DealRecordEntity[]>;
  listShowroomVisits(storeId: MongoId): Promise<DomainShowroomVisit[]>;
  createShowroomVisit(input: CreateShowroomVisitInput): Promise<DomainShowroomVisit>;
  appendShowroomEvent(input: AppendShowroomEventInput): Promise<DomainShowroomEvent>;
  assignShowroomVisit(input: AssignShowroomVisitInput): Promise<DomainShowroomVisit>;
  setPresence(input: SetPresenceInput): Promise<UserPresenceRecord>;
  clearPresence(userId: MongoId, sessionId: string): Promise<void>;
  listPresence(storeId?: MongoId): Promise<UserPresenceRecord[]>;
  appendActivityEvent(input: CreateActivityEventInput): Promise<ActivityEventRecord>;
  listActivityEvents(storeId: MongoId, limit?: number): Promise<ActivityEventRecord[]>;
  saveKpiAggregate(input: CreateKpiAggregateInput): Promise<KpiAggregate>;
  saveReportSnapshot(input: CreateReportSnapshotInput): Promise<ReportSnapshot>;
  listReportSnapshots(storeId: MongoId, reportType?: ReportSnapshot['reportType']): Promise<ReportSnapshot[]>;
  createSavedReportView(input: CreateSavedReportViewInput): Promise<SavedReportView>;
  listSavedReportViews(ownerUserId: MongoId): Promise<SavedReportView[]>;
  listImportJobs(storeId: MongoId): Promise<ImportJob[]>;
}
