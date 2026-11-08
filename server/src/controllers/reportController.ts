import type { RequestHandler } from 'express';
import { createStoreKpiSnapshot, calculateStoreKpis, getStoreKpiSnapshot, listStoreKpiSnapshots } from '../repositories/reportRepository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { reportPeriodQuerySchema, reportPeriodSchema } from '../validators/report.js';

function assertReportReader(request: Parameters<RequestHandler>[0]) {
  if (!['owner', 'manager', 'bdc'].includes(request.auth?.role ?? '')) {
    throw new AppError(403, 'Store performance reports are available to owners, managers, and BDC employees.', 'REPORT_ACCESS_DENIED');
  }
}

function assertReportManager(request: Parameters<RequestHandler>[0]) {
  if (!['owner', 'manager'].includes(request.auth?.role ?? '')) {
    throw new AppError(403, 'Store report snapshots are available to owners and managers.', 'REPORT_SNAPSHOT_FORBIDDEN');
  }
}

export const getStoreKpiSummary: RequestHandler = asyncHandler(async (request, response) => {
  assertReportReader(request);
  const parsed = reportPeriodQuerySchema.safeParse(request.query);
  if (!parsed.success) throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(' '), 'VALIDATION_ERROR');
  const now = new Date();
  const period = {
    storeId: parsed.data.storeId,
    startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : now,
  };
  if (period.startAt >= period.endAt || period.endAt.getTime() - period.startAt.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw new AppError(400, 'Choose a valid report period of 366 days or less.', 'INVALID_REPORT_PERIOD');
  }
  const includeEmployeeMetrics = request.auth!.role === 'owner' || request.auth!.role === 'manager';
  response.json({ data: await calculateStoreKpis(request.auth!.dealerAccountId, period, includeEmployeeMetrics) });
});

export const createOwnStoreKpiSnapshot: RequestHandler = asyncHandler(async (request, response) => {
  assertReportManager(request);
  const parsed = reportPeriodSchema.safeParse(request.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(' '), 'VALIDATION_ERROR');
  response.status(201).json({ data: await createStoreKpiSnapshot(request.auth!.dealerAccountId, request.auth!.userId, parsed.data) });
});

export const listOwnStoreKpiSnapshots: RequestHandler = asyncHandler(async (request, response) => {
  assertReportManager(request);
  const parsed = reportPeriodQuerySchema.safeParse(request.query);
  if (!parsed.success) throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(' '), 'VALIDATION_ERROR');
  const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : undefined;
  const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : undefined;
  if (startAt && endAt && (startAt >= endAt || endAt.getTime() - startAt.getTime() > 366 * 24 * 60 * 60 * 1000)) {
    throw new AppError(400, 'Choose a valid report period of 366 days or less.', 'INVALID_REPORT_PERIOD');
  }
  const snapshots = await listStoreKpiSnapshots(request.auth!.dealerAccountId, parsed.data.storeId, startAt, endAt);
  response.json({ data: snapshots.map((snapshot) => ({
    id: snapshot._id.toString(), storeId: snapshot.storeId.toString(), reportType: snapshot.reportType,
    periodStart: snapshot.periodStart, periodEnd: snapshot.periodEnd, storeTimeZone: snapshot.storeTimeZone,
    generatedAt: snapshot.generatedAt, generatedByUserId: snapshot.generatedByUserId.toString(),
    definitionVersion: snapshot.definitionVersion,
  })) });
});

export const getOwnStoreKpiSnapshot: RequestHandler = asyncHandler(async (request, response) => {
  assertReportManager(request);
  const id = request.params.id;
  if (typeof id !== 'string') throw new AppError(404, 'Report snapshot not found.', 'REPORT_SNAPSHOT_NOT_FOUND');
  response.json({ data: await getStoreKpiSnapshot(request.auth!.dealerAccountId, id) });
});
