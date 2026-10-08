import { makeMatch } from '@/test/factories';
import { isOlderMatch, matchAfterEvent } from './realtime';

describe('isOlderMatch', () => {
  it('compares positions by number of moves', () => {
    expect(isOlderMatch(makeMatch({}, [3]), makeMatch({}, [3, 4]))).toBe(true);
    expect(isOlderMatch(makeMatch({}, [3, 4]), makeMatch({}, [3]))).toBe(false);
  });

  it('then by stage, so an ended match never goes back to being played', () => {
    const moves = [0, 1, 0, 1, 0, 1, 0];
    const finished = makeMatch({ status: 'finished', winnerSeat: 1 }, moves);
    expect(isOlderMatch(makeMatch({}, moves), finished)).toBe(true);
    expect(isOlderMatch(finished, makeMatch({}, moves))).toBe(false);
    expect(isOlderMatch(makeMatch({ status: 'waiting' }), makeMatch())).toBe(true);
  });

  it('accepts the same position again', () => {
    expect(isOlderMatch(makeMatch({}, [2]), makeMatch({}, [2]))).toBe(false);
  });
});

describe('matchAfterEvent', () => {
  it('takes the newer position but keeps the seat the viewer loaded', () => {
    const spectatorView = makeMatch({ yourSeat: null }, [3, 4]);
    const next = matchAfterEvent(spectatorView, makeMatch({}, [3]));
    expect(next?.game.moves).toEqual([3, 4]);
    expect(next?.yourSeat).toBe(1);
  });

  it('ignores an older position', () => {
    expect(matchAfterEvent(makeMatch({}, [3]), makeMatch({}, [3, 4]))).toBeNull();
  });
});
