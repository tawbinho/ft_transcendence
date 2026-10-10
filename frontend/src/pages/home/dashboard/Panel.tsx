import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

/** The frame of a dashboard panel: a title, an optional link on the far side, and the content. */
export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: { to: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn('flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        {action && (
          <Link
            to={action.to}
            className="inline-flex min-h-6 items-center text-sm font-semibold text-primary hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** What a panel shows while its data loads: three grey rows. */
export function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  );
}
