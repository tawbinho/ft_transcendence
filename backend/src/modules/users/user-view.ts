import { isOnline } from './presence.service.js';

// WHY THIS FILE EXISTS
// Turns one database row of the player search into the JSON the API sends
// (PlayerListItem in backend/docs/openapi.yaml). PURE: no database, no Nest,
// so it is easy to test.

// How the viewer relates to another player.
export type Friendship =
  | 'self'
  | 'none'
  | 'friends'
  | 'request_sent'
  | 'request_received';

// One row as the service loads it (stats already counted by the database).
export interface PlayerRow {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  wins: number;
  losses: number;
  draws: number;
  // The viewer's relation to this player and whether they blocked them. The
  // database works both out (see playerColumns in users.service.ts).
  friendship: Friendship;
  blocked: boolean;
  // A computer opponent, not a person.
  isBot: boolean;
}

export interface ProfileStatsView {
  played: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface PlayerListItemView {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  online: boolean;
  createdAt: Date;
  stats: ProfileStatsView;
  friendship: Friendship;
  isBot: boolean;
}

export function toStats(row: PlayerRow): ProfileStatsView {
  return {
    played: row.wins + row.losses + row.draws,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
  };
}

export function toPlayerListItem(
  row: PlayerRow,
  viewerId: string,
  now = Date.now(),
): PlayerListItemView {
  return {
    id: row.id,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    // You are always online to yourself: you are looking at the page.
    online: row.id === viewerId || isOnline(row.lastSeenAt, now),
    createdAt: row.createdAt,
    stats: toStats(row),
    friendship: row.id === viewerId ? 'self' : row.friendship,
    isBot: row.isBot,
  };
}

// ---- Profile --------------------------------------------------------------

export interface ProfileView {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  online: boolean;
  createdAt: Date;
  // When they were last seen; null while they are online (and when never).
  lastSeenAt: Date | null;
  stats: ProfileStatsView;
  friendship: Friendship;
  // The viewer blocked this player.
  blocked: boolean;
  isBot: boolean;
}

export function toProfile(
  row: PlayerRow,
  viewerId: string,
  now = Date.now(),
): ProfileView {
  const online = row.id === viewerId || isOnline(row.lastSeenAt, now);
  return {
    id: row.id,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    online,
    createdAt: row.createdAt,
    lastSeenAt: online ? null : row.lastSeenAt,
    stats: toStats(row),
    friendship: row.id === viewerId ? 'self' : row.friendship,
    blocked: row.blocked,
    isBot: row.isBot,
  };
}

// ---- Match history of a profile -------------------------------------------

// A finished match, seen from the profile owner's side.
export interface ProfileMatchRow {
  id: string;
  result: 'win' | 'loss' | 'draw';
  cols: number;
  rows: number;
  winLength: number;
  theme: string;
  endedAt: Date;
  moveCount: number;
  opponent: { id: string; displayName: string };
}

export interface ProfileMatchView {
  id: string;
  opponent: { id: string; displayName: string };
  result: 'win' | 'loss' | 'draw';
  settings: { cols: number; rows: number; winLength: number; theme: string };
  endedAt: Date;
  moveCount: number;
}

export function toProfileMatch(row: ProfileMatchRow): ProfileMatchView {
  return {
    id: row.id,
    opponent: {
      id: row.opponent.id,
      displayName: row.opponent.displayName,
    },
    result: row.result,
    settings: {
      cols: row.cols,
      rows: row.rows,
      winLength: row.winLength,
      theme: row.theme,
    },
    endedAt: row.endedAt,
    moveCount: row.moveCount,
  };
}
