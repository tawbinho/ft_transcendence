import { makeStats } from '@/test/fixtures/users';
import { badgesOf, levelOf, winRate } from './achievements';

const none = { played: 0, wins: 0, losses: 0, draws: 0 };
const earnedIds = (stats = none) =>
  badgesOf(stats)
    .filter((badge) => badge.earned)
    .map((badge) => badge.id);

describe('levelOf', () => {
  it('starts at level 1 with no experience', () => {
    expect(levelOf(none)).toEqual({ level: 1, xp: 0, xpInLevel: 0, xpToNext: 100 });
  });

  it('gives 30 points per win, 10 per draw and 5 per loss', () => {
    expect(levelOf({ played: 3, wins: 1, draws: 1, losses: 1 }).xp).toBe(45);
  });

  it('moves up a level every 100 points', () => {
    expect(levelOf({ played: 4, wins: 3, draws: 1, losses: 0 })).toEqual({
      level: 2,
      xp: 100,
      xpInLevel: 0,
      xpToNext: 100,
    });
    expect(levelOf({ played: 7, wins: 3, draws: 0, losses: 4 })).toMatchObject({
      level: 2,
      xpInLevel: 10,
      xpToNext: 90,
    });
    expect(levelOf(makeStats({ wins: 20, losses: 0, draws: 0, played: 20 }))).toMatchObject({ level: 7, xp: 600 });
  });
});

describe('winRate', () => {
  it('is null before the first match', () => {
    expect(winRate(none)).toBeNull();
  });

  it('is wins divided by matches played', () => {
    expect(winRate({ played: 8, wins: 2, losses: 6, draws: 0 })).toBe(0.25);
  });
});

describe('badgesOf', () => {
  it('lists every badge in a fixed order, none earned at the start', () => {
    expect(badgesOf(none).map((badge) => badge.id)).toEqual([
      'firstGame',
      'firstWin',
      'tenWins',
      'fiftyGames',
      'fiveDraws',
      'sharp',
    ]);
    expect(earnedIds()).toEqual([]);
  });

  it('gives first game after one loss, and first win after one win', () => {
    expect(earnedIds({ played: 1, wins: 0, losses: 1, draws: 0 })).toEqual(['firstGame']);
    expect(earnedIds({ played: 1, wins: 1, losses: 0, draws: 0 })).toEqual(['firstGame', 'firstWin']);
  });

  it('needs 10 wins, 50 games and 5 draws for their badges', () => {
    expect(earnedIds({ played: 9, wins: 9, losses: 0, draws: 0 })).not.toContain('tenWins');
    expect(earnedIds({ played: 10, wins: 10, losses: 0, draws: 0 })).toContain('tenWins');
    expect(earnedIds({ played: 49, wins: 0, losses: 49, draws: 0 })).not.toContain('fiftyGames');
    expect(earnedIds({ played: 50, wins: 0, losses: 50, draws: 0 })).toContain('fiftyGames');
    expect(earnedIds({ played: 5, wins: 0, losses: 0, draws: 4 })).not.toContain('fiveDraws');
    expect(earnedIds({ played: 5, wins: 0, losses: 0, draws: 5 })).toContain('fiveDraws');
  });

  it('gives the win rate badge for 60% over at least 20 matches', () => {
    expect(earnedIds({ played: 10, wins: 10, losses: 0, draws: 0 })).not.toContain('sharp');
    expect(earnedIds({ played: 20, wins: 11, losses: 9, draws: 0 })).not.toContain('sharp');
    expect(earnedIds({ played: 20, wins: 12, losses: 8, draws: 0 })).toContain('sharp');
  });
});
