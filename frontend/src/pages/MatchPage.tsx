import { useIsMutating } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { FlagIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, buttonClass, Card, ConfirmDialog, PageSpinner, Spinner } from '@/components/ui';
import { Board } from '@/features/game/components/Board';
import { GameSummary } from '@/features/game/components/GameSummary';
import { PlayerTag } from '@/features/game/components/PlayerTag';
import { normalizeSettings, toBoardTheme } from '@/features/game/settings';
import { ShareLink } from '@/features/matches/components/ShareLink';
import {
  matchKeys,
  useCreateMatch,
  useJoinMatch,
  useMakeMove,
  useMatch,
  useResignMatch,
} from '@/features/matches/hooks';
import { isMatchId, isMyTurn, opponentOf, outcomeOf, toBoardModel, viewerOf } from '@/features/matches/model';
import type { Match } from '@/features/matches/types';
import { isApiError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { useErrorMessage } from '@/lib/errorMessage';

export function MatchPage() {
  const { matchId = '' } = useParams();
  return isMatchId(matchId) ? <MatchScreen key={matchId} id={matchId} /> : <Unavailable />;
}

function MatchScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const moving = useIsMutating({ mutationKey: matchKeys.move(id) }) > 0;
  const query = useMatch(id, { paused: moving });

  if (query.isPending) return <PageSpinner />;
  if (!query.data) {
    // Only players can read a match: anyone else may be an invited player.
    if (isApiError(query.error, 'MATCH_NOT_FOUND')) return <JoinMatch id={id} />;
    return (
      <Alert
        tone="danger"
        title={t('errors.title')}
        action={
          <Button size="sm" variant="secondary" loading={query.isFetching} onClick={() => void query.refetch()}>
            {t('common.retry')}
          </Button>
        }
      >
        {errorMessage(query.error)}
      </Alert>
    );
  }

  const match = query.data;
  // Someone who does not play in this match can join it while it waits,
  // and watch it once it has started.
  if (match.yourSeat === null) {
    return match.status === 'waiting' ? <JoinMatch id={id} /> : <Navigate to={paths.watch(id)} replace />;
  }
  if (match.status === 'waiting') return <WaitingRoom match={match} />;
  return <MatchBoard match={match} syncFailed={query.isRefetchError} />;
}

function Unavailable({ reason }: { reason?: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('online.unavailableTitle')} />
      <Card className="flex flex-col items-start gap-4">
        <p className="text-muted">{reason ?? t('online.unavailableBody')}</p>
        <Link to="/play/online" className={buttonClass()}>
          {t('online.newMatch')}
        </Link>
      </Card>
    </div>
  );
}

const CLOSED = ['MATCH_NOT_FOUND', 'MATCH_NOT_JOINABLE', 'NOT_INVITED'];

function JoinMatch({ id }: { id: string }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const join = useJoinMatch(id);

  if (CLOSED.some((code) => isApiError(join.error, code))) {
    return <Unavailable reason={errorMessage(join.error)} />;
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('online.joinTitle')} />
      <Card className="flex flex-col items-start gap-4">
        <p className="text-muted">{t('online.joinBody')}</p>
        {join.error && <Alert tone="danger">{errorMessage(join.error)}</Alert>}
        <Button size="lg" loading={join.isPending} onClick={() => join.mutate()}>
          {t('online.join')}
        </Button>
      </Card>
    </div>
  );
}

function WaitingRoom({ match }: { match: Match }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const cancel = useResignMatch(match.id);
  const [confirming, setConfirming] = useState(false);
  const url = `${window.location.origin}${paths.match(match.id)}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title={t('online.waitingTitle')} subtitle={t('online.waitingBody')} className="mb-0" />
      <Card className="flex flex-col gap-5">
        <ShareLink url={url} />
        <p role="status" className="flex items-center gap-3 text-muted">
          <Spinner className="text-primary" />
          {t('online.waitingStatus')}
        </p>
        {cancel.error && <Alert tone="danger">{errorMessage(cancel.error)}</Alert>}
        <Button variant="secondary" className="self-start" onClick={() => setConfirming(true)}>
          {t('online.cancelMatch')}
        </Button>
      </Card>
      <GameSummary settings={match.settings} />
      <ConfirmDialog
        open={confirming}
        title={t('online.cancelTitle')}
        confirmLabel={t('online.cancelMatch')}
        confirmVariant="danger"
        loading={cancel.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() => cancel.mutate(undefined, { onSettled: () => setConfirming(false) })}
      >
        {t('online.cancelBody')}
      </ConfirmDialog>
    </div>
  );
}

function MatchBoard({ match, syncFailed }: { match: Match; syncFailed: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const move = useMakeMove(match.id);
  const resign = useResignMatch(match.id);
  const rematch = useCreateMatch();
  const [confirmingResign, setConfirmingResign] = useState(false);

  const theme = toBoardTheme(match.settings.theme);
  const me = viewerOf(match);
  const opponent = opponentOf(match);
  const outcome = outcomeOf(match);
  const myTurn = isMyTurn(match);
  const playing = match.status === 'in_progress';
  const nameOf = (seat: 1 | 2) => match.players.find((player) => player.seat === seat)?.displayName ?? '?';

  const status = playing
    ? myTurn
      ? t('game.yourTurn')
      : t('online.waitingFor', { name: opponent?.displayName ?? '?' })
    : outcome === 'won'
      ? t('online.resultWon')
      : outcome === 'lost'
        ? t('online.resultLost')
        : outcome === 'draw'
          ? t('online.resultDraw')
          : t('online.resultCancelled');

  const loser = match.players.find((player) => player.result === 'loss');
  const reason =
    match.endReason === 'resign' && loser
      ? loser.seat === match.yourSeat
        ? t('online.youResigned')
        : t('online.byResignation', { name: loser.displayName })
      : match.endReason === 'disconnect' && loser
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

  function startRematch() {
    if (!opponent) return;
    const settings = normalizeSettings({ ...match.settings, theme });
    rematch.mutate(
      { settings, opponentDisplayName: opponent.displayName },
      { onSuccess: (created) => navigate(paths.match(created.id)) },
    );
  }

  return (
    <>
      <PageHeader
        title={`${nameOf(1)} ${t('online.vs')} ${nameOf(2)}`}
        actions={
          playing && (
            <Button variant="secondary" onClick={() => setConfirmingResign(true)}>
              <FlagIcon />
              {t('online.resign')}
            </Button>
          )
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {([1, 2] as const).map((seat) => (
              <PlayerTag
                key={seat}
                seat={seat}
                theme={theme}
                name={seat === me?.seat ? `${nameOf(seat)} (${t('online.you')})` : nameOf(seat)}
                note={t(`themes.${theme}.seat${seat}`)}
                active={playing && match.game.current === seat}
                align={seat === 2 ? 'end' : 'start'}
              />
            ))}
          </div>

          <div
            className={cn(
              'rounded-xl px-4 py-2 text-center',
              outcome === 'won' && 'bg-success-soft text-success',
              outcome === 'lost' && 'bg-danger-soft text-danger',
              (outcome === 'draw' || outcome === 'cancelled') && 'bg-surface-2',
            )}
          >
            <p className="text-lg font-bold">{status}</p>
            {reason && <p className="text-sm">{reason}</p>}
          </div>

          {move.error && <Alert tone="danger">{errorMessage(move.error)}</Alert>}
          {resign.error && <Alert tone="danger">{errorMessage(resign.error)}</Alert>}
          {syncFailed && <Alert tone="warning">{t('online.syncError')}</Alert>}

          <Board
            theme={theme}
            model={toBoardModel(match)}
            onPlay={
              playing
                ? (col) => {
                    move.reset();
                    move.mutate(col);
                  }
                : undefined
            }
            disabled={!myTurn || move.isPending}
            previewSeat={myTurn ? match.yourSeat : null}
          />
        </div>

        <aside className="flex flex-col gap-4">
          {!playing && (
            <Card className="flex flex-col gap-2 p-4 sm:p-4">
              {rematch.error && <Alert tone="danger">{errorMessage(rematch.error)}</Alert>}
              {opponent && (
                <Button loading={rematch.isPending} onClick={startRematch}>
                  {t('online.rematch')}
                </Button>
              )}
              <Link to="/play/online" className={buttonClass({ variant: 'secondary' })}>
                {t('online.newMatch')}
              </Link>
              <Link to="/matches" className={buttonClass({ variant: 'ghost' })}>
                {t('online.allMatches')}
              </Link>
            </Card>
          )}
          <GameSummary settings={match.settings} moveCount={match.game.moveCount} />
        </aside>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <ConfirmDialog
        open={confirmingResign}
        title={t('online.resignTitle')}
        confirmLabel={t('online.resign')}
        confirmVariant="danger"
        loading={resign.isPending}
        onClose={() => setConfirmingResign(false)}
        onConfirm={() => resign.mutate(undefined, { onSettled: () => setConfirmingResign(false) })}
      >
        {t('online.resignBody')}
      </ConfirmDialog>
    </>
  );
}
