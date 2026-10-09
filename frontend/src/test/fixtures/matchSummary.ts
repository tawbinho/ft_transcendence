import type { MatchSummary } from '@/features/matches/types';
import { makeMatch } from '@/test/factories';

/** A match as the lists show it (alice, seat 1, against bob): what makeMatch gives, without the board. */
export function makeMatchSummary(overrides: Partial<MatchSummary> = {}, moveCount = 0): MatchSummary {
  const { game, startedAt, ...summary } = makeMatch();
  void game;
  void startedAt;
  return { ...summary, moveCount, ...overrides };
}
