// src/data/mainDatabase.ts
import * as type from '../types';
import { STORE_DATA, resolveLegacyStoreDataKey } from './stores';
export * from '../types';
export * from './stores';

export const SUPER_ADMIN_USER = 'Andres Hernandez';
export const CURRENT_USER = 'Andres Hernandez';

export function isSuperAdminAccount(): boolean {
  if (typeof window === 'undefined') return true;
  const user = localStorage.getItem('eveo_user_name') || CURRENT_USER;
  return user === SUPER_ADMIN_USER || localStorage.getItem('eveo_super_admin') !== 'false';
}

export const generateDefaultUser = (
  role: type.GlobalRole | type.StoreRole,
  customName?: string
): type.UserProfile => {
  const name = customName || `${role.toUpperCase()} Agent 1`;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  return { id: `usr_${Date.now()}`, name, role, initials };
};

/** Phase 1 fixture metadata only; active store selection comes from the canonical registry. */
export const LEGACY_DEMO_STORES: type.Store[] = [
  {
    id: 'njx',
    name: 'Sample Store East',
    logoText: 'EAST',
    logoUrl: '',
    bannerUrl: '',
    themeGradient: 'from-[#1e3a8a]/20 to-[#0f172a]/80',
  },
  {
    id: 'dk',
    name: 'Sample Store Central',
    logoText: 'CENTRAL',
    logoUrl: '',
    bannerUrl: '',
    themeGradient: 'from-[#7f1d1d]/20 to-[#000000]/80',
  },
  {
    id: 'kia',
    name: 'Sample Store West',
    logoText: 'WEST',
    logoUrl: '',
    bannerUrl: '',
    themeGradient: 'from-[#374151]/20 to-[#4c0519]/80',
  },
];

export const ALL_REPORTS = [
  { id: 'agent', label: 'Agent KPI', value: null, progress: 85, color: 'from-gray-800 to-black', ring: 'border-emerald-500/40' },
  { id: 'lead', label: 'Lead KPI', value: null, progress: 78, color: 'from-gray-800 to-black', ring: 'border-orange-500/40' },
  { id: 'conv', label: 'Conversion Ratios', value: null, progress: 68, color: 'from-gray-800 to-black', ring: 'border-blue-500/40' },
  { id: 'sold', label: 'Sold Cars', value: null, progress: 75, color: 'from-orange-950 to-black', ring: 'border-amber-500/50' },
  { id: 'pending', label: 'Pending Deals', value: null, progress: 60, color: 'from-blue-950 to-black', ring: 'border-purple-500/50' },
];

export const MOCK_FOLLOWUPS = [
  { id: 301, name: 'Robert Fox', time: '18 mins ago', rep: 'Sarah J.', message: 'Can we do 5PM instead?' },
  { id: 302, name: 'Jenny Wilson', time: '22 mins ago', rep: 'Michael T.', message: 'Does the 2021 model have Apple CarPlay?' },
];

export const MOCK_COMPLETED_SHIFTS = [
  { date: 'Oct 5', hours: '9:00 AM - 8:30 PM (10.5h OT)', status: 'COMPLETE', overtime: true, kpiScore: '100% Daily Goal', note: 'Stayed 2.5h late to cover evening showroom handoffs.' },
  { date: 'Oct 4', hours: '9:00 AM - 6:00 PM (8h)', status: 'COMPLETE', overtime: false, kpiScore: '96% Daily Goal', note: 'Cleared all 15-min SLA alerts and booked 4 appointments.' },
  { date: 'Oct 2', hours: '10:00 AM - 4:00 PM (6h)', status: 'COMPLETE', overtime: false, kpiScore: '92% Daily Goal', note: 'Saturday rotation shift completed.' },
  { date: 'Oct 1', hours: '0h (Missed 9:00 AM - 6:00 PM)', status: 'MISSED', overtime: false, kpiScore: '0% SLA', note: 'Called in at 7:45 AM — unexpected flat tire on commute.' },
];

export const mockIntegrations: type.Integration[] = [
  { id: 'int_1', type: 'Inventory', provider: 'vAuto Feed', value: 'ftp://feed.homenetinc.com/vauto...', status: 'Active' },
  { id: 'int_2', type: 'CRM', provider: 'Elead', value: 'sk_live_***********892a', status: 'Active' },
  { id: 'int_3', type: 'Social', provider: 'Facebook', value: '@PremiumAutoGroup', status: 'Active' },
];

// PLATFORM LEVEL: EVEO Global BDC Agents & Super Admin Account
const BDC_ROSTER_KEY = 'eveo_global_bdc_team_v1';

const DEFAULT_EVEO_GLOBAL_TEAM: type.GlobalUser[] = [
  {
    id: 1,
    name: 'Sofia',
    initials: 'SF',
    role: 'bdc',
    wage: 2800000,
    currency: 'COP',
    schedule: 'Mon - Fri',
    daysOff: 'Sat & Sun',
    pendingRequest: true,
    route: 'Standard ACH',
    assignedStoreIds: ['njx', 'dk', 'kia'],
    liveActivity: 'Lead Pipeline • Calling Gordon Freeman',
  },
  {
    id: 2,
    name: 'Erick',
    initials: 'ER',
    role: 'bdc',
    wage: 2800000,
    currency: 'COP',
    schedule: 'Tue - Sat',
    daysOff: 'Sun & Mon',
    pendingRequest: false,
    route: 'Standard ACH',
    assignedStoreIds: ['njx', 'kia'],
    liveActivity: 'Confirming Tomorrow Appts',
  },
  {
    id: 3,
    name: 'Andres Hernandez',
    initials: 'AH',
    role: 'bdc_manager',
    wage: 4000000,
    currency: 'COP',
    schedule: 'Mon - Sat',
    daysOff: 'Wed & Sun',
    pendingRequest: false,
    route: 'Global Instant (USD → COP)',
    assignedStoreIds: ['njx', 'dk', 'kia'],
    liveActivity: 'Super Admin • Auditing BDC Response SLAs',
  },
  {
    id: 4,
    name: 'Richard Hammond',
    initials: 'RH',
    role: 'owner',
    pendingRequest: false,
    route: 'N/A',
    assignedStoreIds: ['njx'],
    isExecutiveHidden: true,
    liveActivity: 'Store Owner Portal',
  },
];

export const EVEO_GLOBAL_TEAM: type.GlobalUser[] = (() => {
  if (typeof window === 'undefined') return DEFAULT_EVEO_GLOBAL_TEAM;
  try {
    const saved = localStorage.getItem(BDC_ROSTER_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Fallback
  }
  return DEFAULT_EVEO_GLOBAL_TEAM;
})();

export function updateEveoBdcStoreAssignment(agentId: number, storeId: string) {
  const agent = EVEO_GLOBAL_TEAM.find((u) => u.id === agentId);
  if (!agent) return;
  const current = agent.assignedStoreIds || [];
  agent.assignedStoreIds = current.includes(storeId)
    ? current.filter((id) => id !== storeId)
    : [...current, storeId];
  if (typeof window !== 'undefined') {
    localStorage.setItem(BDC_ROSTER_KEY, JSON.stringify(EVEO_GLOBAL_TEAM));
    window.dispatchEvent(new CustomEvent('eveo:bdc-roster-updated'));
  }
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getCalendarStorageKey(storeId: string, agentName: string): string {
  const normalizedAgent = agentName === 'self' || agentName === 'manager_self' ? CURRENT_USER : agentName;
  return `eveo_cal_v3_${storeId}_${normalizedAgent}`;
}

export function getOrSeedAgentCalendar(
  storeId: string,
  agentName: string,
  year = new Date().getFullYear(),
  month = new Date().getMonth()
): Record<string, type.ShiftDayRecord> {
  const key = getCalendarStorageKey(storeId, agentName);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // Proceed to seed
  }

  const seeded: Record<string, type.ShiftDayRecord> = {};
  const today = new Date();
  const TODAY = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const CREATION_DATE = new Date(2026, 9, 1);
  const seed = (agentName.length || 5) + storeId.length;

  for (let i = 1; i <= 31; i++) {
    const dateKey = `${year}-${month}-${i}`;
    const thisDate = new Date(year, month, i);
    if (thisDate < CREATION_DATE) continue;
    const displayDate = `${MONTHS_SHORT[month]} ${i}`;

    if (thisDate.getDay() === 6) {
      seeded[dateKey] = {
        dateKey,
        displayDate,
        status: 'dayoff',
        shiftHours: 'OFF (Regular Weekly Rest)',
        kpiScore: 'Rest Day',
        kpiDetail: 'Scheduled weekly rotation off',
        note: 'Standard Saturday rest day.',
      };
    } else if (thisDate <= TODAY) {
      const isMissed = i === 1 || (i % seed === 0 && i !== 7);
      if (isMissed) {
        seeded[dateKey] = {
          dateKey,
          displayDate,
          status: 'missed',
          shiftHours: '0h (Missed 9:00 AM - 6:00 PM)',
          kpiScore: '0% SLA',
          kpiDetail: 'Shift covered by floor backup',
          note:
            i === 1
              ? 'Called in at 7:45 AM — unexpected flat tire on commute.'
              : 'Documented medical absence — shift reassigned by manager.',
        };
      } else {
        const isOvertime = i === 5 || i === 8;
        const touches = 225 + ((i * 11) % 45);
        const appts = 3 + (i % 4);
        seeded[dateKey] = {
          dateKey,
          displayDate,
          status: 'worked',
          shiftHours: isOvertime ? '9:00 AM - 8:30 PM (10.5h OT)' : '9:00 AM - 6:00 PM (8h)',
          kpiScore: `${Math.min(100, Math.round((touches / 250) * 100))}% Daily Goal`,
          kpiDetail: `${touches} Outbound Touches • ${appts} Appts Confirmed`,
          note: isOvertime
            ? `Stayed 2.5h late to cover evening showroom handoffs for ${storeId.toUpperCase()}.`
            : 'Completed full BDC pipeline and cleared all 15-min SLA alerts.',
          overtime: isOvertime,
        };
      }
    }
  }

  try {
    localStorage.setItem(key, JSON.stringify(seeded));
  } catch {
    // Ignore storage quota errors
  }
  return seeded;
}

export function saveAgentCalendarRecords(
  storeId: string,
  agentName: string,
  records: Record<string, type.ShiftDayRecord>
): void {
  const key = getCalendarStorageKey(storeId, agentName);
  try {
    localStorage.setItem(key, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('eveo:calendar-updated', { detail: { storeId, agentName } }));
  } catch {
    // Ignore storage errors
  }
}

export function getVisibleStoreRoster(storeId: string): Array<type.GlobalUser | type.StoreStaff> {
  const compatibilityStoreId = resolveLegacyStoreDataKey(storeId);
  const localStaff = STORE_DATA[compatibilityStoreId]?.staff ?? [];
  const globalAgentsForStore = EVEO_GLOBAL_TEAM.filter(
    (u) => !u.isExecutiveHidden && (!u.assignedStoreIds || u.assignedStoreIds.includes(storeId) || u.assignedStoreIds.includes(compatibilityStoreId))
  );
  return [...localStaff.filter((s) => !s.isExecutiveHidden), ...globalAgentsForStore];
}
