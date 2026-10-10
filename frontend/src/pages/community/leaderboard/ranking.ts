import type { ProfileStats } from '@/features/users/types';

// The decisions of the leaderboard, kept out of the components so they can be tested.

/** How many players stand on the podium (first page only). */
export const PODIUM_SIZE = 3;

/**
 * A player's place. `offset` is how many players come before the page
 * (page 2 of 10 per page: offset 10) and `index` is the position on the page, from 0.
 */
export function rankOf(offset: number, index: number): number {
  return offset + index + 1;
}

/** Wins out of games played, from 0 to 1. null while the player has not finished a game. */
export function winRate(stats: ProfileStats): number | null {
  return stats.played > 0 ? stats.wins / stats.played : null;
}

/** The players of one page, split into the podium (first page only) and the table below it. */
export function splitPodium<T>(players: T[], page: number): { podium: T[]; rest: T[] } {
  if (page > 1) return { podium: [], rest: players };
  return { podium: players.slice(0, PODIUM_SIZE), rest: players.slice(PODIUM_SIZE) };
}
