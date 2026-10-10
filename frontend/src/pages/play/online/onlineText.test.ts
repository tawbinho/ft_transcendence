import i18n from '@/i18n';
import { makeMatch } from '@/test/factories';
import type { Match } from '@/features/matches/types';
import { endReasonText, matchAnnouncement, matchDetail, matchStatus, matchTone, playerLabel } from './onlineText';

const t = i18n.getFixedT('en');

// alice (seat 1) is the viewer. After [3, 3] it is her turn.
const myTurn = makeMatch({}, [3, 3]);
const theirTurn = makeMatch({}, [3]);

const finished = (overrides: Partial<Match>, result1: 'win' | 'loss' | 'draw', result2: 'win' | 'loss' | 'draw') =>
  makeMatch(
    {
      status: 'finished',
      players: [
        { seat: 1, userId: 'u1', displayName: 'alice', result: result1 },
        { seat: 2, userId: 'u2', displayName: 'bob', result: result2 },
      ],
      ...overrides,
    },
    [0, 1, 0, 1, 0, 1, 0],
  );

const won = finished({ endReason: 'win', winnerSeat: 1 }, 'win', 'loss');
const lostByResign = finished({ endReason: 'resign', winnerSeat: 2 }, 'loss', 'win');
const drawn = finished({ endReason: 'draw', winnerSeat: null }, 'draw', 'draw');
const cancelled = makeMatch({ status: 'abandoned', winnerSeat: null }, []);

describe('playerLabel', () => {
  it('marks your own name', () => {
    expect(playerLabel(myTurn, 1, t)).toBe('alice (you)');
    expect(playerLabel(myTurn, 2, t)).toBe('bob');
  });
});

describe('matchStatus', () => {
  it('says whose turn it is', () => {
    expect(matchStatus(myTurn, t)).toBe('Your turn');
    expect(matchStatus(theirTurn, t)).toBe('Waiting for bob…');
  });

  it('says how the match ended for you', () => {
    expect(matchStatus(won, t)).toBe('You won!');
    expect(matchStatus(lostByResign, t)).toBe('You lost.');
    expect(matchStatus(drawn, t)).toBe('It’s a draw.');
    expect(matchStatus(cancelled, t)).toBe('This match was cancelled.');
  });
});

describe('endReasonText', () => {
  it('says who resigned', () => {
    expect(endReasonText(lostByResign, t)).toBe('You resigned.');
    const otherResigned = finished({ endReason: 'resign', winnerSeat: 1 }, 'win', 'loss');
    expect(endReasonText(otherResigned, t)).toBe('bob resigned.');
  });

  it('says who left the match', () => {
    const left = finished({ endReason: 'disconnect', winnerSeat: 1 }, 'win', 'loss');
    expect(endReasonText(left, t)).toBe('bob left the match.');
  });

  it('is null when the match ended on the board', () => {
    expect(endReasonText(won, t)).toBeNull();
    expect(endReasonText(myTurn, t)).toBeNull();
  });
});

describe('matchDetail', () => {
  it('gives the reason of an early end', () => {
    expect(matchDetail(lostByResign, t)).toBe('You resigned.');
  });

  it('gives the number of moves of a game decided on the board', () => {
    expect(matchDetail(won, t)).toBe('Connected 4 in 7 moves.');
  });

  it('has nothing to add during the match or when it was cancelled', () => {
    expect(matchDetail(myTurn, t)).toBeNull();
    expect(matchDetail(cancelled, t)).toBeNull();
  });
});

describe('matchTone', () => {
  it('is green for a win, red for a loss, grey otherwise', () => {
    expect(matchTone(won)).toBe('win');
    expect(matchTone(lostByResign)).toBe('loss');
    expect(matchTone(drawn)).toBe('draw');
    expect(matchTone(cancelled)).toBe('over');
    expect(matchTone(myTurn)).toBe('none');
  });
});

describe('matchAnnouncement', () => {
  it('says the last move while the match goes on', () => {
    expect(matchAnnouncement(myTurn, t)).toBe('bob played column 4.');
  });

  it('adds the result and its detail once the match is over', () => {
    expect(matchAnnouncement(won, t)).toBe('alice played column 1. You won! Connected 4 in 7 moves.');
  });
});
