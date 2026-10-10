import { screen, within } from '@testing-library/react';
import { allowConsole } from '@/test/console';
import { fakeApi } from '@/test/fakeApi';
import { expectNoA11yViolations } from '@/test/axe';
import { TOURNAMENT_ID } from '@/test/fixtures/ids';
import { pageOf } from '@/test/fixtures/pages';
import { makeTournament } from '@/test/fixtures/tournaments';
import { makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

describe('tournaments hub', () => {
  it('offers the same-screen tournament to a visitor and asks them to log in for the online ones', async () => {
    const { container } = renderRoute('/tournaments', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Tournaments' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set up a tournament' })).toHaveAttribute('href', '/tournaments/local');
    expect(screen.getByText('Log in to join online tournaments.')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    // The list of online tournaments is for members.
    expect(screen.queryByRole('heading', { name: 'All online tournaments' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('shows a member the online tournaments with their status and a link to each', async () => {
    const api = fakeApi({
      ...quietApi,
      'GET /tournaments': pageOf([
        { ...makeTournament(), joined: true },
        {
          ...makeTournament({ id: 'other', name: 'Sunday cup', status: 'finished', joined: false }),
          winner: { id: 'u2', displayName: 'bob' },
        },
      ]),
    });
    const { container } = renderRoute('/tournaments', { user: makeUser() });

    const friday = await screen.findByRole('link', { name: /Friday cup/ });
    expect(friday).toHaveAttribute('href', `/tournaments/${TOURNAMENT_ID}`);
    expect(within(friday).getByText('Registered')).toBeInTheDocument();
    expect(within(friday).getByText('Registration open')).toBeInTheDocument();
    const sunday = screen.getByRole('link', { name: /Sunday cup/ });
    expect(within(sunday).getByText('bob')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a tournament' })).toHaveAttribute('href', '/tournaments/new');
    expect(api.requests.some((request) => request.path === '/tournaments')).toBe(true);
    await expectNoA11yViolations(container);
  });

  it('asks the server for one status when a filter is chosen', async () => {
    // The test router is not the DOM one, so changing the address warns about flushSync; the app's router does not.
    allowConsole();
    const api = fakeApi({ ...quietApi, 'GET /tournaments': pageOf([makeTournament()]) });
    const { events } = renderRoute('/tournaments', { user: makeUser() });

    await events.click(await screen.findByRole('radio', { name: 'In progress' }));

    await screen.findByRole('radio', { name: 'In progress', checked: true });
    const last = api.requests.filter((request) => request.path === '/tournaments').at(-1);
    expect(last?.query).toMatchObject({ status: 'running' });
  });

  it('reads the filter from the address', async () => {
    const api = fakeApi({ ...quietApi, 'GET /tournaments': pageOf([]) });
    renderRoute('/tournaments?status=finished', { user: makeUser() });

    expect(await screen.findByRole('radio', { name: 'Finished', checked: true })).toBeInTheDocument();
    expect(await screen.findByText('No tournament here yet.')).toBeInTheDocument();
    expect(api.requests.find((request) => request.path === '/tournaments')?.query).toMatchObject({
      status: 'finished',
    });
  });
});
