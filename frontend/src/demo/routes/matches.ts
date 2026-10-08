import type { Seat } from '@/features/game/engine';
import { randomBetween, type DemoMatch } from '../db';
import { createMatch, joinMatch, playMove, readSettings, resign } from '../matches';
import { conflict, forbidden, notFound, PASS, type DemoContext, type DemoRouter } from '../router';
import { findPlayerByName, matchSummary, matchView, type Session } from '../views';
import type { World } from '../world';
import { bodyOf, paginate } from './common';

// Match routes. Matches against made-up players (challenges, tournament
// matches, the ones on the Watch page) are answered here; every other match
// is a real one and goes to the backend (PASS).

export function matchRoutes(router: DemoRouter, world: World): void {
  const { db } = world;
  const demoMatch = (id: string | undefined) => db.matches.find((match) => match.id === id);

  // Declared before "/matches/:id" so "live" is not taken for an id.
  router.add('spectate', 'GET', '/matches/live', async (ctx) => {
    const session = await world.session(ctx);
    const live = db.matches
      .filter((match) => match.status === 'in_progress')
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));
    return paginate(
      live.map((match) => matchSummary(match, session.viewer.id)),
      ctx.query,
    );
  });

  // A challenge to a made-up player: they join a few seconds later if online.
  router.add(null, 'POST', '/matches', async (ctx) => {
    const { opponentDisplayName, settings } = bodyOf(ctx.body);
    const opponent =
      typeof opponentDisplayName === 'string' ? findPlayerByName(db, opponentDisplayName.trim()) : undefined;
    if (!opponent) return PASS;

    const session = await world.session(ctx);
    const seat: Seat = Math.random() < 0.5 ? 1 : 2;
    const match = createMatch(db, {
      settings: readSettings(settings),
      players: [{ userId: session.viewer.id, displayName: session.viewer.displayName, seat }],
      invitedId: opponent.id,
    });
    if (opponent.online)
      world.schedule({ at: Date.now() + randomBetween(3000, 5000), type: 'join-match', matchId: match.id });
    return matchView(match, session.viewer.id);
  });

  router.add(null, 'GET', '/matches/:id', async (ctx) => {
    const match = demoMatch(ctx.params.id);
    if (!match) return PASS;
    const session = await world.session(ctx);
    return matchView(match, session.viewer.id);
  });

  router.add(null, 'POST', '/matches/:id/join', async (ctx) => {
    const match = demoMatch(ctx.params.id);
    if (!match) return PASS;
    const session = await world.session(ctx);
    // The same checks, in the same order, as the backend.
    if (match.status !== 'waiting') throw conflict('MATCH_NOT_JOINABLE', 'This match is not open any more');
    if (match.players.some((player) => player.userId === session.viewer.id)) {
      throw conflict('ALREADY_IN_MATCH', 'You are already in this match');
    }
    if (match.invitedId && match.invitedId !== session.viewer.id) {
      throw forbidden('NOT_INVITED', 'This match is reserved for another player');
    }
    joinMatch(db, match, { userId: session.viewer.id, displayName: session.viewer.displayName });
    return update(session, match);
  });

  router.add(null, 'POST', '/matches/:id/moves', async (ctx) => {
    const found = await playerMatch(ctx);
    if (!found) return PASS;
    const [session, match, seat] = found;
    playMove(db, match, seat, bodyOf(ctx.body).col);
    return update(session, match);
  });

  router.add(null, 'POST', '/matches/:id/resign', async (ctx) => {
    const found = await playerMatch(ctx);
    if (!found) return PASS;
    const [session, match, seat] = found;
    resign(match, seat);
    return update(session, match);
  });

  /** A demo match the viewer plays in, with their seat; null for a real match. */
  async function playerMatch(ctx: DemoContext): Promise<[Session, DemoMatch, Seat] | null> {
    const match = demoMatch(ctx.params.id);
    if (!match) return null;
    const session = await world.session(ctx);
    const seat = match.players.find((player) => player.userId === session.viewer.id)?.seat;
    // Like the backend: a match you do not play in does not exist for you.
    if (!seat) throw notFound('MATCH_NOT_FOUND', 'Match not found');
    return [session, match, seat];
  }

  function update(session: Session, match: DemoMatch) {
    const view = matchView(match, session.viewer.id);
    world.emit('match:update', view);
    return view;
  }
}
