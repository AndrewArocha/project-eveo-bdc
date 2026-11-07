// src/data/stores/njx/users/index.ts
import { type StoreStaff } from '../../../../types';
import { usr_201_sarah, type UserExclusiveFolder } from './usr_201_sarah';

export const usr_202_michael: UserExclusiveFolder = {
  userProfile: {
    id: 'usr_202_michael',
    numericId: 202,
    storeId: 'njx',
    name: 'Michael T.',
    initials: 'MT',
    email: 'michael@njautoxchange.com',
    role: 'sales',
    liveActivity: 'Test Drive • 2024 Kia Telluride',
  },
  userConfig: {
    userId: 'usr_202_michael',
    schedule: 'Tue - Sat',
    daysOff: 'Sun & Mon',
    kpiTarget: 12,
    dailyCallKpiTarget: 100,
    avgMinutesPerCallCycle: 5,
    wage: 3000,
    currency: 'USD',
    route: 'Standard ACH',
    assignedStoreIds: ['njx'],
    active: true,
  },
  completedShifts: [
    {
      date: 'Oct 27',
      hours: '9:00 AM - 6:00 PM (8h)',
      status: 'COMPLETE',
      overtime: false,
      kpiScore: '92% Daily Goal',
      calls: 32,
      sms: 14,
      emails: 3,
      contactsMade: 6,
      appointmentsBooked: 1,
      showroomUps: 3,
      dealsDelivered: 0,
      note: 'Completed afternoon test drives and follow-up calls.',
    },
  ],
  aggregatedKpi: {
    calls: 32,
    sms: 14,
    emails: 3,
    contactsMade: 6,
    appointmentsBooked: 1,
    showroom: 3,
    dealsDelivered: 1,
  },
};

export const usr_203_anthony: UserExclusiveFolder = {
  userProfile: {
    id: 'usr_203_anthony',
    numericId: 203,
    storeId: 'njx',
    name: 'Anthony G.',
    initials: 'AG',
    email: 'anthony@njautoxchange.com',
    role: 'manager',
    liveActivity: 'Desk • Reviewing SLA Metrics',
  },
  userConfig: {
    userId: 'usr_203_anthony',
    schedule: 'Mon - Sat',
    daysOff: 'Sunday',
    kpiTarget: 20,
    dailyCallKpiTarget: 100,
    avgMinutesPerCallCycle: 5,
    wage: 5500,
    currency: 'USD',
    route: 'Standard ACH',
    assignedStoreIds: ['njx'],
    active: true,
  },
  completedShifts: [
    {
      date: 'Oct 27',
      hours: '9:00 AM - 6:00 PM (8h)',
      status: 'COMPLETE',
      overtime: false,
      kpiScore: '100% Floor SLA',
      calls: 18,
      sms: 11,
      emails: 6,
      contactsMade: 5,
      appointmentsBooked: 0,
      showroomUps: 4,
      dealsDelivered: 0,
      note: 'Desk management and TO closes.',
    },
  ],
  aggregatedKpi: {
    calls: 18,
    sms: 11,
    emails: 6,
    contactsMade: 5,
    appointmentsBooked: 0,
    showroom: 4,
    dealsDelivered: 0,
  },
};

export const NJX_USERS_DIRECTORY: Record<string, UserExclusiveFolder> = {
  usr_201_sarah,
  usr_202_michael,
  usr_203_anthony,
};

export function getNjxUserById(userId: string): UserExclusiveFolder | undefined {
  return NJX_USERS_DIRECTORY[userId];
}

export const njxStaffList: StoreStaff[] = Object.values(NJX_USERS_DIRECTORY).map((u) => ({
  id: u.userProfile.numericId,
  name: u.userProfile.name,
  initials: u.userProfile.initials,
  role: u.userProfile.role,
  schedule: u.userConfig.schedule,
  daysOff: u.userConfig.daysOff,
  kpiTarget: u.userConfig.kpiTarget,
  wage: u.userConfig.wage,
  currency: u.userConfig.currency,
  route: u.userConfig.route,
  assignedStoreIds: u.userConfig.assignedStoreIds,
  liveActivity: u.userProfile.liveActivity,
}));