import {
  toPlayerListItem,
  toProfile,
  toProfileMatch,
  type PlayerRow,
} from './user-view.js';

const ME = 'user-me';
const NOW = new Date('2026-01-01T12:00:00Z').getTime();

function row(overrides: Partial<PlayerRow> = {}): PlayerRow {
  return {
    id: 'user-bob',
    displayName: 'bob',
    avatarUrl: null,
    lastSeenAt: null,
    createdAt: new Date('2025-12-01T00:00:00Z'),
    wins: 3,
    losses: 2,
    draws: 1,
    friendship: 'none',
    blocked: false,
    isBot: false,
    ...overrides,
  };
}

describe('toPlayerListItem', () => {
  it('carries the headline facts and counts played = wins + losses + draws', () => {
    expect(toPlayerListItem(row(), ME, NOW)).toEqual({
      id: 'user-bob',
      displayName: 'bob',
      avatarUrl: null,
      online: false,
      createdAt: new Date('2025-12-01T00:00:00Z'),
      stats: { played: 6, wins: 3, losses: 2, draws: 1 },
      friendship: 'none',
      isBot: false,
    });
  });

  it('says when a player is a computer', () => {
    expect(toPlayerListItem(row({ isBot: true }), ME, NOW).isBot).toBe(true);
    expect(toProfile(row({ isBot: true }), ME, NOW).isBot).toBe(true);
  });

  it('is online when seen less than a minute ago', () => {
    const recent = new Date(NOW - 30_000);
    expect(toPlayerListItem(row({ lastSeenAt: recent }), ME, NOW).online).toBe(
      true,
    );
  });

  it('is offline when seen a minute ago or more, or never', () => {
    const old = new Date(NOW - 60_000);
    expect(toPlayerListItem(row({ lastSeenAt: old }), ME, NOW).online).toBe(
      false,
    );
    expect(toPlayerListItem(row(), ME, NOW).online).toBe(false);
  });

  it('passes on the friendship of the pair', () => {
    expect(toPlayerListItem(row({ friendship: 'request_received' }), ME, NOW).friendship).toBe('request_received');
  });

  it('shows the viewer as self and online', () => {
    const item = toPlayerListItem(row({ id: ME }), ME, NOW);
    expect(item.friendship).toBe('self');
    expect(item.online).toBe(true);
  });

  it('does not leak the last seen date or other fields', () => {
    const item = toPlayerListItem(row({ lastSeenAt: new Date(NOW) }), ME, NOW);
    expect(item).not.toHaveProperty('lastSeenAt');
    expect(item).not.toHaveProperty('email');
  });
});

describe('toProfile', () => {
  it('shows when an offline player was last seen', () => {
    const seen = new Date(NOW - 5 * 60_000);
    const profile = toProfile(row({ lastSeenAt: seen }), ME, NOW);
    expect(profile.online).toBe(false);
    expect(profile.lastSeenAt).toEqual(seen);
  });

  it('hides the last seen date while the player is online', () => {
    const profile = toProfile(row({ lastSeenAt: new Date(NOW - 1000) }), ME, NOW);
    expect(profile.online).toBe(true);
    expect(profile.lastSeenAt).toBeNull();
  });

  it('shows the viewer as self, online, with no last seen', () => {
    const profile = toProfile(row({ id: ME }), ME, NOW);
    expect(profile).toMatchObject({
      friendship: 'self',
      online: true,
      lastSeenAt: null,
    });
  });

  it('carries the stats, the friendship and the blocked flag', () => {
    const profile = toProfile(row({ friendship: 'friends', blocked: true }), ME, NOW);
    expect(profile.stats).toEqual({ played: 6, wins: 3, losses: 2, draws: 1 });
    expect(profile.friendship).toBe('friends');
    expect(profile.blocked).toBe(true);
  });

  it('does not leak the email', () => {
    expect(toProfile(row(), ME, NOW)).not.toHaveProperty('email');
  });
});

describe('toProfileMatch', () => {
  it('maps a row to the history shape with grouped settings', () => {
    expect(
      toProfileMatch({
        id: 'm1',
        result: 'win',
        cols: 7,
        rows: 6,
        winLength: 4,
        theme: 'ocean',
        endedAt: new Date('2026-01-01T00:00:00Z'),
        moveCount: 9,
        opponent: { id: 'u2', displayName: 'ann', email: 'a@x.com' } as never,
      }),
    ).toEqual({
      id: 'm1',
      opponent: { id: 'u2', displayName: 'ann' },
      result: 'win',
      settings: { cols: 7, rows: 6, winLength: 4, theme: 'ocean' },
      endedAt: new Date('2026-01-01T00:00:00Z'),
      moveCount: 9,
    });
  });
});
