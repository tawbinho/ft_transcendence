import { QueryClient, type InfiniteData } from '@tanstack/react-query';
import { addMessageToCache, chatKeys, flattenMessages, setPeerReadAt } from './hooks';
import type { Conversation, Message, MessagePage } from './types';

const message = (id: string): Message => ({
  id,
  senderId: 'u2',
  kind: 'text',
  body: `message ${id}`,
  matchId: null,
  tournamentId: null,
  event: null,
  createdAt: '2026-10-08T10:00:00.000Z',
});

/** Pages as the server sends them: the latest messages first, each page oldest first. */
const pages = (...ids: string[][]): InfiniteData<MessagePage> => ({
  pages: ids.map((list) => ({ items: list.map(message), hasMore: false, peerReadAt: null })),
  pageParams: ids.map(() => undefined),
});

const conversation = (peerId: string): Conversation => ({
  peer: { id: peerId, displayName: peerId, avatarUrl: null, online: true },
  lastMessage: null,
  unread: 0,
  peerReadAt: null,
  blocked: false,
});

const idsIn = (client: QueryClient, peerId: string) =>
  flattenMessages(client.getQueryData(chatKeys.messages(peerId))).map((item) => item.id);

describe('chat cache', () => {
  it('lists the loaded messages oldest first', () => {
    expect(flattenMessages(pages(['c', 'd'], ['a', 'b'])).map((item) => item.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(flattenMessages(undefined)).toEqual([]);
  });

  it('adds a new message at the end, once', () => {
    const client = new QueryClient();
    client.setQueryData(chatKeys.messages('u2'), pages(['c', 'd'], ['a', 'b']));
    addMessageToCache(client, 'u2', message('e'));
    // The same message can come back from the server's answer and from a live event.
    addMessageToCache(client, 'u2', message('e'));
    expect(idsIn(client, 'u2')).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('does not create a conversation that was never loaded', () => {
    const client = new QueryClient();
    addMessageToCache(client, 'u3', message('x'));
    expect(client.getQueryData(chatKeys.messages('u3'))).toBeUndefined();
  });

  it('records when the peer read the conversation, for the "Seen" mark', () => {
    const client = new QueryClient();
    const readAt = '2026-10-08T11:00:00.000Z';
    client.setQueryData(chatKeys.messages('u2'), pages(['a']));
    client.setQueryData(chatKeys.conversations(), [conversation('u2'), conversation('u3')]);
    setPeerReadAt(client, 'u2', readAt);
    expect(client.getQueryData<InfiniteData<MessagePage>>(chatKeys.messages('u2'))?.pages[0]?.peerReadAt).toBe(readAt);
    expect(client.getQueryData<Conversation[]>(chatKeys.conversations())?.map((item) => item.peerReadAt)).toEqual([
      readAt,
      null,
    ]);
  });
});
