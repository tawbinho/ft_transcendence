import { useCallback, useMemo, useState } from 'react';
import { canDrop, replay, type GameState } from './engine';
import type { BoardSettings } from './settings';

export interface OfflineGame {
  game: GameState;
  /** Columns played so far, in order. */
  moves: readonly number[];
  /** Plays for the player whose turn it is. */
  play: (col: number) => void;
  /** Takes back the last move. */
  undo: () => void;
  canUndo: boolean;
  restart: () => void;
}

/**
 * State of a game for two people on one screen, played in this browser. The
 * move list is the only state; the board is derived from it with the engine,
 * so undo is just "drop the last move".
 */
export function useOfflineGame(settings: BoardSettings): OfflineGame {
  const [moves, setMoves] = useState<readonly number[]>([]);
  const game = useMemo(() => replay(settings, moves), [settings, moves]);

  const play = useCallback(
    (col: number) => {
      if (canDrop(game, col)) setMoves([...moves, col]);
    },
    [game, moves],
  );

  const undo = useCallback(() => setMoves(moves.slice(0, -1)), [moves]);
  const restart = useCallback(() => setMoves([]), []);

  return { game, moves, play, undo, canUndo: moves.length > 0, restart };
}
