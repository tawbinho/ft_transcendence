import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: ReactNode;
}

/** A labelled native <select> (keyboard and screen reader support for free). */
export function SelectField({ label, className, children, ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        className="h-11 rounded-xl border border-border bg-surface px-3 text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
