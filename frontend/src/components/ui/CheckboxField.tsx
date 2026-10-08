import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: ReactNode;
}

export function CheckboxField({ label, className, ...props }: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input id={id} type="checkbox" className="size-4 flex-none accent-primary" {...props} />
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
    </div>
  );
}
