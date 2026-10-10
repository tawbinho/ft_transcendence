import type { Conversation } from '@/features/chat/types';
import { makeSummary } from './users';

/** A conversation with bob that has `unread` messages waiting for alice. */
export function makeConversation(unread = 0, overrides: Partial<Conversation> = {}): Conversation {
  return { peer: makeSummary(), lastMessage: null, unread, peerReadAt: null, blocked: false, ...overrides };
}
