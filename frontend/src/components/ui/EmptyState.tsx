import type { ReactNode } from 'react';
import { ILLUSTRATIONS, type IllustrationName } from '@/components/illustrations';
import { cn } from '@/lib/cn';

/** What a list shows when it has nothing in it, with an optional next step. */
export function EmptyState({
  children,
  action,
  illustration = 'board',
  plain = false,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  /** The picture above the text: `board` (default), `trophy`, `chat` or `notFound`. `null` shows none. */
  illustration?: IllustrationName | null;
  /** No dashed frame, for a list that already sits inside a card. */
  plain?: boolean;
  className?: string;
}) {
  const Illustration = illustration ? ILLUSTRATIONS[illustration] : null;
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 text-center',
        plain ? 'py-4' : 'rounded-card border border-dashed border-border p-8 sm:p-10',
        className,
      )}
    >
      {Illustration && <Illustration className="h-28 w-auto" />}
      <div className="text-muted">{children}</div>
      {action}
    </div>
  );
}
