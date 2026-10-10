import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { PlayIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass, Card } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { GameSummary } from '@/features/game/components/GameSummary';
import { ChampionCard } from '@/features/tournaments/components/ChampionCard';
import { TournamentStatusBadge } from '@/features/tournaments/components/TournamentStatusBadge';
import type { Tournament } from '@/features/tournaments/types';
import { pairingToPlay } from '@/features/tournaments/view';
import { PlayersPanel } from './PlayersPanel';
import { Registration } from './Registration';
import { TournamentBracket } from './TournamentBracket';

/** An online tournament: its registration, the viewer's next match, the bracket and the players. */
export function TournamentView({ tournament }: { tournament: Tournament }) {
  const { t } = useTranslation();
  const viewerId = useUser()?.id;
  const toPlay = pairingToPlay(tournament, viewerId);
  const opponent = toPlay?.players.find((player) => player && player.id !== viewerId);

  return (
    <>
      <PageHeader
        title={tournament.name}
        subtitle={
          // The status sits right after "Created by", not at the far end of the header row.
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {t('tournaments.createdBy', { name: tournament.createdBy.displayName })}
            <TournamentStatusBadge status={tournament.status} />
          </span>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {tournament.status === 'registering' && <Registration tournament={tournament} />}

          {toPlay?.matchId && (
            <Card className="flex flex-wrap items-center justify-between gap-4 border-primary">
              <p className="text-lg font-bold">
                {t('tournaments.yourMatchReady', { name: opponent?.displayName ?? '?' })}
              </p>
              <Link to={paths.match(toPlay.matchId)} className={buttonClass({ size: 'lg' })}>
                <PlayIcon />
                {t('tournaments.play')}
              </Link>
            </Card>
          )}

          {tournament.status === 'finished' && tournament.winner && (
            <ChampionCard title={t('tournaments.champion', { name: tournament.winner.displayName })} />
          )}

          {tournament.rounds.length > 0 && <TournamentBracket tournament={tournament} viewerId={viewerId} />}
        </div>

        <aside className="flex flex-col gap-4">
          <PlayersPanel tournament={tournament} />
          <GameSummary settings={tournament.settings} />
        </aside>
      </div>
    </>
  );
}
