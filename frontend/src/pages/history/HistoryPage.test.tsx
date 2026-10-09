import { screen, within } from '@testing-library/react';
import { ApiError } from '@/lib/api/errors';
import { expectNoA11yViolations } from '@/test/axe';
import { allowConsole } from '@/test/console';
import { fakeApi } from '@/test/fakeApi';
import { makeMatchSummary } from '@/test/fixtures/matches';
import { emptyPage } from '@/test/fixtures/pages';
import { makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

const won = makeMatchSummary({ id: 'won-1' });
const lost = makeMatchSummary({
  id: 'lost-1',
  winnerSeat: 2,
  players: [
    { seat: 1, userId: 'u1', displayName: 'alice', result: 'loss' },
    { seat: 2, userId: 'u2', displayName: 'bob', result: 'win' },
  ],
});
const waiting = makeMatchSummary({
  id: 'wait-1',
  status: 'waiting',
  endReason: null,
  winnerSeat: null,
  moveCount: 0,
  players: [{ seat: 1, userId: 'u1', displayName: 'alice', result: null }],
});

const listOf = (items: object[], total = items.length) => ({ items, total, limit: 10, offset: 0 });

describe('history page', () => {
  it('shows the statistics and one row for each match', async () => {
    fakeApi({ ...quietApi, 'GET /matches/mine': listOf([won, lost]) });
    const { container } = renderRoute('/matches', { user: makeUser() });

    expect(await screen.findAllByRole('link', { name: 'Open match against bob' })).toHaveLength(2);
    const stats = screen.getByRole('heading', { level: 2, name: 'Statistics' }).closest('section')!;
    expect(await within(stats).findByText('Win rate')).toBeInTheDocument();
    expect(within(stats).getByRole('progressbar', { name: 'Share of matches won' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(within(stats).getByText('Latest results')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('shows the current streak as a number, named for what it is a streak of', async () => {
    const wonToo = makeMatchSummary({ id: 'won-2' });
    fakeApi({ ...quietApi, 'GET /matches/mine': listOf([lost, wonToo, won]) });
    renderRoute('/matches', { user: makeUser() });

    const label = await screen.findByText('Current losing streak');
    expect(label.nextElementSibling).toHaveTextContent(/^1$/);
  });

  it('links a finished match to its replay, and a waiting one to nothing but its page', async () => {
    fakeApi({ ...quietApi, 'GET /matches/mine': listOf([won, waiting]) });
    renderRoute('/matches', { user: makeUser() });

    const replay = await screen.findByRole('link', { name: 'Replay the match against bob' });
    expect(replay).toHaveAttribute('href', '/watch/won-1');
    expect(screen.getAllByRole('link', { name: /Replay/ })).toHaveLength(1);
  });

  it('asks the backend for the filter in the address and keeps it selected', async () => {
    const api = fakeApi({ ...quietApi, 'GET /matches/mine': listOf([won]) });
    renderRoute('/matches?status=finished&page=2', { user: makeUser() });

    await screen.findByRole('link', { name: 'Open match against bob' });
    expect(screen.getByRole('radio', { name: 'Finished' })).toBeChecked();
    const list = api.requests.find((request) => request.path === '/matches/mine' && request.query?.limit === 10);
    expect(list?.query).toMatchObject({ status: 'finished', limit: 10, offset: 10 });
  });

  it('puts the chosen filter in the address and goes back to the first page', async () => {
    allowConsole(); // the test router warns about flushSync, which the real router supports
    fakeApi({ ...quietApi, 'GET /matches/mine': listOf([won], 25) });
    const { events, router } = renderRoute('/matches?page=3', { user: makeUser() });

    await events.click(await screen.findByRole('radio', { name: 'Cancelled' }));

    expect(router.state.location.search).toBe('?status=abandoned');
  });

  it('puts the page in the address', async () => {
    allowConsole(); // the test router warns about flushSync, which the real router supports
    fakeApi({ ...quietApi, 'GET /matches/mine': listOf([won], 25) });
    const { events, router } = renderRoute('/matches?status=finished', { user: makeUser() });

    await events.click(await screen.findByRole('button', { name: 'Next' }));

    expect(router.state.location.search).toBe('?status=finished&page=2');
  });

  it('invites to start a match when there is none', async () => {
    fakeApi({ ...quietApi, 'GET /matches/mine': emptyPage() });
    renderRoute('/matches', { user: makeUser() });

    expect(await screen.findByText('No matches here yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a match' })).toHaveAttribute('href', '/play/online');
  });

  it('says what went wrong with the list and offers to try again', async () => {
    allowConsole();
    fakeApi({ ...quietApi, 'GET /matches/mine': new ApiError('SERVER_ERROR', 'Boom', 500) });
    renderRoute('/matches', { user: makeUser() });

    expect((await screen.findAllByRole('button', { name: 'Try again' })).length).toBeGreaterThan(0);
  });
});
