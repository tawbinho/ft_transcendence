import { createBracket, isPlayable, recordWinner, shuffle } from '@/features/tournaments/bracket';
import { isoNow, newId, type DemoMessage, type DemoTournament } from './db';
import { createMatch } from './matches';
import { findPlayer, messageView, type Session } from './views';
import type { World } from './world';

// Runs online tournaments the way the backend should: build the bracket at
// the start, create a match for every pairing whose two players are known,
// move winners on, replay draws, and finish after the final.

/** Thinking time per move when two made-up players meet, so brackets move on quickly. */
const FAST_MOVE_MS = 700;

export function startTournament(world: World, tournament: DemoTournament, now = Date.now()): void {
  tournament.status = 'running';
  tournament.startedAt = new Date(now).toISOString();
  tournament.bracket = createBracket(shuffle(tournament.players));
  tournament.pairings = {};
  tournament.bracket.forEach((round, r) =>
    round.forEach((_, i) => {
      tournament.pairings[`${r}:${i}`] = { id: newId(), matchId: null };
    }),
  );
  advanceTournament(world, tournament, now);
}

/**
 * Records the results of finished pairing matches and creates the matches of
 * pairings that are ready. Returns whether anything changed.
 */
export function advanceTournament(world: World, tournament: DemoTournament, now = Date.now()): boolean {
  if (tournament.status !== 'running') return false;
  const { db } = world;
  const session = world.lastSession();
  let changed = false;

  for (let r = 0; r < tournament.bracket.length; r++) {
    for (let i = 0; i < tournament.bracket[r]!.length; i++) {
      const pairing = tournament.bracket[r]![i]!;
      if (!isPlayable(pairing)) continue;
      const extra = tournament.pairings[`${r}:${i}`]!;
      const match = db.matches.find((m) => m.id === extra.matchId);

      if (match?.status === 'in_progress' || match?.status === 'waiting') continue;
      if (match?.status === 'finished') {
        const winner = match.players.find((player) => player.result === 'win');
        if (winner) {
          tournament.bracket = recordWinner(tournament.bracket, r, i, pairing.players[0] === winner.userId ? 0 : 1);
          changed = true;
          continue;
        }
        // A draw: the pairing is played again below.
      }

      // Who gets the first move is random.
      const [first, second] = pairing.players as [string, string];
      const [a, b] = Math.random() < 0.5 ? [first, second] : [second, first];
      const viewerPlays = session !== null && (a === session.viewer.id || b === session.viewer.id);
      const name = (id: string) =>
        findPlayer(db, id)?.displayName ?? (id === session?.viewer.id ? session.viewer.displayName : '?');
      const created = createMatch(db, {
        settings: { ...tournament.settings },
        players: [
          { userId: a, displayName: name(a), seat: 1 },
          { userId: b, displayName: name(b), seat: 2 },
        ],
        moveDelay: viewerPlays ? undefined : FAST_MOVE_MS,
        tournamentId: tournament.id,
      });
      extra.matchId = created.id;
      changed = true;
      if (viewerPlays && session)
        notifyMatchReady(world, session, tournament, created.id, a === session.viewer.id ? b : a);
    }
  }

  const final = tournament.bracket[tournament.bracket.length - 1]?.[0];
  if (final && final.winner !== null) {
    tournament.status = 'finished';
    tournament.endedAt = new Date(now).toISOString();
    changed = true;
  }
  if (changed) world.emit('tournament:update', { id: tournament.id });
  return changed;
}

/** A system message in the conversation with the opponent: "your match is ready". */
function notifyMatchReady(
  world: World,
  session: Session,
  tournament: DemoTournament,
  matchId: string,
  opponentId: string,
) {
  const message: DemoMessage = {
    id: newId(),
    peerId: opponentId,
    from: 'system',
    kind: 'system',
    body: '',
    matchId,
    tournamentId: tournament.id,
    event: 'tournament_match',
    createdAt: isoNow(),
  };
  session.state.messages.push(message);
  world.emit('chat:message', { peerId: opponentId, message: messageView(session, message) });
}
