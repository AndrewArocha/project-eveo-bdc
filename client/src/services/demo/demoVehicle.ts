import type { ShowroomVehicleDraft, VehiclePurpose } from '../../types/vehicle';
import { getStoreInventory } from '../inventory/storeInventorySync';

export const demoVehicles = {
  vehicle_of_interest: [
    { label: '2024 Kia Telluride SX', vin: '5XYP5DGC0RG412890' },
    { label: '2023 Honda Civic Type R', vin: 'JHMFL5G40PX000412' },
    { label: '2024 Ford F-150 Lariat', vin: '1FTFW1E84RFA10294' },
  ],
  trade_in: [
    { label: '2020 Honda Accord Sport', vin: '1HGCV1F34LA012845' },
    { label: '2021 Toyota RAV4 XLE', vin: '2T3P1RFV8MW148290' },
  ],
};

export function lookupDemoVehicle(storeId: string, vin: string, purpose: VehiclePurpose): ShowroomVehicleDraft | null {
  const label = demoVehicles[purpose].find((vehicle) => vehicle.vin === vin)?.label
    ?? getStoreInventory(storeId).units.find((vehicle) => vehicle.vin === vin)?.vehicle;
  if (!label) return null;
  const parts = label.trim().split(/\s+/);
  const modelYear = /^\d{4}$/.test(parts[0]) ? Number(parts.shift()) : null;
  const [make = '', ...model] = parts;
  return {
    vin, modelYear, make, model: model.join(' '), purpose, source: 'demo', decodedAt: new Date().toISOString(),
    trim: null, series: null, bodyClass: null, vehicleType: null, driveType: null, fuelTypePrimary: null,
    engineCylinders: null, displacementL: null,
  };
}
