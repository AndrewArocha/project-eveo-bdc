import { Types } from 'mongoose';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { Appointment } from '../models/Appointment.js';
import { Lead } from '../models/Lead.js';
import { ReportSnapshot } from '../models/ReportSnapshot.js';
import { ShowroomVisit } from '../models/ShowroomVisit.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const KPI_DEFINITION_VERSION = 1;
const SOURCE_LIMIT = 100;

type ReportPeriod = { storeId: string; startAt: Date; endAt: Date };
type SourceRecord = { id: string; label: string; occurredAt: Date; status?: string };
type Metric = {
  key: string;
  label: string;
  unit: 'count' | 'percentage';
  value: number | null;
  numerator?: number;
  denominator?: number;
  formula: string;
  measurementNote: string;
  sourceCount: number;
  sourceRecords: SourceRecord[];
  sourcesTruncated: boolean;
};
type EmployeeMetric = {
  userId: string;
  name: string;
  role: string;
  assignedLeads: number;
  assignedAppointments: number;
  activitiesLogged: number;
};

export interface StoreKpiSummary {
  reportType: 'store_kpi';
  definitionVersion: number;
  storeId: string;
  storeTimeZone: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  metrics: Metric[];
  employeeMetrics?: EmployeeMetric[];
}

function sourceRecords<T extends { _id: Types.ObjectId; createdAt: Date; status?: string }>(
  records: T[],
  label: (record: T) => string,
): SourceRecord[] {
  return records.map((record) => ({
    id: record._id.toString(),
    label: label(record),
    occurredAt: record.createdAt,
    ...(record.status ? { status: record.status } : {}),
  }));
}

function countMetric(key: string, label: string, formula: string, measurementNote: string, count: number, records: SourceRecord[]): Metric {
  return {
    key, label, unit: 'count', value: count, formula, measurementNote,
    sourceCount: count, sourceRecords: records, sourcesTruncated: count > records.length,
  };
}

export async function calculateStoreKpis(dealerAccountId: string, period: ReportPeriod, includeEmployeeMetrics = false): Promise<StoreKpiSummary> {
  if (!Types.ObjectId.isValid(period.storeId)) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  const store = await Store.findOne({ _id: period.storeId, dealerAccountId, active: true }).select('timezone').lean();
  if (!store) throw new AppError(404, 'Store not found.', 'STORE_NOT_FOUND');
  let storeTimeZone = store.timezone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: storeTimeZone }).format();
  } catch {
    storeTimeZone = 'UTC';
  }

  const range = { $gte: period.startAt, $lt: period.endAt };
  const appointmentEligible = ['arrived', 'showed', 'sold', 'no_show'];
  const appointmentShown = ['arrived', 'showed', 'sold'];
  const [leadCount, leads, appointmentCount, appointmentsCreated, eligibleAppointmentCount, shownAppointmentCount, eligibleAppointments, showroomCount, showrooms, activityCount, activity] = await Promise.all([
    Lead.countDocuments({ dealerAccountId, storeId: period.storeId, createdAt: range }),
    Lead.find({ dealerAccountId, storeId: period.storeId, createdAt: range }).select('_id customerNameSnapshot createdAt status').sort({ createdAt: -1 }).limit(SOURCE_LIMIT).lean(),
    Appointment.countDocuments({ dealerAccountId, storeId: period.storeId, createdAt: range }),
    Appointment.find({ dealerAccountId, storeId: period.storeId, createdAt: range }).select('_id customerNameSnapshot createdAt status').sort({ createdAt: -1 }).limit(SOURCE_LIMIT).lean(),
    Appointment.countDocuments({ dealerAccountId, storeId: period.storeId, scheduledAt: range, status: { $in: appointmentEligible } }),
    Appointment.countDocuments({ dealerAccountId, storeId: period.storeId, scheduledAt: range, status: { $in: appointmentShown } }),
    Appointment.find({ dealerAccountId, storeId: period.storeId, scheduledAt: range, status: { $in: appointmentEligible } }).select('_id customerNameSnapshot scheduledAt status').sort({ scheduledAt: -1 }).limit(SOURCE_LIMIT).lean(),
    ShowroomVisit.countDocuments({ dealerAccountId, storeId: period.storeId, createdAt: range }),
    ShowroomVisit.find({ dealerAccountId, storeId: period.storeId, createdAt: range }).select('_id customerNameSnapshot createdAt status').sort({ createdAt: -1 }).limit(SOURCE_LIMIT).lean(),
    ActivityEvent.countDocuments({ dealerAccountId, storeId: period.storeId, occurredAt: range }),
    ActivityEvent.find({ dealerAccountId, storeId: period.storeId, occurredAt: range }).select('_id title occurredAt category').sort({ occurredAt: -1 }).limit(SOURCE_LIMIT).lean(),
  ]);

  const appointmentRateRecords: SourceRecord[] = eligibleAppointments.map((record) => ({
    id: record._id.toString(), label: record.customerNameSnapshot, occurredAt: record.scheduledAt!, status: record.status,
  }));
  const activityRecords: SourceRecord[] = activity.map((event) => ({
    id: event._id.toString(), label: event.title, occurredAt: event.occurredAt,
  }));
  const metrics: Metric[] = [
    countMetric('leads_created', 'Leads created', 'Count of lead records created during the selected period.', 'Lead creation time is used; current lead status is not treated as a historical conversion event.', leadCount, sourceRecords(leads, (lead) => lead.customerNameSnapshot)),
    countMetric('appointments_created', 'Appointments created', 'Count of appointment records created during the selected period.', 'Appointment creation time is used; this does not measure appointments scheduled within the period.', appointmentCount, sourceRecords(appointmentsCreated, (appointment) => appointment.customerNameSnapshot)),
    {
      key: 'appointment_show_rate', label: 'Appointment show rate', unit: 'percentage',
      value: eligibleAppointmentCount === 0 ? null : Math.round((shownAppointmentCount / eligibleAppointmentCount) * 1000) / 10,
      numerator: shownAppointmentCount, denominator: eligibleAppointmentCount,
      formula: 'Arrived, showed, or sold appointments ÷ (arrived, showed, sold, or no-show appointments) × 100.',
      measurementNote: 'Appointments are grouped by scheduled time. Pending and cancelled appointments are excluded; status is current when this report is generated.',
      sourceCount: eligibleAppointmentCount, sourceRecords: appointmentRateRecords,
      sourcesTruncated: eligibleAppointmentCount > appointmentRateRecords.length,
    },
    countMetric('showroom_visits_created', 'Showroom visits', 'Count of showroom visits created during the selected period.', 'Visit creation time is used; a visit may still be active or may later be completed.', showroomCount, sourceRecords(showrooms, (visit) => visit.customerNameSnapshot)),
    countMetric('operational_activity', 'Recorded activities', 'Count of activity events recorded during the selected period.', 'Includes operational events currently captured by EVEO; external calls, SMS, and email are not yet ingested.', activityCount, activityRecords),
  ];

  let employeeMetrics: EmployeeMetric[] | undefined;
  if (includeEmployeeMetrics) {
    const accountObjectId = new Types.ObjectId(dealerAccountId);
    const storeObjectId = new Types.ObjectId(period.storeId);
    const [employees, leadAssignments, appointmentAssignments, activitiesByActor] = await Promise.all([
      User.find({ dealerAccountId, active: true, role: { $ne: 'owner' }, storeIds: period.storeId }).select('_id name role').sort({ name: 1 }).lean(),
      Lead.aggregate([
        { $match: { dealerAccountId: accountObjectId, storeId: storeObjectId, createdAt: range, assignedStoreUserId: { $ne: null } } },
        { $group: { _id: '$assignedStoreUserId', count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        { $match: { dealerAccountId: accountObjectId, storeId: storeObjectId, createdAt: range, assignedStoreUserId: { $ne: null } } },
        { $group: { _id: '$assignedStoreUserId', count: { $sum: 1 } } },
      ]),
      ActivityEvent.aggregate([
        { $match: { dealerAccountId: accountObjectId, storeId: storeObjectId, occurredAt: range } },
        { $group: { _id: '$actorUserId', count: { $sum: 1 } } },
      ]),
    ]);
    const countsById = (rows: Array<{ _id: Types.ObjectId; count: number }>) => new Map(rows.map((row) => [row._id.toString(), row.count]));
    const leadsByUser = countsById(leadAssignments);
    const appointmentsByUser = countsById(appointmentAssignments);
    const activitiesByUser = countsById(activitiesByActor);
    employeeMetrics = employees.map((employee) => ({
      userId: employee._id.toString(), name: employee.name, role: employee.role,
      assignedLeads: leadsByUser.get(employee._id.toString()) ?? 0,
      assignedAppointments: appointmentsByUser.get(employee._id.toString()) ?? 0,
      activitiesLogged: activitiesByUser.get(employee._id.toString()) ?? 0,
    }));
  }

  return {
    reportType: 'store_kpi', definitionVersion: KPI_DEFINITION_VERSION,
    storeId: period.storeId, storeTimeZone,
    periodStart: period.startAt.toISOString(), periodEnd: period.endAt.toISOString(),
    generatedAt: new Date().toISOString(), metrics,
    ...(employeeMetrics ? { employeeMetrics } : {}),
  };
}

export async function createStoreKpiSnapshot(dealerAccountId: string, userId: string, period: ReportPeriod) {
  const summary = await calculateStoreKpis(dealerAccountId, period, true);
  const snapshot = await ReportSnapshot.create({
    dealerAccountId, storeId: period.storeId, reportType: summary.reportType,
    periodStart: period.startAt, periodEnd: period.endAt, storeTimeZone: summary.storeTimeZone,
    generatedAt: summary.generatedAt, generatedByUserId: userId,
    definitionVersion: summary.definitionVersion, payload: summary,
  });
  return { id: snapshot.id, generatedByUserId: userId, ...summary };
}

export async function listStoreKpiSnapshots(dealerAccountId: string, storeId: string, startAt?: Date, endAt?: Date) {
  const filter: Record<string, unknown> = { dealerAccountId, storeId, reportType: 'store_kpi' };
  if (startAt || endAt) {
    filter.periodStart = {
      ...(startAt ? { $gte: startAt } : {}),
      ...(endAt ? { $lt: endAt } : {}),
    };
  }
  return ReportSnapshot.find(filter).sort({ generatedAt: -1 }).limit(50)
    .select('_id storeId reportType periodStart periodEnd storeTimeZone generatedAt generatedByUserId definitionVersion').lean();
}

export async function getStoreKpiSnapshot(dealerAccountId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Report snapshot not found.', 'REPORT_SNAPSHOT_NOT_FOUND');
  const snapshot = await ReportSnapshot.findOne({ _id: id, dealerAccountId }).lean();
  if (!snapshot) throw new AppError(404, 'Report snapshot not found.', 'REPORT_SNAPSHOT_NOT_FOUND');
  return {
    id: snapshot._id.toString(), storeId: snapshot.storeId.toString(), reportType: snapshot.reportType,
    periodStart: snapshot.periodStart, periodEnd: snapshot.periodEnd, storeTimeZone: snapshot.storeTimeZone,
    generatedAt: snapshot.generatedAt, generatedByUserId: snapshot.generatedByUserId.toString(),
    definitionVersion: snapshot.definitionVersion, payload: snapshot.payload,
  };
}
