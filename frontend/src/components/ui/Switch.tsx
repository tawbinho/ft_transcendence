import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'role'> {
  label: ReactNode;
}

/** An on/off setting that takes effect right away (use a checkbox for a choice that is saved with a form). */
export function Switch({ label, className, ...props }: SwitchProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn('group flex cursor-pointer items-center gap-3', className)}>
      <input id={id} type="checkbox" role="switch" className="sr-only" {...props} />
      <span
        aria-hidden="true"
        className={cn(
          'relative h-6 w-11 flex-none rounded-full border border-border bg-surface-2 transition',
          'group-has-[:checked]:border-primary group-has-[:checked]:bg-primary',
          'group-has-[:focus-visible]:outline-3 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-ring',
          'group-has-[:disabled]:opacity-55',
        )}
      >
        <span
          className={cn(
            'absolute start-0.5 top-0.5 size-5 rounded-full bg-fg/70 shadow-sm transition',
            'group-has-[:checked]:bg-primary-fg group-has-[:checked]:ltr:translate-x-5 group-has-[:checked]:rtl:-translate-x-5',
          )}
        />
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}
