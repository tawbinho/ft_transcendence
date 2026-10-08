import type { FriendsOverview } from '@/features/friends/types';
import { randomBetween, isoNow } from '../db';
import { DemoError, forbidden, notFound, type DemoRouter } from '../router';
import { findPlayer, friendshipOf, playerSummary, type Session } from '../views';
import type { World } from '../world';

// GET /friends, PUT and DELETE /friends/:userId.

export function friendRoutes(router: DemoRouter, world: World): void {
  const { db } = world;

  router.add('friends', 'GET', '/friends', async (ctx) => overview(await world.session(ctx)));

  // Sends a request, or accepts theirs. Online players accept after a moment.
  router.add('friends', 'PUT', '/friends/:userId', async (ctx) => {
    const session = await world.session(ctx);
    const player = target(session, ctx.params.userId!);
    const { state } = session;
    if (state.blocked.includes(player.id)) throw forbidden('BLOCKED', 'Unblock this player first');

    if (state.incoming.includes(player.id)) {
      state.incoming = state.incoming.filter((id) => id !== player.id);
      state.friends.push({ id: player.id, since: isoNow() });
    } else if (friendshipOf(state, player.id) === 'none') {
      state.outgoing.push(player.id);
      if (player.online) {
        world.schedule({
          at: Date.now() + randomBetween(4000, 8000),
          type: 'accept-friend',
          viewerId: session.viewer.id,
          peerId: player.id,
        });
      }
    }
    return { friendship: friendshipOf(state, player.id) };
  });

  // Unfriends, cancels the viewer's request, or declines theirs.
  router.add('friends', 'DELETE', '/friends/:userId', async (ctx) => {
    const session = await world.session(ctx);
    const player = target(session, ctx.params.userId!);
    const { state } = session;
    state.friends = state.friends.filter((friend) => friend.id !== player.id);
    state.incoming = state.incoming.filter((id) => id !== player.id);
    state.outgoing = state.outgoing.filter((id) => id !== player.id);
    return { friendship: friendshipOf(state, player.id) };
  });

  function target(session: Session, userId: string) {
    if (userId === session.viewer.id) throw new DemoError(400, 'CANNOT_FRIEND_SELF', 'You cannot add yourself');
    const player = findPlayer(db, userId);
    if (!player) throw notFound('USER_NOT_FOUND', 'No player has this id');
    return player;
  }

  function overview(session: Session): FriendsOverview {
    const { state } = session;
    const known = (ids: string[]) => ids.flatMap((id) => findPlayer(db, id) ?? []);
    const friends = state.friends
      .flatMap(({ id, since }) => {
        const player = findPlayer(db, id);
        return player ? [{ ...playerSummary(player), since }] : [];
      })
      .sort((a, b) => Number(b.online) - Number(a.online) || a.displayName.localeCompare(b.displayName));
    return {
      friends,
      incoming: known(state.incoming).map(playerSummary),
      outgoing: known(state.outgoing).map(playerSummary),
    };
  }
}
