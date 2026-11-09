import { demoStorage } from '../demo/demoSession';
// src/services/notifications/notificationCenterStore.ts
import { playWoodBlockAlert, playSocialMediaChime } from '../../utils/soundEngine';
import { readStoreScopedStorage, resolveLegacyStoreDataKey, STORE_DATA } from '../../data/mockDatabase';

export interface StoreNotificationItem {
  id: string;
  storeId: string;
  type: 'sla_breach' | 'unconfirmed_appt' | 'sold_vehicle_alert' | 'inventory_sync' | 'new_lead';
  severity: 'critical' | 'normal';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  route?: string;
}

const NOTIFICATIONS_KEY_PREFIX = 'eveo_store_notifications_v2_';

function seedNotificationsForStore(storeId: string): StoreNotificationItem[] {
  if (!Object.hasOwn(STORE_DATA, resolveLegacyStoreDataKey(storeId))) return [];
  return [
    {
      id: `notif_${storeId}_sla_1`,
      storeId,
      type: 'sla_breach',
      severity: 'critical',
      title: 'High Showroom SLA Alert (6m Wait)',
      message: 'David Kim (2025 Genesis GV80) has waited 6m in the lobby — 4m SLA threshold exceeded.',
      timestamp: '2m ago',
      read: false,
      route: '/app/showroom',
    },
    {
      id: `notif_${storeId}_appt_1`,
      storeId,
      type: 'unconfirmed_appt',
      severity: 'critical',
      title: 'Unconfirmed Appointment Warning',
      message: 'Gordon Freeman (1:00 PM • 2024 Tesla Model Y) still requires BDC confirmation.',
      timestamp: '9m ago',
      read: false,
      route: '/app/hub',
    },
    {
      id: `notif_${storeId}_lead_1`,
      storeId,
      type: 'new_lead',
      severity: 'normal',
      title: 'New Website Inquiry Logged',
      message: 'John Smith requested internet pricing & CarFax on 2021 Ford F-150.',
      timestamp: '15m ago',
      read: true,
      route: '/app/hub',
    },
  ];
}

export function getStoreNotifications(storeId: string): StoreNotificationItem[] {
  if (typeof window === 'undefined') return seedNotificationsForStore(storeId);
  try {
    const raw = readStoreScopedStorage(NOTIFICATIONS_KEY_PREFIX, storeId);
    if (raw) return JSON.parse(raw) as StoreNotificationItem[];
  } catch {
    // Fallback
  }
  const seeded = seedNotificationsForStore(storeId);
  try {
    demoStorage.setItem(`${NOTIFICATIONS_KEY_PREFIX}${storeId}`, JSON.stringify(seeded));
  } catch {
    // Ignore
  }
  return seeded;
}

export function pushStoreNotification(
  payload: Omit<StoreNotificationItem, 'id' | 'timestamp' | 'read'>
): StoreNotificationItem {
  const item: StoreNotificationItem = {
    ...payload,
    id: `notif_${payload.storeId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: 'Just now',
    read: false,
  };

  if (item.severity === 'critical') {
    playWoodBlockAlert();
  } else {
    playSocialMediaChime();
  }

  const existing = getStoreNotifications(payload.storeId);
  const updated = [item, ...existing].slice(0, 40);
  try {
    demoStorage.setItem(`${NOTIFICATIONS_KEY_PREFIX}${payload.storeId}`, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('eveo:store-notifications-updated', { detail: { storeId: payload.storeId } })
    );
  } catch {
    // Ignore
  }
  return item;
}

export function markAllStoreNotificationsRead(storeId: string) {
  const updated = getStoreNotifications(storeId).map((n) => ({ ...n, read: true }));
  try {
    demoStorage.setItem(`${NOTIFICATIONS_KEY_PREFIX}${storeId}`, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('eveo:store-notifications-updated', { detail: { storeId } })
    );
  } catch {
    // Ignore
  }
}
