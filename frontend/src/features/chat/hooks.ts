import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { friendKeys } from '@/features/friends/hooks';
import { userKeys } from '@/features/users/hooks';
import { useLiveInterval, useRealtimeEvent } from '@/lib/realtime';
import { usePageVisible } from '@/lib/usePageVisible';
import { blocksApi, chatApi } from './api';
import type { Conversation, Message, MessagePage, SendMessageInput } from './types';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (peerId: string) => [...chatKeys.all, 'messages', peerId] as const,
};

export const blockKeys = {
  all: ['blocks'] as const,
};

type MessagesData = InfiniteData<MessagePage>;

// ---- Conversations -----------------------------------------------------------

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: ({ signal }) => chatApi.conversations(signal),
    refetchInterval: useLiveInterval(10_000),
  });
}

/** Unread messages in all conversations, for the badge in the menu. */
export function useUnreadCount(enabled: boolean): number {
  const { data } = useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: ({ signal }) => chatApi.conversations(signal),
    enabled,
    refetchInterval: useLiveInterval(15_000),
    select: (conversations) => conversations.reduce((sum, conversation) => sum + conversation.unread, 0),
  });
  return data ?? 0;
}

// ---- Messages ----------------------------------------------------------------

const PAGE_SIZE = 30;

/** The messages with one player, loaded backwards in pages of 30. */
export function useMessages(peerId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(peerId),
    queryFn: ({ pageParam, signal }) => chatApi.messages(peerId, { before: pageParam, limit: PAGE_SIZE }, signal),
    initialPageParam: undefined as string | undefined,
    // The "next" page goes back in time: the messages before the oldest one loaded.
    getNextPageParam: (page) => (page.hasMore ? page.items[0]?.id : undefined),
    refetchInterval: useLiveInterval(5_000),
  });
}

/** All loaded messages, oldest first. */
export function flattenMessages(data: MessagesData | undefined): Message[] {
  return data ? [...data.pages].reverse().flatMap((page) => page.items) : [];
}

/** Adds a message to a conversation already loaded (from an answer or a live event). */
export function addMessageToCache(queryClient: QueryClient, peerId: string, message: Message): void {
  queryClient.setQueryData<MessagesData>(chatKeys.messages(peerId), (data) => {
    if (!data || data.pages.length === 0) return data;
    if (data.pages.some((page) => page.items.some((item) => item.id === message.id))) return data;
    const [latest, ...older] = data.pages;
    return { ...data, pages: [{ ...latest!, items: [...latest!.items, message] }, ...older] };
  });
}

/** The peer read the viewer's messages: shows "Seen" without waiting for a refresh. */
export function setPeerReadAt(queryClient: QueryClient, peerId: string, readAt: string): void {
  queryClient.setQueryData<MessagesData>(chatKeys.messages(peerId), (data) => {
    if (!data || data.pages.length === 0) return data;
    const [latest, ...older] = data.pages;
    return { ...data, pages: [{ ...latest!, peerReadAt: readAt }, ...older] };
  });
  queryClient.setQueryData<Conversation[]>(chatKeys.conversations(), (list) =>
    list?.map((conversation) =>
      conversation.peer.id === peerId ? { ...conversation, peerReadAt: readAt } : conversation,
    ),
  );
}

export function useSendMessage(peerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => chatApi.send(peerId, input),
    onSuccess: (message) => {
      addMessageToCache(queryClient, peerId, message);
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

/**
 * Marks the conversation as read when a new message from the peer is on
 * screen (and the tab is visible), so their "Seen" and the unread badge stay true.
 */
export function useMarkRead(peerId: string, latestFromPeer: string | null): void {
  const queryClient = useQueryClient();
  const visible = usePageVisible();
  const { mutate } = useMutation({
    mutationFn: () => chatApi.markRead(peerId),
    onSuccess: () =>
      queryClient.setQueryData<Conversation[]>(chatKeys.conversations(), (list) =>
        list?.map((conversation) => (conversation.peer.id === peerId ? { ...conversation, unread: 0 } : conversation)),
      ),
  });
  useEffect(() => {
    if (latestFromPeer && visible) mutate();
  }, [latestFromPeer, visible, mutate]);
}

// ---- Typing ------------------------------------------------------------------

/** At most one "typing" signal every 3 seconds. */
const TYPING_SIGNAL_MS = 3_000;
/** "… is typing" disappears this long after the last signal. */
const TYPING_SHOWN_MS = 5_000;

/** Returns the function to call on each keystroke. */
export function useTypingSignal(peerId: string): () => void {
  const lastSent = useRef(0);
  return useCallback(() => {
    const now = Date.now();
    if (now - lastSent.current < TYPING_SIGNAL_MS) return;
    lastSent.current = now;
    // A lost "typing" signal does not matter.
    chatApi.typing(peerId).catch(() => {});
  }, [peerId]);
}

/** Whether the peer is typing right now. */
export function usePeerTyping(peerId: string): boolean {
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useRealtimeEvent('chat:typing', ({ userId }) => {
    if (userId !== peerId) return;
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTyping(false), TYPING_SHOWN_MS);
  });
  useRealtimeEvent('chat:message', ({ message }) => {
    if (message.senderId === peerId) setTyping(false);
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  return typing;
}

// ---- Blocking ----------------------------------------------------------------

export function useBlocks() {
  return useQuery({ queryKey: blockKeys.all, queryFn: ({ signal }) => blocksApi.list(signal) });
}

/** Blocking changes conversations, friendships and profiles. */
function refreshAfterBlock(queryClient: QueryClient) {
  for (const queryKey of [blockKeys.all, chatKeys.all, friendKeys.all, userKeys.all]) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

export function useBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => blocksApi.block(userId),
    onSuccess: () => refreshAfterBlock(queryClient),
  });
}

export function useUnblock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => blocksApi.unblock(userId),
    onSuccess: () => refreshAfterBlock(queryClient),
  });
}
