# EVEO dual-vehicle NHTSA VIN lookup

This drop-in slice adds a typed NHTSA vPIC VIN decoder and two independent UI fields: vehicle of interest and optional customer trade-in.

## Files

- `client/src/types/vehicle.ts`: canonical vehicle and showroom vehicle-selection types.
- `client/src/services/vehicleLookup/nhtsaVinService.ts`: async NHTSA service with VIN validation, response normalization, errors, and abort support.
- `client/src/components/showroom/VehicleVinLookupField.tsx`: single reusable VIN field; each instance owns its request/loading/error state.
- `client/src/components/showroom/ShowroomVehicleDetails.tsx`: renders the two distinct fields and returns separate records to its parent.

## Connect to the project's centralized type entry point

In `client/src/types/index.ts`, add:

```ts
export * from './vehicle';
```

Do not duplicate the types if equivalent canonical types already exist; merge these definitions into the existing domain model instead.

## Mount in the Live Showroom check-in form

```tsx
import { useState } from 'react';
import type { ShowroomVehicleSelection } from '../../types';
import ShowroomVehicleDetails from '../../components/showroom/ShowroomVehicleDetails';

const [vehicles, setVehicles] = useState<ShowroomVehicleSelection>({
  vehicleOfInterest: null,
  tradeIn: null,
});

// In the form JSX:
<ShowroomVehicleDetails value={vehicles} onChange={setVehicles} />

// Include `vehicles.vehicleOfInterest` and `vehicles.tradeIn` in the
// check-in command sent to your repository/service when the user submits.
```

The component is deliberately controlled by the parent, so the check-in form owns the selected records and can submit them through your async mock service now and HTTP service later. Do not write to `STORE_DATA` directly from the component.

## Persisted model guidance

When a showroom visit is created, persist the two slots separately:

- `vehicleOfInterest: ShowroomVehicleDraft | null`
- `tradeIn: ShowroomVehicleDraft | null`

The API/repository should create persisted `ShowroomVehicleRecord` IDs and audit fields (`storeId`, `visitId`, `createdByUserId`, `createdAt`) when saving. For an absent trade-in, persist `null`, not a copy of the primary vehicle.

## NHTSA source

Endpoint: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/{VIN}?format=json`

`modelyear` is added as an optional query parameter when the user provides one. This implementation calls NHTSA from the browser for the current mock/demo app. Before production, prefer calling NHTSA through your backend adapter so you can centrally control timeouts, rate limits, audit behavior, and fallback handling. NHTSA may rate-limit requests. The decoder's response represents manufacturer-reported vehicle data; it is not ownership, title, accident-history, or inventory verification.

## Validation / local checks

After copying the files:

1. Add the type barrel export.
2. Mount `ShowroomVehicleDetails` in your actual check-in form.
3. Run `npm run build` and `npm run lint` from `client`.
4. Test a valid VIN, invalid VIN, NHTSA failure, clearing the vehicle-of-interest record, and a trade-in lookup while ensuring the first vehicle remains unchanged.
5. Verify the async check-in repository receives both distinct slots.

The provided slice does not modify `Hub.tsx`, route definitions, appointment storage, or existing report types because the current Live Showroom check-in page/repository was not included in the supplied source. Integration is intentionally a component + service boundary rather than an invented replacement for those systems.
