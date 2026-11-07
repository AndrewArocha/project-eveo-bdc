import { useId } from 'react';

interface LiquidVolumeSliderProps {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
  className?: string;
  disabled?: boolean;
}

export default function LiquidVolumeSlider({
  label,
  value,
  onChange,
  className = '',
  disabled = false,
}: LiquidVolumeSliderProps) {
  const generatedId = useId();
  const inputId = `liquid-volume-${generatedId}`;
  const percentage = Math.min(100, Math.max(0, Math.round(value * 100)));

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <label
        htmlFor={inputId}
        className="w-28 shrink-0 text-xs font-semibold text-gray-400"
      >
        {label}
      </label>

      <div className="relative h-8 min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.65)]">
          <div
            className="h-full rounded-full bg-linear-to-r from-orange-600 via-orange-400 to-amber-200 shadow-[0_0_12px_rgba(249,115,22,0.45)] transition-[width] duration-100"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <input
          id={inputId}
          type="range"
          min={0}
          max={100}
          step={1}
          value={percentage}
          disabled={disabled}
          aria-label={label}
          aria-valuetext={`${percentage}%`}
          onChange={(event) => onChange(Number(event.currentTarget.value) / 100)}
          className="
            absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent
            outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50
            disabled:cursor-not-allowed disabled:opacity-40
            [&::-webkit-slider-runnable-track]:h-1.5
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-moz-range-track]:h-1.5
            [&::-moz-range-track]:rounded-full
            [&::-moz-range-track]:bg-transparent
            [&::-webkit-slider-thumb]:mt-[-5px]
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:border-orange-100/80
            [&::-webkit-slider-thumb]:bg-linear-to-br
            [&::-webkit-slider-thumb]:from-white
            [&::-webkit-slider-thumb]:via-orange-300
            [&::-webkit-slider-thumb]:to-orange-600
            [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(249,115,22,0.12),0_2px_9px_rgba(249,115,22,0.55)]
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border
            [&::-moz-range-thumb]:border-orange-100/80
            [&::-moz-range-thumb]:bg-orange-400
            [&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(249,115,22,0.12),0_2px_9px_rgba(249,115,22,0.55)]
          "
        />
      </div>

      <output
        htmlFor={inputId}
        className="w-10 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-gray-200"
      >
        {percentage}%
      </output>
    </div>
  );
}
