import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** What a list shows when it has nothing in it, with an optional next step. */
export function EmptyState({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-8 text-center sm:p-10',
        className,
      )}
    >
      <div className="text-muted">{children}</div>
      {action}
    </div>
  );
}
