import type { MatchSettings } from '@/features/matches/types';

// The shapes of the player routes (docs/api-contract.md, "Players").

/** How the viewer relates to another player. */
export type Friendship = 'self' | 'none' | 'friends' | 'request_sent' | 'request_received';

/** What the app shows next to a player's name: their picture and whether they are online. */
export interface UserSummary {
  id: string;
  displayName: string;
  /** null: no picture uploaded, the app draws the default avatar. */
  avatarUrl: string | null;
  online: boolean;
}

/** Results of finished matches. */
export interface ProfileStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface Profile extends UserSummary {
  createdAt: string;
  /** When they were last online; null while they are online. */
  lastSeenAt: string | null;
  stats: ProfileStats;
  friendship: Friendship;
  /** The viewer blocked this player. */
  blocked: boolean;
}

/** One row of the player search. */
export interface PlayerListItem extends UserSummary {
  createdAt: string;
  stats: ProfileStats;
  friendship: Friendship;
}

export const PLAYER_SORTS = ['name', 'wins', 'newest'] as const;
export type PlayerSort = (typeof PLAYER_SORTS)[number];

export interface PlayerSearchParams {
  /** Part of a display name, case-insensitive. */
  search?: string;
  /** Only players online right now. */
  online?: boolean;
  /** Only the viewer's friends. */
  friends?: boolean;
  sort?: PlayerSort;
  limit?: number;
  offset?: number;
}

/** A finished match on a profile, seen from the profile owner's side. */
export interface ProfileMatch {
  id: string;
  opponent: { id: string; displayName: string };
  result: 'win' | 'loss' | 'draw';
  settings: MatchSettings;
  endedAt: string;
  moveCount: number;
}

export interface UpdateProfileInput {
  displayName?: string;
}
