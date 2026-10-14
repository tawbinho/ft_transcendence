import {
  toConversations,
  toMessage,
  toMessagePage,
  type MessageData,
} from './message-view.js';

function message(n: number, overrides: Partial<MessageData> = {}): MessageData {
  return {
    id: `m${n}`,
    senderId: 'alice',
    kind: 'text',
    body: `hello ${n}`,
    matchId: null,
    tournamentId: null,
    event: null,
    createdAt: new Date(`2026-01-01T10:00:0${n}Z`),
    ...overrides,
  };
}

describe('toMessage', () => {
  it('carries the fields of a text message', () => {
    expect(toMessage(message(1))).toEqual({
      id: 'm1',
      senderId: 'alice',
      kind: 'text',
      body: 'hello 1',
      matchId: null,
      tournamentId: null,
      event: null,
      createdAt: new Date('2026-01-01T10:00:01Z'),
    });
  });

  it('keeps an invitation, with its match and an empty body', () => {
    const view = toMessage(message(1, { kind: 'invite', body: '', matchId: 'match-1' }));
    expect(view).toMatchObject({ kind: 'invite', body: '', matchId: 'match-1' });
  });

  it('keeps a system message: no sender, an event, a tournament and a match', () => {
    const view = toMessage(
      message(1, {
        kind: 'system',
        senderId: null,
        body: '',
        event: 'tournament_match',
        tournamentId: 't1',
        matchId: 'match-1',
      }),
    );
    expect(view).toMatchObject({ senderId: null, event: 'tournament_match', tournamentId: 't1' });
  });

  it('does not leak extra fields of the row', () => {
    const view = toMessage({ ...message(1), userLowId: 'x', userHighId: 'y' } as never);
    expect(view).not.toHaveProperty('userLowId');
    expect(view).not.toHaveProperty('userHighId');
  });
});

describe('toMessagePage', () => {
  // The database returns newest first, one more than the page size.
  const newestFirst = [message(5), message(4), message(3), message(2), message(1)];

  it('sends the page oldest first', () => {
    const page = toMessagePage(newestFirst.slice(0, 3), 3, null);
    expect(page.items.map((m) => m.id)).toEqual(['m3', 'm4', 'm5']);
    expect(page.hasMore).toBe(false);
  });

  it('says older messages exist when the database returned one extra, and drops it', () => {
    const page = toMessagePage(newestFirst.slice(0, 4), 3, null);
    expect(page.hasMore).toBe(true);
    expect(page.items.map((m) => m.id)).toEqual(['m3', 'm4', 'm5']);
  });

  it('works with an empty conversation', () => {
    expect(toMessagePage([], 30, null)).toEqual({ items: [], hasMore: false, peerReadAt: null });
  });

  it('carries the time the peer read up to', () => {
    const readAt = new Date('2026-01-01T10:00:09Z');
    expect(toMessagePage([message(1)], 30, readAt).peerReadAt).toEqual(readAt);
  });
});

describe('toConversations', () => {
  const peer = (id: string) => ({ id, displayName: id, avatarUrl: null, online: false });

  it('puts the conversation with the latest message first', () => {
    const list = toConversations([
      { peer: peer('bob'), lastMessage: message(1), unread: 0, peerReadAt: null, blocked: false },
      { peer: peer('carol'), lastMessage: message(7), unread: 2, peerReadAt: null, blocked: false },
      { peer: peer('dave'), lastMessage: message(4), unread: 0, peerReadAt: null, blocked: true },
    ]);
    expect(list.map((c) => c.peer.id)).toEqual(['carol', 'dave', 'bob']);
  });

  it('carries unread, the read receipt and the blocked flag', () => {
    const readAt = new Date('2026-01-01T10:00:05Z');
    const [first] = toConversations([
      { peer: peer('bob'), lastMessage: message(1), unread: 3, peerReadAt: readAt, blocked: true },
    ]);
    expect(first).toMatchObject({ unread: 3, peerReadAt: readAt, blocked: true });
  });

  it('only exposes the public fields of the peer', () => {
    const [first] = toConversations([
      {
        peer: { ...peer('bob'), email: 'b@x.com' } as never,
        lastMessage: message(1),
        unread: 0,
        peerReadAt: null,
        blocked: false,
      },
    ]);
    expect(first!.peer).not.toHaveProperty('email');
  });
});
