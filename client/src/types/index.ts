// Role & Auth Types
export type UserRole = 'bdc' | 'sales' | 'manager';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  avatarUrl?: string;
  defaultStoreId?: string;
}

// Store & Asset Types
export interface Store {
  id: string;
  name: string;
  logoText: string;
  logo?: string;
  bgImage?: string;
  logoUrl: string;       // Dynamic fetch ready
  bannerUrl: string;     // Dynamic fetch ready
  themeGradient: string;
}

// Operational Types
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

export interface KPIItem {
  id: number | string;
  name: string;
  vehicle: string;
  rep?: string;
  profit?: string;
  date?: string;
  stage?: string;
}

// Settings & Config
export interface UserSettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  compactMode: boolean;
  soundEnabled: boolean;
  uiVolume: number;
}