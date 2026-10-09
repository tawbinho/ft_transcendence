import { makeMatchSummary } from '@/test/fixtures/matchSummary';
import { makeSummary } from '@/test/fixtures/users';
import type { MatchSummary } from '@/features/matches/types';
import { greetingOf, isMyTurn, matchesWaitingForMe, onlineFriends } from './dashboard';

const summary = (overrides: Partial<MatchSummary>) => makeMatchSummary(overrides);

describe('greetingOf', () => {
  it.each([
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [17, 'afternoon'],
    [18, 'evening'],
    [23, 'evening'],
    [3, 'evening'],
  ] as const)('at %i o’clock it is %s', (hour, expected) => {
    expect(greetingOf(hour)).toBe(expected);
  });
});

describe('isMyTurn', () => {
  it('is seat 1 after an even number of moves and seat 2 after an odd number', () => {
    expect(isMyTurn(summary({ yourSeat: 1, moveCount: 0 }))).toBe(true);
    expect(isMyTurn(summary({ yourSeat: 1, moveCount: 3 }))).toBe(false);
    expect(isMyTurn(summary({ yourSeat: 2, moveCount: 3 }))).toBe(true);
    expect(isMyTurn(summary({ yourSeat: 2, moveCount: 4 }))).toBe(false);
  });

  it('is never true for a match that is not in progress or that the viewer only watches', () => {
    expect(isMyTurn(summary({ status: 'waiting', yourSeat: 1, moveCount: 0 }))).toBe(false);
    expect(isMyTurn(summary({ status: 'finished', yourSeat: 1, moveCount: 0 }))).toBe(false);
    expect(isMyTurn(summary({ yourSeat: null, moveCount: 0 }))).toBe(false);
  });
});

describe('matchesWaitingForMe', () => {
  it('keeps only the matches where the viewer has to move', () => {
    const mine = summary({ id: 'a', yourSeat: 1, moveCount: 2 });
    const theirs = summary({ id: 'b', yourSeat: 1, moveCount: 1 });
    expect(matchesWaitingForMe([theirs, mine])).toEqual([mine]);
  });
});

describe('onlineFriends', () => {
  const friend = (name: string, online: boolean) => ({
    ...makeSummary({ id: name, displayName: name, online }),
    since: '2026-09-01T10:00:00.000Z',
  });

  it('keeps the online friends, in order, up to the limit', () => {
    const friends = [friend('a', true), friend('b', false), friend('c', true), friend('d', true)];
    expect(onlineFriends(friends, 2).map((f) => f.displayName)).toEqual(['a', 'c']);
    expect(onlineFriends(friends).map((f) => f.displayName)).toEqual(['a', 'c', 'd']);
  });
});
