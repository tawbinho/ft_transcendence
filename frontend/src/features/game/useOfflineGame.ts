import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createBotClient, type BotClient, type Difficulty } from './bot';
import { canDrop, otherSeat, replay, type GameState, type Seat } from './engine';
import type { BoardSettings } from './settings';

export type Opponent = { kind: 'human' } | { kind: 'computer'; difficulty: Difficulty; computerSeat: Seat };

export interface OfflineGame {
  game: GameState;
  /** Columns played so far, in order. */
  moves: readonly number[];
  /** Plays for the human whose turn it is; ignored while the computer is to move. */
  play: (col: number) => void;
  /** Takes back the last move (against the computer: back to your last turn). */
  undo: () => void;
  canUndo: boolean;
  restart: () => void;
  /** True while the computer is choosing its move. */
  computerThinking: boolean;
}

/** The computer answers no faster than this, so its move reads as a move. */
const MIN_THINK_MS = 450;

const seatOfMove = (index: number): Seat => (index % 2 === 0 ? 1 : 2);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * State of a game played in this browser: two people on one screen, or one
 * person against the computer. The move list is the only state; the board is
 * derived from it with the engine, so undo is just "drop the last moves".
 */
export function useOfflineGame(settings: BoardSettings, opponent: Opponent): OfflineGame {
  const [moves, setMoves] = useState<readonly number[]>([]);
  const game = useMemo(() => replay(settings, moves), [settings, moves]);

  const computerSeat = opponent.kind === 'computer' ? opponent.computerSeat : null;
  const difficulty = opponent.kind === 'computer' ? opponent.difficulty : null;
  const computerToPlay = computerSeat !== null && game.status === 'playing' && game.current === computerSeat;

  const botRef = useRef<BotClient | null>(null);
  useEffect(() => {
    const bot = createBotClient();
    botRef.current = bot;
    return () => {
      bot.dispose();
      botRef.current = null;
    };
  }, []);

  useEffect(() => {
    const bot = botRef.current;
    if (!computerToPlay || !difficulty || !bot) return;

    // Undo, restart or unmount cancel the answer to this position.
    let cancelled = false;
    const started = performance.now();
    bot
      .chooseMove(game, difficulty)
      .then(async (col) => {
        await wait(MIN_THINK_MS - (performance.now() - started));
        if (!cancelled) setMoves((current) => (current === moves ? [...current, col] : current));
      })
      .catch(() => {
        // The bot was stopped (the page closed); nothing to play.
      });
    return () => {
      cancelled = true;
    };
  }, [computerToPlay, difficulty, game, moves]);

  const play = useCallback(
    (col: number) => {
      if (computerToPlay || !canDrop(game, col)) return;
      setMoves([...moves, col]);
    },
    [computerToPlay, game, moves],
  );

  const undoCount = useMemo(() => {
    if (computerSeat === null) return moves.length > 0 ? 1 : 0;
    // Remove the computer's replies, then the human move before them.
    let kept = moves.length;
    while (kept > 0 && seatOfMove(kept - 1) === computerSeat) kept--;
    return kept === 0 ? 0 : moves.length - (kept - 1);
  }, [computerSeat, moves]);

  const undo = useCallback(() => {
    if (undoCount > 0) setMoves(moves.slice(0, moves.length - undoCount));
  }, [moves, undoCount]);

  const restart = useCallback(() => setMoves([]), []);

  return {
    game,
    moves,
    play,
    undo,
    canUndo: undoCount > 0,
    restart,
    computerThinking: computerToPlay,
  };
}

/** The seat the human plays when facing the computer. */
export function humanSeatAgainst(computerSeat: Seat): Seat {
  return otherSeat(computerSeat);
}
