import { GameRuleError } from './game.errors.js';
import {
  DEFAULT_SETTINGS,
  SETTINGS_LIMITS,
  type Cell,
  type GameSettings,
  type GameState,
  type Position,
  type Seat,
} from './game.types.js';

// WHY THIS FILE EXISTS
// The rules of Connect Four, as plain functions over an immutable state. No
// framework, no database: the match service, the WebSocket gateway and the AI
// all call these. The server is the judge of every move, so the browser can
// never decide an outcome.
//
// Every function that "changes" the game returns a NEW state and leaves the
// old one untouched. That makes the AI's search safe (it can try a move and
// throw the result away) and rules out a whole class of bugs.

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function isWholeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

// Checks the settings and returns a clean copy. Throws INVALID_SETTINGS when
// the board is too small or too large, or when nobody could ever win.
export function validateSettings(settings: GameSettings): GameSettings {
  const { cols, rows, winLength } = settings;
  const { minSize, maxSize, minWinLength } = SETTINGS_LIMITS;

  if (!isWholeNumber(cols) || cols < minSize || cols > maxSize) {
    throw new GameRuleError(
      'INVALID_SETTINGS',
      `cols must be a whole number from ${minSize} to ${maxSize}`,
    );
  }
  if (!isWholeNumber(rows) || rows < minSize || rows > maxSize) {
    throw new GameRuleError(
      'INVALID_SETTINGS',
      `rows must be a whole number from ${minSize} to ${maxSize}`,
    );
  }
  // The line must fit along the SMALLER side of the board, so that all four
  // directions (horizontal, vertical, both diagonals) can complete it. A
  // longer line would make some directions impossible and the game lopsided.
  const longestLine = Math.min(cols, rows);
  if (
    !isWholeNumber(winLength) ||
    winLength < minWinLength ||
    winLength > longestLine
  ) {
    throw new GameRuleError(
      'INVALID_SETTINGS',
      `winLength must be a whole number from ${minWinLength} to ${longestLine}`,
    );
  }
  return { cols, rows, winLength };
}

// ---------------------------------------------------------------------------
// Creating and reading a game
// ---------------------------------------------------------------------------

// A new game with an empty board. Missing settings fall back to the classic
// 7 x 6, four-in-a-row game. Seat 1 plays first.
export function createGame(settings: Partial<GameSettings> = {}): GameState {
  const valid = validateSettings({ ...DEFAULT_SETTINGS, ...settings });
  return {
    settings: valid,
    // One array per column, filled with 0 (empty).
    board: Array.from({ length: valid.cols }, () =>
      Array<Cell>(valid.rows).fill(0),
    ),
    current: 1,
    status: 'playing',
    winner: null,
    winningLine: null,
    lastMove: null,
    moveCount: 0,
  };
}

// Can a disc be dropped in this column right now? False when the game is over,
// the column does not exist, or it is full. Never throws.
export function canDrop(state: GameState, col: number): boolean {
  return (
    state.status === 'playing' &&
    isWholeNumber(col) &&
    col >= 0 &&
    col < state.settings.cols &&
    // The top square of the column is still empty.
    state.board[col]![state.settings.rows - 1] === 0
  );
}

// Every column where a disc can currently be dropped, left to right. Empty
// once the game is over. This is what the AI picks its move from.
export function legalMoves(state: GameState): number[] {
  const moves: number[] = [];
  for (let col = 0; col < state.settings.cols; col++) {
    if (canDrop(state, col)) moves.push(col);
  }
  return moves;
}

// ---------------------------------------------------------------------------
// Playing a move
// ---------------------------------------------------------------------------

// The current player drops a disc in `col`. It falls to the lowest free square.
// Returns the NEW state. Throws GameRuleError if the move is not allowed.
export function drop(state: GameState, col: number): GameState {
  if (state.status !== 'playing') {
    throw new GameRuleError('GAME_OVER', 'The game is already over');
  }
  const { cols, rows, winLength } = state.settings;
  if (!isWholeNumber(col) || col < 0 || col >= cols) {
    throw new GameRuleError(
      'INVALID_COLUMN',
      `Column must be from 0 to ${cols - 1}`,
    );
  }

  // Discs fill a column from the bottom, so the first empty square is where
  // the disc lands.
  const row = state.board[col]!.indexOf(0);
  if (row === -1) {
    throw new GameRuleError('COLUMN_FULL', 'This column is full');
  }

  const seat = state.current;
  const position: Position = { col, row };

  // Build the new board by copying only the column that changed; the other
  // columns are shared with the old state (they are never modified).
  const newColumn = state.board[col]!.slice();
  newColumn[row] = seat;
  const board = state.board.slice();
  board[col] = newColumn;

  const moveCount = state.moveCount + 1;
  const winningLine = findWinningLine(board, winLength, position, seat);

  // A win is checked BEFORE a draw: a disc that fills the last square and
  // completes a line is a win, not a draw.
  const status = winningLine
    ? 'won'
    : moveCount === cols * rows
      ? 'draw'
      : 'playing';

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

// Rebuilds a game from its settings and the list of columns played, in order.
// Used to restore a match from the saved moves (reconnecting, spectating,
// match history). Throws if the list contains an illegal move.
export function replay(
  settings: Partial<GameSettings>,
  moves: readonly number[],
): GameState {
  return moves.reduce<GameState>(
    (state, col) => drop(state, col),
    createGame(settings),
  );
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function otherSeat(seat: Seat): Seat {
  return seat === 1 ? 2 : 1;
}

// The four lines through a square: horizontal, vertical and the two diagonals.
// Each is given as ONE direction; the opposite direction is checked too.
const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal going up to the right
  [1, -1], // diagonal going down to the right
];

// Only the disc that was just dropped can have completed a line, so we only
// look around it: for each of the four lines, count the connected discs of the
// same seat on both sides. If the run (including the new disc) is long enough,
// it is returned in order from one end to the other; otherwise null.
// If one disc completes two lines at once, the first one found is returned.
function findWinningLine(
  board: readonly (readonly Cell[])[],
  winLength: number,
  last: Position,
  seat: Seat,
): Position[] | null {
  const owns = (col: number, row: number): boolean =>
    board[col]?.[row] === seat; // out of the board counts as "not ours"

  for (const [dc, dr] of DIRECTIONS) {
    const run: Position[] = [last];

    // Walk away from the last disc in one direction, then in the other.
    for (
      let c = last.col + dc, r = last.row + dr;
      owns(c, r);
      c += dc, r += dr
    ) {
      run.push({ col: c, row: r });
    }
    for (
      let c = last.col - dc, r = last.row - dr;
      owns(c, r);
      c -= dc, r -= dr
    ) {
      run.unshift({ col: c, row: r });
    }

    if (run.length >= winLength) return run;
  }
  return null;
}
