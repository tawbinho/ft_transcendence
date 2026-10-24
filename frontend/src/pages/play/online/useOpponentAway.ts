import { useState } from 'react';
import { useRealtimeEvent } from '@/lib/realtime';

/**
 * True while the opponent has no connection open (they closed the tab or lost the network), from
 * the live `presence` events.
 */
export function useOpponentAway(opponentId: string | null): boolean {
  const [away, setAway] = useState(false);

  useRealtimeEvent('presence', ({ userId, online }) => {
    if (userId === opponentId) setAway(!online);
  });

  return away;
}
