import { screen, within } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { allowConsole } from '@/test/console';
import { fakeApi } from '@/test/fakeApi';
import { pageOf } from '@/test/fixtures/pages';
import { makePlayer, makeStats, makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';
import { ApiError } from '@/lib/api/errors';

const quiet = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

/** Five players, best first, as the server sorts them for ?sort=wins. */
const players = [
  makePlayer({ id: 'p1', displayName: 'zara', stats: makeStats({ played: 10, wins: 9, losses: 1, draws: 0 }) }),
  makePlayer({ id: 'p2', displayName: 'omar', stats: makeStats({ played: 10, wins: 7, losses: 3, draws: 0 }) }),
  makePlayer({ id: 'p3', displayName: 'noor', stats: makeStats({ played: 10, wins: 5, losses: 4, draws: 1 }) }),
  makePlayer({ id: 'p4', displayName: 'kenji', stats: makeStats({ played: 8, wins: 4, losses: 4, draws: 0 }) }),
  makePlayer({
    id: 'u1',
    displayName: 'alice',
    friendship: 'self',
    stats: makeStats({ played: 0, wins: 0, losses: 0, draws: 0 }),
  }),
];

describe('leaderboard page', () => {
  it('asks for the players with the most wins', async () => {
    const api = fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    renderRoute('/leaderboard', { user: makeUser() });

    await screen.findByRole('list', { name: 'Top three players' });
    const request = api.requests.find((r) => r.path === '/users');
    expect(request?.query).toMatchObject({ sort: 'wins', limit: 10, offset: 0 });
  });

  it('shows the best three on a podium and the others in a table with their rank', async () => {
    fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    renderRoute('/leaderboard', { user: makeUser() });

    const podium = await screen.findByRole('list', { name: 'Top three players' });
    const cards = within(podium).getAllByRole('listitem');
    expect(cards.map((card) => within(card).getByRole('link').textContent)).toEqual(['zara', 'omar', 'noor']);
    expect(within(cards[0]!).getByText('Wins: 9')).toBeInTheDocument();
    expect(within(cards[0]!).getByText('Win rate: 90%')).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Ranking' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByRole('rowheader')).toHaveTextContent('4');
    expect(within(rows[0]!).getByText('kenji')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('50%')).toBeInTheDocument();
  });

  it('marks the viewer’s own row and shows a dash for a win rate without games', async () => {
    fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    renderRoute('/leaderboard', { user: makeUser() });

    const table = await screen.findByRole('table', { name: 'Ranking' });
    const mine = within(table).getByRole('row', { name: /alice/ });
    expect(within(mine).getByText('You')).toBeInTheDocument();
    expect(within(mine).getByLabelText('No games yet')).toBeInTheDocument();
  });

  it('keeps counting the ranks on the next page, without a podium', async () => {
    const api = fakeApi({
      ...quiet,
      'GET /users': { items: players.slice(3), total: 15, limit: 10, offset: 10 },
    });
    renderRoute('/leaderboard?page=2', { user: makeUser() });

    const table = await screen.findByRole('table', { name: 'Ranking' });
    expect(screen.queryByRole('list', { name: 'Top three players' })).not.toBeInTheDocument();
    const rows = within(table).getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByRole('rowheader')).toHaveTextContent('11');
    expect(within(rows[1]!).getByRole('rowheader')).toHaveTextContent('12');
    expect(api.requests.find((r) => r.path === '/users')?.query).toMatchObject({ offset: 10 });
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('goes to the next page from the pagination', async () => {
    // The test router is react-router's plain one; the page's URL updates use flushSync, which only the
    // "react-router/dom" router supports, so react-router warns. The real app uses the dom one.
    allowConsole();
    const api = fakeApi({
      ...quiet,
      'GET /users': { items: players, total: 15, limit: 10, offset: 0 },
    });
    const { events } = renderRoute('/leaderboard', { user: makeUser() });

    await events.click(await screen.findByRole('button', { name: 'Next' }));

    await screen.findByText('Page 2 of 2');
    expect(api.requests.some((r) => r.path === '/users' && r.query?.offset === 10)).toBe(true);
  });

  it('says so when nobody is ranked', async () => {
    fakeApi({ ...quiet, 'GET /users': pageOf([]) });
    renderRoute('/leaderboard', { user: makeUser() });

    expect(await screen.findByText('No player is ranked yet.')).toBeInTheDocument();
  });

  it('shows the error with a button to try again', async () => {
    allowConsole();
    fakeApi({ ...quiet, 'GET /users': new ApiError('INTERNAL_ERROR', 'Boom', 500) });
    renderRoute('/leaderboard', { user: makeUser() });

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('has no accessibility problems', async () => {
    fakeApi({ ...quiet, 'GET /users': pageOf(players) });
    const { container } = renderRoute('/leaderboard', { user: makeUser() });

    await screen.findByRole('table', { name: 'Ranking' });
    await expectNoA11yViolations(container);
  });
});
