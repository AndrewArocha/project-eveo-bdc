import { demoStorage } from '../demo/demoSession';
// src/services/inventory/storeInventorySync.ts
import {
  njxInventory,
  type StoreInventorySummary,
} from '../../data/stores/njx/inventory';
import { LEGACY_DEMO_STORES, readStoreScopedStorage, resolveLegacyStoreDataKey } from '../../data/mockDatabase';
import { playWoodBlockAlert } from '../../utils/soundEngine';
import { pushStoreNotification } from '../../services/notifications/notificationCenterStore';

export type InventoryUnitStatus = 'READY_FOR_SALE' | 'PENDING' | 'SOLD' | 'DELIVERED';
export type StoreInventoryUnit = StoreInventorySummary['units'][number];

const INVENTORY_STORAGE_PREFIX = 'eveo_store_inventory_v2_';
const INVENTORY_API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
const INVENTORY_SYNC_ENABLED = import.meta.env.VITE_ENABLE_INVENTORY_SYNC === 'true';

/**
 * Automatic feed synchronization stays disabled until the server route is implemented
 * and explicitly enabled in the client environment. A configured API URL alone is
 * not proof that the inventory connector exists yet.
 */
export function isStoreWebsiteInventorySyncAvailable(): boolean {
  return INVENTORY_SYNC_ENABLED && INVENTORY_API_BASE_URL.length > 0;
}

export function getStoreWebsiteInventoryUrl(storeId: string, configuredWebsite = ''): string {
  if (configuredWebsite.trim()) return normalizeInventorySourceUrl(configuredWebsite);
  try {
    const customUrl = readStoreScopedStorage('eveo_store_website_', storeId);
    if (customUrl?.trim()) return normalizeInventorySourceUrl(customUrl);
  } catch {
    // Fall through to the store's configured public website.
  }

  const store = LEGACY_DEMO_STORES.find((item) => item.id === resolveLegacyStoreDataKey(storeId));
  return store?.websiteUrl ? normalizeInventorySourceUrl(store.websiteUrl) : '';
}

function normalizeInventorySourceUrl(value: string): string {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function buildDefaultStoreInventory(storeId: string): StoreInventorySummary {
  if (resolveLegacyStoreDataKey(storeId) === 'njx') {
    return {
      ...njxInventory,
      units: [
        ...njxInventory.units,
        // Include a DELIVERED (Sold) unit so testing sold-car appointment blocking works out of the box
        {
          vin: '1FTFW1E50MFA44910',
          vehicle: '2022 Ford F-150 Lariat',
          daysInStock: 68,
          price: 38900,
          status: 'DELIVERED',
        },
      ],
    };
  }

  // Stores without an imported inventory source start empty. Leads, pending
  // deals and sold records are not inventory records and must never be used
  // to fabricate vehicles or VINs.
  return {
    storeId,
    carsReadyForSale: 0,
    carsDeliveredMtd: 0,
    dealsDeliveredToday: 0,
    averageRatioBenchmark: 100,
    units: [],
  };
}

export function getStoreInventory(storeId: string): StoreInventorySummary {
  if (typeof window === 'undefined') return buildDefaultStoreInventory(storeId);
  try {
    const raw = readStoreScopedStorage(INVENTORY_STORAGE_PREFIX, storeId);
    if (raw) return JSON.parse(raw) as StoreInventorySummary;
  } catch {
    // Fallback
  }
  const seeded = buildDefaultStoreInventory(storeId);
  try {
    demoStorage.setItem(`${INVENTORY_STORAGE_PREFIX}${storeId}`, JSON.stringify(seeded));
  } catch {
    // Ignore
  }
  return seeded;
}

export function saveStoreInventory(storeId: string, summary: StoreInventorySummary) {
  try {
    demoStorage.setItem(`${INVENTORY_STORAGE_PREFIX}${storeId}`, JSON.stringify(summary));
    window.dispatchEvent(
      new CustomEvent('eveo:store-inventory-updated', { detail: { storeId, summary } })
    );
  } catch {
    // Ignore
  }
}

export function updateStoreVehicleStatus(
  storeId: string,
  vin: string,
  newStatus: InventoryUnitStatus
) {
  const current = getStoreInventory(storeId);
  const target = current.units.find((u) => u.vin === vin);

  const updatedUnits = current.units.map((u) =>
    u.vin === vin ? { ...u, status: newStatus } : u
  );

  const readyDelta =
    target?.status === 'READY_FOR_SALE' && newStatus !== 'READY_FOR_SALE'
      ? -1
      : target?.status !== 'READY_FOR_SALE' && newStatus === 'READY_FOR_SALE'
        ? 1
        : 0;

  const deliveredDelta =
    target?.status !== 'DELIVERED' && newStatus === 'DELIVERED'
      ? 1
      : target?.status === 'DELIVERED' && newStatus !== 'DELIVERED'
        ? -1
        : 0;

  const updated: StoreInventorySummary = {
    ...current,
    carsReadyForSale: Math.max(0, current.carsReadyForSale + readyDelta),
    carsDeliveredMtd: Math.max(0, current.carsDeliveredMtd + deliveredDelta),
    units: updatedUnits,
  };

  saveStoreInventory(storeId, updated);

  if (target) {
    pushStoreNotification({
      storeId,
      type: newStatus === 'DELIVERED' ? 'sold_vehicle_alert' : 'inventory_sync',
      severity: newStatus === 'DELIVERED' ? 'critical' : 'normal',
      title:
        newStatus === 'DELIVERED'
          ? `Vehicle Marked DELIVERED (Sold) • ${target.vehicle}`
          : `Inventory Updated • ${target.vehicle}`,
      message:
        newStatus === 'DELIVERED'
          ? `VIN ${target.vin} is now marked DELIVERED. Any attempt to book an appointment on this vehicle will trigger a WoodBlock alert.`
          : `VIN ${target.vin} status changed to ${newStatus.replace(/_/g, ' ')}.`,
    });
  }
}

/**
 * Checks if a vehicle name or VIN in `storeId` is already marked DELIVERED (Sold).
 * If so, plays the WoodBlock knock + mobile vibration and returns the sold unit!
 */
export function checkAndAlertIfVehicleSold(
  storeId: string,
  vehicleQuery: string
): StoreInventoryUnit | null {
  const q = vehicleQuery.trim().toLowerCase();
  if (!q) return null;
  const inv = getStoreInventory(storeId);
  const soldUnit = inv.units.find(
    (u) =>
      (u.status === 'SOLD' || u.status === 'DELIVERED') &&
      (u.vehicle.toLowerCase().includes(q) ||
        q.includes(u.vehicle.toLowerCase()) ||
        u.vin.toLowerCase() === q)
  );

  if (soldUnit) {
    playWoodBlockAlert();
    pushStoreNotification({
      storeId,
      type: 'sold_vehicle_alert',
      severity: 'critical',
      title: `Blocked Action on SOLD Vehicle • ${soldUnit.vehicle}`,
      message: `Attempted to schedule or walk around ${soldUnit.vehicle} (VIN: ${soldUnit.vin}), which is already marked DELIVERED.`,
    });
    return soldUnit;
  }
  return null;
}

/**
 * Global Progressive Website Inventory Synchronizer for ANY Dealership Store!
 * Connects to the store's configured website URL,
 * progressively ingests new units, and marks removed website units as DELIVERED (Sold).
 */
export async function syncStoreWebsiteInventoryProgressively(
  storeId: string,
  onProgress?: (stage: string, pct: number, summary: StoreInventorySummary) => void,
  configuredWebsite = '',
): Promise<StoreInventorySummary> {
  const storeMeta = LEGACY_DEMO_STORES.find((store) => store.id === resolveLegacyStoreDataKey(storeId));
  if (!storeMeta && !configuredWebsite.trim()) throw new Error(`Store ${storeId} is not registered in EVEO.`);

  const sourceUrl = getStoreWebsiteInventoryUrl(storeId, configuredWebsite);
  if (!sourceUrl) {
    throw new Error(`No valid inventory source URL is configured for ${storeMeta?.name || storeId}.`);
  }

  const current = getStoreInventory(storeId);
  if (!isStoreWebsiteInventorySyncAvailable()) {
    throw new Error(
      'Automatic inventory sync is disabled until the EVEO inventory API route is implemented and explicitly enabled.'
    );
  }

  onProgress?.(`Connecting to ${sourceUrl}...`, 20, current);

  const response = await fetch(`${INVENTORY_API_BASE_URL}/api/stores/${encodeURIComponent(storeId)}/inventory/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId, sourceUrl }),
  });
  if (!response.ok) {
    throw new Error(`Inventory synchronization failed (${response.status}).`);
  }

  const payload = (await response.json()) as { units?: StoreInventoryUnit[] };
  if (!Array.isArray(payload.units)) {
    throw new Error('The inventory connector returned an invalid response: expected a units array.');
  }

  const storeName = storeMeta?.name || storeId;
  onProgress?.(`Reconciling ${storeName} inventory observations...`, 70, current);

  const nextUnits = [...current.units];
  const existingByVin = new Map(nextUnits.map((unit) => [unit.vin.toUpperCase(), unit]));
  const incomingVins = new Set(payload.units.map((unit) => unit.vin.toUpperCase()));
  let newUnits = 0;
  let conflictingUnits = 0;

  for (const incoming of payload.units) {
    const existing = existingByVin.get(incoming.vin.toUpperCase());
    if (!existing) {
      nextUnits.unshift(incoming);
      newUnits += 1;
      continue;
    }

    // Do not silently choose the website over a previously recorded source or
    // human decision. Preserve the existing row and flag any disagreement.
    if (existing.status !== incoming.status || existing.price !== incoming.price || existing.daysInStock !== incoming.daysInStock) {
      conflictingUnits += 1;
    }
  }

  const missingFromFeed = current.units.filter((unit) => !incomingVins.has(unit.vin.toUpperCase())).length;
  const nextSummary: StoreInventorySummary = { ...current, units: nextUnits };
  saveStoreInventory(storeId, nextSummary);

  if (conflictingUnits > 0 || missingFromFeed > 0) {
    pushStoreNotification({
      storeId,
      type: 'inventory_sync',
      severity: 'normal',
      title: 'Inventory sync requires human review',
      message: `${conflictingUnits} existing vehicles have source disagreements and ${missingFromFeed} existing vehicles were absent from this feed. No vehicle was automatically marked sold or delivered.`,
      route: '/app/reports',
    });
  }

  onProgress?.(`Imported ${newUnits} new inventory records.`, 100, nextSummary);
  pushStoreNotification({
    storeId,
    type: 'inventory_sync',
    severity: 'normal',
    title: `${storeName} inventory feed processed`,
    message: `${payload.units.length} source records reviewed; ${newUnits} new vehicles added. Existing status and price disagreements were preserved for human review.`,
    route: '/app/reports',
  });

  return nextSummary;
}
