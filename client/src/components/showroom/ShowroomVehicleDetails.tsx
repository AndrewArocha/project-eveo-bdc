import { CarFront, Repeat2 } from 'lucide-react';
import type { ShowroomVehicleSelection, ShowroomVehicleDraft } from '../../types';
import VehicleVinLookupField from './VehicleVinLookupField';

interface ShowroomVehicleDetailsProps {
  value: ShowroomVehicleSelection;
  onChange: (value: ShowroomVehicleSelection) => void;
}

/**
 * This goes into the Live Showroom check-in form. Each VIN field owns its own
 * input/loading/error state; the parent owns the separate vehicle records.
 */
export default function ShowroomVehicleDetails({
  value,
  onChange,
}: ShowroomVehicleDetailsProps) {
  const updateVehicle = (
    key: keyof ShowroomVehicleSelection,
    vehicle: ShowroomVehicleDraft | null,
  ) => {
    onChange({ ...value, [key]: vehicle });
  };

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
          <CarFront size={20} className="text-orange-500" /> Vehicle information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Decode each VIN separately. A trade-in is optional and never replaces the vehicle of interest.
        </p>
      </div>

      <VehicleVinLookupField
        purpose="vehicle_of_interest"
        value={value.vehicleOfInterest}
        onChange={(vehicle) => updateVehicle('vehicleOfInterest', vehicle)}
      />

      <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
        <Repeat2 size={15} /> Separate trade-in record
      </div>

      <VehicleVinLookupField
        purpose="trade_in"
        value={value.tradeIn}
        onChange={(vehicle) => updateVehicle('tradeIn', vehicle)}
      />
    </section>
  );
}
