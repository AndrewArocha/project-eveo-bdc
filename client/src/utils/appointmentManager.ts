// src/utils/appointmentManager.ts
import { STORE_DATA } from '../data/mockDatabase';

type ApptStatus = 'CONFIRMED' | 'PENDING CONFIRM' | 'NO SHOW' | 'ARRIVED' | 'SOLD';

export interface Appointment {
  id: string;
  time: string;
  customer: string;
  vehicle: string;
  rep: string;
  status: ApptStatus;
}

// 1. Get today's dynamic date string (e.g., "2026-9-12")
export const getTodayDateKey = (): string => {
  const today = new Date();
  // Using getMonth() which is 0-indexed, so we add 1, but for consistency with your 
  // earlier code that used 9 for October, we'll keep it 0-indexed:
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
};

// 2. Fetch all appointments for a specific store and date
export const getAppointmentsByDate = (storeId: string, dateKey: string): Appointment[] => {
  const dbKey = `eveo_appointments_${storeId}`;
  const savedDb = localStorage.getItem(dbKey);
  
  if (savedDb) {
    const db = JSON.parse(savedDb);
    if (db[dateKey]) {
       return db[dateKey];
    }
  }

  // Fallback: If no localStorage data exists, pull the static data from njx.ts so the UI isn't empty
  if (storeId === 'njx' && STORE_DATA['njx'] && STORE_DATA['njx'].appointments) {
     const fallbackAppts = STORE_DATA['njx'].appointments.map((appt) => ({
        id: appt.id.toString(),
        time: appt.time,
        customer: appt.name || 'Unknown',
        vehicle: appt.vehicle,
        rep: appt.rep,
        status: (appt.status.toUpperCase() === 'PENDING CONFIRM' ? 'PENDING CONFIRM' : 'CONFIRMED') as ApptStatus
     }));
     
     return fallbackAppts;
  }

  return [];
};

// 3. Helper to get only the upcoming/pending appointments for a store today
export const getNextAppointment = (storeId: string): Appointment | null => {
  const todayKey = getTodayDateKey();
  const todaysAppts = getAppointmentsByDate(storeId, todayKey);
  
  const validAppts = todaysAppts.filter(a => 
    a.status === 'CONFIRMED' || a.status === 'PENDING CONFIRM'
  );

  return validAppts.length > 0 ? validAppts[0] : null;
};

// 4. Handler to update new appointment created

export const saveAppointments = (storeId: string, dateKey: string, appointments: Appointment[]) => {
  const dbKey = `eveo_appointments_${storeId}`;
  const savedDb = localStorage.getItem(dbKey);
  const db = savedDb ? JSON.parse(savedDb) : {};
  
  db[dateKey] = appointments;
  localStorage.setItem(dbKey, JSON.stringify(db));
  
  // Instantly trigger UI updates across the app!
  window.dispatchEvent(new Event('appointmentsUpdated'));
};