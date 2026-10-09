import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';
import { PresenceService } from '../users/presence.service.js';
import { MatchesService } from './matches.service.js';

// WHY THIS FILE EXISTS
// A remote game needs a rule for a player who leaves: closing the tab or
// losing the connection must not freeze the opponent forever. The rule:
//  - when a player's LAST socket closes, each running match of theirs gets a
//    countdown (DISCONNECT_GRACE_SECONDS, 30 by default);
//  - if they open a socket again before it ends (a page refresh, a network
//    cut), the countdowns are cancelled and the game goes on;
//  - otherwise they lose (end reason `disconnect`) and the opponent wins.
// Only players who WERE connected can be forfeited: an app that does not use
// sockets never triggers this. The countdowns live in memory, so a server
// restart drops them (the players reconnect and keep playing).
@Injectable()
export class DisconnectForfeitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DisconnectForfeitService.name);

  // userId -> the countdowns running for that user's matches.
  private readonly timers = new Map<string, Set<NodeJS.Timeout>>();

  constructor(
    private readonly matches: MatchesService,
    private readonly presence: PresenceService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    this.presence.onUserOffline((userId) => void this.start(userId));
    this.presence.onUserOnline((userId) => this.cancel(userId));
  }

  onModuleDestroy(): void {
    for (const userId of this.timers.keys()) this.cancel(userId);
  }

  // The user has no socket left: start a countdown for each running match.
  async start(userId: string): Promise<void> {
    try {
      const matchIds = await this.matches.inProgressMatchIdsOf(userId);
      // They may have reconnected while we were asking the database.
      if (matchIds.length === 0 || this.presence.isConnected(userId)) return;

      this.cancel(userId); // never two countdowns for the same match
      const graceMs =
        this.config.get('DISCONNECT_GRACE_SECONDS', { infer: true }) * 1000;
      const timers = new Set<NodeJS.Timeout>();
      for (const matchId of matchIds) {
        const timer = setTimeout(() => {
          timers.delete(timer);
          if (timers.size === 0) this.timers.delete(userId);
          void this.forfeit(userId, matchId);
        }, graceMs);
        timers.add(timer);
      }
      this.timers.set(userId, timers);
    } catch (error) {
      this.logger.warn(`Could not start the countdown: ${String(error)}`);
    }
  }

  // The user is back: stop their countdowns.
  cancel(userId: string): void {
    for (const timer of this.timers.get(userId) ?? []) clearTimeout(timer);
    this.timers.delete(userId);
  }

  private async forfeit(userId: string, matchId: string): Promise<void> {
    // Checked again at the last moment, in case a reconnection slipped by.
    if (this.presence.isConnected(userId)) return;
    try {
      await this.matches.forfeitByDisconnect(userId, matchId);
    } catch (error) {
      this.logger.warn(`Could not forfeit match ${matchId}: ${String(error)}`);
    }
  }
}
