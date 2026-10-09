import type { Friend } from '@/features/friends/types';

/** Friends who are online come first, then everybody by name. The server already does this; it is repeated here so a refreshed list never reshuffles wrongly. */
export function onlineFirst(friends: Friend[]): Friend[] {
  return [...friends].sort((a, b) => Number(b.online) - Number(a.online) || a.displayName.localeCompare(b.displayName));
}

export function countOnline(friends: Friend[]): number {
  return friends.filter((friend) => friend.online).length;
}
