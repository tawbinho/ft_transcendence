// WHY THIS FILE EXISTS
// The allowed values of the friends module in one place.

// A friendship row is either a request waiting for an answer, or accepted.
// Declining or cancelling a request, or removing a friend, DELETES the row.
export const FRIENDSHIP_STATUSES = ['pending', 'accepted'] as const;
export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

// Putting a pair of ids in a fixed order (the smaller first) makes ONE row per
// pair of players, whoever sent the request. Postgres compares uuids byte by
// byte, which for lowercase hex text is the same as comparing the text.
export function orderPair(a: string, b: string): [low: string, high: string] {
  return a < b ? [a, b] : [b, a];
}
