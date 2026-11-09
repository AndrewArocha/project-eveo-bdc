import type { Request, RequestHandler } from 'express';
import { importInventoryCsv, listInventoryImportJobs } from '../services/inventoryCsvImport.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function assertInventoryManager(request: Request) {
  if (!['owner', 'manager'].includes(request.auth?.role ?? '')) {
    throw new AppError(403, 'Only owners and managers can import inventory.', 'INVENTORY_IMPORT_FORBIDDEN');
  }
}

function safeJob(job: Record<string, unknown>) {
  const id = job.id ?? (job._id && typeof job._id === 'object' && 'toString' in job._id ? job._id.toString() : '');
  return {
    id, storeId: job.storeId, kind: job.kind, sourceName: job.sourceName, status: job.status,
    totalRows: job.totalRows, createdCount: job.createdCount, observedCount: job.observedCount,
    errorCount: job.errorCount, rowErrors: job.rowErrors, startedAt: job.startedAt, completedAt: job.completedAt,
    duplicateUpload: job.duplicateUpload ?? false,
  };
}

export const createOwnInventoryImport: RequestHandler = asyncHandler(async (request, response) => {
  assertInventoryManager(request);
  const result = await importInventoryCsv(request.body, request.auth!.dealerAccountId, request.auth!.userId);
  response.status(result.duplicateUpload ? 200 : 201).json({ data: safeJob(result as unknown as Record<string, unknown>) });
});

export const listOwnInventoryImports: RequestHandler = asyncHandler(async (request, response) => {
  assertInventoryManager(request);
  const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
  if (!storeId) throw new AppError(400, 'A storeId query parameter is required.', 'STORE_REQUIRED');
  const jobs = await listInventoryImportJobs(request.auth!.dealerAccountId, storeId);
  response.json({ data: jobs.map((job) => safeJob(job as unknown as Record<string, unknown>)) });
});
