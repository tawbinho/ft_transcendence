import { isoNow, newId, pick, randomBetween, type DemoMatch, type DemoMessage, type DemoTask } from './db';
import { createMatch, joinMatch, playComputerTurn } from './matches';
import { replyText } from './seed';
import { advanceTournament, startTournament } from './tournaments';
import { findPlayer, matchView, messageView, type Session } from './views';
import type { World } from './world';

// The demo world lives on by itself: made-up players reply, accept friend
// requests, join matches and tournaments, play their moves, and go online
// or offline. tick() runs every second and does whatever is due.

/** How many computer-vs-computer matches to keep on the "Watch" page. */
const LIVE_EXHIBITIONS = 3;
const PRESENCE_EVERY_MS = 30_000;
let nextPresenceChange = Date.now() + PRESENCE_EVERY_MS;

/** Runs everything due by `now`. Returns whether the world changed. */
export function tick(world: World, now = Date.now()): boolean {
  let changed = runTasks(world, now);
  changed = playMoves(world, now) || changed;
  changed = runTournaments(world, now) || changed;
  changed = keepExhibitionsGoing(world, now) || changed;
  changed = changePresence(world, now) || changed;
  return changed;
}

// ---- Scheduled tasks -------------------------------------------------------

function runTasks(world: World, now: number): boolean {
  const due = world.db.tasks.filter((task) => task.at <= now);
  if (due.length === 0) return false;
  world.db.tasks = world.db.tasks.filter((task) => task.at > now);
  for (const task of due) runTask(world, task, now);
  return true;
}

function runTask(world: World, task: DemoTask, now: number): void {
  const { db } = world;
  if (task.type === 'join-match') {
    const match = db.matches.find((m) => m.id === task.matchId);
    const player = match?.invitedId ? findPlayer(db, match.invitedId) : undefined;
    if (match?.status === 'waiting' && player?.online) {
      joinMatch(db, match, { userId: player.id, displayName: player.displayName });
      emitMatch(world, match);
    }
    return;
  }

  if (task.type === 'join-tournament') {
    const tournament = db.tournaments.find((t) => t.id === task.tournamentId);
    if (!tournament || tournament.status !== 'registering') return;
    const candidates = db.players.filter((p) => p.online && !tournament.players.includes(p.id));
    if (candidates.length === 0) return;
    tournament.players.push(pick(candidates).id);
    if (tournament.players.length >= tournament.size) startTournament(world, tournament, now);
    else world.schedule({ at: now + randomBetween(4000, 8000), type: 'join-tournament', tournamentId: tournament.id });
    world.emit('tournament:update', { id: tournament.id });
    return;
  }

  // The other tasks concern one logged-in user's conversations and friends.
  const state = db.viewers[task.viewerId];
  const player = findPlayer(db, task.peerId);
  if (!state || !player || state.blocked.includes(player.id)) return;
  const session = world.lastSession();
  const live = session?.viewer.id === task.viewerId ? session : null;

  switch (task.type) {
    case 'read': {
      const readAt = isoNow();
      state.readByPeer[player.id] = readAt;
      live && world.emit('chat:read', { userId: player.id, readAt });
      break;
    }
    case 'typing':
      live && world.emit('chat:typing', { userId: player.id });
      break;
    case 'reply': {
      const message: DemoMessage = {
        id: newId(),
        peerId: player.id,
        from: 'peer',
        kind: 'text',
        body: replyText(task.invite),
        matchId: null,
        tournamentId: null,
        event: null,
        createdAt: isoNow(),
      };
      state.messages.push(message);
      if (live) world.emit('chat:message', { peerId: player.id, message: messageView(live, message) });
      break;
    }
    case 'accept-friend':
      if (!state.outgoing.includes(player.id)) break;
      state.outgoing = state.outgoing.filter((id) => id !== player.id);
      state.friends.push({ id: player.id, since: isoNow() });
      live && world.emit('friends:update', {});
      break;
  }
}

// ---- Matches -----------------------------------------------------------------

function emitMatch(world: World, match: DemoMatch): void {
  const session = world.lastSession();
  world.emit('match:update', matchView(match, session?.viewer.id ?? ''));
}

function playMoves(world: World, now: number): boolean {
  let changed = false;
  for (const match of world.db.matches) {
    if (playComputerTurn(world.db, match, now)) {
      emitMatch(world, match);
      changed = true;
    }
  }
  return changed;
}

function isExhibition(world: World, match: DemoMatch): boolean {
  return match.tournamentId === null && match.players.every((player) => findPlayer(world.db, player.userId));
}

/** Keeps a few matches between made-up players going, and forgets old ones. */
function keepExhibitionsGoing(world: World, now: number): boolean {
  const { db } = world;
  const before = db.matches.length;
  // Matches of made-up players are forgotten two minutes after they end
  // (tournament matches only once their tournament is over).
  const forgettable = (match: DemoMatch) =>
    (match.status === 'finished' || match.status === 'abandoned') &&
    now - Date.parse(match.endedAt ?? '') > 120_000 &&
    (isExhibition(world, match) || (match.tournamentId !== null && !isPartOfRunningTournament(world, match)));
  db.matches = db.matches.filter((match) => !forgettable(match));
  let changed = db.matches.length !== before;

  const live = db.matches.filter((m) => m.status === 'in_progress' && isExhibition(world, m));
  const busy = new Set(
    db.matches.filter((m) => m.status === 'in_progress').flatMap((m) => m.players.map((p) => p.userId)),
  );
  for (let missing = LIVE_EXHIBITIONS - live.length; missing > 0; missing--) {
    const free = db.players.filter((p) => p.online && !busy.has(p.id));
    if (free.length < 2) break;
    const first = pick(free);
    const second = pick(free.filter((p) => p.id !== first.id));
    busy.add(first.id).add(second.id);
    const big = Math.random() < 0.3;
    createMatch(db, {
      settings: big
        ? { cols: 9, rows: 7, winLength: 5, theme: 'midnight' }
        : { cols: 7, rows: 6, winLength: 4, theme: pick(['classic', 'ocean', 'sunset']) },
      players: [
        { userId: first.id, displayName: first.displayName, seat: 1 },
        { userId: second.id, displayName: second.displayName, seat: 2 },
      ],
      moveDelay: randomBetween(1500, 2600),
    });
    changed = true;
  }
  return changed;
}

function isPartOfRunningTournament(world: World, match: DemoMatch): boolean {
  return world.db.tournaments.some((t) => t.id === match.tournamentId && t.status === 'running');
}

// ---- Tournaments -------------------------------------------------------------

function runTournaments(world: World, now: number): boolean {
  let changed = false;
  for (const tournament of world.db.tournaments) {
    if (tournament.status === 'registering' && tournament.players.length >= tournament.size) {
      startTournament(world, tournament, now);
      changed = true;
    } else {
      changed = advanceTournament(world, tournament, now) || changed;
    }
  }
  return changed;
}

// ---- Presence ----------------------------------------------------------------

/** Every half minute a player who is not playing goes online or offline. */
function changePresence(world: World, now: number): boolean {
  if (now < nextPresenceChange) return false;
  nextPresenceChange = now + PRESENCE_EVERY_MS;
  const playing = new Set(
    world.db.matches.filter((m) => m.status !== 'finished').flatMap((m) => m.players.map((p) => p.userId)),
  );
  const idle = world.db.players.filter((p) => !playing.has(p.id));
  if (idle.length === 0) return false;
  const player = pick(idle);
  player.online = !player.online;
  player.lastSeenAt = player.online ? null : isoNow();
  world.emit('presence', { userId: player.id, online: player.online });
  return true;
}

/** What a made-up player does after the viewer writes to them. */
export function scheduleAnswer(world: World, session: Session, peerId: string, invite: boolean): void {
  const player = findPlayer(world.db, peerId);
  if (!player?.online) return;
  const now = Date.now();
  const viewerId = session.viewer.id;
  world.schedule({ at: now + 1200, type: 'read', viewerId, peerId });
  if (invite) {
    world.schedule({ at: now + 2500, type: 'reply', viewerId, peerId, invite: true });
    return;
  }
  world.schedule({ at: now + 2000, type: 'typing', viewerId, peerId });
  world.schedule({ at: now + 4000, type: 'typing', viewerId, peerId });
  world.schedule({ at: now + randomBetween(5000, 6500), type: 'reply', viewerId, peerId, invite: false });
}
