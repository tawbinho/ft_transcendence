import type { Match, MatchSummary } from '@/features/matches/types';
import { makeMatch } from '../factories';

// Matches for the watch and history tests.

/** One row of a match list: alice (seat 1, the viewer) against bob, won by alice. */
export function makeMatchSummary(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    id: 'm1',
    status: 'finished',
    endReason: 'win',
    settings: { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
    createdAt: '2026-10-08T10:00:00.000Z',
    endedAt: '2026-10-08T10:10:00.000Z',
    players: [
      { seat: 1, userId: 'u1', displayName: 'alice', result: 'win' },
      { seat: 2, userId: 'u2', displayName: 'bob', result: 'loss' },
    ],
    yourSeat: 1,
    winnerSeat: 1,
    moveCount: 7,
    ...overrides,
  };
}

/** Seat 1 stacks column 0 and seat 2 column 1: seat 1 wins with the seventh move. */
export const WINNING_MOVES = [0, 1, 0, 1, 0, 1, 0];

/** A finished match won by alice (seat 1) in seven moves. */
export function makeFinishedMatch(overrides: Partial<Match> = {}): Match {
  return makeMatch(
    {
      status: 'finished',
      endReason: 'win',
      endedAt: '2026-10-08T10:10:00.000Z',
      winnerSeat: 1,
      players: [
        { seat: 1, userId: 'u1', displayName: 'alice', result: 'win' },
        { seat: 2, userId: 'u2', displayName: 'bob', result: 'loss' },
      ],
      ...overrides,
    },
    WINNING_MOVES,
  );
}
