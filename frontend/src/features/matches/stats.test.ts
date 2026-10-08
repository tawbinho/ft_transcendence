import { computeStats } from './stats';
import type { MatchSummary } from './types';

let nextId = 0;

function summary(winnerSeat: 1 | 2 | null, status: MatchSummary['status'] = 'finished'): MatchSummary {
  return {
    id: `m${nextId++}`,
    status,
    endReason: winnerSeat ? 'win' : 'draw',
    settings: { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
    createdAt: '2026-10-08T10:00:00.000Z',
    endedAt: '2026-10-08T10:10:00.000Z',
    players: [],
    yourSeat: 1,
    winnerSeat,
    moveCount: 20,
  };
}

describe('computeStats', () => {
  it('counts results and streaks, newest first', () => {
    const stats = computeStats([summary(1), summary(1), summary(2), summary(1), summary(1), summary(1), summary(null)]);
    expect(stats).toMatchObject({ played: 7, wins: 5, losses: 1, draws: 1, bestWinStreak: 3 });
    expect(stats.winRate).toBeCloseTo(5 / 7);
    expect(stats.streak).toEqual({ outcome: 'won', length: 2 });
  });

  it('ignores cancelled matches and handles an empty history', () => {
    expect(computeStats([summary(null, 'abandoned')])).toMatchObject({ played: 0, winRate: null, streak: null });
  });
});
