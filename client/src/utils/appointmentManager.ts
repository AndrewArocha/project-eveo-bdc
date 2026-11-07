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
  name?: string;
}

// 1. Get today's dynamic date string (e.g., "2026-9-12")
export const getTodayDateKey = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
};

// 2. Fetch all appointments for a specific store and date
export const getAppointmentsByDate = (storeId: string, dateKey: string): Appointment[] => {
  const dbKey = `eveo_appointments_${storeId}`;
  const saved = localStorage.getItem(dbKey);

if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed[dateKey] && parsed[dateKey].length > 0) {
        return parsed[dateKey];
      }
    } catch (e) {
      console.error('Failed to parse appointments from localStorage', e);
    }
  }

  // Dynamic Multi-Tenant Fallback: Pull from whichever storeId is active (njx, dk, kia)!
  const storeAppts = STORE_DATA[storeId]?.appointments;
  if (storeAppts && storeAppts.length > 0) {
    return storeAppts.map((appt) => ({
      id: appt.id.toString(),
      time: appt.time,
      customer: appt.customer || appt.name || 'Unknown Customer',
      vehicle: appt.vehicle,
      rep: appt.rep,
      status: (appt.status.toUpperCase() === 'PENDING CONFIRM' ? 'PENDING CONFIRM' : 'CONFIRMED') as ApptStatus,
    }));
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
  const saved = localStorage.getItem(dbKey);
  const db = saved ? JSON.parse(saved) : {};
  db[dateKey] = appointments;
  localStorage.setItem(dbKey, JSON.stringify(db));
  window.dispatchEvent(new Event('appointmentsUpdated'));
};