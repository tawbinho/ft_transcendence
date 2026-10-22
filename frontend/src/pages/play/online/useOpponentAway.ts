import { useState } from 'react';
import { useRealtimeEvent } from '@/lib/realtime';

/**
 * True while the opponent has no connection open (they closed the tab or lost
 * the network), from the live `presence` events. The backend then waits a
 * short time for them to come back before they lose the match. Computer
 * opponents never connect, so they never send these events.
 */
export function useOpponentAway(opponentId: string | null): boolean {
  const [away, setAway] = useState(false);

  useRealtimeEvent('presence', ({ userId, online }) => {
    if (userId === opponentId) setAway(!online);
  });

  return away;
}
