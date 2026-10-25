import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { PlayIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { BracketView, type BracketPairingView } from '@/features/tournaments/components/BracketView';
import type { Tournament } from '@/features/tournaments/types';

/** The bracket of an online tournament: a "Play" button on the viewer's match in progress. */
export function TournamentBracket({ tournament, viewerId }: { tournament: Tournament; viewerId: string | undefined }) {
  const { t } = useTranslation();

  const rounds: BracketPairingView[][] = tournament.rounds.map((round) =>
    round.pairings.map((pairing) => {
      const viewerPlays = pairing.players.some((player) => player !== null && player.id === viewerId);
      const live = pairing.matchId !== null && pairing.winnerId === null;
      return {
        key: pairing.id,
        players: [
          pairing.players[0] && { name: pairing.players[0].displayName, user: pairing.players[0] },
          pairing.players[1] && { name: pairing.players[1].displayName, user: pairing.players[1] },
        ],
        winner: pairing.winnerId === null ? null : pairing.players[0]?.id === pairing.winnerId ? 0 : 1,
        current: live && viewerPlays,
        action:
          live && viewerPlays && pairing.matchId ? (
            <Link to={paths.match(pairing.matchId)} className={buttonClass({ size: 'sm' })}>
              <PlayIcon />
              {t('tournaments.play')}
            </Link>
          ) : undefined,
      };
    }),
  );

  return (
    <section aria-labelledby="bracket-title" className="flex min-w-0 flex-col gap-4">
      <h2 id="bracket-title" className="text-xl font-bold">
        {t('tournaments.bracket')}
      </h2>
      <BracketView
        rounds={rounds}
        label={t('tournaments.bracket')}
        currentLabel={t('tournaments.yourMatch')}
        champion={tournament.winner?.displayName}
      />
    </section>
  );
}
