import type { ProfileStats } from './types';

// Experience, levels and badges. Nothing is stored: everything is computed
// from the player's match results, so it is always in step with their history.

/** Experience points earned by one finished match. */
export const XP_PER_RESULT = { win: 30, draw: 10, loss: 5 } as const;

/** Experience points needed for each level. */
export const XP_PER_LEVEL = 100;

export interface Level {
  /** Starts at 1. */
  level: number;
  /** All the experience points earned so far. */
  xp: number;
  /** Points earned inside the current level (0 to 99). */
  xpInLevel: number;
  /** Points still missing for the next level. */
  xpToNext: number;
}

export function levelOf(stats: ProfileStats): Level {
  const xp = stats.wins * XP_PER_RESULT.win + stats.draws * XP_PER_RESULT.draw + stats.losses * XP_PER_RESULT.loss;
  const xpInLevel = xp % XP_PER_LEVEL;
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, xp, xpInLevel, xpToNext: XP_PER_LEVEL - xpInLevel };
}

/** Wins as a share of played matches (0 to 1); null before the first match. */
export function winRate(stats: ProfileStats): number | null {
  return stats.played > 0 ? stats.wins / stats.played : null;
}

/** The win rate badge needs this many matches, so one lucky win does not count. */
export const SHARP_MIN_PLAYED = 20;
export const SHARP_MIN_RATE = 0.6;

export const BADGE_IDS = ['firstGame', 'firstWin', 'tenWins', 'fiftyGames', 'fiveDraws', 'sharp'] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export interface Badge {
  id: BadgeId;
  earned: boolean;
}

/** Whether each badge is earned, always in the same order. */
export function badgesOf(stats: ProfileStats): Badge[] {
  const rate = winRate(stats) ?? 0;
  const earned: Record<BadgeId, boolean> = {
    firstGame: stats.played >= 1,
    firstWin: stats.wins >= 1,
    tenWins: stats.wins >= 10,
    fiftyGames: stats.played >= 50,
    fiveDraws: stats.draws >= 5,
    sharp: stats.played >= SHARP_MIN_PLAYED && rate >= SHARP_MIN_RATE,
  };
  return BADGE_IDS.map((id) => ({ id, earned: earned[id] }));
}
