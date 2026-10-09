import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

// A user is online while they were seen in the last minute. Two things keep
// them "seen": the live connection (the server refreshes every connected user
// every 20 seconds) and, for an app that does not use sockets, a request at
// least every 30 seconds while a tab is visible. After the last socket closes
// the REST value can still say online for up to a minute; the `presence`
// event is immediate.
export const ONLINE_WINDOW_MS = 60_000;

// We write "seen" to the database at most this often per user, so a busy
// page does not turn every request into an UPDATE.
const TOUCH_EVERY_MS = 30_000;

// Pure: is this "last seen" date recent enough to count as online?
export function isOnline(lastSeenAt: Date | null, now = Date.now()): boolean {
  return lastSeenAt !== null && now - lastSeenAt.getTime() < ONLINE_WINDOW_MS;
}

// WHY THIS FILE EXISTS
// Presence: who is online. The session guard calls touch() on every request
// of a logged-in user; views call isOnline() on the stored date.
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  // userId -> when we last wrote it. Lives in memory, so it resets when the
  // server restarts (one extra write, harmless) and is per server instance.
  private readonly lastWrite = new Map<string, number>();

  // userId -> how many sockets (tabs) the user has open right now.
  private readonly connections = new Map<string, number>();

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // A socket opened. True when it is the user's FIRST one (they just came
  // online).
  connect(userId: string): boolean {
    const count = (this.connections.get(userId) ?? 0) + 1;
    this.connections.set(userId, count);
    return count === 1;
  }

  // A socket closed. True when it was the user's LAST one (they went offline).
  disconnect(userId: string): boolean {
    const count = (this.connections.get(userId) ?? 0) - 1;
    if (count > 0) {
      this.connections.set(userId, count);
      return false;
    }
    this.connections.delete(userId);
    return true;
  }

  // Writes "seen now" at once, without the 30 s limit of touch(). Used when a
  // socket opens or closes, so `lastSeenAt` is exact.
  async markSeen(userId: string): Promise<void> {
    const now = Date.now();
    this.lastWrite.set(userId, now);
    try {
      await this.users.update({ id: userId }, { lastSeenAt: new Date(now) });
    } catch (error) {
      this.logger.warn(`Could not record presence: ${String(error)}`);
    }
  }

  // One UPDATE for everybody with an open socket: they are still here.
  async touchConnected(): Promise<void> {
    const ids = [...this.connections.keys()];
    if (ids.length === 0) return;
    await this.users.query(
      'UPDATE users SET last_seen_at = now() WHERE id = ANY($1::uuid[])',
      [ids],
    );
  }

  // Records "this user is here now". Never throws and never makes the request
  // wait: presence is nice to have, it must not break a real action.
  touch(userId: string): void {
    const now = Date.now();
    const previous = this.lastWrite.get(userId) ?? 0;
    if (now - previous < TOUCH_EVERY_MS) return;
    this.lastWrite.set(userId, now);

    void this.users
      .update({ id: userId }, { lastSeenAt: new Date(now) })
      .catch((error: unknown) => {
        // Let the next request retry instead of waiting 30 more seconds.
        this.lastWrite.delete(userId);
        this.logger.warn(`Could not record presence: ${String(error)}`);
      });
  }
}
