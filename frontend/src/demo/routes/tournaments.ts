import {
  MIN_TOURNAMENT_PLAYERS,
  TOURNAMENT_SIZES,
  TOURNAMENT_STATUSES,
  type TournamentSize,
  type TournamentStatus,
} from '@/features/tournaments/types';
import { validateTournamentName } from '@/features/tournaments/validation';
import { isoNow, newId, randomBetween, type DemoTournament } from '../db';
import { readSettings } from '../matches';
import { conflict, forbidden, invalid, notFound, type DemoRouter } from '../router';
import { startTournament } from '../tournaments';
import { tournamentSummary, tournamentView, type Session } from '../views';
import type { World } from '../world';
import { bodyOf, paginate } from './common';

// The tournament routes (/tournaments/...).

export function tournamentRoutes(router: DemoRouter, world: World): void {
  const { db } = world;

  router.add('tournaments', 'GET', '/tournaments', async (ctx) => {
    const session = await world.session(ctx);
    const status = ctx.query.status as TournamentStatus | undefined;
    if (status !== undefined && !TOURNAMENT_STATUSES.includes(status)) {
      throw invalid('status must be registering, running or finished');
    }
    const list = db.tournaments
      .filter((t) => !status || t.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => tournamentSummary(session, t));
    return paginate(list, ctx.query);
  });

  router.add('tournaments', 'POST', '/tournaments', async (ctx) => {
    const session = await world.session(ctx);
    const { name, size, settings } = bodyOf(ctx.body);
    if (typeof name !== 'string' || validateTournamentName(name) !== null) {
      throw invalid("name must be 3 to 30 letters, numbers, spaces or - _ ' .");
    }
    if (!TOURNAMENT_SIZES.includes(size as TournamentSize)) throw invalid('size must be 4 or 8');
    const tournament: DemoTournament = {
      id: newId(),
      name: name.trim(),
      status: 'registering',
      size: size as TournamentSize,
      settings: readSettings(settings),
      createdBy: session.viewer.id,
      createdAt: isoNow(),
      startedAt: null,
      endedAt: null,
      players: [session.viewer.id],
      bracket: [],
      pairings: {},
    };
    db.tournaments.push(tournament);
    invitePlayers(tournament);
    return tournamentView(session, tournament);
  });

  router.add('tournaments', 'GET', '/tournaments/:id', async (ctx) => {
    const session = await world.session(ctx);
    return tournamentView(session, find(ctx.params.id!));
  });

  router.add('tournaments', 'POST', '/tournaments/:id/join', async (ctx) => {
    const session = await world.session(ctx);
    const tournament = openTournament(ctx.params.id!);
    if (tournament.players.includes(session.viewer.id)) throw conflict('ALREADY_JOINED', 'You are already registered');
    if (tournament.players.length >= tournament.size) throw conflict('TOURNAMENT_FULL', 'This tournament is full');
    tournament.players.push(session.viewer.id);
    if (tournament.players.length >= tournament.size) startTournament(world, tournament);
    else invitePlayers(tournament);
    return changed(session, tournament);
  });

  router.add('tournaments', 'POST', '/tournaments/:id/leave', async (ctx) => {
    const session = await world.session(ctx);
    const tournament = openTournament(ctx.params.id!);
    if (!tournament.players.includes(session.viewer.id)) throw conflict('NOT_JOINED', 'You are not registered');
    if (tournament.createdBy === session.viewer.id) {
      throw conflict('CREATOR_CANNOT_LEAVE', 'Cancel the tournament instead');
    }
    tournament.players = tournament.players.filter((id) => id !== session.viewer.id);
    return changed(session, tournament);
  });

  router.add('tournaments', 'POST', '/tournaments/:id/start', async (ctx) => {
    const session = await world.session(ctx);
    const tournament = ownTournament(session, ctx.params.id!);
    if (tournament.players.length < MIN_TOURNAMENT_PLAYERS) {
      throw conflict('NOT_ENOUGH_PLAYERS', `At least ${MIN_TOURNAMENT_PLAYERS} players are needed`);
    }
    startTournament(world, tournament);
    return changed(session, tournament);
  });

  router.add('tournaments', 'DELETE', '/tournaments/:id', async (ctx) => {
    const session = await world.session(ctx);
    const tournament = ownTournament(session, ctx.params.id!);
    db.tournaments = db.tournaments.filter((t) => t.id !== tournament.id);
    world.emit('tournament:update', { id: tournament.id });
    return null;
  });

  function find(id: string): DemoTournament {
    const tournament = db.tournaments.find((t) => t.id === id);
    if (!tournament) throw notFound('TOURNAMENT_NOT_FOUND', 'This tournament does not exist');
    return tournament;
  }

  function openTournament(id: string): DemoTournament {
    const tournament = find(id);
    if (tournament.status !== 'registering') throw conflict('TOURNAMENT_NOT_OPEN', 'Registration is closed');
    return tournament;
  }

  function ownTournament(session: Session, id: string): DemoTournament {
    const tournament = openTournament(id);
    if (tournament.createdBy !== session.viewer.id) throw forbidden('NOT_CREATOR', 'Only the creator can do this');
    return tournament;
  }

  /** Made-up players sign up one by one until the tournament is full. */
  function invitePlayers(tournament: DemoTournament) {
    const pending = db.tasks.some((task) => task.type === 'join-tournament' && task.tournamentId === tournament.id);
    if (!pending) {
      world.schedule({
        at: Date.now() + randomBetween(4000, 7000),
        type: 'join-tournament',
        tournamentId: tournament.id,
      });
    }
  }

  function changed(session: Session, tournament: DemoTournament) {
    world.emit('tournament:update', { id: tournament.id });
    return tournamentView(session, tournament);
  }
}
