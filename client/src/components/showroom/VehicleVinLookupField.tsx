// src/components/showroom/VehicleVinLookupField.tsx
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, ScanBarcode, Search, Sparkles, X } from 'lucide-react';
import type { ShowroomVehicleDraft, VehiclePurpose } from '../../types';
import { demoVehicles, lookupDemoVehicle } from '../../services/demo/demoVehicle';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
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
  const { isDemoWorkspace, activeStoreId } = useStoreAppearance();
  const [vin, setVin] = useState(value?.vin ?? '');
  const [modelYear, setModelYear] = useState(value?.modelYear?.toString() ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const config = FIELD_CONFIG[purpose];

  useEffect(() => {
    if (value?.vin) {
      setVin(value.vin);
      setModelYear(value.modelYear?.toString() ?? '');
    } else if (value === null) {
      setVin('');
      setModelYear('');
    }
  }, [value]);

  // Rear Camera Viewfinder lifecycle when scanner is toggled open
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isScannerOpen && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          setCameraActive(true);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => setCameraActive(false));
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setCameraActive(false);
    };
  }, [isScannerOpen]);

  const executeDecode = async (targetVinInput: string, targetYearInput?: string) => {
    const cleanedVin = normalizeVin(targetVinInput);
    if (cleanedVin.length !== 17) return;

    setError(null);
    setWarnings([]);
    setIsLoading(true);
    setIsScannerOpen(false);

    try {
      if (isDemoWorkspace) {
        const record = lookupDemoVehicle(activeStoreId, cleanedVin, purpose);
        if (!record) throw new Error('VIN not found in demo inventory. Try a sample VIN or add a vehicle to inventory.');
        setVin(record.vin);
        setModelYear(record.modelYear?.toString() ?? '');
        onChange(record);
        return;
      }
      const yearStr = targetYearInput !== undefined ? targetYearInput : modelYear;
      const year = yearStr.trim() ? Number(yearStr) : undefined;
      const result = await decodeVin(cleanedVin, year);

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
    const cleaned = normalizeVin(nextValue).slice(0, 17);
    setVin(cleaned);
    setError(null);
    setWarnings([]);
    if (value) onChange(null);
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
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-xs dark:border-white/10 dark:bg-black/25 sm:p-5">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{config.title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {config.description}
          </p>
        </div>
        {value ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-500">
            <CheckCircle2 size={13} /> Decoded
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsScannerOpen((prev) => !prev)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-400 active:scale-95 transition-all cursor-pointer"
          >
            <ScanBarcode size={14} /> {isScannerOpen ? 'Close Scanner' : 'Scan VIN'}
          </button>
        )}
      </div>

      {/* Inline Camera Barcode Viewfinder */}
      {isScannerOpen && (
        <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-black/90 p-3 text-white overflow-hidden">
          <div className="relative h-36 w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10 mb-3">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center px-4">
                <ScanBarcode size={28} className="mx-auto mb-1.5 text-emerald-400" />
                <p className="text-xs font-bold text-gray-200">Point Camera at Door-Jamb or Windshield VIN</p>
                <p className="text-[10px] text-gray-500">Or tap a detected vehicle barcode below:</p>
              </div>
            )}
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)] animate-pulse pointer-events-none" />
          </div>

          {isDemoWorkspace && <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1 flex items-center gap-1">
              <Sparkles size={11} className="text-orange-400" /> Quick Scan:
            </span>
            {demoVehicles[purpose].map((preset) => (
              <button
                type="button"
                key={preset.vin}
                onClick={() => {
                  setVin(preset.vin);
                  void executeDecode(preset.vin);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500/20 border border-white/15 hover:border-emerald-500/40 text-[11px] font-bold text-white transition-all cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            17-Character VIN
          </span>
          <input
            name={`${purpose}_vin`}
            value={vin}
            onChange={(event) => handleVinChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void executeDecode(vin);
              }
            }}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={17}
            placeholder="e.g. 5XYP5DGC0RG412890"
            aria-label={`${config.title} VIN`}
            aria-invalid={Boolean(error)}
            className="w-full min-w-0 min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-base sm:text-sm tracking-wider text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-[#080B10] dark:text-white"
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{vin.length}/17 characters</span>
            {isDemoWorkspace && !value && !isScannerOpen && (
              <div className="flex items-center gap-1.5">
                {demoVehicles[purpose].slice(0, 2).map((preset) => (
                  <button
                    type="button"
                    key={preset.vin}
                    onClick={() => {
                      setVin(preset.vin);
                      void executeDecode(preset.vin);
                    }}
                    className="text-[10px] font-bold text-orange-500 hover:underline cursor-pointer"
                  >
                    +{preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Year (Opt.)
          </span>
          <input
            name={`${purpose}_year`}
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
            placeholder="2024"
            aria-label={`${config.title} model year`}
            className="w-full min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base sm:text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-[#080B10] dark:text-white"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void executeDecode(vin)}
          disabled={!canLookup}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
          {isLoading ? 'Decoding with NHTSA…' : 'Decode VIN'}
        </button>
        {(value || vin) && (
          <button
            type="button"
            onClick={clearVehicle}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 cursor-pointer"
          >
            <X size={15} /> Clear
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs sm:text-sm text-red-600 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value && (
        <div aria-live="polite" className="mt-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-gray-900 dark:text-white truncate">
              {displayName || 'Vehicle Decoded'}
            </p>
            <span className="font-mono text-[10px] text-emerald-500 shrink-0">{value.vin}</span>
          </div>

          <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">
            <Spec label="Body" value={value.bodyClass} />
            <Spec label="Drive" value={value.driveType} />
            <Spec label="Fuel" value={value.fuelTypePrimary} />
            <Spec label="Engine" value={value.displacementL ? `${value.displacementL}L (${value.engineCylinders || '-'} cyl)` : value.engineCylinders} />
            <Spec label="Type" value={value.vehicleType} />
            {value.series && <Spec label="Series" value={value.series} />}
          </dl>

          {warnings.length > 0 && (
            <p className="mt-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-300">
              Note: {warnings.join(' ')}
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
      <dt className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 truncate font-bold text-gray-800 dark:text-gray-200">
        {value || '—'}
      </dd>
    </div>
  );
}