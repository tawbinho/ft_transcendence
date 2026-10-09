import { makeMatchSummary as summary } from '@/test/fixtures/matches';
import { recentResults } from './recentResults';

const won = summary({ winnerSeat: 1 });
const lost = summary({ winnerSeat: 2 });
const draw = summary({ winnerSeat: null, endReason: 'draw' });
const cancelled = summary({ status: 'abandoned', winnerSeat: null, endReason: null });

describe('recentResults', () => {
  it('keeps the newest first', () => {
    expect(recentResults([won, lost, draw], 10)).toEqual(['won', 'lost', 'draw']);
  });

  it('stops after the count asked for', () => {
    expect(recentResults([won, won, lost, draw], 2)).toEqual(['won', 'won']);
  });

  it('skips cancelled matches, they have no result', () => {
    expect(recentResults([cancelled, won, cancelled, lost], 10)).toEqual(['won', 'lost']);
  });

  it('is empty without matches', () => {
    expect(recentResults([], 10)).toEqual([]);
  });
});
