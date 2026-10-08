import { canDrop, drop, replay, type Seat } from '@/features/game/engine';
import type { BoardModel } from '@/features/game/components/Board';
import type { Match, MatchPlayer, MatchSummary } from './types';

type MatchLike = Pick<Match | MatchSummary, 'status' | 'endReason' | 'players' | 'yourSeat' | 'winnerSeat'>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Match ids are UUIDs: anything else in the URL cannot be a match. */
export function isMatchId(value: string): boolean {
  return UUID.test(value);
}

/** How a match ended, seen by the viewer; null while it is not over. */
export type Outcome = 'won' | 'lost' | 'draw' | 'cancelled';

export function isOver(match: Pick<Match, 'status'>): boolean {
  return match.status === 'finished' || match.status === 'abandoned';
}

export function outcomeOf(match: MatchLike): Outcome | null {
  if (!isOver(match)) return null;
  if (match.winnerSeat !== null) return match.winnerSeat === match.yourSeat ? 'won' : 'lost';
  // Abandoned without a winner: cancelled before anyone joined.
  return match.status === 'abandoned' ? 'cancelled' : 'draw';
}

export function viewerOf(match: Pick<Match, 'players' | 'yourSeat'>): MatchPlayer | null {
  return match.players.find((player) => player.seat === match.yourSeat) ?? null;
}

export function opponentOf(match: Pick<Match, 'players' | 'yourSeat'>): MatchPlayer | null {
  return match.players.find((player) => player.seat !== match.yourSeat) ?? null;
}

export function playerInSeat(match: Pick<Match, 'players'>, seat: Seat): MatchPlayer | null {
  return match.players.find((player) => player.seat === seat) ?? null;
}

export function isMyTurn(match: Match): boolean {
  return match.status === 'in_progress' && match.yourSeat !== null && match.game.current === match.yourSeat;
}

export function canPlayColumn(match: Match, col: number): boolean {
  if (!isMyTurn(match)) return false;
  const { cols, rows } = match.settings;
  return col >= 0 && col < cols && match.game.board[col]?.[rows - 1] === 0;
}

export function toBoardModel(match: Match): BoardModel {
  return {
    cols: match.settings.cols,
    rows: match.settings.rows,
    board: match.game.board,
    lastMove: match.game.lastMove,
    winningLine: match.game.winningLine,
  };
}

/**
 * The match as it will look once `col` is accepted, computed with the local
 * engine so the disc drops instantly. The server's answer replaces it.
 * Returns null when the move is not legal locally.
 */
export function withMove(match: Match, col: number): Match | null {
  if (!canPlayColumn(match, col)) return null;
  let state;
  try {
    state = replay(match.settings, match.game.moves);
  } catch {
    return null;
  }
  if (!canDrop(state, col)) return null;
  const next = drop(state, col);
  return {
    ...match,
    game: {
      board: next.board.map((column) => [...column]),
      // Until the server confirms, nobody may play (even if the game ended).
      current: next.status === 'playing' ? next.current : null,
      lastMove: next.lastMove,
      winningLine: next.winningLine ? [...next.winningLine] : null,
      moveCount: next.moveCount,
      moves: [...match.game.moves, col],
    },
  };
}

/**
 * How often to ask the server for news, in milliseconds, or false to stop.
 * Without live events (src/app/realtime.ts) this is how moves arrive: often
 * while the opponent may move, less often while only a resignation could
 * change things. Not faster: the backend allows 100 requests a minute per
 * address, and two players testing on one computer share them.
 */
export function pollInterval(match: Match | undefined): number | false {
  if (!match || isOver(match)) return false;
  if (match.status === 'waiting') return 2_000;
  return isMyTurn(match) ? 5_000 : 2_000;
}
