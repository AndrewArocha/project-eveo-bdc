import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, Search, X } from 'lucide-react';
import type { ShowroomVehicleDraft, VehiclePurpose } from '../../types';
import { decodeVin, normalizeVin, VinLookupError } from '../../utils/nhtsaVinService';

interface VehicleVinLookupFieldProps {
  purpose: VehiclePurpose;
  value: ShowroomVehicleDraft | null;
  onChange: (vehicle: ShowroomVehicleDraft | null) => void;
}

const FIELD_CONFIG: Record<VehiclePurpose, { title: string; description: string }> = {
  vehicle_of_interest: {
    title: 'Vehicle of interest',
    description: 'The dealership vehicle the customer wants to see, buy, or test-drive.',
  },
  trade_in: {
    title: 'Customer trade-in',
    description: 'The customer’s current vehicle, if they are considering a trade-in.',
  },
};

export default function VehicleVinLookupField({
  purpose,
  value,
  onChange,
}: VehicleVinLookupFieldProps) {
  const [vin, setVin] = useState(value?.vin ?? '');
  const [modelYear, setModelYear] = useState(value?.modelYear?.toString() ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const config = FIELD_CONFIG[purpose];

  // If a different visit/record is loaded into this mounted form, reflect it.
  // A transition to null intentionally preserves the user's current VIN draft.
  useEffect(() => {
    if (value?.vin) {
      setVin(value.vin);
      setModelYear(value.modelYear?.toString() ?? '');
    }
  }, [value?.vin, value?.modelYear]);

  const handleLookup = async () => {
    setError(null);
    setWarnings([]);
    setIsLoading(true);

    try {
      const year = modelYear.trim() ? Number(modelYear) : undefined;
      const result = await decodeVin(normalizeVin(vin), year);

      const record: ShowroomVehicleDraft = {
        ...result.vehicle,
        purpose,
        source: 'nhtsa-vpic',
        decodedAt: new Date().toISOString(),
      };

      setVin(record.vin);
      setModelYear(record.modelYear?.toString() ?? '');
      setWarnings(result.warnings);
      onChange(record);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(
        caught instanceof VinLookupError || caught instanceof Error
          ? caught.message
          : 'Vehicle lookup failed. Please try again.',
      );
      onChange(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVinChange = (nextValue: string) => {
    setVin(normalizeVin(nextValue).slice(0, 17));
    setError(null);
    setWarnings([]);
    if (value) onChange(null); // Avoid accidentally saving stale decoded data.
  };

  const clearVehicle = () => {
    setVin('');
    setModelYear('');
    setError(null);
    setWarnings([]);
    onChange(null);
  };

  const canLookup = vin.length === 17 && !isLoading;
  const displayName = [value?.modelYear, value?.make, value?.model, value?.trim]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-black/20 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{config.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {config.description}
          </p>
        </div>
        {value && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} /> Decoded
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            VIN
          </span>
          <input
            value={vin}
            onChange={(event) => handleVinChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleLookup();
              }
            }}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={17}
            placeholder="17-character VIN"
            aria-label={`${config.title} VIN`}
            aria-invalid={Boolean(error)}
            className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-3 font-mono text-sm tracking-wider text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-[#080B10] dark:text-white"
          />
          <span className="mt-1 block text-xs text-gray-400">{vin.length}/17 characters</span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Model year (optional)
          </span>
          <input
            inputMode="numeric"
            type="number"
            min={1981}
            max={2100}
            value={modelYear}
            onChange={(event) => {
              setModelYear(event.target.value);
              setError(null);
              if (value) onChange(null);
            }}
            placeholder="e.g. 2024"
            aria-label={`${config.title} model year`}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-[#080B10] dark:text-white"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleLookup()}
          disabled={!canLookup}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-[#080B10]"
        >
          {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
          {isLoading ? 'Looking up VIN…' : 'Decode VIN'}
        </button>
        {(value || vin) && (
          <button
            type="button"
            onClick={clearVehicle}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <X size={16} /> Clear
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value && (
        <div aria-live="polite" className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Vehicle decoded by NHTSA vPIC
          </p>
          <p className="mt-1 wrap-break-word text-base font-bold text-gray-900 dark:text-white">
            {displayName || 'Vehicle identification returned'}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-gray-500 dark:text-gray-400">VIN: {value.vin}</p>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <Spec label="Body class" value={value.bodyClass} />
            <Spec label="Vehicle type" value={value.vehicleType} />
            <Spec label="Drive type" value={value.driveType} />
            <Spec label="Fuel" value={value.fuelTypePrimary} />
            <Spec label="Cylinders" value={value.engineCylinders} />
            <Spec label="Displacement (L)" value={value.displacementL} />
            {value.series && <Spec label="Series" value={value.series} />}
          </dl>

          {warnings.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              NHTSA note: {warnings.join(' ')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 wrap-break-word font-semibold text-gray-800 dark:text-gray-200">
        {value || 'Not reported'}
      </dd>
    </div>
  );
}
