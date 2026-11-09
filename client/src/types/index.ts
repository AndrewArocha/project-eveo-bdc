// src/types/index.ts

// --- PLATFORM LEVEL (Global EVEO HQ Users) ---
export type GlobalRole = 'bdc' | 'bdc_manager' | 'super_admin' | 'owner';

// --- TENANT LEVEL (Local Store Staff) ---
export type StoreRole = 'manager' | 'sales';

export type UserRole = GlobalRole | StoreRole;

export type DayStatus =
  | 'worked'
  | 'missed'
  | 'timeoff'
  | 'upcoming'
  | 'pending'
  | 'dayoff'
  | 'vacation'
  | 'pending_vacation';

/** Unified record for every calendar day AND the Completed Shifts history list */
export interface ShiftDayRecord {
  dateKey: string;       // e.g. "2026-9-5" (Year-MonthIndex-Day)
  displayDate: string;   // e.g. "Oct 5"
  status: DayStatus;
  batchId?: string;      // Shared ID when multiple days off / vacation are requested together
  shiftHours: string;    // e.g. "9:00 AM - 6:00 PM (8h)"
  kpiScore: string;      // e.g. "96% Daily Goal"
  kpiDetail: string;     // e.g. "240 Outbound Touches • 4 Appts Confirmed"
  note: string;          // Detailed shift log or absence reason
  overtime?: boolean;
}

/** Real-time Google Sheets-style workspace presence indicator */
export interface LivePresenceState {
  userId: string | number;
  name: string;
  initials: string;
  role: UserRole;
  storeId: string;
  module: 'Hub' | 'Live Showroom' | 'Lead Pipeline' | 'Schedule' | 'Reports';
  actionText: string;    // e.g. "Greeting customer in Showroom"
  colorRing: string;     // e.g. "ring-emerald-400 bg-emerald-500"
  lastActive: string;
}

export interface GlobalUser {
  id: string | number;
  name: string;
  initials?: string;
  role: GlobalRole;
   email?: string;
  wage?: number;
  currency?: string;
  schedule?: string;
  daysOff?: string;
  pendingRequest?: boolean;
  route?: string;
  /** Stores this user is assigned to. If length > 1, BDC/Owner can switch stores! */
  assignedStoreIds?: string[];
  /** If true (e.g. Store Owner), hidden from standard agent/manager shift rosters */
  isExecutiveHidden?: boolean;
  liveActivity?: string;
}

export interface StoreStaff {
  id: string | number;
  name: string;
  initials?: string;
  role: StoreRole | 'bdc'; // Supports in-house BDC agents tied to a single store
  email?: string;
  wage?: number;
  currency?: string;
  kpiTarget?: number;
  schedule?: string;
  daysOff?: string;
  pendingRequest?: boolean;
  route?: string;
  assignedStoreIds?: string[];
  isExecutiveHidden?: boolean;
  liveActivity?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: GlobalRole | StoreRole;
  initials: string;
  avatarUrl?: string;
  defaultStoreId?: string;
  assignedStoreIds?: string[];
}

// --- Store & Asset Types ---
export interface Store {
  id: string;
  /** Stable ID from the canonical domain repository or API. */
  domainId?: string;
  /** Legacy demo key used only by Phase 1 fixture adapters. */
  legacyDataKey?: string;
  storeCode?: string;
  dealerAccountId?: string;
  name: string;
  websiteUrl?: string;
  phone?: string;
  logoText: string;
  logo?: string;
  bgImage?: string;
  logoUrl: string;
  bannerUrl: string;
  themeGradient: string;
}

export interface StoreData {
  staff: StoreStaff[];
  leads: Lead[];
  handoffs: Handoff[];
  appointments: Appointment[];
  sold: DealRecord[];
  pending: DealRecord[];
  inventory?: Array<{ vin: string; vehicle: string; daysInStock: number; price: number; status: 'READY_FOR_SALE' | 'PENDING' | 'SOLD' | 'DELIVERED' }>;
  bannerUrl: string;
}

export type IntegrationType = 'CRM' | 'Inventory' | 'Social' | 'Lead Source' | 'Telephony';

export interface Integration {
  id: string;
  type: IntegrationType;
  provider: string;
  value: string;
  status: 'Active' | 'Pending' | 'Error';
}

// --- Operational Types ---
export type ApptStatus = 'CONFIRMED' | 'PENDING CONFIRM' | 'NO SHOW' | 'ARRIVED' | 'SOLD';

export interface Appointment {
  id: string | number;
  time: string;
  customer?: string;
  name?: string;
  vehicle: string;
  rep: string;
  status: ApptStatus | string;
  phone?: string;
  notes?: string;
  leadSource?: string;
}

export interface Lead {
  id: string | number;
  name: string;
  vehicle: string;
  status: string;
  time: string;
  assignee: string;
  notes: string;
}

export interface Handoff {
  id: string | number;
  name: string;
  vehicle: string;
  rep: string;
  waitTime: string;
  status: string;
}

export interface DealRecord {
  id: number | string;
  name: string;
  vehicle: string;
  rep: string;
  stage?: string;
  profit?: string;
  date?: string;
  instagramHandle?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

// --- Settings & Config ---
export interface UserSettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  compactMode: boolean;
  soundEnabled: boolean;
  uiVolume: number;
}

export * from './showroom';
export * from './vehicle';
