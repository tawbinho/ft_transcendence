import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, type EntityManager, Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { validateSettings } from '../matches/engine/game.engine.js';
import { GameRuleError } from '../matches/engine/game.errors.js';
import {
  DEFAULT_SETTINGS,
  type GameSettings,
} from '../matches/engine/game.types.js';
import { DEFAULT_THEME } from '../matches/match.constants.js';
import type { CreateTournamentDto } from './dto/create-tournament.dto.js';
import type { ListTournamentsQuery } from './dto/list-tournaments.query.js';
import { TournamentPlayer } from './entities/tournament-player.entity.js';
import { Tournament } from './entities/tournament.entity.js';
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
// The rules of a tournament: who may create, list, read, cancel it, and who may
// join or leave it. Starting it and playing the bracket are NOT here yet.
//
// Every change to a tournament happens inside a database transaction that first
// LOCKS the tournament row (SELECT ... FOR UPDATE). Two requests for the same
// tournament are therefore handled one after the other, never at the same
// time, so two players can never take the last place together.
@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournaments: Repository<Tournament>,
    @InjectRepository(TournamentPlayer)
    private readonly players: Repository<TournamentPlayer>,
    private readonly dataSource: DataSource,
  ) {}

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

    return toTournament(
      tournament,
      registered.map((row) => ({
        userId: row.userId,
        displayName: row.user.displayName,
        avatarUrl: row.user.avatarUrl,
      })),
      userId,
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
    });

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

    return this.get(userId, tournamentId);
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
