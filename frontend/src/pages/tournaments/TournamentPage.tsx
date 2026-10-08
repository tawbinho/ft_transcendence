import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { CrownIcon, EyeIcon, PlayIcon, TrashIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, buttonClass, Card, ConfirmDialog, PageSpinner } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { GameSummary } from '@/features/game/components/GameSummary';
import { BracketView, type BracketPairingView } from '@/features/tournaments/components/BracketView';
import { TournamentStatusBadge } from '@/features/tournaments/components/TournamentStatusBadge';
import { useDeleteTournament, useTournament, useTournamentAction } from '@/features/tournaments/hooks';
import { MIN_TOURNAMENT_PLAYERS, type Pairing, type Tournament } from '@/features/tournaments/types';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';

export function TournamentPage() {
  const { tournamentId = '' } = useParams();
  return <TournamentScreen key={tournamentId} id={tournamentId} />;
}

function TournamentScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const query = useTournament(id);

  if (query.isPending) return <PageSpinner />;
  if (!query.data) {
    if (isApiError(query.error, 'TOURNAMENT_NOT_FOUND')) {
      return (
        <div className="mx-auto max-w-lg">
          <PageHeader title={t('tournaments.notFoundTitle')} />
          <Card className="flex flex-col items-start gap-4">
            <p className="text-muted">{t('errors.TOURNAMENT_NOT_FOUND')}</p>
            <Link to="/tournaments" className={buttonClass()}>
              {t('tournaments.title')}
            </Link>
          </Card>
        </div>
      );
    }
    return <LoadError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  return <TournamentView tournament={query.data} />;
}

/** The pairing the viewer has to play now, if any. */
function pairingToPlay(tournament: Tournament, viewerId: string | undefined): Pairing | null {
  if (!viewerId || tournament.status !== 'running') return null;
  for (const round of tournament.rounds) {
    for (const pairing of round.pairings) {
      const plays = pairing.players.some((player) => player?.id === viewerId);
      if (plays && pairing.matchId && !pairing.winnerId) return pairing;
    }
  }
  return null;
}

function TournamentView({ tournament }: { tournament: Tournament }) {
  const { t } = useTranslation();
  const viewer = useUser();
  const toPlay = pairingToPlay(tournament, viewer?.id);
  const opponent = toPlay?.players.find((player) => player && player.id !== viewer?.id);

  const rounds: BracketPairingView[][] = tournament.rounds.map((round) =>
    round.pairings.map((pairing) => {
      const viewerPlays = pairing.players.some((player) => player?.id === viewer?.id);
      const live = pairing.matchId !== null && pairing.winnerId === null;
      return {
        key: pairing.id,
        players: [
          pairing.players[0] && { name: pairing.players[0].displayName, user: pairing.players[0] },
          pairing.players[1] && { name: pairing.players[1].displayName, user: pairing.players[1] },
        ],
        winner: pairing.winnerId === null ? null : pairing.players[0]?.id === pairing.winnerId ? 0 : 1,
        bye: pairing.bye,
        current: live && viewerPlays,
        action:
          live && pairing.matchId ? (
            <Link
              to={viewerPlays ? paths.match(pairing.matchId) : paths.watch(pairing.matchId)}
              className={buttonClass({ size: 'sm', variant: viewerPlays ? 'primary' : 'ghost' })}
            >
              {viewerPlays ? <PlayIcon /> : <EyeIcon />}
              {viewerPlays ? t('tournaments.play') : t('watch.watch')}
            </Link>
          ) : undefined,
      };
    }),
  );

  return (
    <>
      <PageHeader
        title={tournament.name}
        subtitle={t('tournaments.createdBy', { name: tournament.createdBy.displayName })}
        actions={<TournamentStatusBadge status={tournament.status} />}
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
            <Card className="flex flex-col items-center gap-2 text-center">
              <CrownIcon className="text-5xl text-warning" />
              <h2 className="text-2xl font-extrabold">
                {t('tournaments.champion', { name: tournament.winner.displayName })}
              </h2>
            </Card>
          )}

          {rounds.length > 0 && (
            <section aria-labelledby="bracket-title" className="flex flex-col gap-4">
              <h2 id="bracket-title" className="text-xl font-bold">
                {t('tournaments.bracket')}
              </h2>
              <BracketView rounds={rounds} label={t('tournaments.bracket')} />
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="players-title" className="rounded-2xl border border-border bg-surface p-4">
            <h2 id="players-title" className="mb-3 font-bold">
              {t('tournaments.players')}{' '}
              <span className="font-normal text-muted">
                {t('tournaments.playerCount', { count: tournament.players.length, size: tournament.size })}
              </span>
            </h2>
            <ul className="flex flex-col gap-2">
              {tournament.players.map((player) => (
                <li key={player.id}>
                  <PlayerLink user={player} presence />
                </li>
              ))}
            </ul>
          </section>
          <GameSummary settings={tournament.settings} />
        </aside>
      </div>
    </>
  );
}

/** Join, leave, start early or cancel, while players register. */
function Registration({ tournament }: { tournament: Tournament }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const viewer = useUser();
  const join = useTournamentAction(tournament.id, 'join');
  const leave = useTournamentAction(tournament.id, 'leave');
  const start = useTournamentAction(tournament.id, 'start');
  const remove = useDeleteTournament(tournament.id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isCreator = tournament.createdBy.id === viewer?.id;
  const error = join.error ?? leave.error ?? start.error ?? remove.error;
  const canStart = tournament.players.length >= MIN_TOURNAMENT_PLAYERS;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">{t('tournaments.registrationOpen')}</h2>
        <p className="text-muted">
          {t('tournaments.registrationBody', { size: tournament.size, min: MIN_TOURNAMENT_PLAYERS })}
        </p>
      </div>
      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
      <div className="flex flex-wrap gap-2">
        {!tournament.joined && (
          <Button loading={join.isPending} onClick={() => join.mutate()}>
            {t('tournaments.join')}
          </Button>
        )}
        {tournament.joined && !isCreator && (
          <Button variant="secondary" loading={leave.isPending} onClick={() => leave.mutate()}>
            {t('tournaments.leave')}
          </Button>
        )}
        {isCreator && (
          <>
            <Button loading={start.isPending} disabled={!canStart} onClick={() => start.mutate()}>
              <PlayIcon />
              {t('tournaments.startNow')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              <TrashIcon />
              {t('tournaments.delete')}
            </Button>
          </>
        )}
      </div>
      {isCreator && !canStart && (
        <p className="text-sm text-muted">{t('tournaments.needMorePlayers', { min: MIN_TOURNAMENT_PLAYERS })}</p>
      )}
      <ConfirmDialog
        open={confirmingDelete}
        title={t('tournaments.deleteTitle')}
        confirmLabel={t('tournaments.delete')}
        confirmVariant="danger"
        loading={remove.isPending}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => remove.mutate(undefined, { onError: () => setConfirmingDelete(false) })}
      >
        {t('tournaments.deleteBody')}
      </ConfirmDialog>
    </Card>
  );
}
