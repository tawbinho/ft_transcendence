import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@cf/shared';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

/** One shared, lazily-created socket. It authenticates via the session cookie. */
export function getSocket(): GameSocket {
  if (!socket) {
    socket = io({ withCredentials: true, autoConnect: true });
  }
  return socket;
}
