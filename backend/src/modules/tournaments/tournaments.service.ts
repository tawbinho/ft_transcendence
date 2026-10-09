import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, type EntityManager, Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { validateSettings } from '../matches/engine/game.engine.js';
import { GameRuleError } from '../matches/engine/game.errors.js';
import {
  DEFAULT_SETTINGS,
  type GameSettings,
} from '../matches/engine/game.types.js';
import { MatchPlayer } from '../matches/entities/match-player.entity.js';
import { DEFAULT_THEME } from '../matches/match.constants.js';
import { MatchesService } from '../matches/matches.service.js';
import { EVENTS } from '../realtime/realtime.constants.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import type { CreateTournamentDto } from './dto/create-tournament.dto.js';
import type { ListTournamentsQuery } from './dto/list-tournaments.query.js';
import {
  buildBracket,
  isFinal,
  isReady,
  placeWinner,
  type Slot,
} from './bracket.js';
import { TournamentPairing } from './entities/tournament-pairing.entity.js';
import { TournamentPlayer } from './entities/tournament-player.entity.js';
import { Tournament } from './entities/tournament.entity.js';
import { MIN_PLAYERS_TO_START } from './tournament.constants.js';
import {
  toTournament,
  toTournamentSummary,
  type TournamentSummaryView,
  type TournamentView,
} from './tournament-view.js';

export interface TournamentPage {
  items: TournamentSummaryView[];
  total: number;
  limit: number;
  offset: number;
}

// WHY THIS FILE EXISTS
// The rules of a tournament: who may create, list, read, cancel it, who may join
// or leave it, starting it (the bracket and its matches) and moving the bracket
// on when a match ends.
//
// Every change to a tournament happens inside a database transaction that first
// LOCKS the tournament row (SELECT ... FOR UPDATE). Two requests for the same
// tournament are therefore handled one after the other, never at the same
// time, so two players can never take the last place together.
@Injectable()
export class TournamentsService implements OnModuleInit {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    @InjectRepository(Tournament)
    private readonly tournaments: Repository<Tournament>,
    @InjectRepository(TournamentPlayer)
    private readonly players: Repository<TournamentPlayer>,
    @InjectRepository(TournamentPairing)
    private readonly pairings: Repository<TournamentPairing>,
    private readonly matches: MatchesService,
    private readonly realtime: RealtimeService,
    private readonly dataSource: DataSource,
  ) {}

  // When a match ends, the bracket moves on (a winner advances, a draw is
  // replayed, the final ends the tournament).
  onModuleInit(): void {
    this.matches.onMatchFinished((matchId) => this.advance(matchId));
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  // Creates a tournament in the "registering" state and registers its creator.
  async create(
    userId: string,
    dto: CreateTournamentDto,
  ): Promise<TournamentView> {
    const settings = this.buildSettings(dto.settings);
    const theme = dto.settings?.theme ?? DEFAULT_THEME;

    const id = await this.dataSource.transaction(async (manager) => {
      const tournament = await manager.save(
        manager.create(Tournament, {
          name: dto.name,
          size: dto.size,
          ...settings,
          theme,
          createdById: userId,
          status: 'registering',
        }),
      );
      // The creator takes the first place.
      await manager.insert(TournamentPlayer, {
        tournamentId: tournament.id,
        userId,
      });
      return tournament.id;
    });

    this.announce(id);
    return this.get(userId, id);
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  // Every tournament, newest first, with an optional status filter and
  // pagination. Any logged-in user can see them all.
  async list(
    userId: string,
    query: ListTournamentsQuery,
  ): Promise<TournamentPage> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const builder = this.tournaments
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.createdBy', 'creator')
      .leftJoinAndSelect('t.winner', 'winner')
      .orderBy('t.createdAt', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .take(limit)
      .skip(offset);
    if (query.status)
      builder.andWhere('t.status = :status', { status: query.status });
    const [rows, total] = await builder.getManyAndCount();

    // Two more queries for the whole page (not one per tournament): how many
    // players registered in each, and which of them the viewer is in.
    const ids = rows.map((tournament) => tournament.id);
    const counts = ids.length
      ? await this.players
          .createQueryBuilder('p')
          .select('p.tournamentId', 'tournamentId')
          .addSelect('COUNT(*)', 'count')
          .where('p.tournamentId IN (:...ids)', { ids })
          .groupBy('p.tournamentId')
          .getRawMany<{ tournamentId: string; count: string }>()
      : [];
    const mine = ids.length
      ? await this.players.find({ where: { tournamentId: In(ids), userId } })
      : [];
    const playerCount = new Map(
      counts.map((row) => [row.tournamentId, Number(row.count)]),
    );
    const joined = new Set(mine.map((row) => row.tournamentId));

    return {
      items: rows.map((tournament) =>
        toTournamentSummary(
          tournament,
          playerCount.get(tournament.id) ?? 0,
          joined.has(tournament.id),
        ),
      ),
      total,
      limit,
      offset,
    };
  }

  // One tournament with the list of registered players.
  async get(userId: string, tournamentId: string): Promise<TournamentView> {
    const tournament = await this.tournaments.findOne({
      where: { id: tournamentId },
      relations: { createdBy: true, winner: true },
    });
    if (!tournament) throw this.notFound();

    // In order of registration. The user id breaks a tie if two players
    // registered in the same millisecond, so the order is always the same.
    const registered = await this.players.find({
      where: { tournamentId },
      relations: { user: true },
      order: { joinedAt: 'ASC', userId: 'ASC' },
    });

    const bracket = await this.pairings.find({ where: { tournamentId } });

    return toTournament(
      tournament,
      registered.map((row) => ({
        userId: row.userId,
        displayName: row.user.displayName,
        avatarUrl: row.user.avatarUrl,
        lastSeenAt: row.user.lastSeenAt,
      })),
      userId,
      bracket,
    );
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  // The viewer takes a place, while registration is open.
  async join(userId: string, tournamentId: string): Promise<TournamentView> {
    await this.dataSource.transaction(async (manager) => {
      const tournament = await this.lockTournament(manager, tournamentId);
      this.requireRegistering(tournament);

      // The lock means a second joiner arrives HERE only after the first one
      // finished, and then sees the place already taken.
      const alreadyIn = await manager.countBy(TournamentPlayer, {
        tournamentId,
        userId,
      });
      if (alreadyIn > 0) {
        throw new AppError('ALREADY_JOINED', 'You are already registered', 409);
      }
      const taken = await manager.countBy(TournamentPlayer, { tournamentId });
      if (taken >= tournament.size) {
        throw new AppError('TOURNAMENT_FULL', 'Every place is taken', 409);
      }

      await manager.insert(TournamentPlayer, { tournamentId, userId });

      // Taking the last place starts the tournament at once.
      if (taken + 1 === tournament.size) {
        await this.startBracket(manager, tournament);
      }
    });

    this.announce(tournamentId);
    return this.get(userId, tournamentId);
  }

  // The viewer gives their place back, while registration is open. The creator
  // cannot leave: they cancel the tournament instead.
  async leave(userId: string, tournamentId: string): Promise<TournamentView> {
    await this.dataSource.transaction(async (manager) => {
      const tournament = await this.lockTournament(manager, tournamentId);
      this.requireRegistering(tournament);

      const registered = await manager.countBy(TournamentPlayer, {
        tournamentId,
        userId,
      });
      if (registered === 0) {
        throw new AppError('NOT_JOINED', 'You are not registered', 409);
      }
      if (tournament.createdById === userId) {
        throw new AppError(
          'CREATOR_CANNOT_LEAVE',
          'The creator cannot leave: cancel the tournament instead',
          409,
        );
      }

      await manager.delete(TournamentPlayer, { tournamentId, userId });
    });

    this.announce(tournamentId);
    return this.get(userId, tournamentId);
  }

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  // The creator starts the tournament before it is full. Needs at least 3
  // players: the empty places of the bracket become byes.
  async start(userId: string, tournamentId: string): Promise<TournamentView> {
    await this.dataSource.transaction(async (manager) => {
      const tournament = await this.lockTournament(manager, tournamentId);
      if (tournament.createdById !== userId) {
        throw new AppError(
          'NOT_CREATOR',
          'Only the creator can start it',
          403,
        );
      }
      this.requireRegistering(tournament);

      const registered = await manager.countBy(TournamentPlayer, {
        tournamentId,
      });
      if (registered < MIN_PLAYERS_TO_START) {
        throw new AppError(
          'NOT_ENOUGH_PLAYERS',
          `At least ${MIN_PLAYERS_TO_START} players are needed to start`,
          409,
        );
      }
      await this.startBracket(manager, tournament);
    });

    this.announce(tournamentId);
    return this.get(userId, tournamentId);
  }

  // Builds the bracket from the registered players, creates the match of every
  // pairing that is ready, and marks the tournament as running. Runs inside a
  // transaction that holds the tournament lock (the caller's).
  private async startBracket(
    manager: EntityManager,
    tournament: Tournament,
  ): Promise<void> {
    const registered = await manager.find(TournamentPlayer, {
      where: { tournamentId: tournament.id },
      order: { joinedAt: 'ASC', userId: 'ASC' },
    });
    const slots = buildBracket(registered.map((row) => row.userId));

    // A pairing is ready when both players are known (byes can already fill a
    // round-1 pairing): its match starts right away.
    for (const slot of slots.filter(isReady)) {
      slot.matchId = await this.createMatchFor(manager, tournament, slot);
    }

    await manager.insert(
      TournamentPairing,
      slots.map((slot) => ({ tournamentId: tournament.id, ...slot })),
    );
    await manager.update(
      Tournament,
      { id: tournament.id },
      { status: 'running', startedAt: new Date() },
    );
  }

  // A started match for a pairing, with the board of the tournament.
  private createMatchFor(
    manager: EntityManager,
    tournament: Tournament,
    slot: Slot,
  ): Promise<string> {
    return this.matches.createStartedMatch(
      manager,
      {
        cols: tournament.cols,
        rows: tournament.rows,
        winLength: tournament.winLength,
        theme: tournament.theme,
      },
      slot.player1Id!,
      slot.player2Id!,
    );
  }

  // ---------------------------------------------------------------------------
  // Advancing
  // ---------------------------------------------------------------------------

  // A match is over. If it was a tournament match, move the bracket on:
  //  - a winner: they take their place in the next round (and that match starts
  //    if the other player is known), or win the tournament after the final;
  //  - a draw: the pairing is replayed with a new match.
  // The tournament row is locked, so two matches ending at the same moment
  // cannot both write to the same next pairing. Safe to call twice for the
  // same match: the second time the pairing already has its winner.
  private async advance(matchId: string): Promise<void> {
    const found = await this.pairings.findOneBy({ matchId });
    if (!found) return; // an ordinary match, not part of a tournament
    const tournamentId = found.tournamentId;

    await this.dataSource.transaction(async (manager) => {
      const tournament = await this.lockTournament(manager, tournamentId);
      if (tournament.status !== 'running') return;

      // Read again now that we hold the lock: it may have moved on already.
      const pairing = await manager.findOneBy(TournamentPairing, {
        id: found.id,
      });
      if (!pairing || pairing.matchId !== matchId || pairing.winnerId) return;

      const results = await manager.find(MatchPlayer, { where: { matchId } });
      const winner = results.find((row) => row.result === 'win');
      const drawn =
        results.length === 2 && results.every((row) => row.result === 'draw');
      if (!winner && !drawn) return; // not a result (cancelled)

      if (!winner) {
        // A tournament needs a winner: play it again, new seats.
        const replay = await this.createMatchFor(manager, tournament, {
          player1Id: pairing.player1Id,
          player2Id: pairing.player2Id,
        } as Slot);
        await manager.update(
          TournamentPairing,
          { id: pairing.id },
          { matchId: replay },
        );
        return;
      }

      const rows = await manager.find(TournamentPairing, {
        where: { tournamentId },
      });
      const slots: Slot[] = rows.map((row) => ({
        round: row.round,
        position: row.position,
        player1Id: row.player1Id,
        player2Id: row.player2Id,
        bye: row.bye,
        winnerId: row.winnerId,
        matchId: row.matchId,
      }));
      const idOf = new Map(
        rows.map((row) => [`${row.round}:${row.position}`, row.id]),
      );
      const changed = placeWinner(
        slots,
        pairing.round,
        pairing.position,
        winner.userId,
      );

      // The next pairing may now have both players: start its match.
      const next = changed[1];
      if (next && isReady(next)) {
        next.matchId = await this.createMatchFor(manager, tournament, next);
      }
      for (const slot of changed) {
        await manager.update(
          TournamentPairing,
          { id: idOf.get(`${slot.round}:${slot.position}`)! },
          {
            player1Id: slot.player1Id,
            player2Id: slot.player2Id,
            winnerId: slot.winnerId,
            matchId: slot.matchId,
          },
        );
      }

      // The final is won: the tournament is over.
      if (isFinal(slots, changed[0]!)) {
        await manager.update(
          Tournament,
          { id: tournamentId },
          { status: 'finished', winnerId: winner.userId, endedAt: new Date() },
        );
      }
    });

    this.announce(tournamentId);
  }

  // ---------------------------------------------------------------------------
  // Cancel
  // ---------------------------------------------------------------------------

  // Only the creator, and only while registration is open. Cancelling DELETES
  // the tournament (its registrations go with it).
  async cancel(userId: string, tournamentId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const tournament = await this.lockTournament(manager, tournamentId);
      if (tournament.createdById !== userId) {
        throw new AppError(
          'NOT_CREATOR',
          'Only the creator can cancel it',
          403,
        );
      }
      this.requireRegistering(tournament);

      await manager.delete(Tournament, { id: tournamentId });
    });
    this.announce(tournamentId);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  // Loads the tournament row and LOCKS it until the transaction ends. Any other
  // transaction that wants the same tournament waits here. No relations are
  // loaded with it on purpose: Postgres cannot lock rows through an outer join.
  private async lockTournament(
    manager: EntityManager,
    tournamentId: string,
  ): Promise<Tournament> {
    const tournament = await manager.findOne(Tournament, {
      where: { id: tournamentId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!tournament) throw this.notFound();
    return tournament;
  }

  // Joining, leaving and cancelling are only possible before the start.
  private requireRegistering(tournament: Tournament): void {
    if (tournament.status !== 'registering') {
      throw new AppError(
        'TOURNAMENT_NOT_OPEN',
        'Registration is over for this tournament',
        409,
      );
    }
  }

  // Tells every connected app that this tournament changed (it refetches the
  // tournament and the list). A cancelled tournament is announced too: the
  // refetch finds it gone.
  private announce(tournamentId: string): void {
    this.realtime.emitToAll(EVENTS.tournamentUpdate, { id: tournamentId });
  }

  private notFound(): AppError {
    return new AppError('TOURNAMENT_NOT_FOUND', 'Tournament not found', 404);
  }

  // Fills in the classic defaults and lets the engine check the combination
  // (the same check as when a match is created).
  private buildSettings(input?: {
    cols?: number;
    rows?: number;
    winLength?: number;
  }): GameSettings {
    try {
      return validateSettings({
        cols: input?.cols ?? DEFAULT_SETTINGS.cols,
        rows: input?.rows ?? DEFAULT_SETTINGS.rows,
        winLength: input?.winLength ?? DEFAULT_SETTINGS.winLength,
      });
    } catch (error) {
      // The engine speaks its own error type; the API speaks AppError.
      if (error instanceof GameRuleError) {
        throw new AppError(error.code, error.message, 400);
      }
      throw error;
    }
  }
}
