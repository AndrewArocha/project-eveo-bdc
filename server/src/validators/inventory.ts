import { z } from 'zod';

const storeId = z.string().regex(/^[a-f\d]{24}$/i);
const vin = z.string().trim().min(11).max(17).regex(/^[A-HJ-NPR-Z0-9]+$/i).transform((value) => value.toUpperCase());

export const createInventoryVehicleSchema = z.object({
  storeId,
  vin,
  stockNumber: z.string().trim().max(40).optional(),
  vehicle: z.string().trim().min(2).max(180),
  make: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  trim: z.string().trim().max(80).optional(),
  modelYear: z.number().int().min(1886).max(2100).nullable().optional(),
  mileage: z.number().nonnegative().nullable().optional(),
  price: z.number().nonnegative().default(0),
  condition: z.enum(['NEW', 'USED', 'CERTIFIED_PRE_OWNED']).default('USED'),
  status: z.enum(['READY_FOR_SALE', 'PENDING', 'SOLD', 'DELIVERED']).default('READY_FOR_SALE'),
  photos: z.array(z.url()).max(30).optional(),
});

export const updateInventoryVehicleSchema = createInventoryVehicleSchema
  .omit({ storeId: true, vin: true })
  .partial();

export const recordInventoryObservationSchema = z.object({
  source: z.string().trim().min(1).max(120),
  values: z.object({
    stockNumber: z.string().trim().max(40).optional(),
    vehicle: z.string().trim().min(2).max(180).optional(),
    make: z.string().trim().max(60).optional(),
    model: z.string().trim().max(80).optional(),
    trim: z.string().trim().max(80).optional(),
    modelYear: z.number().int().min(1886).max(2100).nullable().optional(),
    mileage: z.number().nonnegative().nullable().optional(),
    price: z.number().nonnegative().optional(),
    condition: z.enum(['NEW', 'USED', 'CERTIFIED_PRE_OWNED']).optional(),
    status: z.enum(['READY_FOR_SALE', 'PENDING', 'SOLD', 'DELIVERED']).optional(),
  }).refine((values) => Object.keys(values).length > 0, 'Provide at least one observed inventory field.'),
});

export const resolveInventoryDiscrepancySchema = z.object({
  resolution: z.enum(['accepted_source', 'kept_current', 'custom']),
  value: z.union([z.string().max(500), z.number().finite(), z.null()]).optional(),
}).refine((input) => input.resolution !== 'custom' || input.value !== undefined, {
  message: 'A resolved value is required for a custom resolution.',
});
