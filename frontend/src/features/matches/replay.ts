import { createGame, drop, type GameSettings, type GameState, type Seat } from '@/features/game/engine';
import type { BoardModel } from '@/features/game/components/Board';

// Replaying a finished match: every position it went through, computed with the
// same engine that plays the game, so a replay can never disagree with the match.

/**
 * Every position of a match: frames[0] is the empty board, frames[n] the board
 * after n moves. It stops at the first move the rules refuse, so a damaged move
 * list shows the moves that were fine instead of breaking the page.
 */
export function replayFrames(settings: Partial<GameSettings>, moves: readonly number[]): GameState[] {
  const frames = [createGame(settings)];
  for (const col of moves) {
    try {
      frames.push(drop(frames[frames.length - 1]!, col));
    } catch {
      break;
    }
  }
  return frames;
}

/** The position after `step` moves; a step outside the match is moved to the nearest end. */
export function positionAfter(frames: readonly GameState[], step: number): GameState {
  return frames[Math.max(0, Math.min(step, frames.length - 1))]!;
}

/** The board a position is drawn from. */
export function toReplayModel(state: GameState): BoardModel {
  return {
    cols: state.settings.cols,
    rows: state.settings.rows,
    board: state.board,
    lastMove: state.lastMove,
    winningLine: state.winningLine,
  };
}

/** Who played move number `n` (the first move is number 1, played by seat 1). */
export function seatOfMove(n: number): Seat {
  return n % 2 === 1 ? 1 : 2;
}

/** Where a key takes the replay: the new step, or null when the key does nothing here. */
export function stepForKey(key: string, step: number, total: number): number | null {
  const target: Record<string, number> = {
    ArrowLeft: step - 1,
    ArrowRight: step + 1,
    Home: 0,
    End: total,
  };
  const next = target[key];
  return next === undefined ? null : Math.max(0, Math.min(total, next));
}
