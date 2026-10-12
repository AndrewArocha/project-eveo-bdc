/** The reason a vehicle is associated with a showroom visit. */
export type VehiclePurpose = 'vehicle_of_interest' | 'trade_in';

/** Normalized vehicle specifications, independent of the NHTSA response shape. */
export interface VehicleSpecifications {
  vin: string;
  modelYear: number | null;
  make: string;
  model: string;
  trim: string | null;
  series: string | null;
  bodyClass: string | null;
  vehicleType: string | null;
  driveType: string | null;
  fuelTypePrimary: string | null;
  engineCylinders: string | null;
  displacementL: string | null;
}

/**
 * Client-side draft attached to a check-in before it is persisted by the API.
 * `purpose` distinguishes the purchase vehicle from the customer's trade-in.
 */
export interface ShowroomVehicleDraft extends VehicleSpecifications {
  purpose: VehiclePurpose;
  source: 'nhtsa-vpic';
  decodedAt: string;
}

/** Persisted vehicle record. IDs and audit fields are assigned by the backend. */
export interface ShowroomVehicleRecord extends ShowroomVehicleDraft {
  id: string;
  storeId: string;
  visitId: string;
  createdAt: string;
  createdByUserId: string;
}

/** Separate slots prevent a trade-in from replacing the vehicle of interest. */
export interface ShowroomVehicleSelection {
  vehicleOfInterest: ShowroomVehicleDraft | null;
  tradeIn: ShowroomVehicleDraft | null;
}

export interface NhtsaVinDecodeResult {
  vehicle: VehicleSpecifications;
  warnings: string[];
}

/** Metadata for a photo/video attached to a showroom event. Binary content is stored separately. */
export interface ShowroomMediaAsset {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'video';
  uploadedAt: string;
}