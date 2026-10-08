import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { RefreshIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, buttonClass } from '@/components/ui';
import { GameBoard } from '@/features/game/components/GameBoard';
import { GameLayout } from '@/features/game/components/GameLayout';
import { GameStatus } from '@/features/game/components/GameStatus';
import { GameSummary } from '@/features/game/components/GameSummary';
import { MoveAnnouncer } from '@/features/game/components/MoveAnnouncer';
import { PlayersBar } from '@/features/game/components/PlayersBar';
import type { Seat } from '@/features/game/engine';
import { useOfflineGame } from '@/features/game/useOfflineGame';
import type { Slot } from '@/features/tournaments/bracket';
import type { LocalTournament } from '@/features/tournaments/local';
import type { PairingRef } from '@/features/tournaments/view';

/** One match of a same-screen tournament: the first player of the pairing starts. */
export function LocalMatch({
  tournament,
  pairing,
  onWinner,
  onLeave,
}: {
  tournament: LocalTournament;
  pairing: PairingRef;
  /** The match is over and the winner chose to continue. */
  onWinner: (slot: Slot) => void;
  /** Back to the bracket; the match starts again from the first move next time. */
  onLeave: () => void;
}) {
  const { t } = useTranslation();
  const { settings } = tournament;
  const players = tournament.bracket[pairing.round]![pairing.index]!.players;
  const { game, moves, play, restart } = useOfflineGame(settings, { kind: 'human' });

  const nameOf = (seat: Seat) => players[seat - 1] ?? '?';
  const over = game.status !== 'playing';
  const status =
    game.status === 'won' && game.winner !== null
      ? t('game.wins', { name: nameOf(game.winner) })
      : game.status === 'draw'
        ? t('localTournament.drawReplay')
        : t('game.turnOf', { name: nameOf(game.current) });

  const lastSeat: Seat = moves.length % 2 === 1 ? 1 : 2;
  const announcement = game.lastMove
    ? [t('game.playedColumn', { name: nameOf(lastSeat), n: game.lastMove.col + 1 }), over && status]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <>
      <PageHeader
        title={`${nameOf(1)} ${t('localTournament.vs')} ${nameOf(2)}`}
        subtitle={t('localTournament.title')}
        actions={
          !over && (
            <Button variant="secondary" onClick={onLeave}>
              {t('localTournament.backToBracket')}
            </Button>
          )
        }
      />
      <GameLayout
        aside={
          <>
            <Alert tone="info">{t('localTournament.matchHint')}</Alert>
            <GameSummary settings={settings} moveCount={game.moveCount} />
            <Link to="/tournaments" className={buttonClass({ variant: 'ghost' })}>
              {t('tournaments.title')}
            </Link>
          </>
        }
      >
        <PlayersBar theme={settings.theme} names={[nameOf(1), nameOf(2)]} activeSeat={over ? null : game.current} />
        <GameStatus tone={game.status === 'won' ? 'win' : game.status === 'draw' ? 'draw' : 'none'}>
          {status}
        </GameStatus>
        {over && (
          <div className="flex flex-wrap justify-center gap-2">
            {game.status === 'won' && game.winner !== null ? (
              <Button size="lg" onClick={() => onWinner(game.winner === 1 ? 0 : 1)}>
                {t('localTournament.continue')}
              </Button>
            ) : (
              <Button size="lg" onClick={restart}>
                <RefreshIcon />
                {t('localTournament.replay')}
              </Button>
            )}
          </div>
        )}
        <GameBoard
          autoFocus
          theme={settings.theme}
          model={{ ...settings, board: game.board, lastMove: game.lastMove, winningLine: game.winningLine }}
          onPlay={play}
          disabled={over}
          previewSeat={over ? null : game.current}
        />
      </GameLayout>
      <MoveAnnouncer text={announcement} />
    </>
  );
}
