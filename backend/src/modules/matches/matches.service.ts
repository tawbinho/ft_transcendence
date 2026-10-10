import { randomInt } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, type EntityManager, Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { UsersService } from '../users/users.service.js';
import { BlocksService } from '../friends/blocks.service.js';
import { EVENTS } from '../realtime/realtime.constants.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import type {
  CreateMatchDto,
  MatchSettingsDto,
} from './dto/create-match.dto.js';
import type { ListLiveMatchesQuery } from './dto/list-live-matches.query.js';
import type { ListMatchesQuery } from './dto/list-matches.query.js';
import { drop, replay, validateSettings } from './engine/game.engine.js';
import { GameRuleError } from './engine/game.errors.js';
import { DEFAULT_SETTINGS, type GameSettings } from './engine/game.types.js';
import { MatchMove } from './entities/match-move.entity.js';
import { MatchPlayer } from './entities/match-player.entity.js';
import { Match } from './entities/match.entity.js';
import {
  DEFAULT_THEME,
  MAX_WAITING_MATCHES_PER_USER,
} from './match.constants.js';
import {
  toMatchSummary,
  toMatchView,
  type MatchSummaryView,
  type MatchView,
} from './match-view.js';

// How the engine's rule errors map to HTTP statuses.
const RULE_ERROR_STATUS = {
  INVALID_SETTINGS: 400,
  INVALID_COLUMN: 400,
  COLUMN_FULL: 409,
  GAME_OVER: 409,
} as const;

export interface MatchPage {
  items: MatchSummaryView[];
  total: number;
  limit: number;
  offset: number;
}

// WHY THIS FILE EXISTS
// The rules of a match: creating one, joining it, playing moves, resigning,
// reading it back. The Connect Four rules themselves are in the engine; this
// service decides WHO may do WHAT and keeps the database consistent.
//
// Every change to a match happens inside a database transaction that first
// LOCKS the match row (SELECT ... FOR UPDATE). Two requests for the same match
// are therefore handled one after the other, never at the same time, so two
// players can never take the same seat and a move can never be stored twice.
@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(MatchPlayer)
    private readonly players: Repository<MatchPlayer>,
    @InjectRepository(MatchMove) private readonly moves: Repository<MatchMove>,
    private readonly users: UsersService,
    private readonly blocks: BlocksService,
    private readonly realtime: RealtimeService,
    private readonly dataSource: DataSource,
  ) {}

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  // Creates a match in the "waiting" state with the creator in a random seat.
  async create(userId: string, dto: CreateMatchDto): Promise<MatchView> {
    const settings = this.buildSettings(dto.settings);
    const theme = dto.settings?.theme ?? DEFAULT_THEME;

    // An invitation reserves the match for one player, found by display name.
    let invitedUserId: string | null = null;
    if (dto.opponentDisplayName) {
      const invited = await this.users.findByDisplayName(
        dto.opponentDisplayName,
      );
      if (!invited) {
        throw new AppError(
          'USER_NOT_FOUND',
          'No player has this display name',
          404,
        );
      }
      if (invited.id === userId) {
        throw new AppError(
          'CANNOT_INVITE_SELF',
          'You cannot invite yourself',
          400,
        );
      }
      // Nobody can invite a player who blocked them, or whom they blocked.
      if (await this.blocks.isBlockedBetween(userId, invited.id)) {
        throw new AppError('BLOCKED', 'You cannot invite this player', 403);
      }
      invitedUserId = invited.id;
    }

    const matchId = await this.dataSource.transaction(async (manager) => {
      // Stops one user from flooding the lobby with matches nobody joins.
      // (A soft limit: two simultaneous creates could just exceed it.)
      const waiting = await manager
        .createQueryBuilder(Match, 'm')
        .innerJoin(MatchPlayer, 'p', 'p.matchId = m.id')
        .where('p.userId = :userId', { userId })
        .andWhere("m.status = 'waiting'")
        .getCount();
      if (waiting >= MAX_WAITING_MATCHES_PER_USER) {
        throw new AppError(
          'TOO_MANY_WAITING_MATCHES',
          `You already have ${MAX_WAITING_MATCHES_PER_USER} matches waiting for an opponent`,
          409,
        );
      }

      const match = await manager.save(
        manager.create(Match, {
          ...settings,
          theme,
          invitedUserId,
          status: 'waiting',
        }),
      );

      // The first seat is a coin flip: moving first is a big advantage in
      // Connect Four, so the creator should not always have it.
      await manager.save(
        manager.create(MatchPlayer, {
          matchId: match.id,
          seat: randomInt(1, 3),
          userId,
          result: null,
        }),
      );
      return match.id;
    });

    // Nobody watches a new match yet, but a computer opponent it was reserved
    // for must hear about it (to join).
    await this.broadcast(matchId);
    return this.get(userId, matchId);
  }

  // ---------------------------------------------------------------------------
  // Join
  // ---------------------------------------------------------------------------

  // The second player takes the free seat and the match starts.
  async join(userId: string, matchId: string): Promise<MatchView> {
    await this.dataSource.transaction(async (manager) => {
      const match = await this.lockMatch(manager, matchId);

      // The lock means a second joiner arrives HERE only after the first one
      // finished, and then finds the match already in progress.
      if (match.status !== 'waiting') {
        throw new AppError(
          'MATCH_NOT_JOINABLE',
          'This match is not open any more',
          409,
        );
      }
      const seated = await manager.find(MatchPlayer, { where: { matchId } });
      if (seated.some((player) => player.userId === userId)) {
        throw new AppError(
          'ALREADY_IN_MATCH',
          'You are already in this match',
          409,
        );
      }
      if (match.invitedUserId && match.invitedUserId !== userId) {
        throw new AppError(
          'NOT_INVITED',
          'This match is reserved for another player',
          403,
        );
      }
      if (seated.length !== 1) {
        throw new AppError(
          'MATCH_NOT_JOINABLE',
          'This match is not open any more',
          409,
        );
      }

      const freeSeat = seated[0]!.seat === 1 ? 2 : 1;
      await manager.insert(MatchPlayer, {
        matchId,
        seat: freeSeat,
        userId,
        result: null,
      });
      await manager.update(
        Match,
        { id: matchId },
        {
          status: 'in_progress',
          startedAt: new Date(),
        },
      );
    });

    await this.broadcast(matchId);
    return this.get(userId, matchId);
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  // The full state of one match. Any logged-in user may read it (spectator
  // mode): `yourSeat` is null for someone who does not play it. Joining,
  // moving and resigning stay for the players.
  async get(userId: string, matchId: string): Promise<MatchView> {
    return this.load(userId, matchId);
  }

  // Loads a match and builds its view for one viewer (null: nobody in
  // particular, used for live events).
  private async load(
    viewerId: string | null,
    matchId: string,
  ): Promise<MatchView> {
    const match = await this.matches.findOneBy({ id: matchId });
    if (!match) throw this.notFound();
    const players = await this.players.find({
      where: { matchId },
      relations: { user: true },
    });

    const moves = await this.moves.find({
      where: { matchId },
      order: { ply: 'ASC' },
    });
    return toMatchView(
      match,
      players.map((p) => ({
        seat: p.seat,
        userId: p.userId,
        displayName: p.user.displayName,
        result: p.result,
      })),
      moves,
      viewerId,
    );
  }

  // Tells everybody watching this match that it changed. Live events are
  // hints (the app also polls), so a failure here must never fail the request
  // that already succeeded.
  private async broadcast(matchId: string): Promise<void> {
    try {
      this.realtime.emitToMatch(
        matchId,
        EVENTS.matchUpdate,
        await this.load(null, matchId),
      );
    } catch {
      // ignored on purpose
    }
    // Listeners run in the background: a slow one must not delay the request.
    for (const listener of this.changedListeners) {
      void Promise.resolve()
        .then(() => listener(matchId))
        .catch((error: unknown) => {
          this.logger.warn(`Match changed listener failed: ${String(error)}`);
        });
    }
  }

  // The matches the user plays or played, newest first, with optional status
  // filter and pagination. This is the base of the match history.
  async listMine(userId: string, query: ListMatchesQuery): Promise<MatchPage> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const builder = this.matches
      .createQueryBuilder('m')
      .innerJoin(
        MatchPlayer,
        'me',
        'me.matchId = m.id AND me.userId = :userId',
        {
          userId,
        },
      )
      .orderBy('m.createdAt', 'DESC')
      .take(limit)
      .skip(offset);
    if (query.status)
      builder.andWhere('m.status = :status', { status: query.status });
    const [matches, total] = await builder.getManyAndCount();
    return this.toPage(matches, total, limit, offset, userId);
  }

  // ---------------------------------------------------------------------------
  // Live matches (the Watch page)
  // ---------------------------------------------------------------------------

  // Every match being played right now, most recently started first. Any
  // logged-in user can list them (spectator mode); `yourSeat` is the viewer's
  // seat in the matches they play, null in the others. A spectator then opens
  // one with GET /matches/:id.
  async listLive(
    userId: string,
    query: ListLiveMatchesQuery,
  ): Promise<MatchPage> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [matches, total] = await this.matches
      .createQueryBuilder('m')
      .where("m.status = 'in_progress'")
      .orderBy('m.startedAt', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();
    return this.toPage(matches, total, limit, offset, userId);
  }

  // Turns a page of match rows into the list the API sends. Two more queries
  // for the whole page (not one per match): the players and the number of
  // moves of each match. Shared by every list of matches.
  private async toPage(
    matches: Match[],
    total: number,
    limit: number,
    offset: number,
    viewerId: string,
  ): Promise<MatchPage> {
    const ids = matches.map((match) => match.id);
    const players = ids.length
      ? await this.players.find({
          where: { matchId: In(ids) },
          relations: { user: true },
        })
      : [];
    const counts = ids.length
      ? await this.moves
          .createQueryBuilder('mv')
          .select('mv.matchId', 'matchId')
          .addSelect('COUNT(*)', 'count')
          .where('mv.matchId IN (:...ids)', { ids })
          .groupBy('mv.matchId')
          .getRawMany<{ matchId: string; count: string }>()
      : [];
    const moveCount = new Map(
      counts.map((row) => [row.matchId, Number(row.count)]),
    );

    return {
      items: matches.map((match) =>
        toMatchSummary(
          match,
          players
            .filter((p) => p.matchId === match.id)
            .map((p) => ({
              seat: p.seat,
              userId: p.userId,
              displayName: p.user.displayName,
              result: p.result,
            })),
          moveCount.get(match.id) ?? 0,
          viewerId,
        ),
      ),
      total,
      limit,
      offset,
    };
  }

  // ---------------------------------------------------------------------------
  // Play
  // ---------------------------------------------------------------------------

  // The player drops a disc in `col`. The engine judges the move; this method
  // checks the match is running, that the user is a player, and that it is
  // their turn, then saves the move and, if the game ended, the result.
  async makeMove(
    userId: string,
    matchId: string,
    col: number,
  ): Promise<MatchView> {
    const finished = await this.dataSource.transaction(async (manager) => {
      const match = await this.lockMatch(manager, matchId);
      const players = await manager.find(MatchPlayer, { where: { matchId } });
      const me = players.find((player) => player.userId === userId);
      if (!me) throw this.notFound();
      if (match.status !== 'in_progress') {
        throw new AppError(
          'MATCH_NOT_ACTIVE',
          'This match is not being played',
          409,
        );
      }

      // The board is never stored: rebuild it from the saved moves.
      const stored = await manager.find(MatchMove, {
        where: { matchId },
        order: { ply: 'ASC' },
      });
      let state = replay(
        this.settingsOf(match),
        stored.map((move) => move.col),
      );

      if (state.current !== me.seat) {
        throw new AppError('NOT_YOUR_TURN', 'It is not your turn', 409);
      }
      try {
        state = drop(state, col);
      } catch (error) {
        throw this.ruleError(error);
      }

      // The primary key (match, ply) is a second safety net: even without the
      // lock, a move number could not be stored twice.
      await manager.insert(MatchMove, {
        matchId,
        ply: state.moveCount,
        seat: me.seat,
        col,
      });

      if (state.status !== 'playing') {
        await manager.update(
          Match,
          { id: matchId },
          {
            status: 'finished',
            endReason: state.status === 'won' ? 'win' : 'draw',
            endedAt: new Date(),
          },
        );
        for (const player of players) {
          await manager.update(
            MatchPlayer,
            { matchId, seat: player.seat },
            {
              result:
                state.status === 'draw'
                  ? 'draw'
                  : player.seat === state.winner
                    ? 'win'
                    : 'loss',
            },
          );
        }
      }
      // Did this move end the match (a win or a draw)?
      return state.status !== 'playing';
    });

    await this.broadcast(matchId);
    if (finished) await this.notifyFinished(matchId);
    return this.get(userId, matchId);
  }

  // Giving up. In a running match the other player wins. In a match still
  // waiting for an opponent it simply cancels the match.
  async resign(userId: string, matchId: string): Promise<MatchView> {
    const ended = await this.dataSource.transaction(async (manager) => {
      const match = await this.lockMatch(manager, matchId);
      const players = await manager.find(MatchPlayer, { where: { matchId } });
      if (!players.some((player) => player.userId === userId))
        throw this.notFound();

      if (match.status === 'waiting') {
        await manager.update(
          Match,
          { id: matchId },
          {
            status: 'abandoned',
            endedAt: new Date(),
          },
        );
        return false; // a cancelled waiting match is not a result
      }
      if (match.status !== 'in_progress') {
        throw new AppError(
          'MATCH_NOT_ACTIVE',
          'This match is already over',
          409,
        );
      }

      await this.endByForfeit(manager, matchId, players, userId, 'resign');
      return true;
    });

    await this.broadcast(matchId);
    if (ended) await this.notifyFinished(matchId);
    return this.get(userId, matchId);
  }

  // ---------------------------------------------------------------------------
  // Matches made by the server (tournaments)
  // ---------------------------------------------------------------------------

  // Creates a match between two players that STARTS AT ONCE: both seated (seats
  // at random: moving first is an advantage), `in_progress`, nobody has to join.
  // Runs inside the caller's transaction, so a tournament can create its
  // matches and update its bracket atomically. Returns the match id.
  async createStartedMatch(
    manager: EntityManager,
    settings: GameSettings & { theme: string },
    playerAId: string,
    playerBId: string,
  ): Promise<string> {
    const match = await manager.save(
      manager.create(Match, {
        cols: settings.cols,
        rows: settings.rows,
        winLength: settings.winLength,
        theme: settings.theme,
        invitedUserId: null,
        status: 'in_progress',
        startedAt: new Date(),
      }),
    );
    const seatA = randomInt(1, 3);
    await manager.insert(MatchPlayer, [
      { matchId: match.id, seat: seatA, userId: playerAId, result: null },
      { matchId: match.id, seat: seatA === 1 ? 2 : 1, userId: playerBId, result: null },
    ]);
    return match.id;
  }

  // Other modules can ask to be told when a match is OVER (won, drawn,
  // resigned or forfeited): the tournaments module moves its bracket on.
  // A listener that fails must not break the request that ended the match.
  private readonly finishedListeners: Array<
    (matchId: string) => Promise<void> | void
  > = [];

  // The same for ANY change of a match (created, joined, a move, the end): the
  // computer opponent uses it to join a match it was invited to and to answer
  // a move.
  private readonly changedListeners: Array<
    (matchId: string) => Promise<void> | void
  > = [];

  onMatchChanged(listener: (matchId: string) => Promise<void> | void): void {
    this.changedListeners.push(listener);
  }

  onMatchFinished(listener: (matchId: string) => Promise<void> | void): void {
    this.finishedListeners.push(listener);
  }

  private async notifyFinished(matchId: string): Promise<void> {
    for (const listener of this.finishedListeners) {
      try {
        await listener(matchId);
      } catch (error) {
        this.logger.warn(`Match finished listener failed: ${String(error)}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Disconnection
  // ---------------------------------------------------------------------------

  // The ids of the matches the user is playing right now.
  async inProgressMatchIdsOf(userId: string): Promise<string[]> {
    const rows = await this.matches
      .createQueryBuilder('m')
      .select('m.id', 'id')
      .innerJoin(MatchPlayer, 'p', 'p.matchId = m.id')
      .where('p.userId = :userId', { userId })
      .andWhere("m.status = 'in_progress'")
      .getRawMany<{ id: string }>();
    return rows.map((row) => row.id);
  }

  // The player stayed away too long: they lose and the opponent wins. Called
  // by a timer, so by now the match may already be over (resigned, or the
  // other player left first): then nothing happens. Returns true if it ended.
  async forfeitByDisconnect(userId: string, matchId: string): Promise<boolean> {
    const ended = await this.dataSource.transaction(async (manager) => {
      const match = await manager.findOne(Match, {
        where: { id: matchId },
        lock: { mode: 'pessimistic_write' },
      });
      if (match?.status !== 'in_progress') return false;
      const players = await manager.find(MatchPlayer, { where: { matchId } });
      if (!players.some((player) => player.userId === userId)) return false;

      await this.endByForfeit(manager, matchId, players, userId, 'disconnect');
      return true;
    });
    if (ended) {
      await this.broadcast(matchId);
      await this.notifyFinished(matchId);
    }
    return ended;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  // Ends a running match because `loserId` gave up (resign) or left
  // (disconnect): the match is finished, the loser loses, the other wins.
  // Must run inside a transaction that holds the match lock.
  private async endByForfeit(
    manager: EntityManager,
    matchId: string,
    players: MatchPlayer[],
    loserId: string,
    reason: 'resign' | 'disconnect',
  ): Promise<void> {
    await manager.update(
      Match,
      { id: matchId },
      { status: 'finished', endReason: reason, endedAt: new Date() },
    );
    for (const player of players) {
      await manager.update(
        MatchPlayer,
        { matchId, seat: player.seat },
        { result: player.userId === loserId ? 'loss' : 'win' },
      );
    }
  }

  // Loads the match row and LOCKS it until the transaction ends. Any other
  // transaction that wants the same match waits here. No relations are loaded
  // with it on purpose: Postgres cannot lock rows through an outer join.
  private async lockMatch(
    manager: EntityManager,
    matchId: string,
  ): Promise<Match> {
    const match = await manager.findOne(Match, {
      where: { id: matchId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!match) throw this.notFound();
    return match;
  }

  private notFound(): AppError {
    return new AppError('MATCH_NOT_FOUND', 'Match not found', 404);
  }

  private settingsOf(match: Match): GameSettings {
    return { cols: match.cols, rows: match.rows, winLength: match.winLength };
  }

  // Fills in the classic defaults and lets the engine check the combination
  // (for example a win length longer than the board).
  private buildSettings(input?: MatchSettingsDto): GameSettings {
    try {
      return validateSettings({
        cols: input?.cols ?? DEFAULT_SETTINGS.cols,
        rows: input?.rows ?? DEFAULT_SETTINGS.rows,
        winLength: input?.winLength ?? DEFAULT_SETTINGS.winLength,
      });
    } catch (error) {
      throw this.ruleError(error);
    }
  }

  // The engine reports its own error type; the API speaks AppError.
  private ruleError(error: unknown): unknown {
    if (error instanceof GameRuleError) {
      return new AppError(
        error.code,
        error.message,
        RULE_ERROR_STATUS[error.code],
      );
    }
    return error;
  }
}
