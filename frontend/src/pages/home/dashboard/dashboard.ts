import type { Friend } from '@/features/friends/types';
import type { MatchSummary } from '@/features/matches/types';

/** Which greeting to use: 'morning' before noon, 'afternoon' until 6 pm, 'evening' after. */
export function greetingOf(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Whether the viewer has to move. A summary does not say whose turn it is, but
 * seat 1 always starts and the players alternate: after an even number of moves
 * it is seat 1's turn.
 */
export function isMyTurn(match: Pick<MatchSummary, 'status' | 'yourSeat' | 'moveCount'>): boolean {
  if (match.status !== 'in_progress' || match.yourSeat === null) return false;
  return (match.moveCount % 2 === 0 ? 1 : 2) === match.yourSeat;
}

/** The matches where the viewer has to move, in the order given. */
export function matchesWaitingForMe(matches: readonly MatchSummary[]): MatchSummary[] {
  return matches.filter(isMyTurn);
}

/** The friends who are online now, at most `limit` of them. */
export function onlineFriends(friends: readonly Friend[], limit = 5): Friend[] {
  return friends.filter((friend) => friend.online).slice(0, limit);
}
