import type { Socket } from 'socket.io-client';
import { emitRealtime, setRealtimeStatus } from './bus';
import { isRealtimeEvent } from './events';

// The Socket.IO connection to the backend (only with VITE_REALTIME=socket,
// see src/config.ts). It is opened after login and closed at logout. The
// browser sends the session cookie with the handshake, which is how the
// server knows who is connected. Socket.IO reconnects by itself after a
// network cut; while it is down the pages keep polling.

let socket: Socket | null = null;
/** Bumped by every connect/disconnect, so a slow import cannot open a stale socket. */
let generation = 0;

/** Matches the viewer looks at, and how many components look at each. */
const watchedMatches = new Map<string, number>();

export async function connectRealtime(): Promise<void> {
  if (socket) return;
  const mine = ++generation;
  setRealtimeStatus('connecting');

  // Loaded on demand: the library is only downloaded when this is enabled.
  let io: typeof import('socket.io-client').io;
  try {
    ({ io } = await import('socket.io-client'));
  } catch {
    // Could not download it (offline?): the pages keep polling.
    if (mine === generation) setRealtimeStatus('off');
    return;
  }
  if (mine !== generation) return;

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
  generation++;
  socket?.disconnect();
  socket = null;
  setRealtimeStatus('off');
}

/**
 * Asks the server for `match:update` events about one match (players and
 * spectators alike). Returns the function that stops watching.
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
