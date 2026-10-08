import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CrownIcon } from '@/components/icons';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Slot } from '../bracket';

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

/** "Final", "Semi-finals", "Quarter-finals", else "Round n". */
function useRoundName() {
  const { t } = useTranslation();
  return (round: number, total: number) => {
    const fromEnd = total - 1 - round;
    if (fromEnd === 0) return t('tournaments.final');
    if (fromEnd === 1) return t('tournaments.semiFinals');
    if (fromEnd === 2) return t('tournaments.quarterFinals');
    return t('tournaments.round', { n: round + 1 });
  };
}

/**
 * The bracket as columns of rounds, the final last. Later rounds sit between
 * the pairings that feed them. On small screens the columns scroll sideways.
 */
export function BracketView({ rounds, label }: { rounds: BracketPairingView[][]; label: string }) {
  const roundName = useRoundName();
  return (
    <div className="overflow-x-auto pb-2">
      <ol aria-label={label} className="flex min-w-max gap-4">
        {rounds.map((pairings, round) => (
          <li key={round} className="flex w-56 flex-col">
            <h3 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
              {roundName(round, rounds.length)}
            </h3>
            <ol className="flex flex-1 flex-col justify-around gap-4">
              {pairings.map((pairing) => (
                <li key={pairing.key}>
                  <PairingCard pairing={pairing} />
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PairingCard({ pairing }: { pairing: BracketPairingView }) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border bg-surface p-2 shadow-sm',
        pairing.current ? 'border-primary ring-1 ring-primary' : 'border-border',
      )}
    >
      <ul className="flex flex-col divide-y divide-border">
        {([0, 1] as const).map((slot) => {
          const player = pairing.players[slot];
          const won = pairing.winner === slot;
          const lost = pairing.winner !== null && !won && player !== null;
          return (
            <li key={slot} className="flex min-h-10 items-center gap-2 px-1.5 py-1">
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
