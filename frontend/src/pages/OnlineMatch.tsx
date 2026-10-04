import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isOk } from '@cf/shared';
import type { ApiResult, MatchStateDTO } from '@cf/shared';
import { getSocket } from '../lib/socket';
import { useAuth } from '../features/auth/AuthContext';
import { Board } from '../features/game/Board';
import { Button, Card, Spinner } from '../components/ui';

export function OnlineMatch() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useMemo(() => getSocket(), []);

  const [state, setState] = useState<MatchStateDTO | null>(null);
  const [error, setError] = useState('');
  const [moveError, setMoveError] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const onState = (s: MatchStateDTO) => {
      setState(s);
      setReconnecting(false);
    };
    const onOver = (s: MatchStateDTO) => setState(s);
    const onDisconnected = () => setReconnecting(true);
    const onReconnected = () => setReconnecting(false);

    socket.on('match:state', onState);
    socket.on('match:over', onOver);
    socket.on('opponent:disconnected', onDisconnected);
    socket.on('opponent:reconnected', onReconnected);

    const join = () =>
      socket.emit('match:join', { matchId: id }, (res: ApiResult<MatchStateDTO>) => {
        if (isOk(res)) setState(res.data);
        else setError(res.error.message);
      });
    if (socket.connected) join();
    else socket.once('connect', join);

    return () => {
      socket.off('match:state', onState);
      socket.off('match:over', onOver);
      socket.off('opponent:disconnected', onDisconnected);
      socket.off('opponent:reconnected', onReconnected);
      socket.emit('spectate:leave', { matchId: id });
    };
  }, [id, socket]);

  const game = state?.game;
  const mySeat = state?.players.find((p) => p.user?.id === user?.id)?.seat ?? null;
  const isSpectator = state !== null && mySeat === null;
  const waiting = state !== null && state.players.length < 2 && !isSpectator;
  const myTurn = Boolean(mySeat) && game?.status === 'playing' && game.current === mySeat;

  function move(col: number) {
    if (!id || !myTurn) return;
    setMoveError('');
    socket.emit('match:move', { matchId: id, column: col }, (res: ApiResult<MatchStateDTO>) => {
      if (!isOk(res)) setMoveError(res.error.message);
    });
  }

  function resign() {
    if (id) socket.emit('match:resign', { matchId: id }, () => undefined);
  }

  function copyInvite() {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-danger">{error}</p>
        <Link to="/play" className="mt-4 inline-block underline underline-offset-2">
          {t('common.back')}
        </Link>
      </Card>
    );
  }
  if (!state || !game) return <Spinner />;

  let status = '';
  if (game.status === 'won') {
    const winnerName = state.players.find((p) => p.seat === game.winner)?.user?.displayName ?? '';
    status = mySeat
      ? game.winner === mySeat
        ? t('game.youWon')
        : t('game.youLost')
      : t('game.wonBy', { name: winnerName });
  } else if (game.status === 'draw') status = t('game.draw');
  else if (waiting) status = t('game.waiting');
  else if (isSpectator) status = t('game.spectating');
  else status = myTurn ? t('game.yourTurn') : t('game.opponentTurn');

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/play" className="text-sm text-muted underline underline-offset-2">
          ← {t('common.back')}
        </Link>
        <p className="rounded-2xl bg-raised px-4 py-2 font-display font-bold shadow-clay-sm">{status}</p>
      </div>

      {reconnecting && (
        <div className="rounded-2xl bg-warning px-4 py-2 text-center font-bold text-white">
          {t('game.reconnecting')}
        </div>
      )}

      <Board game={game} onDrop={isSpectator ? undefined : move} disabled={!myTurn} />
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {moveError && <p className="text-center text-sm text-danger">{moveError}</p>}

      {waiting && (
        <Card>
          <p className="mb-2 text-sm text-muted">{t('game.shareInvite')}</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={window.location.href}
              className="flex-1 rounded-xl bg-well px-3 py-2 text-sm shadow-clay-in"
              aria-label="Invite link"
            />
            <Button onClick={copyInvite}>{copied ? t('game.copied') : t('game.copy')}</Button>
          </div>
        </Card>
      )}

      {isSpectator && (
        <p className="text-center text-sm text-muted">{t('spectate.viewers', { count: state.spectators })}</p>
      )}

      <div className="flex justify-center gap-3">
        {game.status === 'playing' && !isSpectator && !waiting && (
          <Button variant="danger" onClick={resign}>
            {t('game.resign')}
          </Button>
        )}
        {game.status !== 'playing' && (
          <Link to="/play">
            <Button>{t('game.rematch')}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
