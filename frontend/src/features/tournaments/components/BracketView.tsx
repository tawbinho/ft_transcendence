import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CrownIcon } from '@/components/icons';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Slot } from '../bracket';
import { ScrollFade } from './ScrollFade';
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
 * there is one. Later rounds sit between the pairings that feed them. When the
 * columns are wider than the screen they scroll inside this box, not the page.
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
        <ol className="flex min-w-max gap-4">
          {rounds.map((pairings, round) => (
            <li key={round} className="flex w-56 flex-col">
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
                {t(`tournaments.${roundName(round, rounds.length)}`, { n: round + 1 })}
              </h3>
              <ol className="flex flex-1 flex-col justify-around gap-4">
                {pairings.map((pairing) => (
                  <li key={pairing.key}>
                    <PairingCard pairing={pairing} currentLabel={currentLabel} />
                  </li>
                ))}
              </ol>
            </li>
          ))}
          {champion && (
            <li className="flex w-44 flex-col">
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
                {t('tournaments.championTitle')}
              </h3>
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-warning bg-surface p-3 text-center">
                <CrownIcon className="text-4xl text-warning" />
                <span className="max-w-full truncate font-bold">{champion}</span>
              </div>
            </li>
          )}
        </ol>
      </ScrollFade>
    </div>
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
