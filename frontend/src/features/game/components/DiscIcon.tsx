import { cn } from '@/lib/cn';
import type { Seat } from '../engine';
import type { BoardTheme } from '../settings';

/** A small disc in a seat's color, for player labels and legends. */
export function DiscIcon({ seat, theme, className }: { seat: Seat; theme: BoardTheme; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-board-theme={theme}
      className={cn('disc-icon disc', seat === 1 ? 'disc-1' : 'disc-2', className)}
    />
  );
}
