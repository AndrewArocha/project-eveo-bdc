import { type StoreData } from '../../types';

export const njxData: StoreData = {
    // 🌟 LOCAL DEALERSHIP STAFF (Sales Floor & GMs)
    staff: [
        { id: 201, name: 'Sarah J.', role: 'sales', schedule: 'Mon-Fri 9AM-6PM', kpiTarget: 15 },
        { id: 202, name: 'Michael T.', role: 'sales', schedule: 'Tue-Sat 10AM-7PM', kpiTarget: 12 },
        { id: 203, name: 'David G.', role: 'manager', schedule: 'Mon-Sat 8AM-5PM' }
    ],
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
        { id: 501, name: 'Cody Fisher', vehicle: '2023 Tesla Model Y', stage: 'Financing', rep: 'Sarah J.', socials: { instagram: '@cody.fish', whatsapp: '+1 555-0192' } },
        { id: 502, name: 'Bessie Cooper', vehicle: '2021 Toyota RAV4', stage: 'Negotiation', rep: 'Sarah J.' },
    ],
    bannerUrl:
        "https://di-uploads-pod47.dealerinspire.com/njautoxchange/uploads/2025/10/option1-desktop.jpg",
};