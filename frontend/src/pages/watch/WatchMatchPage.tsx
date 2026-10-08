import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { BackIcon, EyeIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { Badge, buttonClass, Card, PageSpinner } from '@/components/ui';
import { GameBoard } from '@/features/game/components/GameBoard';
import { GameLayout } from '@/features/game/components/GameLayout';
import { GameStatus } from '@/features/game/components/GameStatus';
import { GameSummary } from '@/features/game/components/GameSummary';
import { MoveAnnouncer } from '@/features/game/components/MoveAnnouncer';
import { PlayersBar } from '@/features/game/components/PlayersBar';
import { toBoardTheme } from '@/features/game/settings';
import { useMatch } from '@/features/matches/hooks';
import { isMatchId, isOver, playerInSeat, toBoardModel } from '@/features/matches/model';
import type { Match } from '@/features/matches/types';
import { isApiError } from '@/lib/api/errors';

/** A match seen by someone who does not play in it: the board updates live, nothing can be played. */
export function WatchMatchPage() {
  const { matchId = '' } = useParams();
  return isMatchId(matchId) ? <Spectate key={matchId} id={matchId} /> : <CannotWatch />;
}

function Spectate({ id }: { id: string }) {
  const query = useMatch(id);

  if (query.isPending) return <PageSpinner />;
  if (!query.data) {
    if (isApiError(query.error, 'MATCH_NOT_FOUND')) return <CannotWatch />;
    return <LoadError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }

  const match = query.data;
  // Players play on the match page; a match still waiting can only be joined there.
  if (match.yourSeat !== null || match.status === 'waiting') return <Navigate to={paths.match(id)} replace />;
  return <SpectatorView match={match} />;
}

function CannotWatch() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('watch.unavailableTitle')} />
      <Card className="flex flex-col items-start gap-4">
        <p className="text-muted">{t('watch.unavailableBody')}</p>
        <Link to="/watch" className={buttonClass()}>
          {t('watch.backToLive')}
        </Link>
      </Card>
    </div>
  );
}

function SpectatorView({ match }: { match: Match }) {
  const { t } = useTranslation();
  const theme = toBoardTheme(match.settings.theme);
  const nameOf = (seat: 1 | 2) => playerInSeat(match, seat)?.displayName ?? '?';
  const playing = match.status === 'in_progress';

  const winner = match.winnerSeat === null ? null : nameOf(match.winnerSeat);
  const loser = match.players.find((player) => player.result === 'loss');
  const status = playing
    ? t('game.turnOf', { name: nameOf(match.game.current ?? 1) })
    : winner
      ? t('game.wins', { name: winner })
      : match.status === 'finished'
        ? t('game.draw')
        : t('online.resultCancelled');
  const reason =
    !playing && loser && match.endReason === 'resign'
      ? t('online.byResignation', { name: loser.displayName })
      : !playing && loser && match.endReason === 'disconnect'
        ? t('online.byDisconnect', { name: loser.displayName })
        : null;

  const lastMove = match.game.lastMove;
  const lastSeat = match.game.moves.length % 2 === 1 ? 1 : 2;
  const announcement = [
    lastMove && t('game.playedColumn', { name: nameOf(lastSeat), n: lastMove.col + 1 }),
    !playing && status,
    reason,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <PageHeader
        title={`${nameOf(1)} ${t('online.vs')} ${nameOf(2)}`}
        actions={
          <Link to="/watch" className={buttonClass({ variant: 'secondary' })}>
            <BackIcon />
            {t('watch.backToLive')}
          </Link>
        }
      />
      <GameLayout
        aside={
          <>
            <p className="flex items-center gap-2 text-muted">
              <EyeIcon />
              {playing ? <Badge tone="danger">{t('watch.live')}</Badge> : <Badge>{t('watch.ended')}</Badge>}
              {t('watch.spectating')}
            </p>
            <GameSummary settings={match.settings} moveCount={match.game.moveCount} />
          </>
        }
      >
        <PlayersBar theme={theme} names={[nameOf(1), nameOf(2)]} activeSeat={playing ? match.game.current : null} />
        <GameStatus tone={isOver(match) ? 'over' : 'none'} detail={reason}>
          {status}
        </GameStatus>
        <GameBoard theme={theme} model={toBoardModel(match)} />
      </GameLayout>
      <MoveAnnouncer text={announcement} />
    </>
  );
}
