import { screen, within } from '@testing-library/react';
import { ApiError } from '@/lib/api/errors';
import { expectNoA11yViolations } from '@/test/axe';
import { allowConsole } from '@/test/console';
import { fakeApi } from '@/test/fakeApi';
import { makeMatchSummary } from '@/test/fixtures/matches';
import { pageOf } from '@/test/fixtures/pages';
import { makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

const live = (overrides = {}) =>
  makeMatchSummary({
    status: 'in_progress',
    endReason: null,
    winnerSeat: null,
    yourSeat: null,
    moveCount: 12,
    ...overrides,
  });

describe('watch list', () => {
  it('invites to start a match when nothing is being played', async () => {
    fakeApi({ ...quietApi, 'GET /matches/live': pageOf([]) });
    const { container } = renderRoute('/watch', { user: makeUser() });

    expect(await screen.findByText('No match is being played right now.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a match' })).toHaveAttribute('href', '/play/online');
    await expectNoA11yViolations(container);
  });

  it('shows a card for each live match, with both players and the size of the board', async () => {
    fakeApi({ ...quietApi, 'GET /matches/live': pageOf([live({ id: 'a1' })]) });
    const { container } = renderRoute('/watch', { user: makeUser() });

    const card = (await screen.findByRole('heading', { level: 2, name: 'alice vs bob' })).closest('article')!;
    expect(within(card).getByText('Live')).toBeInTheDocument();
    expect(within(card).getByText(/7 × 6/)).toBeInTheDocument();
    expect(within(card).getByText(/Moves: 12/)).toBeInTheDocument();
    expect(within(card).getByText(/^Started /)).toBeInTheDocument();
    // The board shape is a picture of the board's holes.
    expect(card.querySelectorAll('svg[data-board-theme] circle')).toHaveLength(42);
    await expectNoA11yViolations(container);
  });

  it('draws the board of the match in its own size', async () => {
    const settings = { cols: 5, rows: 4, winLength: 3, theme: 'ocean' };
    fakeApi({ ...quietApi, 'GET /matches/live': pageOf([live({ settings })]) });
    const { container } = renderRoute('/watch', { user: makeUser() });

    await screen.findByRole('heading', { level: 2 });
    expect(container.querySelectorAll('article svg[data-board-theme] circle')).toHaveLength(20);
    expect(container.querySelector('article svg[data-board-theme]')).toHaveAttribute('data-board-theme', 'ocean');
  });

  it('opens other people’s matches on the watch page', async () => {
    fakeApi({ ...quietApi, 'GET /matches/live': pageOf([live({ id: '5b0f0d8e-2c7a-4b7e-9d2f-0a1c3e5f7a91' })]) });
    renderRoute('/watch', { user: makeUser() });

    const link = await screen.findByRole('link', { name: 'Watch alice vs bob' });
    expect(link).toHaveAttribute('href', '/watch/5b0f0d8e-2c7a-4b7e-9d2f-0a1c3e5f7a91');
  });

  it('sends the viewer to the match page when it is their own match', async () => {
    fakeApi({ ...quietApi, 'GET /matches/live': pageOf([live({ id: 'mine', yourSeat: 1 })]) });
    renderRoute('/watch', { user: makeUser() });

    expect(await screen.findByRole('link', { name: 'Your match' })).toHaveAttribute('href', '/matches/mine');
  });

  it('says what went wrong and offers to try again', async () => {
    allowConsole();
    fakeApi({ ...quietApi, 'GET /matches/live': new ApiError('SERVER_ERROR', 'Boom', 500) });
    renderRoute('/watch', { user: makeUser() });

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('watch list and the home page', () => {
  // The home card and this page read the same live list: they must never disagree.
  it('lists as many matches as the live card on the home page counts', async () => {
    const matches = ['a1', 'a2', 'a3', 'a4'].map((id) => live({ id }));
    fakeApi({
      ...quietApi,
      'GET /matches/mine': pageOf([]),
      'GET /matches/live': pageOf(matches),
    });

    const home = renderRoute('/', { user: makeUser() });
    expect(await screen.findByText('Matches being played right now: 4')).toBeInTheDocument();
    home.unmount();

    renderRoute('/watch', { user: makeUser() });
    expect(await screen.findAllByRole('article')).toHaveLength(4);
  });
});
