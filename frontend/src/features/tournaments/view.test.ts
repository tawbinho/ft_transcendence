import { ApiError } from '@/lib/api/errors';
import { makeRunningTournament, SEMI_MATCH_ID } from '@/test/fixtures/runningTournament';
import { makeTournament } from '@/test/fixtures/tournaments';
import { createBracket, recordWinner } from './bracket';
import {
  canCancel,
  canJoin,
  canLeave,
  canStart,
  countMatches,
  filterStatus,
  isFull,
  isStartUnavailable,
  pairingToPlay,
  parseFilter,
  roundName,
} from './view';

describe('roundName', () => {
  it('calls the last round the final, then the semi-finals and the quarter-finals', () => {
    expect([0, 1, 2].map((round) => roundName(round, 3))).toEqual(['quarterFinals', 'semiFinals', 'final']);
    expect([0, 1].map((round) => roundName(round, 2))).toEqual(['semiFinals', 'final']);
    expect(roundName(0, 1)).toBe('final');
  });

  it('numbers the rounds before the quarter-finals', () => {
    expect(roundName(0, 4)).toBe('round');
  });
});

describe('countMatches', () => {
  it('does not count a bye and counts the matches that have a winner', () => {
    const bracket = createBracket(['Ana', 'Ben', 'Cleo']);
    expect(countMatches(bracket)).toEqual({ played: 0, total: 2 });
    expect(countMatches(recordWinner(bracket, 0, 1, 1))).toEqual({ played: 1, total: 2 });
  });
});

describe('registration buttons', () => {
  const open = makeTournament({ joined: false, playerCount: 2 });
  const joined = makeTournament({ joined: true, playerCount: 2 });

  it('lets a member who is not in join while there is room', () => {
    expect(canJoin(open)).toBe(true);
    expect(canJoin(joined)).toBe(false);
    expect(canJoin({ ...open, playerCount: 4 })).toBe(false);
    expect(canJoin({ ...open, status: 'running' })).toBe(false);
  });

  it('lets a registered member leave, except the creator', () => {
    expect(canLeave(joined, 'u2')).toBe(true);
    expect(canLeave(joined, 'u1')).toBe(false);
    expect(canLeave(open, 'u2')).toBe(false);
    expect(canLeave({ ...joined, status: 'running' }, 'u2')).toBe(false);
  });

  it('lets the creator start with at least 3 players', () => {
    expect(canStart({ ...joined, playerCount: 3 }, 'u1')).toBe(true);
    expect(canStart(joined, 'u1')).toBe(false);
    expect(canStart({ ...joined, playerCount: 3 }, 'u2')).toBe(false);
    expect(canStart({ ...joined, playerCount: 3, status: 'running' }, 'u1')).toBe(false);
  });

  it('lets the creator cancel while registration is open', () => {
    expect(canCancel(joined, 'u1')).toBe(true);
    expect(canCancel(joined, 'u2')).toBe(false);
    expect(canCancel({ ...joined, status: 'finished' }, 'u1')).toBe(false);
  });
});

describe('a full tournament', () => {
  it('has every place taken', () => {
    expect(isFull(makeTournament({ playerCount: 4, size: 4 }))).toBe(true);
    expect(isFull(makeTournament({ playerCount: 3, size: 4 }))).toBe(false);
  });
});

describe('isStartUnavailable', () => {
  it('is true when the server has no start route', () => {
    expect(isStartUnavailable(new ApiError('NOT_FOUND', 'Cannot POST /api/tournaments/x/start', 404))).toBe(true);
  });

  it('is false for a missing tournament and for other failures', () => {
    expect(isStartUnavailable(new ApiError('TOURNAMENT_NOT_FOUND', 'No such tournament', 404))).toBe(false);
    expect(isStartUnavailable(new ApiError('NOT_ENOUGH_PLAYERS', 'Too few', 409))).toBe(false);
    expect(isStartUnavailable(new Error('boom'))).toBe(false);
    expect(isStartUnavailable(null)).toBe(false);
  });
});

describe('pairingToPlay', () => {
  const tournament = makeRunningTournament();

  it('finds the viewer’s pairing that has a match and no winner', () => {
    expect(pairingToPlay(tournament, 'u1')?.matchId).toBe(SEMI_MATCH_ID);
    expect(pairingToPlay(tournament, 'u2')?.matchId).toBe(SEMI_MATCH_ID);
  });

  it('finds nothing for a player whose pairing is decided, a spectator or a tournament not running', () => {
    expect(pairingToPlay(tournament, 'u4')).toBeNull();
    expect(pairingToPlay(tournament, 'u9')).toBeNull();
    expect(pairingToPlay(tournament, undefined)).toBeNull();
    expect(pairingToPlay({ ...tournament, status: 'finished' }, 'u1')).toBeNull();
  });
});

describe('the status filter', () => {
  it('reads the address and falls back to all', () => {
    expect(parseFilter('running')).toBe('running');
    expect(parseFilter('finished')).toBe('finished');
    expect(parseFilter('nonsense')).toBe('all');
    expect(parseFilter(null)).toBe('all');
  });

  it('asks the server for no status when it shows all', () => {
    expect(filterStatus('all')).toBeUndefined();
    expect(filterStatus('registering')).toBe('registering');
  });
});
