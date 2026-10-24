import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type EntityManager, Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { BlocksService } from '../friends/blocks.service.js';
import { orderPair } from '../friends/friends.constants.js';
import { MatchPlayer } from '../matches/entities/match-player.entity.js';
import { Match } from '../matches/entities/match.entity.js';
import { EVENTS } from '../realtime/realtime.constants.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { isOnline } from '../users/presence.service.js';
import { User } from '../users/entities/user.entity.js';
import { DEFAULT_PAGE_SIZE } from './chat.constants.js';
import type { ListMessagesQuery } from './dto/list-messages.query.js';
import type { SendMessageDto } from './dto/send-message.dto.js';
import { ConversationRead } from './entities/conversation-read.entity.js';
import { Message } from './entities/message.entity.js';
import {
  toConversations,
  toMessage,
  toMessagePage,
  type ConversationView,
  type MessagePageView,
  type MessageView,
} from './message-view.js';

// The rules of private chat: who may write to whom, reading a conversation page
// by page, invitations, read receipts and the "is typing" signal.
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(ConversationRead)
    private readonly reads: Repository<ConversationRead>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(MatchPlayer)
    private readonly players: Repository<MatchPlayer>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly blocks: BlocksService,
    private readonly realtime: RealtimeService,
  ) {}

  // Conversations

  // One entry per player the viewer has at least one message with (system
  // messages included), the most recent first. Not paginated.
  async conversations(viewerId: string): Promise<ConversationView[]> {
    // Four queries for the whole list (never one per conversation). 1. The
    // latest message of each conversation.
    const last = await this.messages.query<
      Array<{
        peer_id: string;
        id: string;
        sender_id: string | null;
        kind: Message['kind'];
        body: string;
        match_id: string | null;
        tournament_id: string | null;
        event: Message['event'];
        created_at: Date;
      }>
    >(
      `SELECT DISTINCT ON (x.peer_id)
              x.peer_id, x.id, x.sender_id, x.kind, x.body, x.match_id,
              x.tournament_id, x.event, x.created_at
         FROM (SELECT m.*,
                      CASE WHEN m.user_low_id = $1 THEN m.user_high_id
                           ELSE m.user_low_id END AS peer_id
                 FROM messages m
                WHERE m.user_low_id = $1 OR m.user_high_id = $1) x
        ORDER BY x.peer_id, x.created_at DESC, x.id DESC`,
      [viewerId],
    );
    if (last.length === 0) return [];
    const peerIds = last.map((row) => row.peer_id);

    // 2. How many messages of each peer the viewer has not read: the peer's
    //    messages newer than the viewer's read marker.
    const unreadRows = await this.messages.query<
      Array<{ peer_id: string; count: string }>
    >(
      `SELECT m.sender_id AS peer_id, COUNT(*) AS count
         FROM messages m
         LEFT JOIN conversation_reads r
                ON r.user_id = $1 AND r.peer_id = m.sender_id
        WHERE m.sender_id <> $1
          AND (m.user_low_id = $1 OR m.user_high_id = $1)
          AND (r.read_at IS NULL OR m.created_at > r.read_at)
        GROUP BY m.sender_id`,
      [viewerId],
    );
    const unread = new Map(unreadRows.map((r) => [r.peer_id, Number(r.count)]));

    // 3. How far each peer has read the viewer's messages.
    const peerReads = await this.reads.find({
      where: { peerId: viewerId, userId: In(peerIds) },
    });
    const peerReadAt = new Map(peerReads.map((r) => [r.userId, r.readAt]));

    // 4. The peers themselves, and which of them the viewer blocked.
    const peers = await this.users.findBy({ id: In(peerIds) });
    const byId = new Map(peers.map((peer) => [peer.id, peer]));
    const blocked = new Set((await this.blocks.list(viewerId)).map((u) => u.id));

    const now = Date.now();
    return toConversations(
      last
        .filter((row) => byId.has(row.peer_id))
        .map((row) => {
          const peer = byId.get(row.peer_id)!;
          return {
            peer: {
              id: peer.id,
              displayName: peer.displayName,
              avatarUrl: peer.avatarUrl,
              online: isOnline(peer.lastSeenAt, now),
            },
            lastMessage: {
              id: row.id,
              senderId: row.sender_id,
              kind: row.kind,
              body: row.body,
              matchId: row.match_id,
              tournamentId: row.tournament_id,
              event: row.event,
              createdAt: row.created_at,
            },
            unread: unread.get(row.peer_id) ?? 0,
            peerReadAt: peerReadAt.get(row.peer_id) ?? null,
            blocked: blocked.has(row.peer_id),
          };
        }),
    );
  }

  // Reading

  // The latest messages with a player, or the ones just before `before` (the id
  // of a message of THIS conversation).
  async history(
    viewerId: string,
    peerId: string,
    query: ListMessagesQuery,
  ): Promise<MessagePageView> {
    await this.requireOther(viewerId, peerId);
    const [low, high] = orderPair(viewerId, peerId);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const builder = this.messages
      .createQueryBuilder('m')
      .where('m.user_low_id = :low AND m.user_high_id = :high', { low, high })
      .orderBy('m.created_at', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .take(limit + 1);

    if (query.before) {
      const cursor = await this.messages.findOneBy({
        id: query.before,
        userLowId: low,
        userHighId: high,
      });
      if (!cursor) {
        throw new AppError(
          'VALIDATION_ERROR',
          'before must be a message of this conversation',
          400,
        );
      }
      // Messages strictly older than the cursor: compare (time, id) together,
      // so two messages written in the same instant still have an order.
      builder.andWhere('(m.created_at, m.id) < (:at, :id)', {
        at: cursor.createdAt,
        id: cursor.id,
      });
    }

    const rows = await builder.getMany();
    const peerRead = await this.reads.findOneBy({
      userId: peerId,
      peerId: viewerId,
    });
    return toMessagePage(rows, limit, peerRead?.readAt ?? null);
  }

  // Sending

  // A text OR an invitation (exactly one), refused while either player blocked
  // the other. Both players get `chat:message` live, so the sender's other tabs
  // see it too.
  async send(
    viewerId: string,
    peerId: string,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    if ((dto.body === undefined) === (dto.matchId === undefined)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Send either body (a text) or matchId (an invitation), not both',
        400,
      );
    }
    await this.requireOther(viewerId, peerId);
    if (await this.blocks.isBlockedBetween(viewerId, peerId)) {
      throw new AppError('BLOCKED', 'You cannot message this player', 403);
    }
    if (dto.matchId) await this.requireValidInvite(viewerId, peerId, dto.matchId);

    const [low, high] = orderPair(viewerId, peerId);
    const saved = await this.messages.save(
      this.messages.create(
        dto.matchId
          ? {
              userLowId: low,
              userHighId: high,
              senderId: viewerId,
              kind: 'invite',
              body: '',
              matchId: dto.matchId,
            }
          : {
              userLowId: low,
              userHighId: high,
              senderId: viewerId,
              kind: 'text',
              body: dto.body,
            },
      ),
    );
    const view = toMessage(saved);
    this.publish(view, viewerId, peerId);
    return view;
  }

  // Read receipts and typing

  // "I have read everything this player sent so far." Answers the time, and the
  // other player's app shows "Seen" (chat:read).
  async markRead(
    viewerId: string,
    peerId: string,
  ): Promise<{ readAt: Date }> {
    await this.requireOther(viewerId, peerId);
    const readAt = new Date();
    // INSERT ... ON CONFLICT: create the marker, or move it forward.
    await this.reads.upsert({ userId: viewerId, peerId, readAt }, [
      'userId',
      'peerId',
    ]);
    if (!(await this.blocks.isBlockedBetween(viewerId, peerId))) {
      this.realtime.emitToUser(peerId, EVENTS.chatRead, {
        userId: viewerId,
        readAt,
      });
    }
    return { readAt };
  }

  // Stores nothing: only tells the other player "is typing" (chat:typing). Not
  // relayed while either player blocked the other.
  async typing(viewerId: string, peerId: string): Promise<void> {
    await this.requireOther(viewerId, peerId);
    if (await this.blocks.isBlockedBetween(viewerId, peerId)) return;
    this.realtime.emitToUser(peerId, EVENTS.chatTyping, { userId: viewerId });
  }

  // Messages written by the server

  // "Your tournament match against this player is ready." Written inside the
  // CALLER's transaction (so the message exists only if the match does) and
  // returned: the caller publishes it after the transaction commits.
  async addTournamentMatchNotice(
    manager: EntityManager,
    input: {
      playerAId: string;
      playerBId: string;
      matchId: string;
      tournamentId: string;
    },
  ): Promise<{ message: MessageView; playerAId: string; playerBId: string }> {
    const [low, high] = orderPair(input.playerAId, input.playerBId);
    const saved = await manager.save(
      manager.create(Message, {
        userLowId: low,
        userHighId: high,
        senderId: null,
        kind: 'system',
        body: '',
        event: 'tournament_match',
        matchId: input.matchId,
        tournamentId: input.tournamentId,
      }),
    );
    return {
      message: toMessage(saved),
      playerAId: input.playerAId,
      playerBId: input.playerBId,
    };
  }

  // Sends a message to both players, each seeing the OTHER one as `peerId`.
  publish(message: MessageView, playerAId: string, playerBId: string): void {
    this.realtime.emitToUser(playerAId, EVENTS.chatMessage, {
      peerId: playerBId,
      message,
    });
    this.realtime.emitToUser(playerBId, EVENTS.chatMessage, {
      peerId: playerAId,
      message,
    });
  }

  // Internals

  // The other player must exist, and must not be the viewer.
  private async requireOther(viewerId: string, peerId: string): Promise<void> {
    if (viewerId === peerId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'You cannot chat with yourself',
        400,
      );
    }
    if (!(await this.users.existsBy({ id: peerId }))) {
      throw new AppError('USER_NOT_FOUND', 'No player has this id', 404);
    }
  }

  // An invitation points at a match that is still waiting, that the sender
  // created, and that is reserved for the player being invited (made with POST
  // /matches and their `opponentDisplayName`).
  private async requireValidInvite(
    viewerId: string,
    peerId: string,
    matchId: string,
  ): Promise<void> {
    const match = await this.matches.findOneBy({ id: matchId });
    const sender = match
      ? await this.players.existsBy({ matchId, userId: viewerId })
      : false;
    if (
      !match ||
      match.status !== 'waiting' ||
      !sender ||
      match.invitedUserId !== peerId
    ) {
      throw new AppError(
        'INVALID_INVITE',
        'An invitation needs a waiting match you created for this player',
        400,
      );
    }
  }
}
