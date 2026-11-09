import type { NhtsaVinDecodeResult, VehicleSpecifications } from '../types';

const NHTSA_VPIC_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

interface NhtsaFlatVinResult {
  VIN?: string;
  Make?: string;
  Model?: string;
  ModelYear?: string;
  Trim?: string;
  Series?: string;
  BodyClass?: string;
  VehicleType?: string;
  DriveType?: string;
  FuelTypePrimary?: string;
  EngineCylinders?: string;
  DisplacementL?: string;
  ErrorCode?: string;
  ErrorText?: string;
}

interface NhtsaResponse {
  Count?: number;
  Message?: string;
  SearchCriteria?: string;
  Results?: NhtsaFlatVinResult[];
}

export class VinLookupError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'VinLookupError';
    this.status = status;
  }
}

/** Basic US VIN format validation. NHTSA remains authoritative for decoding. */
export function normalizeVin(input: string): string {
  return input.toUpperCase().replace(/\s+/g, '').trim();
}

export function isVinFormatValid(input: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizeVin(input));
}

function nullable(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

/** Decode a full 17-character VIN using the official NHTSA vPIC API. */
export async function decodeVin(
  vinInput: string,
  modelYear?: number,
  signal?: AbortSignal,
): Promise<NhtsaVinDecodeResult> {
  const vin = normalizeVin(vinInput);

  if (!isVinFormatValid(vin)) {
    throw new VinLookupError(
      'Enter a 17-character VIN. The letters I, O, and Q are not permitted.',
    );
  }

  if (
    modelYear !== undefined &&
    (!Number.isInteger(modelYear) || modelYear < 1981 || modelYear > 2100)
  ) {
    throw new VinLookupError('Enter a valid model year or leave it blank.');
  }

  const query = new URLSearchParams({ format: 'json' });
  if (modelYear !== undefined) query.set('modelyear', String(modelYear));

  let response: Response;
  try {
    response = await fetch(
      `${NHTSA_VPIC_BASE}/DecodeVinValuesExtended/${encodeURIComponent(vin)}?${query.toString()}`,
      { method: 'GET', headers: { Accept: 'application/json' }, signal },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new VinLookupError(
      'Could not reach NHTSA. Check your connection and try again.',
    );
  }

  if (!response.ok) {
    throw new VinLookupError(
      `NHTSA VIN lookup failed (HTTP ${response.status}). Please try again later.`,
      response.status,
    );
  }

  let payload: NhtsaResponse;
  try {
    payload = (await response.json()) as NhtsaResponse;
  } catch {
    throw new VinLookupError('NHTSA returned an unreadable response.');
  }

  const result = payload.Results?.[0];
  if (!result) throw new VinLookupError('NHTSA returned no vehicle result.');

  const make = result.Make?.trim() ?? '';
  const model = result.Model?.trim() ?? '';
  const parsedYear = Number.parseInt(result.ModelYear ?? '', 10);
  const normalizedYear = Number.isFinite(parsedYear) ? parsedYear : null;

  // ErrorText can include informational notes even when decoding succeeds.
  const errorText = result.ErrorText?.trim() ?? '';
  const errorCodes = (result.ErrorCode ?? '')
    .split(/[,;]/)
    .map((code) => code.trim())
    .filter(Boolean);
  const hasDecoderWarnings = errorCodes.some((code) => code !== '0');
  const warnings = hasDecoderWarnings && errorText ? [errorText] : [];

  if (!make && !model && normalizedYear === null) {
    throw new VinLookupError(
      errorText || 'NHTSA could not identify this vehicle from the supplied VIN.',
    );
  }

  const vehicle: VehicleSpecifications = {
    vin,
    modelYear: normalizedYear,
    make,
    model,
    trim: nullable(result.Trim),
    series: nullable(result.Series),
    bodyClass: nullable(result.BodyClass),
    vehicleType: nullable(result.VehicleType),
    driveType: nullable(result.DriveType),
    fuelTypePrimary: nullable(result.FuelTypePrimary),
    engineCylinders: nullable(result.EngineCylinders),
    displacementL: nullable(result.DisplacementL),
  };

  return { vehicle, warnings };
}
