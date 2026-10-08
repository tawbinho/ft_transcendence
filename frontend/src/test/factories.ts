import { replay } from '@/features/game/engine';
import type { Match } from '@/features/matches/types';

// Test data shared by several test files.

/** An online match between alice (seat 1, the viewer) and bob, after `moves`. */
export function makeMatch(overrides: Partial<Match> = {}, moves: number[] = []): Match {
  const state = replay({}, moves);
  return {
    id: 'm1',
    status: 'in_progress',
    endReason: null,
    settings: { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
    createdAt: '2026-10-08T10:00:00.000Z',
    startedAt: '2026-10-08T10:01:00.000Z',
    endedAt: null,
    players: [
      { seat: 1, userId: 'u1', displayName: 'alice', result: null },
      { seat: 2, userId: 'u2', displayName: 'bob', result: null },
    ],
    yourSeat: 1,
    winnerSeat: null,
    game: {
      board: state.board.map((column) => [...column]),
      current: state.current,
      lastMove: state.lastMove,
      winningLine: null,
      moveCount: state.moveCount,
      moves,
    },
    ...overrides,
  };
}
