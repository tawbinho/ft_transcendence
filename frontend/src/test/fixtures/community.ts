import type { Friend } from '@/features/friends/types';
import type { Conversation, Message } from '@/features/chat/types';
import { makeSummary } from './users';

// Made-up friends and conversations for the community pages' tests.

export function makeFriend(overrides: Partial<Friend> = {}): Friend {
  return { ...makeSummary(), since: '2026-09-15T10:00:00.000Z', ...overrides };
}

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    senderId: 'u2',
    kind: 'text',
    body: 'Fancy a game?',
    matchId: null,
    tournamentId: null,
    event: null,
    createdAt: '2026-10-08T10:00:00.000Z',
    ...overrides,
  };
}

/** A conversation with bob (id u2) whose last message he wrote. */
export function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    peer: makeSummary(),
    lastMessage: makeMessage(),
    unread: 0,
    peerReadAt: null,
    blocked: false,
    ...overrides,
  };
}
