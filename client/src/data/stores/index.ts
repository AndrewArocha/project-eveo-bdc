import { type StoreData } from '../../types';
import { dkData } from './dk';
import { njxData } from './njx';
import { kiaData } from './kia';

export const STORE_DATA: Record<string, StoreData> = {
  'njx': njxData,
  'dk': dkData,
  'kia': kiaData,
};

// --- Backwards Compatibility Exports ---
// Your existing UI components will pull perfectly from these without breaking
export const MOCK_LEADS = STORE_DATA['njx'].leads;
export const MOCK_HANDOFFS = STORE_DATA['njx'].handoffs;
export const MOCK_APPTS = STORE_DATA['njx'].appointments;
export const MOCK_SOLD = STORE_DATA['njx'].sold;
export const MOCK_PENDING = STORE_DATA['njx'].pending;
export const MOCK_AGENT_STATS = [
  { rep: 'Sarah J.', calls: 65, sms: 42, emails: 12, showroom: 5 },
  { rep: 'Erick', calls: 45, sms: 28, emails: 8, showroom: 4 },
  { rep: 'Michael T.', calls: 32, sms: 14, emails: 3, showroom: 3 }
];
