import { Logger, OnModuleDestroy } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { SessionsService } from '../auth/sessions.service.js';
import { PresenceService } from '../users/presence.service.js';
import {
  EVENTS,
  HEARTBEAT_MS,
  MAX_ROOMS_PER_SOCKET,
  MESSAGES,
  matchRoom,
  userRoom,
} from './realtime.constants.js';
import { RealtimeService } from './realtime.service.js';
import { readMatchId, readSessionToken } from './session-cookie.js';

// What we keep on each socket after it passed the login check.
interface SocketData {
  userId?: string;
  token?: string;
}

// WHY THIS FILE EXISTS
// The door of the live connection (Socket.IO, path /socket.io, same origin as
// the app: the proxy forwards it to the backend).
//  1. Refuses anyone without a valid login (the browser sends the `session`
//     cookie with the handshake).
//  2. Puts every socket in the room of its user, so an event reaches every tab.
//  3. Keeps track of who is online.
//  4. Lets a client start and stop watching a match.
// Sending events is RealtimeService's job, not this class's.
//
// Only the WebSocket transport is allowed: it is what the frontend asks for,
// and it avoids the long-polling fallback, which would need sticky sessions.
@WebSocketGateway({ transports: ['websocket'] })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private server: Server;
  private heartbeat: NodeJS.Timeout | undefined;

  constructor(
    private readonly sessions: SessionsService,
    private readonly presence: PresenceService,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.server = server;
    this.realtime.attach(server);

    // Runs for every new connection BEFORE it is accepted: no valid session,
    // no connection. (A pending-2FA session does not count as a login.)
    server.use((socket, next) => {
      void this.authenticate(socket).then(
        (ok) => next(ok ? undefined : new Error('UNAUTHORIZED')),
        () => next(new Error('UNAUTHORIZED')),
      );
    });

    this.heartbeat = setInterval(() => void this.tick(), HEARTBEAT_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.heartbeat);
  }

  handleConnection(socket: Socket): void {
    const userId = (socket.data as SocketData).userId;
    if (!userId) return;

    // Every tab of the user is in this room.
    void socket.join(userRoom(userId));

    // The user's first open socket: they just came online.
    if (this.presence.connect(userId)) {
      void this.presence.markSeen(userId);
      this.realtime.emitToAll(EVENTS.presence, { userId, online: true });
    }
  }

  handleDisconnect(socket: Socket): void {
    const userId = (socket.data as SocketData).userId;
    if (!userId) return; // refused at the handshake

    // The user's last open socket closed: they went offline.
    if (this.presence.disconnect(userId)) {
      void this.presence.markSeen(userId);
      this.realtime.emitToAll(EVENTS.presence, { userId, online: false });
    }
  }

  // match:watch { matchId }: from now on this socket receives match:update for
  // that match. Players and spectators alike (anyone logged in may watch).
  @SubscribeMessage(MESSAGES.matchWatch)
  watch(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): void {
    const matchId = readMatchId(body);
    if (!matchId) return;
    if (socket.rooms.size >= MAX_ROOMS_PER_SOCKET) return;
    void socket.join(matchRoom(matchId));
  }

  @SubscribeMessage(MESSAGES.matchUnwatch)
  unwatch(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): void {
    const matchId = readMatchId(body);
    if (matchId) void socket.leave(matchRoom(matchId));
  }

  // The login check: the session cookie must belong to a real, unexpired,
  // non-pending session.
  private async authenticate(socket: Socket): Promise<boolean> {
    const token = readSessionToken(socket.handshake.headers.cookie);
    const session = token ? await this.sessions.findActive(token) : null;
    if (!token || !session) return false;
    const data = socket.data as SocketData;
    data.userId = session.userId;
    data.token = token;
    return true;
  }

  // Every few seconds: (1) a user with an open socket keeps counting as online;
  // (2) a socket whose login ended (logout, expiry) is closed, so a socket
  // cannot outlive the session that opened it.
  private async tick(): Promise<void> {
    try {
      const alive = new Map<string, boolean>();
      for (const socket of await this.server.fetchSockets()) {
        const token = (socket.data as SocketData).token;
        if (!token) continue;
        if (!alive.has(token)) {
          alive.set(token, (await this.sessions.findActive(token)) !== null);
        }
        if (!alive.get(token)) socket.disconnect(true);
      }
      await this.presence.touchConnected();
    } catch (error) {
      this.logger.warn(`Heartbeat failed: ${String(error)}`);
    }
  }
}
