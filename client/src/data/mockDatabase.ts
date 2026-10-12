import * as type from '../types';
export * from '../types';

export const generateDefaultUser = (role: type.GlobalRole | type.StoreRole, customName?: string): type.UserProfile => {
  const name = customName || `${role.toUpperCase()} Agent 1`;
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return { id: `usr_${Date.now()}`, name, role, initials };
};

export const CURRENT_USER = 'Sarah J.'; 

export const STORES: type.Store[] = [
  { id: 'njx', name: 'NJ Auto Xchange', logoText: 'NJX', logoUrl: '', bannerUrl: '', themeGradient: 'from-[#1e3a8a]/20 to-[#0f172a]/80' },
  { id: 'dk', name: 'DK Auto Imports', logoText: 'DK', logoUrl: '', bannerUrl: '', themeGradient: 'from-[#7f1d1d]/20 to-[#000000]/80' },
  { id: 'kia', name: 'Northstar Kia', logoText: 'KIA', logoUrl: '', bannerUrl: '', themeGradient: 'from-[#374151]/20 to-[#4c0519]/80' }
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

export const mockIntegrations: type.Integration[] = [
  { id: 'int_1', type: 'Inventory', provider: 'vAuto Feed', value: 'ftp://feed.homenetinc.com/vauto...', status: 'Active' },
  { id: 'int_2', type: 'CRM', provider: 'Elead', value: 'sk_live_***********892a', status: 'Active' },
  { id: 'int_3', type: 'Social', provider: 'Facebook', value: '@PremiumAutoGroup', status: 'Active' },
];

// 🌟 PLATFORM LEVEL: EVEO Global Agents & Admins
export const EVEO_GLOBAL_TEAM: type.GlobalUser[] = [
  { id: 1, name: 'Sofia', role: 'bdc', wage: 2800000, currency: 'COP', schedule: 'Mon - Fri', daysOff: 'Sat & Sun', pendingRequest: true, route: 'Standard ACH' },
  { id: 2, name: 'Erick', role: 'bdc', wage: 2800000, currency: 'COP', schedule: 'Tue - Sat', daysOff: 'Sun & Mon', pendingRequest: false, route: 'Standard ACH' },
  { id: 3, name: 'Andres Hernandez', role: 'bdc_manager', wage: 4000000, currency: 'COP', schedule: 'Mon - Sat', daysOff: 'Wed & Sun', pendingRequest: false, route: 'Global Instant (USD → COP)' },
  { id: 4, name: 'Richard Hammond', role: 'owner', pendingRequest: false, route: 'N/A' },
  { id: 5, name: 'EVEO Admin', role: 'super_admin', pendingRequest: false, route: 'N/A' }
];

// 🌟 Export the local store folders
export * from './stores';