import { type UserRole, type UserProfile, type Store, type Lead, type Handoff, type Appointment, type KPIItem } from '../types';
export * from '../types';

// --- Default User Generator ---
export const generateDefaultUser = (role: UserRole, customName?: string): UserProfile => {
  const name = customName || `${role.toUpperCase()} Agent 1`;
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return { id: `usr_${Date.now()}`, name, role, initials };
};

export const CURRENT_USER = 'Sarah J.'; // Kept as string for backwards compatibility with your UI

// --- Stores Config ---
export const STORES: Store[] = [
  { id: 'njx', name: 'NJ Auto Xchange', logoText: 'NJX', logoUrl: '', bannerUrl: '', themeGradient: 'from-[#1e3a8a]/20 to-[#0f172a]/80' },
  { id: 'dk', name: 'DK Auto Imports', logoText: 'DK', logoUrl: '', bannerUrl: '', themeGradient: 'from-[#7f1d1d]/20 to-[#000000]/80' },
  { id: 'kia', name: 'Northstar Kia', logoText: 'KIA', logoUrl: '', bannerUrl: '', themeGradient: 'from-[#374151]/20 to-[#4c0519]/80' }
];

// --- Global Shared Stats ---
export const MOCK_AGENT_STATS = [
  { rep: 'Sarah J.', calls: 65, sms: 42, emails: 12, showroom: 5 },
  { rep: 'Erick', calls: 45, sms: 28, emails: 8, showroom: 4 },
  { rep: 'Michael T.', calls: 32, sms: 14, emails: 3, showroom: 3 }
];

export const ALL_REPORTS = [
  { id: 'agent', label: 'Agent KPI', value: '85%', progress: 85, color: 'from-gray-800 to-black', ring: 'border-gray-700' },
  { id: 'lead', label: 'Lead KPI', value: null, color: 'from-gray-800 to-black', ring: 'border-gray-700' },
  { id: 'conv', label: 'Conversion Ratios', value: null, color: 'from-gray-800 to-black', ring: 'border-gray-700' },
  { id: 'sold', label: 'Sold Cars', value: '15/20', progress: 75, color: 'from-orange-950 to-black', ring: 'border-orange-500/50' },
  { id: 'pending', label: 'Pending Deals', value: '8', color: 'from-blue-950 to-black', ring: 'border-blue-500/50' },
];

export const MOCK_FOLLOWUPS = [
  { id: 301, name: 'Robert Fox', time: '18 mins ago', rep: 'Sarah J.', message: 'Can we do 5PM instead?' },
  { id: 302, name: 'Jenny Wilson', time: '22 mins ago', rep: 'Alex M.', message: 'Does the 2021 model have Apple CarPlay?' },
];

export const MOCK_COMPLETED_SHIFTS = [
  { date: 'Oct 5', hours: '9:00 AM - 6:00 PM', status: 'COMPLETE', overtime: true },
  { date: 'Oct 4', hours: '9:00 AM - 6:00 PM', status: 'COMPLETE', overtime: false },
  { date: 'Oct 2', hours: '10:00 AM - 4:00 PM', status: 'COMPLETE', overtime: false },
  { date: 'Oct 1', hours: '9:00 AM - 6:00 PM', status: 'MISSED', overtime: false },
];

export const TEAM_MEMBERS = [
  { name: 'Sarah J.', schedule: 'Sun - Fri', daysOff: 'Off Sat', pendingRequest: true },
  { name: 'Erick', schedule: 'Tue - Sat', daysOff: 'Off Sun & Mon', pendingRequest: false },
  { name: 'Michael T.', schedule: 'Wed - Sun', daysOff: 'Off Mon & Tue', pendingRequest: false },
];

// --- THE NEW STORE-INDEXED DATABASE ---
// We dumped your old flat arrays into the 'njx' store so nothing breaks.
export const STORE_DATA: Record<string, { leads: Lead[]; handoffs: Handoff[]; appointments: Appointment[]; sold: KPIItem[]; pending: KPIItem[]; }> = {
  'njx': {
    leads: [
      { id: 1, name: 'Sarah Connor', vehicle: '2024 Tesla Model 3', status: 'Contacted', time: '10 mins ago', assignee: 'Alex M.', notes: 'Looking to trade in a 2018 Camry.' },
      { id: 2, name: 'John Smith', vehicle: '2021 Ford F-150', status: 'New Lead', time: '15 mins ago', assignee: 'Unassigned', notes: 'Requested internet price.' },
      { id: 3, name: 'Maria Garcia', vehicle: '2023 Honda CR-V', status: 'Appt Set', time: '1 hour ago', assignee: 'Alex M.', notes: 'Coming in tomorrow at 2PM.' },
    ],
    handoffs: [
      { id: 101, name: 'Elena Rostova', vehicle: '2024 Kia Telluride', rep: 'Michael T.', waitTime: '4m', status: 'waiting' }, 
      { id: 102, name: 'Marcus Johnson', vehicle: '2020 Civic Type R', rep: 'Sarah J.', waitTime: '1m', status: 'waiting' },
      { id: 103, name: 'David Kim', vehicle: '2025 Genesis GV80', rep: 'Sarah J.', waitTime: '6m', status: 'waiting' }
    ],
    appointments: [
      { id: 201, name: 'Gordon Freeman', vehicle: '2024 Tesla Model Y', time: '1:00 PM', rep: 'Sarah J.', status: 'Pending Confirm', phone: '(555) 123-4567', notes: 'Needs financing options.' },
      { id: 202, name: 'Alyx Vance', vehicle: '2022 Honda Civic', time: '3:30 PM', rep: 'Michael T.', status: 'Confirmed', phone: '(555) 987-6543', notes: 'First time buyer.' },
    ],
    sold: [
      { id: 401, name: 'Esther Howard', vehicle: '2024 Honda Accord', profit: '$2,400', date: 'Oct 2', rep: 'Sarah J.' },
      { id: 402, name: 'Guy Hawkins', vehicle: '2022 Ford F-150', profit: '$3,100', date: 'Oct 4', rep: 'Michael T.' },
    ],
    pending: [
      { id: 501, name: 'Cody Fisher', vehicle: '2023 Tesla Model Y', stage: 'Financing', rep: 'Sarah J.' },
      { id: 502, name: 'Bessie Cooper', vehicle: '2021 Toyota RAV4', stage: 'Negotiation', rep: 'Sarah J.' },
    ]
  },
  'dk': {
    leads: [], handoffs: [], appointments: [], sold: [], pending: []
  },
  'kia': {
    leads: [], handoffs: [], appointments: [], sold: [], pending: []
  }
};

// --- Backwards Compatibility Exports ---
// Leave these here until we fully update Hub.tsx and Reports.tsx to use STORE_DATA[activeStore]
export const MOCK_LEADS = STORE_DATA['njx'].leads;
export const MOCK_HANDOFFS = STORE_DATA['njx'].handoffs;
export const MOCK_APPTS = STORE_DATA['njx'].appointments;
export const MOCK_SOLD = STORE_DATA['njx'].sold;
export const MOCK_PENDING = STORE_DATA['njx'].pending;