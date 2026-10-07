// WHY THIS FILE EXISTS
// The vocabulary of the Connect Four engine: what a board, a move and a game
// state look like. The engine is PURE TypeScript (no Nest, no database, no
// HTTP) so the rules can be tested alone and reused by the match service, the
// WebSocket gateway and the AI opponent.

// The two players. Seat 1 always plays first.
export type Seat = 1 | 2;

// One square of the board: 0 = empty, otherwise the seat that owns the disc.
export type Cell = 0 | Seat;

// A square, addressed by column (left to right, from 0) and row (from 0 at
// the BOTTOM of the board, because discs fall down).
export interface Position {
  col: number;
  row: number;
}

// The rules of one game. Customisable: this is what "game customisation"
// (board size, connect length) changes.
export interface GameSettings {
  cols: number; // number of columns
  rows: number; // number of rows
  winLength: number; // discs in a row needed to win (4 in classic Connect Four)
}

export const DEFAULT_SETTINGS: GameSettings = {
  cols: 7,
  rows: 6,
  winLength: 4,
};

// What the engine accepts. The match feature may restrict this further.
export const SETTINGS_LIMITS = {
  minSize: 3, // smallest number of columns or rows
  maxSize: 12, // largest number of columns or rows
  minWinLength: 3,
} as const;

// playing = moves are still accepted; won = someone connected enough discs;
// draw = the board is full with no winner.
export type GameStatus = 'playing' | 'won' | 'draw';

// The whole state of a game at one moment. Everything is readonly: the engine
// never changes a state, it builds a new one for every move.
export interface GameState {
  readonly settings: GameSettings;
  // board[col][row], row 0 is the bottom. Example: board[3][0] is the bottom
  // square of the fourth column.
  readonly board: readonly (readonly Cell[])[];
  // The seat that plays next (while status is 'playing').
  readonly current: Seat;
  readonly status: GameStatus;
  // Set when status is 'won'.
  readonly winner: Seat | null;
  // The run of connected discs that won, so the UI can highlight it.
  readonly winningLine: readonly Position[] | null;
  // The square of the last disc dropped, or null before the first move.
  readonly lastMove: Position | null;
  // How many discs are on the board.
  readonly moveCount: number;
}
