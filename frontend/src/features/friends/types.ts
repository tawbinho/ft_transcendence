import type { Friendship, UserSummary } from '@/features/users/types';

// The shapes of the friend routes (docs/api-contract.md, "Friends").

export interface Friend extends UserSummary {
  /** When the friendship started. */
  since: string;
}

export interface FriendsOverview {
  /** Online friends first, then by name. */
  friends: Friend[];
  /** Requests other players sent to the viewer. */
  incoming: UserSummary[];
  /** Requests the viewer sent, not answered yet. */
  outgoing: UserSummary[];
}

/** The answer of PUT and DELETE /friends/:userId. */
export interface FriendshipResult {
  friendship: Friendship;
}
