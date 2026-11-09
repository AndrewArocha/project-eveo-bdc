import type {
  AppointmentRecord,
  DealerAccount,
  DealRecordEntity,
  EveoDomainSnapshot,
  InventorySourceObservation,
  InventoryVehicle,
  LeadRecord,
  PlatformStoreAssignment,
  PlatformUser,
  ReportSnapshot,
  StoreMembership,
  StoreRecord,
  StoreUser,
} from '../../types/domain';
import { EVEO_GLOBAL_TEAM, LEGACY_DEMO_STORES } from '../mainDatabase';
import { STORE_DATA } from '../stores';
import { njxInventory } from '../stores/njx/inventory';
import { NJX_HISTORICAL_REPORTS } from '../stores/njx/reports';

const LEGACY_SEED_VERSION = 1;
const LEGACY_SEED_ACTOR_ID = 'system:legacy-demo-seed';

function id(prefix: string, value: string | number): string {
  return `demo_${prefix}_${String(value).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function mapPlatformRole(role: string): PlatformUser['role'] {
  switch (role) {
    case 'super_admin': return 'super_admin';
    case 'owner': return 'platform_owner';
    case 'bdc_manager': return 'bdc_manager';
    case 'bdc': return 'bdc_rep';
    default: return 'support';
  }
}

function mapStoreRole(role: string): StoreUser['role'] {
  switch (role) {
    case 'manager': return 'general_manager';
    case 'bdc': return 'store_bdc';
    default: return 'sales_rep';
  }
}

function mapLeadStatus(status: string): LeadRecord['status'] {
  const normalized = status.toLowerCase();
  if (normalized.includes('contact')) return 'contacted';
  if (normalized.includes('appt') || normalized.includes('appointment')) return 'appointment_set';
  if (normalized.includes('qualif')) return 'qualified';
  if (normalized.includes('lost')) return 'lost';
  if (normalized.includes('convert')) return 'converted';
  return 'new';
}

function mapAppointmentStatus(status: string): AppointmentRecord['status'] {
  const normalized = status.toLowerCase();
  if (normalized.includes('confirm')) return 'confirmed';
  if (normalized.includes('arrived')) return 'arrived';
  if (normalized.includes('show')) return 'showed';
  if (normalized.includes('no show')) return 'no_show';
  if (normalized.includes('sold')) return 'sold';
  if (normalized.includes('cancel')) return 'cancelled';
  return 'pending_confirmation';
}


/**
 * Translates the approved Phase 1 mock data into the canonical domain shape.
 * This intentionally does not infer customers from repeated names, fabricate
 * inventory for DK/KIA, or treat a website/feed status as verified truth.
 */
export function createLegacyDemoSeed(): EveoDomainSnapshot {
  const now = new Date().toISOString();
  const storesByLegacyId = new Map<string, StoreRecord>();
  const accounts: DealerAccount[] = [];
  const storeRecords: StoreRecord[] = [];

  for (const legacyStore of LEGACY_DEMO_STORES) {
    const accountId = id('dealer_account', legacyStore.id);
    const storeId = id('store', legacyStore.id);
    const metadata = legacyStore as typeof legacyStore & {
      websiteUrl?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
    };

    accounts.push({
      id: accountId,
      accountCode: `DEMO-${legacyStore.logoText}`,
      legalName: legacyStore.name,
      displayName: legacyStore.name,
      status: 'active',
      multiStoreEnabled: false,
      customerSharingEnabled: false,
      createdAt: now,
      updatedAt: now,
      isDemoData: true,
    });

    const store: StoreRecord = {
      id: storeId,
      dealerAccountId: accountId,
      storeCode: legacyStore.logoText.toUpperCase(),
      name: legacyStore.name,
      websiteUrl: metadata.websiteUrl,
      phone: metadata.phone,
      email: metadata.email,
      address: metadata.address,
      city: metadata.city,
      countryCode: 'US',
      timeZone: 'America/New_York',
      logoUrl: legacyStore.logoUrl,
      bannerUrl: legacyStore.bannerUrl,
      status: 'active',
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
      isDemoData: true,
    };

    storesByLegacyId.set(legacyStore.id, store);
    storeRecords.push(store);
  }

  const platformUsers: PlatformUser[] = EVEO_GLOBAL_TEAM.map((legacyUser) => ({
    id: id('platform_user', legacyUser.id),
    employeeCode: `EVEO-LEGACY-${String(legacyUser.id).padStart(4, '0')}`,
    fullName: legacyUser.name,
    email: legacyUser.email || `${String(legacyUser.name).toLowerCase().replace(/[^a-z0-9]+/g, '.')}@demo.eveo.local`,
    role: mapPlatformRole(legacyUser.role),
    status: 'active',
    preferredCurrency: legacyUser.currency === 'USD' || legacyUser.currency === 'COP' ? legacyUser.currency : undefined,
    settings: {
      legacyUserId: String(legacyUser.id),
      legacyRole: legacyUser.role,
      identityReviewRequired: true,
    },
    createdAt: now,
    updatedAt: now,
    isDemoData: true,
  }));

  const platformStoreAssignments: PlatformStoreAssignment[] = [];
  for (const legacyUser of EVEO_GLOBAL_TEAM) {
    const platformUser = platformUsers.find((user) => user.settings?.legacyUserId === String(legacyUser.id));
    if (!platformUser) continue;
    for (const legacyStoreId of legacyUser.assignedStoreIds || []) {
      const store = storesByLegacyId.get(legacyStoreId);
      if (!store) continue;
      platformStoreAssignments.push({
        id: id('platform_assignment', `${legacyUser.id}_${legacyStoreId}`),
        platformUserId: platformUser.id,
        dealerAccountId: store.dealerAccountId,
        storeId: store.id,
        assignedByUserId: LEGACY_SEED_ACTOR_ID,
        status: 'active',
        startsAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const storeUsers: StoreUser[] = [];
  const storeMemberships: StoreMembership[] = [];
  const leads: LeadRecord[] = [];
  const appointments: AppointmentRecord[] = [];
  const deals: DealRecordEntity[] = [];

  for (const legacyStore of LEGACY_DEMO_STORES) {
    const store = storesByLegacyId.get(legacyStore.id);
    const legacyData = STORE_DATA[legacyStore.id];
    if (!store || !legacyData) continue;

    legacyData.staff.forEach((staff, index) => {
      const userId = id('store_user', `${legacyStore.id}_${staff.id}`);
      const employeeCode = `${store.storeCode}-${String(index + 1).padStart(3, '0')}`;
      const user: StoreUser = {
        id: userId,
        dealerAccountId: store.dealerAccountId,
        employeeCode,
        fullName: staff.name,
        email: staff.email || `${employeeCode.toLowerCase()}@demo.${legacyStore.id}.local`,
        role: mapStoreRole(staff.role),
        status: 'active',
        primaryStoreId: store.id,
        wageAmount: staff.wage,
        wageCurrency: staff.currency === 'COP' ? 'COP' : 'USD',
        settings: {
          legacyStaffId: String(staff.id),
          legacyRole: staff.role,
          identityReviewRequired: true,
        },
        createdAt: now,
        updatedAt: now,
        isDemoData: true,
      };
      storeUsers.push(user);
      storeMemberships.push({
        id: id('store_membership', `${legacyStore.id}_${staff.id}`),
        dealerAccountId: store.dealerAccountId,
        storeId: store.id,
        storeUserId: userId,
        role: user.role,
        isPrimary: true,
        grantedByUserId: LEGACY_SEED_ACTOR_ID,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
    });

    legacyData.leads.forEach((lead) => {
      leads.push({
        id: id('lead', `${legacyStore.id}_${lead.id}`),
        dealerAccountId: store.dealerAccountId,
        storeId: store.id,
        customerNameSnapshot: lead.name,
        vehicleOfInterest: lead.vehicle,
        status: mapLeadStatus(lead.status),
        notes: lead.notes,
        legacyStatus: lead.status,
        legacyTimeLabel: lead.time,
        createdAt: now,
        updatedAt: now,
        isDemoData: true,
      });
    });

    legacyData.appointments.forEach((appointment) => {
      appointments.push({
        id: id('appointment', `${legacyStore.id}_${appointment.id}`),
        dealerAccountId: store.dealerAccountId,
        storeId: store.id,
        customerNameSnapshot: appointment.name || appointment.customer || 'Unknown customer',
        phoneSnapshot: appointment.phone,
        vehicleSnapshot: appointment.vehicle,
        legacyTimeLabel: appointment.time,
        status: mapAppointmentStatus(appointment.status),
        notes: appointment.notes,
        legacyStatus: appointment.status,
        createdAt: now,
        updatedAt: now,
        isDemoData: true,
      });
    });

    legacyData.sold.forEach((deal) => {
      deals.push({
        id: id('sold_deal', `${legacyStore.id}_${deal.id}`),
        dealerAccountId: store.dealerAccountId,
        storeId: store.id,
        customerNameSnapshot: deal.name,
        vehicleSnapshot: deal.vehicle,
        stage: 'sold',
        assignedStoreUserId: storeUsers.find((user) => user.fullName === deal.rep && user.primaryStoreId === store.id)?.id,
        createdAt: now,
        updatedAt: now,
        isDemoData: true,
      });
    });

    legacyData.pending.forEach((deal) => {
      deals.push({
        id: id('pending_deal', `${legacyStore.id}_${deal.id}`),
        dealerAccountId: store.dealerAccountId,
        storeId: store.id,
        customerNameSnapshot: deal.name,
        vehicleSnapshot: deal.vehicle,
        stage: 'pending',
        assignedStoreUserId: storeUsers.find((user) => user.fullName === deal.rep && user.primaryStoreId === store.id)?.id,
        createdAt: now,
        updatedAt: now,
        isDemoData: true,
      });
    });
  }

  const inventoryVehicles: InventoryVehicle[] = [];
  const inventoryObservations: InventorySourceObservation[] = [];
  const njxStore = storesByLegacyId.get('njx');

  if (njxStore) {
    njxInventory.units.forEach((unit) => {
      const vehicleId = id('inventory_vehicle', `njx_${unit.vin}`);
      const observationId = id('inventory_observation', `njx_${unit.vin}`);
      const availabilityMap: Record<string, InventorySourceObservation['observedStatus']> = {
        READY_FOR_SALE: 'available',
        PENDING: 'pending',
        DELIVERED: 'delivered',
      };
      const vehicleWords = unit.vehicle.match(/^(\d{4})\s+(.+)$/);
      const remainder = vehicleWords?.[2]?.split(/\s+/) || [];

      inventoryVehicles.push({
        id: vehicleId,
        dealerAccountId: njxStore.dealerAccountId,
        storeId: njxStore.id,
        vin: unit.vin,
        year: vehicleWords ? Number(vehicleWords[1]) : undefined,
        make: remainder[0],
        model: remainder.slice(1).join(' ') || undefined,
        displayName: unit.vehicle,
        mileage: undefined,
        photoUrls: [],
        sourceObservationIds: [observationId],
        createdAt: now,
        updatedAt: now,
        isDemoData: true,
      });

      inventoryObservations.push({
        id: observationId,
        dealerAccountId: njxStore.dealerAccountId,
        storeId: njxStore.id,
        inventoryVehicleId: vehicleId,
        sourceType: 'demo_fixture',
        sourceName: 'NJX local inventory fixture',
        sourceRecordId: unit.vin,
        observedAt: now,
        observedStatus: availabilityMap[unit.status],
        observedPrice: { amount: unit.price, currency: 'USD' },
        rawPayload: {
          sourceFixture: 'data/stores/njx/inventory',
          daysInStock: unit.daysInStock,
          originalStatus: unit.status,
        },
        createdAt: now,
        updatedAt: now,
        isDemoData: true,
      });
    });
  }

  const reportSnapshots: ReportSnapshot[] = [];
  const njxReportStore = storesByLegacyId.get('njx');
  if (njxReportStore) {
    for (const report of NJX_HISTORICAL_REPORTS) {
      reportSnapshots.push({
        id: id('report_snapshot', report.id),
        dealerAccountId: njxReportStore.dealerAccountId,
        storeId: njxReportStore.id,
        reportType: 'bdc_daily',
        periodStart: `${report.dateISO}T00:00:00.000Z`,
        periodEnd: `${report.dateISO}T23:59:59.999Z`,
        storeTimeZone: njxReportStore.timeZone,
        generatedAt: now,
        sourceSystem: 'legacy_mock_fixture',
        definitionVersion: 1,
        payload: JSON.parse(JSON.stringify(report)),
        createdAt: now,
        updatedAt: now,
        isDemoData: true,
      });
    }
  }

  // Current mock data has no canonical customer identities. Do not infer or merge
  // customers from matching display names in leads, appointments or deals.
  return {
    schemaVersion: LEGACY_SEED_VERSION,
    dealerAccounts: accounts,
    stores: storeRecords,
    platformUsers,
    storeUsers,
    storeMemberships,
    platformStoreAssignments,
    invitations: [],
    dealerApplications: [],
    customers: [],
    inventoryVehicles,
    inventoryObservations,
    inventoryDiscrepancies: [],
    leads,
    appointments,
    deals,
    showroomVisits: [],
    showroomEvents: [],
    userPresence: [],
    activityEvents: [],
    kpiDefinitions: [],
    kpiAggregates: [],
    reportSnapshots,
    integrationConnections: [],
    inventorySourceConfigs: [],
    importJobs: [],
    savedReportViews: [],
    subscriptions: [],
    paymentMethodReferences: [],
  };
}
