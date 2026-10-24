import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import { matchRoom, userRoom } from './realtime.constants.js';

// WHY THIS FILE EXISTS
// The ONE way the rest of the app sends live events. A service (matches,
// friends...) says "tell these users this happened" and never touches
// Socket.IO itself. Live events are HINTS: if nobody is connected, or sending
// fails, the app still works (it also polls), so nothing here can throw into
// a request.
@Injectable()
export class RealtimeService {
  // Set by the gateway once the Socket.IO server exists. Before that (or in a
  // test without a gateway) every emit quietly does nothing.
  private server: Server | undefined;

  attach(server: Server): void {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server?.to(userRoom(userId)).emit(event, payload);
  }

  // Several users, one send: Socket.IO sends the event once to each socket
  // even if the user is listed twice.
  emitToUsers(userIds: string[], event: string, payload: unknown): void {
    this.server?.to(userIds.map(userRoom)).emit(event, payload);
  }

  emitToMatch(matchId: string, event: string, payload: unknown): void {
    this.server?.to(matchRoom(matchId)).emit(event, payload);
  }

  // Takes out of the room of a match every socket that does not belong to one
  // of these users (see MatchesService.broadcast).
  async keepInMatchRoom(matchId: string, userIds: string[]): Promise<void> {
    if (!this.server) return;
    const room = matchRoom(matchId);
    for (const socket of await this.server.in(room).fetchSockets()) {
      const userId = (socket.data as { userId?: string }).userId;
      if (!userId || !userIds.includes(userId)) socket.leave(room);
    }
  }

  emitToAll(event: string, payload: unknown): void {
    this.server?.emit(event, payload);
  }
}
