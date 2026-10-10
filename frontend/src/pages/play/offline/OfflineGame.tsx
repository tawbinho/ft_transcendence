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
import { ThinkingDots } from '../components/ThinkingDots';
import { useJustWon } from '../components/useJustWon';
import { GameActions } from './GameActions';
import { moveAnnouncement, resultDetail, seatName, statusText, statusTone, type Players } from './offlineText';
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
  const { settings, opponent } = session;
  const { game, moves, play, undo, canUndo, restart, computerThinking } = useOfflineGame(settings, opponent);

  // Changes with every new game, so the board is drawn again and takes keyboard focus again.
  const [round, setRound] = useState(0);

  const computerSeat = opponent.kind === 'computer' ? opponent.computerSeat : null;
  const players: Players = { computerSeat, names: session.names };
  const over = game.status !== 'playing';
  // Against the computer only your own win is a party; between two people any win is.
  const celebrate = useJustWon(game.status === 'won' && game.winner !== computerSeat);

  const text = statusText(game, players, computerThinking, t);
  const status = computerThinking ? (
    <>
      {text}
      <ThinkingDots />
    </>
  ) : (
    text
  );

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
            <GameSummary
              settings={settings}
              moveCount={game.moveCount}
              difficulty={opponent.kind === 'computer' ? opponent.difficulty : undefined}
            />
            <KeysHint />
          </>
        }
      >
        <PlayersBar
          theme={settings.theme}
          names={[seatName(1, players, t), seatName(2, players, t)]}
          activeSeat={over ? null : game.current}
        />
        <GameStatus tone={statusTone(game, computerSeat)} detail={resultDetail(game, t)}>
          {status}
        </GameStatus>
        <GameBoard
          key={round}
          autoFocus
          theme={settings.theme}
          model={{ ...settings, board: game.board, lastMove: game.lastMove, winningLine: game.winningLine }}
          onPlay={play}
          disabled={over || computerThinking}
          previewSeat={over || computerThinking ? null : game.current}
        />
      </GameLayout>
      <MoveAnnouncer text={moveAnnouncement(game, moves.length, players, t)} />
      {celebrate && <Celebration theme={settings.theme} />}
    </>
  );
}
