import { io, type Socket } from 'socket.io-client';
import { emitRealtime, setRealtimeStatus } from './bus';
import { isRealtimeEvent } from './events';

// The Socket.IO connection to the backend. It is opened after login and closed
// at logout. The browser sends the session cookie with the handshake, which is
// how the server knows who is connected. Socket.IO reconnects by itself after
// a network cut; while it is down the pages keep polling.

let socket: Socket | null = null;

/** Matches the viewer looks at, and how many components look at each. */
const watchedMatches = new Map<string, number>();

export function connectRealtime(): void {
  if (socket) return;
  setRealtimeStatus('connecting');

  const next = io({ withCredentials: true, transports: ['websocket'] });
  next.on('connect', () => {
    setRealtimeStatus('live');
    // After a reconnection the server has forgotten what we were watching.
    for (const matchId of watchedMatches.keys()) next.emit('match:watch', { matchId });
  });
  next.on('disconnect', () => setRealtimeStatus('reconnecting'));
  next.onAny((event: string, payload: unknown) => {
    if (isRealtimeEvent(event)) emitRealtime(event, payload as never);
  });
  socket = next;
}

export function disconnectRealtime(): void {
  socket?.disconnect();
  socket = null;
  setRealtimeStatus('off');
}

/**
 * Asks the server for `match:update` events about one match the viewer plays.
 * Returns the function that stops watching.
 */
export function watchMatch(matchId: string): () => void {
  const count = watchedMatches.get(matchId) ?? 0;
  watchedMatches.set(matchId, count + 1);
  if (count === 0) socket?.emit('match:watch', { matchId });

  return () => {
    const left = (watchedMatches.get(matchId) ?? 1) - 1;
    if (left > 0) {
      watchedMatches.set(matchId, left);
      return;
    }
    watchedMatches.delete(matchId);
    socket?.emit('match:unwatch', { matchId });
  };
}
