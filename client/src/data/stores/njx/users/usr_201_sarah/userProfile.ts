import { type StoreStaff } from "../../../../mainDatabase";

// src/data/stores/njx/users/usr_201_sarah/userProfile.ts
export interface ExclusiveUserProfile {
  id: string;
  numericId: number;
  storeId: string;
  name: string;
  initials: string;
  email: string;
  role: StoreStaff['role'];
  liveActivity: string;
  isExecutiveHidden?: boolean;
}

export const userProfile: ExclusiveUserProfile = {
  id: 'usr_201_sarah',
  numericId: 201,
  storeId: 'njx',
  name: 'Sarah J.',
  initials: 'SJ',
  email: 'sarah@example.test',
  role: 'sales',
  liveActivity: 'Showroom • With Marcus Johnson',
};
