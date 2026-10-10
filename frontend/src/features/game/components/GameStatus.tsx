import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** How the banner is colored: the viewer won, lost, the game was drawn, ended otherwise, or is still going. */
export type GameStatusTone = 'win' | 'loss' | 'draw' | 'over' | 'none';

const TONE_CLASSES: Record<GameStatusTone, string> = {
  win: 'bg-success-soft text-success',
  loss: 'bg-danger-soft text-danger',
  draw: 'bg-surface-2',
  over: 'bg-surface-2',
  none: '',
};

/** The line under the player tags: whose turn it is, or how the game ended. */
export function GameStatus({
  tone,
  children,
  detail,
}: {
  tone: GameStatusTone;
  children: ReactNode;
  /** A smaller second line, for example "by resignation". */
  detail?: ReactNode;
}) {
  return (
    <div className={cn('rounded-xl px-4 py-2 text-center', TONE_CLASSES[tone])}>
      <p className="text-lg font-bold">{children}</p>
      {detail && <p className="text-sm">{detail}</p>}
    </div>
  );
}
