import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { GameBoard } from '@/features/game/components/GameBoard';
import { GameLayout } from '@/features/game/components/GameLayout';
import { GameStatus } from '@/features/game/components/GameStatus';
import { GameSummary } from '@/features/game/components/GameSummary';
import { MoveAnnouncer } from '@/features/game/components/MoveAnnouncer';
import { PlayersBar } from '@/features/game/components/PlayersBar';
import { useOfflineGame } from '@/features/game/useOfflineGame';
import { Celebration } from '../components/Celebration';
import { KeysHint } from '../components/KeysHint';
import { useJustWon } from '../components/useJustWon';
import { GameActions } from './GameActions';
import { moveAnnouncement, resultDetail, seatName, statusText } from './offlineText';
import type { Session } from './session';

/** A game in progress: players, status, board and the buttons beside it. */
export function OfflineGame({
  title,
  session,
  onChangeSettings,
}: {
  title: string;
  session: Session;
  onChangeSettings: () => void;
}) {
  const { t } = useTranslation();
  const { settings, names } = session;
  const { game, moves, play, undo, canUndo, restart } = useOfflineGame(settings);

  // Changes with every new game, so the board is drawn again and takes keyboard focus again.
  const [round, setRound] = useState(0);

  const over = game.status !== 'playing';
  const celebrate = useJustWon(game.status === 'won');

  return (
    <>
      <PageHeader title={title} />
      <GameLayout
        aside={
          <>
            <GameActions
              gameOver={over}
              hasMoves={moves.length > 0}
              canUndo={canUndo}
              onRestart={() => {
                restart();
                setRound(round + 1);
              }}
              onUndo={undo}
              onChangeSettings={onChangeSettings}
            />
            <GameSummary settings={settings} moveCount={game.moveCount} />
            <KeysHint />
          </>
        }
      >
        <PlayersBar
          theme={settings.theme}
          names={[seatName(1, names, t), seatName(2, names, t)]}
          activeSeat={over ? null : game.current}
        />
        <GameStatus tone={over ? 'over' : 'none'} detail={resultDetail(game, t)}>
          {statusText(game, names, t)}
        </GameStatus>
        <GameBoard
          key={round}
          autoFocus
          theme={settings.theme}
          model={{ ...settings, board: game.board, lastMove: game.lastMove, winningLine: game.winningLine }}
          onPlay={play}
          disabled={over}
          previewSeat={over ? null : game.current}
        />
      </GameLayout>
      <MoveAnnouncer text={moveAnnouncement(game, moves.length, names, t)} />
      {celebrate && <Celebration theme={settings.theme} />}
    </>
  );
}
