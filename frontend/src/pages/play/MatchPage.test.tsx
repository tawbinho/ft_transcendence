import { act, screen, waitFor, within } from '@testing-library/react';
import type { Match } from '@/features/matches/types';
import { matchKeys } from '@/features/matches/hooks';
import { ApiError } from '@/lib/api/errors';
import { makeMatch } from '@/test/factories';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { MATCH_ID } from '@/test/fixtures/ids';
import { makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

/** Waits until the header and the page have received their answers, so axe does not run during an update. */
async function settled(queryClient: { isFetching: () => number }) {
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
}

const alice = makeUser();
const URL = `/matches/${MATCH_ID}`;

// The header of every member page asks for these.
const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

const waiting: Match = makeMatch({
  id: MATCH_ID,
  status: 'waiting',
  startedAt: null,
  players: [{ seat: 1, userId: 'u1', displayName: 'alice', result: null }],
});

// Seat 1 stacks column 0 and seat 2 column 1: alice connects four on her fourth disc.
const winningMoves = [0, 1, 0, 1, 0, 1, 0];
const wonMatch: Match = makeMatch(
  {
    id: MATCH_ID,
    status: 'finished',
    endReason: 'win',
    winnerSeat: 1,
    players: [
      { seat: 1, userId: 'u1', displayName: 'alice', result: 'win' },
      { seat: 2, userId: 'u2', displayName: 'bob', result: 'loss' },
    ],
  },
  winningMoves,
);

describe('MatchPage: waiting for an opponent', () => {
  it('shows the link to share with a copy button and a way to cancel', async () => {
    fakeApi({ ...quietApi, [`GET ${URL}`]: waiting });
    const { container, queryClient } = renderRoute(URL, { user: alice });

    expect(await screen.findByRole('heading', { level: 1, name: 'Waiting for your opponent' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Match link' })).toHaveValue(`${window.location.origin}${URL}`);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel match' })).toBeInTheDocument();
    await settled(queryClient);
    await expectNoA11yViolations(container);
  });

  it('asks before cancelling, then cancels the match', async () => {
    const api = fakeApi({
      ...quietApi,
      [`GET ${URL}`]: waiting,
      [`POST ${URL}/resign`]: { ...waiting, status: 'abandoned' },
    });
    const { events } = renderRoute(URL, { user: alice });

    await events.click(await screen.findByRole('button', { name: 'Cancel match' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this match?' });
    await events.click(within(dialog).getByRole('button', { name: 'Cancel match' }));

    expect(api.requests.some((request) => request.method === 'POST' && request.path === `${URL}/resign`)).toBe(true);
  });
});

describe('MatchPage: playing', () => {
  it('gives the board keyboard focus and says it is your turn', async () => {
    fakeApi({ ...quietApi, [`GET ${URL}`]: makeMatch({ id: MATCH_ID }, [3, 3]) });
    const { container, queryClient } = renderRoute(URL, { user: alice });

    expect(await screen.findByText('Your turn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Drop a disc in column 4' })).toHaveFocus();
    await settled(queryClient);
    await expectNoA11yViolations(container);
  });

  it('sends a move chosen with the arrow keys and Enter', async () => {
    const api = fakeApi({
      ...quietApi,
      [`GET ${URL}`]: makeMatch({ id: MATCH_ID }, [3, 3]),
      [`POST ${URL}/moves`]: makeMatch({ id: MATCH_ID }, [3, 3, 1]),
    });
    const { events } = renderRoute(URL, { user: alice });
    await screen.findByText('Your turn');

    // Focus starts on the middle column (number 4, index 3): one arrow left reaches index 2.
    await events.keyboard('{ArrowLeft}{Enter}');

    const move = api.requests.find((request) => request.method === 'POST');
    expect(move?.body).toEqual({ col: 2 });
  });

  it('shows who the match is waiting for during the opponent’s turn', async () => {
    fakeApi({ ...quietApi, [`GET ${URL}`]: makeMatch({ id: MATCH_ID }, [3]) });
    renderRoute(URL, { user: alice });

    expect(await screen.findByText('Waiting for bob…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rematch' })).not.toBeInTheDocument();
  });

  it('lets you resign after a confirmation', async () => {
    const api = fakeApi({
      ...quietApi,
      [`GET ${URL}`]: makeMatch({ id: MATCH_ID }, [3, 3]),
      [`POST ${URL}/resign`]: wonMatch,
    });
    const { events } = renderRoute(URL, { user: alice });

    await events.click(await screen.findByRole('button', { name: 'Resign' }));
    const dialog = await screen.findByRole('dialog', { name: 'Resign this match?' });
    await events.click(within(dialog).getByRole('button', { name: 'Resign' }));

    expect(api.requests.some((request) => request.path === `${URL}/resign`)).toBe(true);
  });
});

describe('MatchPage: finished', () => {
  it('shows a win with the number of moves and the next steps', async () => {
    fakeApi({ ...quietApi, [`GET ${URL}`]: wonMatch });
    const { container, queryClient } = renderRoute(URL, { user: alice });

    const banner = (await screen.findByText('You won!')).parentElement;
    expect(banner).toHaveClass('bg-success-soft');
    expect(within(banner as HTMLElement).getByText('Connected 4 in 7 moves.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rematch' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Replay' })).toHaveAttribute('href', `/watch/${MATCH_ID}`);
    expect(screen.getByRole('link', { name: 'New match' })).toHaveAttribute('href', '/play/online');
    expect(screen.getByRole('link', { name: 'All my matches' })).toHaveAttribute('href', '/matches');
    // An old match opened from the history is not a party.
    expect(screen.queryByTestId('celebration')).not.toBeInTheDocument();
    await settled(queryClient);
    await expectNoA11yViolations(container);
  });

  it('asks the same opponent for a rematch on the same board', async () => {
    const api = fakeApi({
      ...quietApi,
      [`GET ${URL}`]: wonMatch,
      'POST /matches': makeMatch({ id: '7c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f', status: 'waiting' }),
    });
    const { events } = renderRoute(URL, { user: alice });

    await events.click(await screen.findByRole('button', { name: 'Rematch' }));

    const create = api.requests.find((request) => request.method === 'POST' && request.path === '/matches');
    expect(create?.body).toMatchObject({
      opponentDisplayName: 'bob',
      settings: { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
    });
  });

  it('celebrates when the match is won while the page is open', async () => {
    fakeApi({ ...quietApi, [`GET ${URL}`]: makeMatch({ id: MATCH_ID }, [0, 1, 0, 1, 0, 1]) });
    const { queryClient } = renderRoute(URL, { user: alice });
    await screen.findByText('Your turn');

    act(() => queryClient.setQueryData(matchKeys.detail(MATCH_ID), wonMatch));

    expect(await screen.findByText('You won!')).toBeInTheDocument();
    expect(screen.getByTestId('celebration')).toBeInTheDocument();
  });

  it('shows a lost match without confetti', async () => {
    const lost = makeMatch({ ...wonMatch, winnerSeat: 2, yourSeat: 1 }, winningMoves);
    lost.players = [
      { seat: 1, userId: 'u1', displayName: 'alice', result: 'loss' },
      { seat: 2, userId: 'u2', displayName: 'bob', result: 'win' },
    ];
    fakeApi({ ...quietApi, [`GET ${URL}`]: lost });
    renderRoute(URL, { user: alice });

    expect(await screen.findByText('You lost.')).toBeInTheDocument();
    expect(screen.queryByTestId('celebration')).not.toBeInTheDocument();
  });
});

describe('MatchPage: not your match', () => {
  it('offers to join a match that only exists for invited players', async () => {
    const api = fakeApi({
      ...quietApi,
      [`GET ${URL}`]: new ApiError('MATCH_NOT_FOUND', 'No such match', 404),
      [`POST ${URL}/join`]: makeMatch({ id: MATCH_ID }, []),
    });
    const { events, container, queryClient } = renderRoute(URL, { user: alice });

    expect(await screen.findByRole('heading', { level: 1, name: 'Join this match?' })).toBeInTheDocument();
    await settled(queryClient);
    await expectNoA11yViolations(container);

    await events.click(screen.getByRole('button', { name: 'Join match' }));
    expect(api.requests.some((request) => request.path === `${URL}/join`)).toBe(true);
  });

  it('says the match is unavailable when the address is not a match', async () => {
    fakeApi(quietApi);
    renderRoute('/matches/not-a-match', { user: alice });

    expect(await screen.findByRole('heading', { level: 1, name: 'Match unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New match' })).toBeInTheDocument();
  });
});
