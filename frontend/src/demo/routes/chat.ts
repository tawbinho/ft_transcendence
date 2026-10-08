import { MESSAGE_MAX_LENGTH } from '@/features/chat/types';
import { isoNow, newId, type DemoMessage } from '../db';
import { DemoError, forbidden, invalid, notFound, type DemoRouter } from '../router';
import { scheduleAnswer } from '../simulation';
import { conversationOf, findPlayer, messagesWith, messageView, playerSummary, type Session } from '../views';
import type { World } from '../world';
import { bodyOf, queryInt } from './common';

// The chat routes (/chat/...) and blocking (/blocks/...).

export function chatRoutes(router: DemoRouter, world: World): void {
  const { db } = world;

  router.add('chat', 'GET', '/chat/conversations', async (ctx) => {
    const session = await world.session(ctx);
    const peers = new Set(session.state.messages.map((message) => message.peerId));
    return [...peers]
      .flatMap((id) => findPlayer(db, id) ?? [])
      .map((player) => conversationOf(session, player))
      .sort((a, b) => (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? ''));
  });

  router.add('chat', 'GET', '/chat/:userId/messages', async (ctx) => {
    const session = await world.session(ctx);
    const peer = peerOf(session, ctx.params.userId!);
    const limit = queryInt(ctx.query, 'limit', 1, 100, 30);
    let messages = messagesWith(session.state, peer.id);
    if (ctx.query.before) {
      const index = messages.findIndex((message) => message.id === ctx.query.before);
      if (index === -1) throw invalid('before must be the id of a message of this conversation');
      messages = messages.slice(0, index);
    }
    const page = messages.slice(-limit);
    return {
      items: page.map((message) => messageView(session, message)),
      hasMore: messages.length > page.length,
      peerReadAt: session.state.readByPeer[peer.id] ?? null,
    };
  });

  router.add('chat', 'POST', '/chat/:userId/messages', async (ctx) => {
    const session = await world.session(ctx);
    const peer = peerOf(session, ctx.params.userId!);
    if (session.state.blocked.includes(peer.id)) throw forbidden('BLOCKED', 'Unblock this player to message them');

    const { body, matchId } = bodyOf(ctx.body);
    const text = typeof body === 'string' ? body.trim() : '';
    if (body !== undefined && typeof body !== 'string') throw invalid('body must be text');
    if (text.length > MESSAGE_MAX_LENGTH) throw invalid(`body must be at most ${MESSAGE_MAX_LENGTH} characters`);

    let invite: string | null = null;
    if (matchId !== undefined) {
      const match = db.matches.find((m) => m.id === matchId);
      const mine = match?.players.some((player) => player.userId === session.viewer.id);
      if (!match || !mine || match.status !== 'waiting' || match.invitedId !== peer.id) {
        throw new DemoError(400, 'INVALID_INVITE', 'matchId must be a waiting match you created for this player');
      }
      invite = match.id;
    } else if (!text) {
      throw invalid('body must not be empty');
    }

    const message: DemoMessage = {
      id: newId(),
      peerId: peer.id,
      from: 'viewer',
      kind: invite ? 'invite' : 'text',
      body: invite ? '' : text,
      matchId: invite,
      tournamentId: null,
      event: null,
      createdAt: isoNow(),
    };
    session.state.messages.push(message);
    scheduleAnswer(world, session, peer.id, invite !== null);
    const view = messageView(session, message);
    world.emit('chat:message', { peerId: peer.id, message: view });
    return view;
  });

  router.add('chat', 'POST', '/chat/:userId/read', async (ctx) => {
    const session = await world.session(ctx);
    const peer = peerOf(session, ctx.params.userId!);
    const readAt = isoNow();
    session.state.readByViewer[peer.id] = readAt;
    return { readAt };
  });

  // The backend relays this to the other player as a "chat:typing" event.
  router.add('chat', 'POST', '/chat/:userId/typing', async (ctx) => {
    peerOf(await world.session(ctx), ctx.params.userId!);
    return null;
  });

  router.add('chat', 'GET', '/blocks', async (ctx) => {
    const session = await world.session(ctx);
    return session.state.blocked.flatMap((id) => findPlayer(db, id) ?? []).map(playerSummary);
  });

  // Blocking also ends any friendship or friend request between them.
  router.add('chat', 'PUT', '/blocks/:userId', async (ctx) => {
    const session = await world.session(ctx);
    const peer = peerOf(session, ctx.params.userId!);
    const { state } = session;
    if (!state.blocked.includes(peer.id)) state.blocked.push(peer.id);
    state.friends = state.friends.filter((friend) => friend.id !== peer.id);
    state.incoming = state.incoming.filter((id) => id !== peer.id);
    state.outgoing = state.outgoing.filter((id) => id !== peer.id);
    // Their pending replies to this viewer are dropped too.
    db.tasks = db.tasks.filter(
      (task) => !('peerId' in task && task.peerId === peer.id && task.viewerId === session.viewer.id),
    );
    return null;
  });

  router.add('chat', 'DELETE', '/blocks/:userId', async (ctx) => {
    const session = await world.session(ctx);
    const peer = peerOf(session, ctx.params.userId!);
    session.state.blocked = session.state.blocked.filter((id) => id !== peer.id);
    return null;
  });

  function peerOf(session: Session, userId: string) {
    if (userId === session.viewer.id) throw invalid('This is your own account');
    const player = findPlayer(db, userId);
    if (!player) throw notFound('USER_NOT_FOUND', 'No player has this id');
    return player;
  }
}
