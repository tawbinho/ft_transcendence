import { makeStats } from '@/test/fixtures/users';
import { PODIUM_SIZE, rankOf, splitPodium, winRate } from './ranking';

describe('rankOf', () => {
  it('starts at 1 on the first page', () => {
    expect(rankOf(0, 0)).toBe(1);
    expect(rankOf(0, 9)).toBe(10);
  });

  it('keeps counting on the next pages', () => {
    expect(rankOf(10, 0)).toBe(11);
    expect(rankOf(20, 4)).toBe(25);
  });
});

describe('winRate', () => {
  it('is wins divided by games played', () => {
    expect(winRate(makeStats({ played: 8, wins: 6 }))).toBe(0.75);
    expect(winRate(makeStats({ played: 5, wins: 0 }))).toBe(0);
  });

  it('is missing for a player with no finished game', () => {
    expect(winRate(makeStats({ played: 0, wins: 0, losses: 0, draws: 0 }))).toBeNull();
  });
});

describe('splitPodium', () => {
  const players = ['a', 'b', 'c', 'd', 'e'];

  it('puts the first three of the first page on the podium', () => {
    expect(PODIUM_SIZE).toBe(3);
    expect(splitPodium(players, 1)).toEqual({ podium: ['a', 'b', 'c'], rest: ['d', 'e'] });
  });

  it('has no podium after the first page', () => {
    expect(splitPodium(players, 2)).toEqual({ podium: [], rest: players });
  });

  it('copes with fewer players than places', () => {
    expect(splitPodium(['a'], 1)).toEqual({ podium: ['a'], rest: [] });
    expect(splitPodium([], 1)).toEqual({ podium: [], rest: [] });
  });
});
