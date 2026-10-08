import type { User } from '@/features/auth/types';
import type { PlayerListItem, Profile, ProfileStats, UserSummary } from '@/features/users/types';

// Made-up people for tests. Every function takes overrides for what a test cares about.

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'alice@example.com',
    displayName: 'alice',
    avatarUrl: null,
    locale: 'en',
    ...overrides,
  };
}

export function makeStats(overrides: Partial<ProfileStats> = {}): ProfileStats {
  return { played: 10, wins: 6, losses: 3, draws: 1, ...overrides };
}

/** What lists show next to a name: bob, who is offline. */
export function makeSummary(overrides: Partial<UserSummary> = {}): UserSummary {
  return { id: 'u2', displayName: 'bob', avatarUrl: null, online: false, ...overrides };
}

/** A player's profile as alice sees it: bob, not a friend. */
export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    ...makeSummary(),
    createdAt: '2026-09-01T10:00:00.000Z',
    lastSeenAt: '2026-10-08T09:00:00.000Z',
    stats: makeStats(),
    friendship: 'none',
    blocked: false,
    ...overrides,
  };
}

/** One row of the player search. */
export function makePlayer(overrides: Partial<PlayerListItem> = {}): PlayerListItem {
  return {
    ...makeSummary(),
    createdAt: '2026-09-01T10:00:00.000Z',
    stats: makeStats(),
    friendship: 'none',
    ...overrides,
  };
}
