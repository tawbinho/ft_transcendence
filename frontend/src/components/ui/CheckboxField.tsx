import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

/** A checkbox and its text in one label, so the whole row (at least 40 px tall) can be clicked or tapped. */
export function CheckboxField({ label, className, ...props }: CheckboxFieldProps) {
  return (
    <label className={cn('flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-semibold', className)}>
      <input
        type="checkbox"
        className="size-5 flex-none cursor-pointer accent-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        {...props}
      />
      {label}
    </label>
  );
}
