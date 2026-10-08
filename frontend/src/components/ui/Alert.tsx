import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  info: 'border-primary/30 bg-primary/10 text-fg',
  success: 'border-success/30 bg-success-soft text-fg',
  warning: 'border-warning/30 bg-warning-soft text-fg',
  danger: 'border-danger/30 bg-danger-soft text-fg',
};

/** A message box. Errors are announced immediately to screen readers. */
export function Alert({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex flex-wrap items-start gap-x-4 gap-y-2 rounded-xl border px-4 py-3 text-sm',
        TONES[tone],
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title ? 'mt-0.5' : null, 'text-fg/90')}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
