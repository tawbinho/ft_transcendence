import type { UserSummary } from '@/features/users/types';

// The shapes of the chat routes (docs/api-contract.md, "Chat").

export const MESSAGE_MAX_LENGTH = 500;

/**
 * - text: written by a player.
 * - invite: a player invites the other to a match (`matchId`).
 * - system: written by the server, for example "your tournament match is
 *   ready". `event` says what happened; the app writes the sentence in the
 *   reader's language.
 */
export type MessageKind = 'text' | 'invite' | 'system';

export type SystemEvent = 'tournament_match';

export interface Message {
  id: string;
  /** null for system messages. */
  senderId: string | null;
  kind: MessageKind;
  /** The text; empty for invites and system messages. */
  body: string;
  /** Invites and tournament notices: the match to open. */
  matchId: string | null;
  /** Tournament notices: the tournament to open. */
  tournamentId: string | null;
  event: SystemEvent | null;
  createdAt: string;
}

/** A private conversation between the viewer and one other player. */
export interface Conversation {
  peer: UserSummary;
  lastMessage: Message | null;
  /** Messages from the peer the viewer has not read yet. */
  unread: number;
  /** The peer has read the viewer's messages up to this time (read receipts). */
  peerReadAt: string | null;
  /** The viewer blocked the peer. */
  blocked: boolean;
}

export interface MessagePage {
  /** Oldest first. */
  items: Message[];
  /** Older messages exist: ask again with `before` = the id of the oldest one. */
  hasMore: boolean;
  peerReadAt: string | null;
}

export interface SendMessageInput {
  body?: string;
  /** Turns the message into an invitation to this match. */
  matchId?: string;
}
