// --- PLATFORM LEVEL (Global EVEO HQ Users) ---
export type GlobalRole = 'bdc' | 'bdc_manager' | 'super_admin' | 'owner';

export interface GlobalUser {
  id: string | number;
  name: string;
  role: GlobalRole;
  wage?: number;
  currency?: string;
  schedule?: string;
  daysOff?: string;
  pendingRequest?: boolean;
  route?: string;
}

export type UserRole = GlobalRole | StoreRole;

export interface UserProfile {
  id: string;
  name: string;
  role: GlobalRole | StoreRole; // Can be either depending on who logs in
  initials: string;
  avatarUrl?: string;
  defaultStoreId?: string;
}

// --- TENANT LEVEL (Local Store Staff) ---
export type StoreRole = 'manager' | 'sales';

export interface StoreStaff {
  id: string | number;
  name: string;
  role: StoreRole;
  kpiTarget?: number;
  schedule?: string;
}

// --- Store & Asset Types ---
export interface Store {
  id: string;
  name: string;
  logoText: string;
  logo?: string;
  bgImage?: string;
  logoUrl: string;
  bannerUrl: string;
  themeGradient: string;
}

export interface StoreData {
  staff: StoreStaff[];     // 🌟 NEW: Local sales agents and GMs
  leads: Lead[];
  handoffs: Handoff[];
  appointments: Appointment[];
  sold: DealRecord[];
  pending: DealRecord[];
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

// 🌟 Re-export everything from your new split type files!
export * from './showroom';
export * from './vehicle';