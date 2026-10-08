import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN, DISPLAY_NAME_PATTERN } from '@/features/auth/validation';
import type { User } from '@/features/auth/types';
import type { MatchSummary } from '@/features/matches/types';
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '@/features/users/avatar';
import {
  PLAYER_SORTS,
  type PlayerListItem,
  type PlayerSort,
  type Profile,
  type ProfileMatch,
} from '@/features/users/types';
import { unwrap } from '@/lib/api/http';
import type { Page } from '@/lib/api/types';
import type { DemoPlayer } from '../db';
import { conflict, DemoError, invalid, notFound, Reply, type DemoContext, type DemoRouter } from '../router';
import { findPlayerByName, playerListItem, profileOf, withProfileChanges, type Session } from '../views';
import type { World } from '../world';
import { bodyOf, paginate, queryBool } from './common';

// GET/PATCH /users..., and the demo's profile changes on GET /auth/me.

export function userRoutes(router: DemoRouter, world: World): void {
  const { db } = world;

  // The real account, with the name and picture changed in the demo.
  router.add('users', 'GET', '/auth/me', async (ctx) => {
    const response = await ctx.passThrough();
    const user = (response.payload as { data?: User | null } | null)?.data;
    const state = user ? db.viewers[user.id] : undefined;
    if (response.status !== 200 || !user || !state) return new Reply(response);
    return new Reply({ status: 200, payload: { data: withProfileChanges(user, state) } });
  });

  router.add('users', 'GET', '/users', async (ctx) => {
    const session = await world.session(ctx);
    const search = (ctx.query.search ?? '').trim().toLowerCase();
    const onlineOnly = queryBool(ctx.query, 'online');
    const friendsOnly = queryBool(ctx.query, 'friends');
    const sort = (ctx.query.sort ?? 'name') as PlayerSort;
    if (!PLAYER_SORTS.includes(sort)) throw invalid('sort must be name, wins or newest');

    const friendIds = new Set(session.state.friends.map((friend) => friend.id));
    const found = (name: string) => !search || name.toLowerCase().includes(search);
    const players = db.players
      .filter((p) => found(p.displayName))
      .filter((p) => !onlineOnly || p.online)
      .filter((p) => !friendsOnly || friendIds.has(p.id))
      .map((player) => playerListItem(session, player));
    // The viewer is listed too (always online, never their own friend), with their real results.
    if (!friendsOnly && found(session.viewer.displayName)) {
      const { id, displayName, avatarUrl, online, createdAt, stats } = await ownProfile(session, ctx);
      players.push({ id, displayName, avatarUrl, online, createdAt, stats, friendship: 'self' });
    }
    return paginate(players.sort(SORTS[sort]), ctx.query);
  });

  router.add('users', 'GET', '/users/:displayName', async (ctx) => {
    const session = await world.session(ctx);
    if (ctx.params.displayName === session.viewer.displayName) return ownProfile(session, ctx);
    return profileOf(session, findOr404(ctx.params.displayName!));
  });

  router.add('users', 'GET', '/users/:displayName/matches', async (ctx) => {
    const session = await world.session(ctx);
    if (ctx.params.displayName === session.viewer.displayName) {
      return paginate(toProfileMatches(await ownFinishedMatches(ctx)), ctx.query);
    }
    return paginate(madeUpHistory(db.players, findOr404(ctx.params.displayName!)), ctx.query);
  });

  router.add('users', 'PATCH', '/users/me', async (ctx) => {
    const session = await world.session(ctx);
    const { displayName } = bodyOf(ctx.body);
    if (displayName !== undefined) {
      const name = typeof displayName === 'string' ? displayName.trim() : '';
      if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX || !DISPLAY_NAME_PATTERN.test(name)) {
        throw invalid('displayName must be 3 to 20 letters, numbers, _ or -');
      }
      if (findPlayerByName(db, name)) throw conflict('DISPLAY_NAME_TAKEN', 'This display name is already taken');
      session.state.profile.displayName = name;
    }
    return withProfileChanges(await ctx.viewer(), session.state);
  });

  router.add('users', 'PUT', '/users/me/avatar', async (ctx) => {
    const session = await world.session(ctx);
    const file = ctx.body instanceof FormData ? ctx.body.get('avatar') : null;
    if (!(file instanceof Blob)) throw invalid('Send the picture in the "avatar" field');
    if (!AVATAR_TYPES.includes(file.type as (typeof AVATAR_TYPES)[number])) {
      throw new DemoError(415, 'AVATAR_INVALID_TYPE', 'Use a PNG, JPEG or WebP picture');
    }
    if (file.size > AVATAR_MAX_BYTES) throw new DemoError(413, 'AVATAR_TOO_LARGE', 'The picture is too large');
    // The demo keeps the picture in the browser; the backend stores a file.
    session.state.profile.avatarUrl = await readAsDataUrl(file);
    return withProfileChanges(await ctx.viewer(), session.state);
  });

  router.add('users', 'DELETE', '/users/me/avatar', async (ctx) => {
    const session = await world.session(ctx);
    session.state.profile.avatarUrl = null;
    return withProfileChanges(await ctx.viewer(), session.state);
  });

  function findOr404(displayName: string): DemoPlayer {
    const player = findPlayerByName(db, displayName);
    if (!player) throw notFound('USER_NOT_FOUND', 'No player has this display name');
    return player;
  }
}

const SORTS: Record<PlayerSort, (a: PlayerListItem, b: PlayerListItem) => number> = {
  name: (a, b) => a.displayName.localeCompare(b.displayName),
  wins: (a, b) => b.stats.wins - a.stats.wins || a.displayName.localeCompare(b.displayName),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new DemoError(400, 'VALIDATION_ERROR', 'The picture could not be read'));
    reader.readAsDataURL(file);
  });
}

// ---- The viewer's own profile, from their real matches -------------------------

/** Up to 300 finished matches from the real backend. */
async function ownFinishedMatches(ctx: DemoContext): Promise<MatchSummary[]> {
  const items: MatchSummary[] = [];
  for (let offset = 0; offset < 300; offset += 50) {
    const response = await ctx.network({
      method: 'GET',
      path: '/matches/mine',
      query: { status: 'finished', limit: 50, offset },
    });
    const page = unwrap<Page<MatchSummary>>(response);
    items.push(...page.items);
    if (items.length >= page.total || page.items.length === 0) break;
  }
  return items;
}

function toProfileMatches(matches: MatchSummary[]): ProfileMatch[] {
  return matches.flatMap((match) => {
    const opponent = match.players.find((player) => player.seat !== match.yourSeat);
    if (!opponent || !match.endedAt) return [];
    const result = match.winnerSeat === null ? 'draw' : match.winnerSeat === match.yourSeat ? 'win' : 'loss';
    return [
      {
        id: match.id,
        opponent: { id: opponent.userId, displayName: opponent.displayName },
        result,
        settings: match.settings,
        endedAt: match.endedAt,
        moveCount: match.moveCount,
      },
    ];
  });
}

async function ownProfile(session: Session, ctx: DemoContext): Promise<Profile> {
  const results = toProfileMatches(await ownFinishedMatches(ctx));
  const count = (result: ProfileMatch['result']) => results.filter((match) => match.result === result).length;
  const { id, displayName, avatarUrl } = session.viewer;
  return {
    id,
    displayName,
    avatarUrl,
    online: true,
    // The real sign-up date will come from the backend.
    createdAt: session.state.joinedAt,
    lastSeenAt: null,
    stats: { played: results.length, wins: count('win'), losses: count('loss'), draws: count('draw') },
    friendship: 'self',
    blocked: false,
  };
}

// ---- Made-up match history ------------------------------------------------------

/** Numbers from a string, always the same for the same string. */
function seededRandom(seed: string): () => number {
  let state = [...seed].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 7);
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function madeUpHistory(players: DemoPlayer[], player: DemoPlayer): ProfileMatch[] {
  const random = seededRandom(player.id);
  const others = players.filter((p) => p.id !== player.id);
  const { played, wins, draws } = player.stats;
  let hoursAgo = 0;
  return Array.from({ length: Math.min(played, 30) }, (_, index) => {
    hoursAgo += 2 + random() * 20;
    const roll = random() * played;
    const opponent = others[Math.floor(random() * others.length)]!;
    const big = random() < 0.25;
    return {
      id: `${player.id}-${index}`,
      opponent: { id: opponent.id, displayName: opponent.displayName },
      result: roll < wins ? 'win' : roll < wins + draws ? 'draw' : 'loss',
      settings: big
        ? { cols: 9, rows: 7, winLength: 5, theme: 'midnight' }
        : { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
      endedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
      moveCount: 12 + Math.floor(random() * 25),
    };
  });
}
