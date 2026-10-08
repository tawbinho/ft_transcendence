import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Option<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
}

interface OptionGroupProps<T extends string> {
  legend: ReactNode;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Lay options out as large cards instead of a compact segmented row. */
  variant?: 'segmented' | 'cards';
  className?: string;
}

/** A set of radio buttons styled as a segmented control or as cards. */
export function OptionGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  variant = 'segmented',
  className,
}: OptionGroupProps<T>) {
  const name = useId();
  return (
    <fieldset className={cn('flex flex-col gap-2', className)}>
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div
        className={cn(
          variant === 'segmented'
            ? 'flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2 p-1'
            : 'grid gap-2 sm:grid-cols-3',
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'relative flex cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60',
              variant === 'segmented'
                ? 'flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-muted transition has-[:checked]:bg-surface has-[:checked]:text-fg has-[:checked]:shadow-sm'
                : 'flex-col gap-1 rounded-xl border border-border bg-surface p-3 transition hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className={cn(variant === 'cards' && 'font-semibold')}>{option.label}</span>
            {option.description && <span className="text-sm text-muted">{option.description}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
