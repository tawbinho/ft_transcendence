import { outcomeOf, type Outcome } from './model';
import type { MatchSummary } from './types';

export interface PlayerStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  /** wins / played, or null before the first finished match. */
  winRate: number | null;
  /** The run of identical results ending with the latest match. */
  streak: { outcome: Exclude<Outcome, 'cancelled'>; length: number } | null;
  bestWinStreak: number;
}

/** Statistics over finished matches, given newest first (as the API sends them). */
export function computeStats(matches: readonly MatchSummary[]): PlayerStats {
  const outcomes = matches
    .map(outcomeOf)
    .filter((outcome): outcome is Exclude<Outcome, 'cancelled'> => outcome !== null && outcome !== 'cancelled');

  const count = (wanted: Outcome) => outcomes.filter((outcome) => outcome === wanted).length;
  const wins = count('won');

  let streak: PlayerStats['streak'] = null;
  if (outcomes.length > 0) {
    const latest = outcomes[0]!;
    let length = 0;
    while (length < outcomes.length && outcomes[length] === latest) length++;
    streak = { outcome: latest, length };
  }

  let bestWinStreak = 0;
  let run = 0;
  for (const outcome of outcomes) {
    run = outcome === 'won' ? run + 1 : 0;
    bestWinStreak = Math.max(bestWinStreak, run);
  }

  return {
    played: outcomes.length,
    wins,
    losses: count('lost'),
    draws: count('draw'),
    winRate: outcomes.length > 0 ? wins / outcomes.length : null,
    streak,
    bestWinStreak,
  };
}
