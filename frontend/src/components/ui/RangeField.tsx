import { useId, type ReactNode } from 'react';

interface RangeFieldProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/** A slider with its current value shown next to the label. */
export function RangeField({ label, value, min, max, onChange, disabled }: RangeFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <output htmlFor={id} className="min-w-6 text-end font-semibold tabular-nums text-primary">
          {value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--c-primary)] disabled:opacity-50"
      />
    </div>
  );
}
