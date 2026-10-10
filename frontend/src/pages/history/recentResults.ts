import { outcomeOf } from '@/features/matches/model';
import type { MatchSummary } from '@/features/matches/types';

export type RecentResult = 'won' | 'lost' | 'draw';

/**
 * The results of the latest finished matches, newest first (the order the API
 * sends them in). Cancelled matches have no result and are skipped.
 */
export function recentResults(matches: readonly MatchSummary[], count: number): RecentResult[] {
  const results: RecentResult[] = [];
  for (const match of matches) {
    const outcome = outcomeOf(match);
    if (outcome === 'won' || outcome === 'lost' || outcome === 'draw') results.push(outcome);
    if (results.length === count) break;
  }
  return results;
}
