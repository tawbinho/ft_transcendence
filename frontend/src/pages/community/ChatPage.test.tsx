import { screen, within } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { makeConversation, makeMessage } from '@/test/fixtures/community';
import { makeProfile, makeSummary, makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const alice = makeUser();
const carol = makeSummary({ id: 'u3', displayName: 'carol', online: true });

const conversations = [
  makeConversation({
    peer: carol,
    unread: 2,
    lastMessage: makeMessage({ id: 'm9', senderId: 'u3', body: 'Are you coming to the tournament tonight?' }),
  }),
  makeConversation({
    lastMessage: makeMessage({ id: 'm2', senderId: 'u1', body: 'See you tomorrow' }),
  }),
];

const answers = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': conversations,
  'GET /users/bob': makeProfile({ friendship: 'friends' }),
  'GET /chat/u2/messages': {
    items: [makeMessage({ id: 'm1', body: 'Fancy a game?' })],
    hasMore: false,
    peerReadAt: null,
  },
};

describe('chat page', () => {
  it('lists the conversations with the unread count and a preview of the last message', async () => {
    fakeApi(answers);
    renderRoute('/chat', { user: alice });

    const list = await screen.findByRole('navigation', { name: 'Conversations' });
    const [first, second] = within(list).getAllByRole('link');
    expect(first).toHaveAttribute('href', '/chat/carol');
    expect(within(first!).getByText('Unread: 2')).toBeInTheDocument();
    expect(within(first!).getByText('Are you coming to the tournament tonight?')).toBeInTheDocument();
    expect(within(second!).getByText('See you tomorrow')).toBeInTheDocument();
    expect(within(second!).queryByText(/Unread/)).not.toBeInTheDocument();
  });

  it('invites a first message when there is no conversation yet', async () => {
    fakeApi({ ...answers, 'GET /chat/conversations': [] });
    renderRoute('/chat', { user: alice });

    expect(await screen.findAllByText(/No conversations yet/)).not.toHaveLength(0);
    // The empty state's button, as well as the header's own Friends link.
    expect(
      screen.getAllByRole('link', { name: 'Friends' }).every((link) => link.getAttribute('href') === '/friends'),
    ).toBe(true);
  });

  it('opens a conversation with a link back to the list', async () => {
    fakeApi(answers);
    renderRoute('/chat/bob', { user: alice });

    expect(await screen.findByText('Fancy a game?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to conversations' })).toHaveAttribute('href', '/chat');
    expect(screen.getByRole('textbox', { name: 'Message to bob' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite to play' })).toBeInTheDocument();
  });

  it('marks the open conversation in the list', async () => {
    fakeApi({ ...answers, 'GET /chat/conversations': [conversations[1]!] });
    renderRoute('/chat/bob', { user: alice });

    const list = await screen.findByRole('navigation', { name: 'Conversations' });
    expect(within(list).getByRole('link', { name: /bob/ })).toHaveAttribute('aria-current', 'page');
  });

  it('does not let you write to yourself', async () => {
    fakeApi({ ...answers, 'GET /users/alice': makeProfile({ id: 'u1', displayName: 'alice', friendship: 'self' }) });
    renderRoute('/chat/alice', { user: alice });

    expect(await screen.findByText('You cannot send messages to yourself.')).toBeInTheDocument();
  });

  it('says a blocked player cannot be written to', async () => {
    fakeApi({ ...answers, 'GET /users/bob': makeProfile({ blocked: true }) });
    renderRoute('/chat/bob', { user: alice });

    expect(await screen.findByText('You cannot exchange messages while they are blocked.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unblock' })).toBeInTheDocument();
  });

  it('has no accessibility problems on the list and on a conversation', async () => {
    fakeApi(answers);
    const list = renderRoute('/chat', { user: alice });
    await screen.findByRole('navigation', { name: 'Conversations' });
    await expectNoA11yViolations(list.container);
    list.unmount();

    const thread = renderRoute('/chat/bob', { user: alice });
    await screen.findByText('Fancy a game?');
    await expectNoA11yViolations(thread.container);
  });
});
