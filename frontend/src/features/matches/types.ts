import type { Position, Seat } from '@/features/game/engine';
import type { Page } from '@/lib/api/types';

// The match shapes sent by the backend (backend/src/modules/matches/match-view.ts).
// Dates arrive as ISO strings.

export type MatchStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned';
export type MatchEndReason = 'win' | 'draw' | 'resign' | 'disconnect';
export type PlayerResult = 'win' | 'loss' | 'draw';

export interface MatchPlayer {
  seat: Seat;
  userId: string;
  displayName: string;
  /** null until the match is over. */
  result: PlayerResult | null;
}

export interface MatchSettings {
  cols: number;
  rows: number;
  winLength: number;
  theme: string;
}

export interface MatchGame {
  /** board[col][row], row 0 at the bottom. */
  board: number[][];
  /** Whose turn it is; null unless the match is in progress. */
  current: Seat | null;
  lastMove: Position | null;
  winningLine: Position[] | null;
  moveCount: number;
  /** The columns played, in order. */
  moves: number[];
}

export interface Match {
  id: string;
  status: MatchStatus;
  endReason: MatchEndReason | null;
  settings: MatchSettings;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  /** Ordered by seat. */
  players: MatchPlayer[];
  /** The viewer's seat, or null when they are not a player. */
  yourSeat: Seat | null;
  winnerSeat: Seat | null;
  game: MatchGame;
}

export interface MatchSummary {
  id: string;
  status: MatchStatus;
  endReason: MatchEndReason | null;
  settings: MatchSettings;
  createdAt: string;
  endedAt: string | null;
  players: MatchPlayer[];
  yourSeat: Seat | null;
  winnerSeat: Seat | null;
  moveCount: number;
}

export type MatchPage = Page<MatchSummary>;

export interface CreateMatchInput {
  settings?: { cols: number; rows: number; winLength: number; theme: string };
  /** Reserve the match for one player; omit for a match anyone with the link can join. */
  opponentDisplayName?: string;
}

export interface ListMatchesParams {
  status?: MatchStatus;
  limit?: number;
  offset?: number;
}
