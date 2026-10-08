import type { UserSummary } from '@/features/users/types';
import { http } from '@/lib/api/http';
import type { Conversation, Message, MessagePage, SendMessageInput } from './types';

const chatPath = (userId: string) => `/chat/${encodeURIComponent(userId)}`;
const blockPath = (userId: string) => `/blocks/${encodeURIComponent(userId)}`;

export const chatApi = {
  /** The viewer's conversations, most recent activity first. */
  conversations: (signal?: AbortSignal) => http.get<Conversation[]>('/chat/conversations', { signal }),

  /** The latest messages with a player, or the ones before `before` (a message id). */
  messages: (userId: string, params: { before?: string; limit?: number }, signal?: AbortSignal) =>
    http.get<MessagePage>(`${chatPath(userId)}/messages`, { query: { ...params }, signal }),

  send: (userId: string, input: SendMessageInput) => http.post<Message>(`${chatPath(userId)}/messages`, input),

  /** Marks everything the player sent as read. */
  markRead: (userId: string) => http.post<{ readAt: string }>(`${chatPath(userId)}/read`),

  /** Tells the player the viewer is typing (the server relays it live). */
  typing: (userId: string) => http.post<null>(`${chatPath(userId)}/typing`),
};

export const blocksApi = {
  list: (signal?: AbortSignal) => http.get<UserSummary[]>('/blocks', { signal }),

  /** They can no longer message the viewer; any friendship between them ends. */
  block: (userId: string) => http.put<null>(blockPath(userId)),

  unblock: (userId: string) => http.delete<null>(blockPath(userId)),
};
