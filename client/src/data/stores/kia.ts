import { type StoreData } from '../../types';
import defaultBanner from '../../images/defaultBanner.avif';

export const kiaData: StoreData = {
  staff: [
    { id: 401, name: 'Jason K.', initials: 'JK', role: 'sales', schedule: 'Mon - Fri', daysOff: 'Sat & Sun', kpiTarget: 18, wage: 3400, currency: 'USD', route: 'Standard ACH', assignedStoreIds: ['kia'], liveActivity: 'Delivering 2025 Kia EV9' },
    { id: 402, name: 'Rachel Z.', initials: 'RZ', role: 'sales', schedule: 'Wed - Sun', daysOff: 'Mon & Tue', kpiTarget: 16, wage: 3400, currency: 'USD', route: 'Standard ACH', assignedStoreIds: ['kia'], liveActivity: 'Floor Lobby • Ready for Ups' },
    { id: 403, name: 'Harvey S.', initials: 'HS', role: 'manager', schedule: 'Mon - Fri', daysOff: 'Sat & Sun', wage: 6000, currency: 'USD', route: 'Standard ACH', assignedStoreIds: ['kia'], liveActivity: 'F&I Desk • Closing Deal #421' }
  ],
  leads: [
    { id: 21, name: 'Mike Ross', vehicle: '2025 Kia Telluride SX', status: 'Contacted', time: '8 mins ago', assignee: 'Erick', notes: 'Looking for 3rd row seating family SUV.' },
    { id: 22, name: 'Donna Paulsen', vehicle: '2025 Kia K5 GT', status: 'Appt Set', time: '22 mins ago', assignee: 'Rachel Z.', notes: 'Arriving at 5:30 PM after work.' },
    { id: 23, name: 'Louis Litt', vehicle: '2024 Kia EV9', status: 'New Lead', time: '40 mins ago', assignee: 'Sofia', notes: 'Inquiring about EV lease incentives.' },
    { id: 24, name: 'Jessica Pearson', vehicle: '2025 Kia Sportage Hybrid', status: 'Contacted', time: '1 hour ago', assignee: 'Jason K.', notes: 'Comparing SX Prestige vs EX trim.' }
  ],
  handoffs: [
    { id: 121, name: 'Katrina Bennett', vehicle: '2025 Kia Sportage', rep: 'Rachel Z.', waitTime: '5m', status: 'waiting' },
    { id: 122, name: 'Alex Williams', vehicle: '2024 Kia Sorento', rep: 'Jason K.', waitTime: '2m', status: 'waiting' }
  ],
  appointments: [
    { id: 221, name: 'Robert Zane', vehicle: '2025 Kia EV9 Land', time: '2:00 PM', rep: 'Jason K.', status: 'Pending Confirm', phone: '(555) 876-5432', notes: 'Wants red interior.' },
    { id: 222, name: 'Samantha Wheeler', vehicle: '2025 Kia Carnival', time: '5:00 PM', rep: 'Rachel Z.', status: 'Confirmed', phone: '(555) 334-1122', notes: 'Bringing trade-in.' }
  ],
  sold: [
    { id: 421, name: 'Harold Gunderson', vehicle: '2024 Kia Forte', profit: '$1,850', date: 'Oct 3', rep: 'Rachel Z.' }
  ],
  pending: [
    { id: 521, name: 'Benjamin IT', vehicle: '2025 Kia Niro EV', stage: 'Credit App', rep: 'Jason K.' }
  ],
  bannerUrl: defaultBanner,
};