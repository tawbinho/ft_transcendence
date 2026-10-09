import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Env } from '../../config/env.validation.js';
import { MatchesService } from '../matches/matches.service.js';
import { TournamentPairing } from './entities/tournament-pairing.entity.js';

// How often we look for stalled matches.
export const SWEEP_EVERY_MS = 15_000;

// WHY THIS FILE EXISTS
// A tournament cannot wait for ever for a player who never plays: the other
// players are waiting for the winner. So in a TOURNAMENT match, the player
// whose turn it is loses if no move has been made for
// TOURNAMENT_TURN_TIMEOUT_SECONDS (180 by default). The clock starts when the
// match starts, and restarts after every move. Ordinary matches have no clock.
//
// The check is a query on the database, repeated every few seconds, instead of
// a timer per match in memory: a server restart cannot lose a clock. The loser
// is recorded as a `disconnect` (the player left the game), which also moves
// the bracket on, like any other end of a match.
@Injectable()
export class TurnTimeoutService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TurnTimeoutService.name);
  private timer: NodeJS.Timeout | undefined;
  private sweeping = false;

  constructor(
    @InjectRepository(TournamentPairing)
    private readonly pairings: Repository<TournamentPairing>,
    private readonly matches: MatchesService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.sweep(), SWEEP_EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  // One pass: forfeits every stalled tournament match. Never overlaps itself.
  async sweep(): Promise<number> {
    if (this.sweeping) return 0;
    this.sweeping = true;
    try {
      const timeout = this.config.get('TOURNAMENT_TURN_TIMEOUT_SECONDS', {
        infer: true,
      });
      const stalled = await this.findStalled(timeout);
      let ended = 0;
      for (const { matchId, userId } of stalled) {
        try {
          if (await this.matches.forfeitByDisconnect(userId, matchId)) ended++;
        } catch (error) {
          this.logger.warn(`Could not forfeit match ${matchId}: ${String(error)}`);
        }
      }
      return ended;
    } catch (error) {
      this.logger.warn(`Turn timeout sweep failed: ${String(error)}`);
      return 0;
    } finally {
      this.sweeping = false;
    }
  }

  // The running tournament matches nobody has moved in for `timeoutSeconds`,
  // with the player whose turn it is. Seat 1 plays first and the seats
  // alternate, so an even number of moves means seat 1 is to move.
  async findStalled(
    timeoutSeconds: number,
  ): Promise<Array<{ matchId: string; userId: string }>> {
    const rows = await this.pairings.query<
      Array<{ match_id: string; user_id: string }>
    >(
      `SELECT m.id AS match_id, mp.user_id
         FROM tournament_pairings tp
         JOIN matches m ON m.id = tp.match_id AND m.status = 'in_progress'
         JOIN match_players mp ON mp.match_id = m.id
        WHERE mp.seat = CASE
                WHEN (SELECT COUNT(*) FROM match_moves mv WHERE mv.match_id = m.id) % 2 = 0
                THEN 1 ELSE 2 END
          AND COALESCE(
                (SELECT MAX(mv.played_at) FROM match_moves mv WHERE mv.match_id = m.id),
                m.started_at
              ) < now() - ($1 * interval '1 second')`,
      [timeoutSeconds],
    );
    return rows.map((row) => ({ matchId: row.match_id, userId: row.user_id }));
  }
}
