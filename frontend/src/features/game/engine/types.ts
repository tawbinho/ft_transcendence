// The vocabulary of the Connect Four rules. These mirror the backend engine
// (backend/src/modules/matches/engine) so a local game and an online match
// follow exactly the same rules.

/** The two players. Seat 1 always plays first. */
export type Seat = 1 | 2;

/** One square: 0 = empty, otherwise the seat that owns the disc. */
export type Cell = 0 | Seat;

/** A square: column from 0 on the left, row from 0 at the BOTTOM. */
export interface Position {
  col: number;
  row: number;
}

export interface GameSettings {
  cols: number;
  rows: number;
  /** Discs in a row needed to win (4 in classic Connect Four). */
  winLength: number;
}

export const DEFAULT_SETTINGS: GameSettings = { cols: 7, rows: 6, winLength: 4 };

/** What the rules allow. Online matches use the narrower MATCH_LIMITS. */
export const SETTINGS_LIMITS = {
  minSize: 3,
  maxSize: 12,
  minWinLength: 3,
} as const;

export type GameStatus = 'playing' | 'won' | 'draw';

export interface GameState {
  readonly settings: GameSettings;
  /** board[col][row], row 0 is the bottom. */
  readonly board: readonly (readonly Cell[])[];
  /** Whose turn it is (meaningless once the game is over). */
  readonly current: Seat;
  readonly status: GameStatus;
  readonly winner: Seat | null;
  /** Every disc of the winning run, for highlighting. */
  readonly winningLine: readonly Position[] | null;
  readonly lastMove: Position | null;
  readonly moveCount: number;
}
