import { screen, waitFor } from '@testing-library/react';
import { saveLastSettings } from '@/features/game/lastSettings';
import { makeMatch } from '@/test/factories';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { makeSummary, makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

/** Waits until the header and the page have received their answers, so axe does not run during an update. */
async function settled(queryClient: { isFetching: () => number }) {
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
}

const alice = makeUser();
const chats = { 'GET /chat/conversations': [] };

const friends = (...list: ReturnType<typeof makeSummary>[]) => ({
  'GET /friends': {
    friends: list.map((friend) => ({ ...friend, since: '2026-09-01T10:00:00.000Z' })),
    incoming: [],
    outgoing: [],
  },
});

beforeEach(() => localStorage.clear());

describe('NewMatchPage friend picks', () => {
  it('offers the friends who are online and fills in the opponent when one is picked', async () => {
    fakeApi({
      ...chats,
      ...friends(
        makeSummary({ id: 'u2', displayName: 'bob', online: true }),
        makeSummary({ id: 'u3', displayName: 'carol', online: false }),
      ),
    });
    const { events, container, queryClient } = renderRoute('/play/online', { user: alice });

    const bob = await screen.findByRole('button', { name: 'bob' });
    expect(screen.queryByRole('button', { name: 'carol' })).not.toBeInTheDocument();

    await events.click(bob);

    expect(screen.getByRole('textbox', { name: /Invite a player/ })).toHaveValue('bob');
    expect(bob).toHaveAttribute('aria-pressed', 'true');
    await settled(queryClient);
    await expectNoA11yViolations(container);
  });

  it('says when no friend is online', async () => {
    fakeApi({ ...chats, ...friends(makeSummary({ displayName: 'carol', online: false })) });
    renderRoute('/play/online', { user: alice });

    expect(await screen.findByText('None of your friends is online right now.')).toBeInTheDocument();
  });

  it('says when the friends could not be loaded, and the form still works', async () => {
    fakeApi({
      ...chats,
      'GET /friends': new (await import('@/lib/api/errors')).ApiError('INTERNAL_ERROR', 'boom', 500),
    });
    renderRoute('/play/online', { user: alice });

    expect(await screen.findByText('Your friends could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create match' })).toBeInTheDocument();
  });

  it('creates the match with the picked friend and remembers the board', async () => {
    const api = fakeApi({
      ...chats,
      ...friends(makeSummary({ id: 'u2', displayName: 'bob', online: true })),
      'POST /matches': makeMatch({ id: '7c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f', status: 'waiting' }),
    });
    const { events } = renderRoute('/play/online', { user: alice });

    await events.click(await screen.findByRole('button', { name: 'bob' }));
    await events.click(screen.getByRole('radio', { name: /Ocean/ }));
    await events.click(screen.getByRole('button', { name: 'Create match' }));

    const create = api.requests.find((request) => request.method === 'POST' && request.path === '/matches');
    expect(create?.body).toMatchObject({ opponentDisplayName: 'bob', settings: { theme: 'ocean' } });
    expect(localStorage.getItem('board-settings')).toContain('ocean');
  });

  it('starts from the board of the last game', async () => {
    saveLastSettings({ cols: 9, rows: 7, winLength: 4, theme: 'sunset' });
    fakeApi({ ...chats, ...friends() });
    renderRoute('/play/online', { user: alice });

    expect(await screen.findByRole('slider', { name: 'Columns' })).toHaveValue('9');
    expect(screen.getByRole('radio', { name: /Sunset/ })).toBeChecked();
  });
});
