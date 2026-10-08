import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Seat } from '../engine';
import type { BoardTheme } from '../settings';
import { DiscIcon } from './DiscIcon';

/** A player's name with their disc; highlighted while it is their turn. */
export function PlayerTag({
  name,
  seat,
  theme,
  active = false,
  note,
  align = 'start',
}: {
  name: ReactNode;
  seat: Seat;
  theme: BoardTheme;
  active?: boolean;
  note?: ReactNode;
  align?: 'start' | 'end';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2 transition',
        align === 'end' && 'flex-row-reverse text-end',
        active ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-surface',
      )}
    >
      <DiscIcon seat={seat} theme={theme} className="text-2xl" />
      <div className="min-w-0">
        <p className="truncate font-bold">{name}</p>
        {note && <p className="truncate text-sm text-muted">{note}</p>}
      </div>
    </div>
  );
}
