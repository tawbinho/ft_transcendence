import { http } from '@/lib/api/http';
import type { FriendshipResult, FriendsOverview } from './types';

const friendPath = (userId: string) => `/friends/${encodeURIComponent(userId)}`;

export const friendsApi = {
  overview: (signal?: AbortSignal) => http.get<FriendsOverview>('/friends', { signal }),

  /** Sends a friend request, or accepts theirs if they already sent one. */
  add: (userId: string) => http.put<FriendshipResult>(friendPath(userId)),

  /** Removes a friend, cancels the viewer's request, or declines theirs. */
  remove: (userId: string) => http.delete<FriendshipResult>(friendPath(userId)),
};
