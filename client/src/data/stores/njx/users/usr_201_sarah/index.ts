// src/data/stores/njx/users/usr_201_sarah/index.ts
import { userProfile, type ExclusiveUserProfile } from './userProfile';
import { userConfig, type ExclusiveUserConfig } from './userConfig';
import { completedShifts, type UserShiftRecord } from './completedShifts';

export interface UserExclusiveFolder {
  userProfile: ExclusiveUserProfile;
  userConfig: ExclusiveUserConfig;
  completedShifts: UserShiftRecord[];
  aggregatedKpi: {
    calls: number;
    sms: number;
    emails: number;
    contactsMade: number;
    appointmentsBooked: number;
    showroom: number;
    dealsDelivered: number;
  };
}

const latestShift = completedShifts[0] || {
  calls: 0,
  sms: 0,
  emails: 0,
  contactsMade: 0,
  appointmentsBooked: 0,
  showroomUps: 0,
  dealsDelivered: 0,
};

export const usr_201_sarah: UserExclusiveFolder = {
  userProfile,
  userConfig,
  completedShifts,
  aggregatedKpi: {
    calls: latestShift.calls,
    sms: latestShift.sms,
    emails: latestShift.emails,
    contactsMade: latestShift.contactsMade,
    appointmentsBooked: latestShift.appointmentsBooked,
    showroom: latestShift.showroomUps,
    dealsDelivered: completedShifts.reduce((sum, s) => sum + s.dealsDelivered, 0),
  },
};