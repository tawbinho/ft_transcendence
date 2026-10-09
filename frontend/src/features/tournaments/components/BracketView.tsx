import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CrownIcon } from '@/components/icons';
import { Avatar, ScrollFade } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Slot } from '../bracket';
import { roundName } from '../view';

/** A player as the bracket shows them: a name, and their avatar for online tournaments. */
export interface BracketEntrant {
  name: string;
  user?: { displayName: string; avatarUrl: string | null };
}

/** One pairing, ready to draw. Both tournament modes map their data to this. */
export interface BracketPairingView {
  key: string;
  players: [BracketEntrant | null, BracketEntrant | null];
  winner: Slot | null;
  bye: boolean;
  /** Highlighted: the viewer's pairing, or the next one to play. */
  current?: boolean;
  /** A link or button under the pairing, e.g. "Watch" or "Play". */
  action?: ReactNode;
}

/**
 * The bracket as columns of rounds, the final last, then the champion once
 * there is one. Lines join each pairing to the one its winner plays next. The
 * columns share the width of the box; when they would get too narrow the box
 * scrolls instead of the page.
 */
export function BracketView({
  rounds,
  label,
  currentLabel,
  champion,
}: {
  rounds: BracketPairingView[][];
  /** Names the scrolling box for screen readers. */
  label: string;
  /** A short word on the highlighted pairing, e.g. "Next match". */
  currentLabel?: string;
  /** The winner's name, shown in a last column with a crown. */
  champion?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-border bg-surface-2/50 p-4">
      {/* When the rounds do not fit, the box scrolls and fades the edge that has more. */}
      <ScrollFade label={label}>
        <ol className="flex w-full min-w-max">
          {rounds.map((pairings, round) => {
            const isFinal = round === rounds.length - 1;
            return (
              <li key={round} className={cn('flex min-w-56 flex-1 flex-col', !isFinal || champion ? 'me-10' : '')}>
                <h3 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
                  {t(`tournaments.${roundName(round, rounds.length)}`, { n: round + 1 })}
                </h3>
                {/* Every pairing gets a row of the same height, so a pairing sits exactly between the two that feed it. */}
                <ol className="grid flex-1 auto-rows-fr">
                  {pairings.map((pairing, index) => (
                    <li key={pairing.key} className="relative flex flex-col justify-center py-2">
                      <PairingCard pairing={pairing} currentLabel={currentLabel} />
                      {round > 0 && <Connector side="in" />}
                      {!isFinal && <Connector side="out" bend={index % 2 === 0 ? 'down' : 'up'} />}
                      {isFinal && champion && <Connector side="out" />}
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
          {champion && (
            <li className="flex w-44 flex-none flex-col">
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
                {t('tournaments.championTitle')}
              </h3>
              <div className="relative flex flex-1 flex-col justify-center py-2">
                <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-warning bg-surface p-3 text-center">
                  <CrownIcon className="text-4xl text-warning" />
                  <span className="max-w-full truncate font-bold">{champion}</span>
                </div>
                <Connector side="in" />
              </div>
            </li>
          )}
        </ol>
      </ScrollFade>
    </div>
  );
}

// The gap between two columns is me-10 (2.5rem). Each pairing draws half of it,
// so the lines of two neighbouring columns meet in the middle. Logical sides
// (start, end) make the lines mirror in right-to-left languages, like the columns.
const LINE = 'absolute bg-muted/40';

/**
 * A line in the gap beside a pairing: `in` comes from the earlier round, `out`
 * goes on to the next one. An `out` line can also `bend` down or up, towards
 * the other pairing that feeds the same next pairing, so the two together
 * draw a "]" that points at it.
 */
function Connector({ side, bend }: { side: 'in' | 'out'; bend?: 'down' | 'up' }) {
  return (
    <>
      <span aria-hidden className={cn(LINE, 'top-1/2 -mt-px h-0.5 w-5', side === 'in' ? '-start-5' : '-end-5')} />
      {bend && (
        <span
          aria-hidden
          className={cn(LINE, '-end-5 w-0.5', bend === 'down' ? 'top-1/2 bottom-0 -mt-px' : 'top-0 bottom-1/2 -mb-px')}
        />
      )}
    </>
  );
}

function PairingCard({ pairing, currentLabel }: { pairing: BracketPairingView; currentLabel?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border bg-surface p-2 shadow-sm',
        pairing.current ? 'border-primary ring-2 ring-primary' : 'border-border',
      )}
    >
      {pairing.current && currentLabel && (
        <p className="px-1.5 text-xs font-bold tracking-wide text-primary uppercase">{currentLabel}</p>
      )}
      <ul className="flex flex-col divide-y divide-border">
        {([0, 1] as const).map((slot) => {
          const player = pairing.players[slot];
          const won = pairing.winner === slot;
          const lost = pairing.winner !== null && !won && player !== null;
          return (
            <li
              key={slot}
              className={cn('flex min-h-10 items-center gap-2 rounded-md px-1.5 py-1', won && 'bg-success-soft')}
            >
              {player ? (
                <>
                  {player.user && <Avatar user={player.user} size="xs" />}
                  <span
                    className={cn('min-w-0 flex-1 truncate', won && 'font-bold', lost && 'text-muted line-through')}
                  >
                    {player.name}
                  </span>
                  {won && (
                    <>
                      <CrownIcon className="flex-none text-warning" />
                      <span className="sr-only">{t('tournaments.winner')}</span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted italic">
                  {pairing.bye ? t('tournaments.bye') : t('tournaments.toBeDecided')}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {pairing.action}
    </div>
  );
}
