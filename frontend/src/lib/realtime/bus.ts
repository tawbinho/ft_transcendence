import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';
import type { RealtimeEvent, RealtimeEvents } from './events';

// The one place live events arrive, whoever produced them: the Socket.IO
// connection (socket.ts) or the in-browser demo server (src/demo). Pages
// subscribe with useRealtimeEvent and never know the source.

type Listener<K extends RealtimeEvent> = (payload: RealtimeEvents[K]) => void;

const listeners = new Map<RealtimeEvent, Set<Listener<never>>>();

export function onRealtime<K extends RealtimeEvent>(event: K, listener: Listener<K>): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  const entry = listener as Listener<never>;
  set.add(entry);
  return () => set.delete(entry);
}

export function emitRealtime<K extends RealtimeEvent>(event: K, payload: RealtimeEvents[K]): void {
  for (const listener of listeners.get(event) ?? []) (listener as Listener<K>)(payload);
}

/** Calls `handler` for every `event` while the component is mounted. */
export function useRealtimeEvent<K extends RealtimeEvent>(event: K, handler: Listener<K>): void {
  // Always calls the latest handler without subscribing again on each render.
  const onEvent = useEffectEvent(handler);
  useEffect(() => onRealtime(event, (payload) => onEvent(payload)), [event]);
}

// ---- Connection status ------------------------------------------------------

/** off: no live connection (polling only); live: events arrive as they happen. */
export type RealtimeStatus = 'off' | 'connecting' | 'live' | 'reconnecting';

let status: RealtimeStatus = 'off';
const statusListeners = new Set<() => void>();

export function setRealtimeStatus(next: RealtimeStatus): void {
  if (next === status) return;
  status = next;
  for (const listener of statusListeners) listener();
}

export function getRealtimeStatus(): RealtimeStatus {
  return status;
}

function subscribeStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(subscribeStatus, getRealtimeStatus, getRealtimeStatus);
}

/** Polling that slows down while live events arrive: they make most refreshes useless. */
export const LIVE_POLL_MS = 30_000;

export function useLiveInterval(ms: number): number {
  return useRealtimeStatus() === 'live' ? Math.max(ms, LIVE_POLL_MS) : ms;
}
