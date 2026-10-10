import { screen, waitFor, within } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { allowConsole } from '@/test/console';
import { fakeApi } from '@/test/fakeApi';
import { pageOf } from '@/test/fixtures/pages';
import { makePlayer, makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const quiet = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

const players = [
  makePlayer({ id: 'u2', displayName: 'bob', friendship: 'none' }),
  makePlayer({ id: 'u3', displayName: 'carol', friendship: 'friends', online: true }),
  makePlayer({ id: 'u4', displayName: 'dave', friendship: 'request_sent' }),
  makePlayer({ id: 'u5', displayName: 'erin', friendship: 'request_received' }),
  makePlayer({ id: 'u1', displayName: 'alice', friendship: 'self' }),
];

const usersRequests = (api: { requests: { path: string; query?: object }[] }) =>
  api.requests.filter((request) => request.path === '/users');

describe('players page', () => {
  it('shows the tabs of the community area and the players with the buttons that fit', async () => {
    fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    renderRoute('/players', { user: makeUser() });

    const tabs = await screen.findByRole('navigation', { name: 'Community' });
    expect(within(tabs).getByRole('link', { name: 'Players' })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('href', '/leaderboard');
    expect(within(tabs).getByRole('link', { name: 'Friends' })).toHaveAttribute('href', '/friends');

    const results = await screen.findByRole('region', { name: 'Search results' });
    expect(within(results).getByText('Players found: 5')).toBeInTheDocument();
    const card = (name: string) => within(results).getByText(name).closest('li')!;
    expect(within(card('bob')).getByRole('button', { name: 'Add friend' })).toBeInTheDocument();
    expect(within(card('carol')).getByText('Friend')).toBeInTheDocument();
    expect(within(card('dave')).getByRole('button', { name: 'Cancel request' })).toBeInTheDocument();
    expect(within(card('erin')).getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(within(card('alice')).getByText('You')).toBeInTheDocument();
    expect(within(card('alice')).queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows how many friend requests wait on the Friends tab', async () => {
    fakeApi({
      'GET /friends': { friends: [], incoming: [makePlayer({ id: 'u9', displayName: 'zed' })], outgoing: [] },
      'GET /chat/conversations': [],
      'GET /users': pageOf(players),
    });
    renderRoute('/players', { user: makeUser() });

    const tabs = await screen.findByRole('navigation', { name: 'Community' });
    await waitFor(() => expect(within(tabs).getByRole('link', { name: /Friends\s*1/ })).toBeInTheDocument());
  });

  it('reads the filters from the URL and sends them to the server', async () => {
    const api = fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    renderRoute('/players?q=bo&online=1&sort=wins&page=2', { user: makeUser() });

    await screen.findByRole('region', { name: 'Search results' });
    expect(screen.getByRole('searchbox', { name: 'Display name' })).toHaveValue('bo');
    expect(screen.getByRole('checkbox', { name: 'Online now' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('wins');
    expect(usersRequests(api)[0]?.query).toMatchObject({
      search: 'bo',
      online: true,
      sort: 'wins',
      limit: 12,
      offset: 12,
    });
  });

  it('writes a changed filter in the URL and goes back to page 1', async () => {
    // The test router is react-router's plain one; the page's URL updates use flushSync, which only the
    // "react-router/dom" router supports, so react-router warns. The real app uses the dom one.
    allowConsole();
    const api = fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    const { events, router } = renderRoute('/players?page=2', { user: makeUser() });

    await events.click(await screen.findByRole('checkbox', { name: 'Friends only' }));

    await waitFor(() => expect(router.state.location.search).toBe('?friends=1'));
    await waitFor(() => expect(usersRequests(api).some((r) => (r.query as { friends?: boolean }).friends)).toBe(true));
  });

  it('searches once typing pauses', async () => {
    // The test router is react-router's plain one; the page's URL updates use flushSync, which only the
    // "react-router/dom" router supports, so react-router warns. The real app uses the dom one.
    allowConsole();
    fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    const { events, router } = renderRoute('/players', { user: makeUser() });

    await events.type(await screen.findByRole('searchbox', { name: 'Display name' }), 'car');

    await waitFor(() => expect(router.state.location.search).toBe('?q=car'));
  });

  it('says so when nobody matches', async () => {
    fakeApi({ ...quiet, 'GET /users': pageOf([]) });
    renderRoute('/players?q=nobody', { user: makeUser() });

    expect(await screen.findByText('No player matches this search.')).toBeInTheDocument();
  });

  it('sends a friend request', async () => {
    const api = fakeApi({
      ...quiet,
      'GET /users': pageOf(players),
      'PUT /friends/:id': { friendship: 'request_sent' },
    });
    const { events } = renderRoute('/players', { user: makeUser() });

    await events.click(await screen.findByRole('button', { name: 'Add friend' }));

    await waitFor(() => expect(api.requests.some((r) => r.method === 'PUT' && r.path === '/friends/u2')).toBe(true));
  });

  it('has no accessibility problems', async () => {
    fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    const { container } = renderRoute('/players', { user: makeUser() });

    await screen.findByRole('region', { name: 'Search results' });
    await expectNoA11yViolations(container);
  });
});
