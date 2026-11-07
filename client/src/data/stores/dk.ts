import { type StoreData } from '../../types';
import defaultBanner from '../../images/defaultBanner.avif';

export const dkData: StoreData = {
  staff: [
    { id: 301, name: 'Carlos R.', initials: 'CR', role: 'sales', schedule: 'Mon - Fri', daysOff: 'Sat & Sun', kpiTarget: 14, wage: 3100, currency: 'USD', route: 'Standard ACH', assignedStoreIds: ['dk'], liveActivity: 'Showroom • Walk-around Porsche Macan' },
    { id: 302, name: 'valeria M.', initials: 'VM', role: 'bdc', schedule: 'Tue - Sat', daysOff: 'Sun & Mon', kpiTarget: 25, wage: 2600, currency: 'USD', route: 'Standard ACH', assignedStoreIds: ['dk'], liveActivity: 'In-House BDC • Confirming 4PM Appt' },
    { id: 303, name: 'Marcus V.', initials: 'MV', role: 'manager', schedule: 'Mon - Sat', daysOff: 'Sunday', wage: 5200, currency: 'USD', route: 'Standard ACH', assignedStoreIds: ['dk'], liveActivity: 'Appraising Trade-In VIN' }
  ],
  leads: [
    { id: 11, name: 'Julian Casablancas', vehicle: '2022 BMW M340i', status: 'New Lead', time: '4 mins ago', assignee: 'Sofia', notes: 'Asking about out-of-state shipping.' },
    { id: 12, name: 'Hannah Montana', vehicle: '2023 Audi Q5', status: 'Appt Set', time: '35 mins ago', assignee: 'Carlos R.', notes: 'Pre-approved through Capital One.' }
  ],
  handoffs: [
    { id: 111, name: 'Devon Larratt', vehicle: '2021 Mercedes AMG C63', rep: 'Carlos R.', waitTime: '2m', status: 'waiting' }
  ],
  appointments: [
    { id: 211, name: 'Arthur Morgan', vehicle: '2023 Ford Bronco', time: '4:15 PM', rep: 'Carlos R.', status: 'Confirmed', phone: '(555) 234-9988', notes: 'Cash buyer, wants test drive ready.' }
  ],
  sold: [
    { id: 411, name: 'Dutch Plan', vehicle: '2022 Porsche Macan', profit: '$4,200', date: 'Oct 5', rep: 'Carlos R.' }
  ],
  pending: [
    { id: 511, name: 'Sadie Adler', vehicle: '2024 BMW X5', stage: 'Trade Appraisal', rep: 'Carlos R.' }
  ],
  bannerUrl: defaultBanner,
};