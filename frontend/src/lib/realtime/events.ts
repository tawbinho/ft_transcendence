import type { Message } from '@/features/chat/types';
import type { Match } from '@/features/matches/types';

/**
 * Every live event the server can push, with its payload
 * (docs/api-contract.md, "Live updates"). They are hints that something
 * changed: the pages also refresh by polling, so a missed event only makes
 * an update slower, never wrong.
 */
export interface RealtimeEvents {
  /** A match the viewer plays or watches changed: the whole new state. */
  'match:update': Match;
  /** A new message in one of the viewer's conversations, sent by either side. */
  'chat:message': { peerId: string; message: Message };
  /** The peer is typing to the viewer (sent again every few seconds while they type). */
  'chat:typing': { userId: string };
  /** The peer read the viewer's messages up to `readAt`. */
  'chat:read': { userId: string; readAt: string };
  /** A player went online or offline. */
  presence: { userId: string; online: boolean };
  /** The viewer's friends or friend requests changed. */
  'friends:update': Record<string, never>;
  /** A tournament changed (registration, a result, the next round). */
  'tournament:update': { id: string };
}

export type RealtimeEvent = keyof RealtimeEvents;

export const REALTIME_EVENTS: readonly RealtimeEvent[] = [
  'match:update',
  'chat:message',
  'chat:typing',
  'chat:read',
  'presence',
  'friends:update',
  'tournament:update',
];

export function isRealtimeEvent(name: string): name is RealtimeEvent {
  return REALTIME_EVENTS.includes(name as RealtimeEvent);
}
