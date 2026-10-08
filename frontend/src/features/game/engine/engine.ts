import { GameRuleError } from './errors';
import {
  DEFAULT_SETTINGS,
  SETTINGS_LIMITS,
  type Cell,
  type GameSettings,
  type GameState,
  type Position,
  type Seat,
} from './types';

// The rules of Connect Four as pure functions over an immutable state, ported
// from the backend engine. Every function that "changes" the game returns a
// NEW state, so React can compare states by reference and the computer
// opponent can try moves freely.

function isWholeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

/** Checks the settings and returns a clean copy, or throws INVALID_SETTINGS. */
export function validateSettings(settings: GameSettings): GameSettings {
  const { cols, rows, winLength } = settings;
  const { minSize, maxSize, minWinLength } = SETTINGS_LIMITS;

  if (!isWholeNumber(cols) || cols < minSize || cols > maxSize) {
    throw new GameRuleError('INVALID_SETTINGS', `cols must be a whole number from ${minSize} to ${maxSize}`);
  }
  if (!isWholeNumber(rows) || rows < minSize || rows > maxSize) {
    throw new GameRuleError('INVALID_SETTINGS', `rows must be a whole number from ${minSize} to ${maxSize}`);
  }
  const longestLine = Math.min(cols, rows);
  if (!isWholeNumber(winLength) || winLength < minWinLength || winLength > longestLine) {
    throw new GameRuleError(
      'INVALID_SETTINGS',
      `winLength must be a whole number from ${minWinLength} to ${longestLine}`,
    );
  }
  return { cols, rows, winLength };
}

/** A new, empty game. Missing settings fall back to the classic 7x6, four in a row. */
export function createGame(settings: Partial<GameSettings> = {}): GameState {
  const valid = validateSettings({ ...DEFAULT_SETTINGS, ...settings });
  return {
    settings: valid,
    board: Array.from({ length: valid.cols }, () => Array<Cell>(valid.rows).fill(0)),
    current: 1,
    status: 'playing',
    winner: null,
    winningLine: null,
    lastMove: null,
    moveCount: 0,
  };
}

/** Whether `col` can take a disc right now. Never throws. */
export function canDrop(state: GameState, col: number): boolean {
  return (
    state.status === 'playing' &&
    isWholeNumber(col) &&
    col >= 0 &&
    col < state.settings.cols &&
    state.board[col]![state.settings.rows - 1] === 0
  );
}

/** The columns that can take a disc, from left to right. */
export function legalMoves(state: GameState): number[] {
  const moves: number[] = [];
  for (let col = 0; col < state.settings.cols; col++) {
    if (canDrop(state, col)) moves.push(col);
  }
  return moves;
}

/**
 * Drops the current player's disc in `col` and returns the new state.
 * Throws GAME_OVER, INVALID_COLUMN or COLUMN_FULL for an illegal move.
 */
export function drop(state: GameState, col: number): GameState {
  if (state.status !== 'playing') {
    throw new GameRuleError('GAME_OVER', 'The game is already over');
  }
  const { cols, rows, winLength } = state.settings;
  if (!isWholeNumber(col) || col < 0 || col >= cols) {
    throw new GameRuleError('INVALID_COLUMN', `Column must be from 0 to ${cols - 1}`);
  }

  const row = state.board[col]!.indexOf(0);
  if (row === -1) {
    throw new GameRuleError('COLUMN_FULL', 'This column is full');
  }

  const seat = state.current;
  const position: Position = { col, row };

  // Copy only the column that changes; the others are shared.
  const column = state.board[col]!.slice();
  column[row] = seat;
  const board = state.board.slice();
  board[col] = column;

  const moveCount = state.moveCount + 1;
  const winningLine = findWinningLine(board, winLength, position, seat);
  const status = winningLine ? 'won' : moveCount === cols * rows ? 'draw' : 'playing';

  return {
    settings: state.settings,
    board,
    current: otherSeat(seat),
    status,
    winner: winningLine ? seat : null,
    winningLine,
    lastMove: position,
    moveCount,
  };
}

/** Plays a list of columns from a fresh game. Throws on the first illegal move. */
export function replay(settings: Partial<GameSettings>, moves: readonly number[]): GameState {
  return moves.reduce<GameState>((state, col) => drop(state, col), createGame(settings));
}

export function otherSeat(seat: Seat): Seat {
  return seat === 1 ? 2 : 1;
}

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal going up to the right
  [1, -1], // diagonal going down to the right
];

// Only a line through the disc just played can be new, so only the four lines
// through that square are checked. The whole run is returned (it can be
// longer than winLength when the disc joins two runs).
function findWinningLine(
  board: readonly (readonly Cell[])[],
  winLength: number,
  last: Position,
  seat: Seat,
): Position[] | null {
  const owns = (col: number, row: number) => board[col]?.[row] === seat;

  for (const [dc, dr] of DIRECTIONS) {
    const run: Position[] = [last];
    for (let c = last.col + dc, r = last.row + dr; owns(c, r); c += dc, r += dr) {
      run.push({ col: c, row: r });
    }
    for (let c = last.col - dc, r = last.row - dr; owns(c, r); c -= dc, r -= dr) {
      run.unshift({ col: c, row: r });
    }
    if (run.length >= winLength) return run;
  }
  return null;
}
