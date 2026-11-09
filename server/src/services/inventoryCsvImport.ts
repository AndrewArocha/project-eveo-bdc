import { createHash } from 'crypto';
import { ImportJob } from '../models/ImportJob.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { recordInventoryObservation } from '../repositories/inventoryRepository.js';
import { AppError } from '../utils/AppError.js';

type CsvRow = { rowNumber: number; values: string[] };
type VehicleData = {
  vin: string; stockNumber: string; vehicle: string; make: string; model: string; trim: string;
  modelYear?: number; mileage?: number; price: number; condition: 'NEW' | 'USED' | 'CERTIFIED_PRE_OWNED';
  status: 'READY_FOR_SALE' | 'PENDING' | 'SOLD' | 'DELIVERED';
};
const MAX_ROWS = 500;
const HEADER_MAP: Record<string, string> = {
  vin: 'vin', vehicleidentificationnumber: 'vin', stock: 'stockNumber', stocknumber: 'stockNumber', stockno: 'stockNumber',
  vehicle: 'vehicle', description: 'vehicle', year: 'modelYear', modelyear: 'modelYear', make: 'make', manufacturer: 'make',
  model: 'model', trim: 'trim', mileage: 'mileage', odometer: 'mileage', price: 'price', internetprice: 'price',
  condition: 'condition', status: 'status', inventorystatus: 'status',
};

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS + 1) throw new AppError(400, `CSV imports are limited to ${MAX_ROWS} vehicle rows.`, 'IMPORT_ROW_LIMIT');
    } else cell += char;
  }
  if (quoted) throw new AppError(400, 'The CSV has an unterminated quoted field.', 'INVALID_CSV');
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2) throw new AppError(400, 'The CSV must include a header and at least one vehicle row.', 'EMPTY_IMPORT');
  return rows.map((values, index) => ({ rowNumber: index + 1, values }));
}

function normalizeHeader(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ''); }
function parseNumber(value: string, field: string): number | undefined {
  if (!value.trim()) return undefined;
  const number = Number(value.replace(/[$,\s]/g, ''));
  if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a non-negative number.`);
  return number;
}

function mapVehicle(row: CsvRow, headerIndexes: Map<string, number>): VehicleData {
  const field = (key: string) => row.values[headerIndexes.get(key) ?? -1]?.trim() ?? '';
  const vin = field('vin').toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin)) throw new Error('VIN must contain 11 to 17 valid characters.');
  const make = field('make');
  const model = field('model');
  const trim = field('trim');
  const modelYearValue = parseNumber(field('modelYear'), 'Year');
  if (modelYearValue !== undefined && (!Number.isInteger(modelYearValue) || modelYearValue < 1886 || modelYearValue > 2100)) throw new Error('Year must be between 1886 and 2100.');
  const conditionRaw = field('condition').toLowerCase().replace(/[^a-z]/g, '');
  const condition = conditionRaw.includes('certified') ? 'CERTIFIED_PRE_OWNED' : conditionRaw === 'new' ? 'NEW' : 'USED';
  const statusRaw = field('status').toLowerCase().replace(/[^a-z]/g, '');
  const status = statusRaw.includes('deliver') ? 'DELIVERED' : statusRaw.includes('sold') ? 'SOLD' : statusRaw.includes('pending') || statusRaw.includes('hold') ? 'PENDING' : 'READY_FOR_SALE';
  const vehicle = field('vehicle') || [modelYearValue, make, model, trim].filter(Boolean).join(' ');
  if (vehicle.length < 2) throw new Error('Provide a vehicle description or year, make, and model.');
  const price = parseNumber(field('price'), 'Price') ?? 0;
  const mileage = parseNumber(field('mileage'), 'Mileage');
  return {
    vin, stockNumber: field('stockNumber').slice(0, 40), vehicle: vehicle.slice(0, 180),
    make: make.slice(0, 60), model: model.slice(0, 80), trim: trim.slice(0, 80),
    ...(modelYearValue !== undefined ? { modelYear: modelYearValue } : {}), ...(mileage !== undefined ? { mileage } : {}),
    price, condition, status,
  };
}

export async function importInventoryCsv(input: { storeId: string; fileName: string; csv: string }, dealerAccountId: string, userId: string) {
  const rows = parseCsv(input.csv.replace(/^\uFEFF/, ''));
  const headerIndexes = new Map<string, number>();
  rows[0].values.forEach((header, index) => {
    const key = HEADER_MAP[normalizeHeader(header)];
    if (key && !headerIndexes.has(key)) headerIndexes.set(key, index);
  });
  if (!headerIndexes.has('vin')) throw new AppError(400, 'The CSV needs a VIN column.', 'VIN_COLUMN_REQUIRED');
  const contentHash = createHash('sha256').update(input.storeId).update('\0').update(input.csv).digest('hex');
  let job;
  try {
    job = await ImportJob.create({
      dealerAccountId, storeId: input.storeId, kind: 'inventory_csv', sourceName: input.fileName,
      contentHash, totalRows: rows.length - 1, startedByUserId: userId,
    });
  } catch (error) {
    if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)) throw error;
    const previous = await ImportJob.findOne({ dealerAccountId, storeId: input.storeId, kind: 'inventory_csv', contentHash }).lean();
    if (previous) return { ...previous, id: previous._id.toString(), duplicateUpload: true };
    throw error;
  }

  const seenVins = new Set<string>();
  const rowErrors: Array<{ row: number; message: string }> = [];
  let createdCount = 0;
  let observedCount = 0;
  let errorCount = 0;
  for (const row of rows.slice(1)) {
    try {
      const vehicle = mapVehicle(row, headerIndexes);
      if (seenVins.has(vehicle.vin)) throw new Error('This VIN appears more than once in the uploaded file.');
      seenVins.add(vehicle.vin);
      const existing = await InventoryVehicle.findOne({ dealerAccountId, vin: vehicle.vin }).select('_id storeId').lean();
      if (existing && existing.storeId.toString() !== input.storeId) throw new Error('This VIN is already assigned to another store in the dealership account.');
      if (!existing) {
        await InventoryVehicle.create({ ...vehicle, dealerAccountId, storeId: input.storeId, sourceObservations: [{ source: `CSV import: ${input.fileName}`, observedBy: userId, values: vehicle, observedAt: new Date() }] });
        createdCount += 1;
      } else {
        await recordInventoryObservation(existing._id.toString(), dealerAccountId, userId, {
          source: `CSV import: ${input.fileName}`,
          values: vehicle,
        });
        observedCount += 1;
      }
    } catch (error) {
      errorCount += 1;
      if (rowErrors.length < 100) rowErrors.push({ row: row.rowNumber, message: error instanceof Error ? error.message : 'Row could not be imported.' });
    }
  }
  job.status = errorCount === 0 ? 'completed' : createdCount + observedCount > 0 ? 'completed_with_errors' : 'failed';
  job.createdCount = createdCount;
  job.observedCount = observedCount;
  job.errorCount = errorCount;
  job.set('rowErrors', rowErrors);
  job.completedAt = new Date();
  await job.save();
  return { ...job.toObject(), id: job.id, duplicateUpload: false };
}

export async function listInventoryImportJobs(dealerAccountId: string, storeId: string) {
  return ImportJob.find({ dealerAccountId, storeId, kind: 'inventory_csv' }).sort({ createdAt: -1 }).limit(30).lean();
}
