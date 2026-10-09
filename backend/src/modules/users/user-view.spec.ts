import { toPlayerListItem, type PlayerRow } from './user-view.js';

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
    });
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
