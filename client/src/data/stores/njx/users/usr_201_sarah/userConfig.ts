    // src/data/stores/njx/users/usr_201_sarah/userConfig.ts
export interface ExclusiveUserConfig {
  userId: string;
  schedule: string;
  daysOff: string;
  kpiTarget: number;
  dailyCallKpiTarget: number;
  avgMinutesPerCallCycle: number;
  wage: number;
  currency: 'USD' | 'COP';
  route: string;
  assignedStoreIds: string[];
  active: boolean;
}

export const userConfig: ExclusiveUserConfig = {
  userId: 'usr_201_sarah',
  schedule: 'Mon - Fri',
  daysOff: 'Sat & Sun',
  kpiTarget: 15,
  dailyCallKpiTarget: 100,
  avgMinutesPerCallCycle: 5,
  wage: 3200,
  currency: 'USD',
  route: 'Standard ACH',
  assignedStoreIds: ['njx'],
  active: true,
};