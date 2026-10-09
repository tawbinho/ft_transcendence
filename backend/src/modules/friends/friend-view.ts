import { isOnline } from '../users/presence.service.js';

// WHY THIS FILE EXISTS
// Turns database rows into the JSON of the friends and blocks routes
// (UserSummary, Friend, FriendsOverview in backend/docs/openapi.yaml). PURE:
// no database, no Nest, easy to test.

// A user row, as the service loads it.
export interface UserRow {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeenAt: Date | null;
}

export interface UserSummaryView {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  online: boolean;
}

export interface FriendView extends UserSummaryView {
  since: Date; // when the request was accepted
}

export interface FriendsOverviewView {
  friends: FriendView[]; // online first, then by name
  incoming: UserSummaryView[]; // requests other players sent to the viewer
  outgoing: UserSummaryView[]; // requests the viewer sent, not answered yet
}

export function toUserSummary(
  user: UserRow,
  now = Date.now(),
): UserSummaryView {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    online: isOnline(user.lastSeenAt, now),
  };
}

// One friendship of the viewer, with the OTHER player and the state.
export interface FriendshipRow {
  other: UserRow;
  status: 'pending' | 'accepted';
  requestedByViewer: boolean;
  acceptedAt: Date | null;
  createdAt: Date;
}

const byName = (a: UserSummaryView, b: UserSummaryView): number =>
  a.displayName.localeCompare(b.displayName);

export function toFriendsOverview(
  rows: FriendshipRow[],
  now = Date.now(),
): FriendsOverviewView {
  const friends: FriendView[] = [];
  const incoming: UserSummaryView[] = [];
  const outgoing: UserSummaryView[] = [];

  for (const row of rows) {
    const summary = toUserSummary(row.other, now);
    if (row.status === 'accepted') {
      friends.push({ ...summary, since: row.acceptedAt ?? row.createdAt });
    } else if (row.requestedByViewer) {
      outgoing.push(summary);
    } else {
      incoming.push(summary);
    }
  }

  // Online friends first, then A to Z.
  friends.sort((a, b) =>
    a.online === b.online ? byName(a, b) : a.online ? -1 : 1,
  );
  incoming.sort(byName);
  outgoing.sort(byName);
  return { friends, incoming, outgoing };
}
