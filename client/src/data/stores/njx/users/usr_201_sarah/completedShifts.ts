// src/data/stores/njx/users/usr_201_sarah/completedShifts.ts
export interface UserShiftRecord {
  date: string;
  hours: string;
  status: 'COMPLETE' | 'MISSED' | 'REST' | 'TIMEOFF';
  overtime: boolean;
  kpiScore: string;
  calls: number;
  sms: number;
  emails: number;
  contactsMade: number;
  appointmentsBooked: number;
  showroomUps: number;
  dealsDelivered: number;
  note: string;
}

export const completedShifts: UserShiftRecord[] = [
  {
    date: 'Oct 27',
    hours: '9:00 AM - 6:00 PM (8h)',
    status: 'COMPLETE',
    overtime: false,
    kpiScore: '96% Daily Goal',
    calls: 65,
    sms: 42,
    emails: 12,
    contactsMade: 12,
    appointmentsBooked: 2,
    showroomUps: 5,
    dealsDelivered: 0,
    note: 'Handled morning internet leads and showroom handoffs.',
  },
  {
    date: 'Oct 26',
    hours: '9:00 AM - 8:30 PM (10.5h OT)',
    status: 'COMPLETE',
    overtime: true,
    kpiScore: '100% Daily Goal',
    calls: 78,
    sms: 49,
    emails: 18,
    contactsMade: 14,
    appointmentsBooked: 3,
    showroomUps: 4,
    dealsDelivered: 1,
    note: 'Stayed 2.5h late to cover evening showroom handoffs.',
  },
];