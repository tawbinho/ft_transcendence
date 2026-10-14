import type { MessageKind, SystemEvent } from './chat.constants.js';

// WHY THIS FILE EXISTS
// Turns database rows into the JSON of the chat routes (Message, Conversation,
// MessagePage in backend/docs/openapi.yaml). PURE: no database, no Nest, so it
// is easy to test. The inputs are plain shapes, not entity classes.

export interface MessageData {
  id: string;
  senderId: string | null;
  kind: MessageKind;
  body: string;
  matchId: string | null;
  tournamentId: string | null;
  event: SystemEvent | null;
  createdAt: Date;
}

// ---- What the API returns -------------------------------------------------

export interface MessageView {
  id: string;
  senderId: string | null; // null: written by the server
  kind: MessageKind;
  body: string; // empty for invitations and system messages
  matchId: string | null;
  tournamentId: string | null;
  event: SystemEvent | null;
  createdAt: Date;
}

export interface MessagePageView {
  items: MessageView[]; // oldest first
  hasMore: boolean; // older messages exist
  peerReadAt: Date | null;
}

export interface PeerView {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  online: boolean;
}

export interface ConversationView {
  peer: PeerView;
  lastMessage: MessageView;
  unread: number;
  peerReadAt: Date | null;
  blocked: boolean;
}

export function toMessage(data: MessageData): MessageView {
  return {
    id: data.id,
    senderId: data.senderId,
    kind: data.kind,
    body: data.body,
    matchId: data.matchId,
    tournamentId: data.tournamentId,
    event: data.event,
    createdAt: data.createdAt,
  };
}

// A page of a conversation. The service asks the database for one message MORE
// than the page size: if it got it, older messages exist (`hasMore`) and the
// extra one is dropped. `newestFirst` is how the database returned them; the
// page is sent oldest first, which is how a chat is read.
export function toMessagePage(
  newestFirst: MessageData[],
  limit: number,
  peerReadAt: Date | null,
): MessagePageView {
  const hasMore = newestFirst.length > limit;
  const kept = hasMore ? newestFirst.slice(0, limit) : newestFirst;
  return {
    items: kept.map(toMessage).reverse(),
    hasMore,
    peerReadAt,
  };
}

// The conversations of a viewer, most recent activity first.
export function toConversations(
  rows: Array<{
    peer: PeerView;
    lastMessage: MessageData;
    unread: number;
    peerReadAt: Date | null;
    blocked: boolean;
  }>,
): ConversationView[] {
  return rows
    .map((row) => ({
      peer: {
        id: row.peer.id,
        displayName: row.peer.displayName,
        avatarUrl: row.peer.avatarUrl,
        online: row.peer.online,
      },
      lastMessage: toMessage(row.lastMessage),
      unread: row.unread,
      peerReadAt: row.peerReadAt,
      blocked: row.blocked,
    }))
    .sort(
      (a, b) =>
        b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime() ||
        b.lastMessage.id.localeCompare(a.lastMessage.id),
    );
}
