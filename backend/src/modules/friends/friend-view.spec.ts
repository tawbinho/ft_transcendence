import {
  toFriendsOverview,
  toUserSummary,
  type FriendshipRow,
  type UserRow,
} from './friend-view.js';

const NOW = new Date('2026-01-01T12:00:00Z').getTime();

function user(name: string, seenSecondsAgo: number | null): UserRow {
  return {
    id: `id-${name}`,
    displayName: name,
    avatarUrl: null,
    lastSeenAt: seenSecondsAgo === null ? null : new Date(NOW - seenSecondsAgo * 1000),
  };
}

function row(
  other: UserRow,
  status: 'pending' | 'accepted',
  requestedByViewer = false,
): FriendshipRow {
  return {
    other,
    status,
    requestedByViewer,
    acceptedAt: status === 'accepted' ? new Date('2026-01-01T00:00:00Z') : null,
    createdAt: new Date('2025-12-31T00:00:00Z'),
  };
}

describe('toUserSummary', () => {
  it('has only the public fields and an online flag', () => {
    expect(toUserSummary({ ...user('bob', 10), email: 'b@x.com' } as never, NOW)).toEqual({
      id: 'id-bob',
      displayName: 'bob',
      avatarUrl: null,
      online: true,
    });
  });
});

describe('toFriendsOverview', () => {
  it('splits friends, incoming and outgoing requests', () => {
    const view = toFriendsOverview(
      [
        row(user('bob', 600), 'accepted'),
        row(user('carol', null), 'pending', false),
        row(user('dave', null), 'pending', true),
      ],
      NOW,
    );
    expect(view.friends.map((f) => f.displayName)).toEqual(['bob']);
    expect(view.incoming.map((f) => f.displayName)).toEqual(['carol']);
    expect(view.outgoing.map((f) => f.displayName)).toEqual(['dave']);
  });

  it('puts online friends first, then sorts by name', () => {
    const view = toFriendsOverview(
      [
        row(user('zoe', 600), 'accepted'),
        row(user('amy', 600), 'accepted'),
        row(user('mia', 5), 'accepted'),
      ],
      NOW,
    );
    expect(view.friends.map((f) => f.displayName)).toEqual(['mia', 'amy', 'zoe']);
  });

  it('reports since from the acceptance date', () => {
    const view = toFriendsOverview([row(user('bob', 600), 'accepted')], NOW);
    expect(view.friends[0]!.since).toEqual(new Date('2026-01-01T00:00:00Z'));
  });

  it('is empty without rows', () => {
    expect(toFriendsOverview([], NOW)).toEqual({ friends: [], incoming: [], outgoing: [] });
  });
});
