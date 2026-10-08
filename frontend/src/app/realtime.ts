import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { config } from '@/config';
import { useCurrentUser } from '@/features/auth/hooks';
import { addMessageToCache, chatKeys, setPeerReadAt } from '@/features/chat/hooks';
import { friendKeys, refreshFriendships } from '@/features/friends/hooks';
import { matchKeys } from '@/features/matches/hooks';
import type { Match, MatchStatus } from '@/features/matches/types';
import { spectateKeys } from '@/features/spectate/hooks';
import { tournamentKeys } from '@/features/tournaments/hooks';
import { userKeys } from '@/features/users/hooks';
import { connectRealtime, disconnectRealtime, useRealtimeEvent } from '@/lib/realtime';

// Live events -> cached data. Every page reads its data from the TanStack
// Query cache, so writing an event into the cache (or marking the right
// queries as stale) updates every page that shows it, without the pages
// knowing about events. Pages still poll: a missed event only makes an
// update slower.

/** Mounted once, in the app layout. */
export function useRealtimeSync(): void {
  const queryClient = useQueryClient();
  const userId = useCurrentUser().data?.id ?? null;

  // The socket lives as long as the session: opened at login, closed at logout.
  useEffect(() => {
    if (config.realtime !== 'socket' || !userId) return;
    void connectRealtime();
    return () => disconnectRealtime();
  }, [userId]);

  useRealtimeEvent('match:update', (match) => applyMatch(queryClient, match));

  useRealtimeEvent('chat:message', ({ peerId, message }) => {
    addMessageToCache(queryClient, peerId, message);
    void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
  });

  useRealtimeEvent('chat:read', ({ userId: peerId, readAt }) => setPeerReadAt(queryClient, peerId, readAt));

  // Online dots appear in friend lists, conversations, profiles and the player search.
  useRealtimeEvent('presence', () => {
    for (const queryKey of [friendKeys.all, chatKeys.conversations(), userKeys.all]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  useRealtimeEvent('friends:update', () => refreshFriendships(queryClient));

  useRealtimeEvent('tournament:update', ({ id }) => {
    void queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(id) });
    void queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() });
  });
}

const STAGE: Record<MatchStatus, number> = { waiting: 0, in_progress: 1, finished: 2, abandoned: 2 };

/** Events may arrive late or out of order: an older position must not replace a newer one. */
export function isOlderMatch(next: Match, current: Match): boolean {
  if (next.game.moveCount !== current.game.moveCount) return next.game.moveCount < current.game.moveCount;
  return STAGE[next.status] < STAGE[current.status];
}

/**
 * The match to show after a `match:update` event, or null to keep the one
 * shown. The server sends one event to players and spectators alike, so the
 * viewer's seat comes from the match they loaded, not from the event.
 */
export function matchAfterEvent(event: Match, cached: Match): Match | null {
  return isOlderMatch(event, cached) ? null : { ...event, yourSeat: cached.yourSeat };
}

function applyMatch(queryClient: QueryClient, match: Match): void {
  const key = matchKeys.detail(match.id);
  const cached = queryClient.getQueryData<Match>(key);

  // Only matches on screen (or recently seen) are kept up to date. While the
  // viewer's own move is being sent, its answer is newer than any event.
  const moving = queryClient.isMutating({ mutationKey: matchKeys.move(match.id) }) > 0;
  const next = cached && !moving ? matchAfterEvent(match, cached) : null;
  if (next) queryClient.setQueryData(key, next);

  // A match that starts or ends changes the lists it appears in.
  const statusChanged = cached ? cached.status !== match.status : match.status !== 'in_progress';
  if (!statusChanged) return;
  void queryClient.invalidateQueries({ queryKey: spectateKeys.all });
  if ((cached ?? match).yourSeat !== null) {
    void queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    void queryClient.invalidateQueries({ queryKey: matchKeys.finished() });
  }
}
