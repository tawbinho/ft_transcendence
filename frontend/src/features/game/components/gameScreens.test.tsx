import { screen, within } from '@testing-library/react';
import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { createLocalTournament, saveLocalTournament } from '@/features/tournaments/local';
import { makeMatch } from '@/test/factories';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { MATCH_ID, WATCH_MATCH_ID } from '@/test/fixtures/ids';
import { makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

// The four game screens (same screen, online match, spectator, same-screen
// tournament) are built from the same pieces: player tags, a status banner,
// the board and a live region. These tests check what each one shows.

const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

const liveRegion = (container: HTMLElement) => container.querySelector('[aria-live="polite"]');

describe('same-screen game', () => {
  it('starts from the setup form and tells whose turn it is', async () => {
    const { events, container } = renderRoute('/play/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Start game' }));

    expect(await screen.findByText('Player 1 to play')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Board with 7 columns and 6 rows/ })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('announces each move and passes the turn', async () => {
    const { events, container } = renderRoute('/play/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Start game' }));

    await events.click(await screen.findByRole('button', { name: 'Drop a disc in column 4' }));

    expect(screen.getByText('Player 2 to play')).toBeInTheDocument();
    expect(liveRegion(container)).toHaveTextContent('Player 1 played column 4.');
  });

  it('announces the winner and shows the winning banner', async () => {
    const { events, container } = renderRoute('/play/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Start game' }));

    // Player 1 stacks column 1, player 2 column 2.
    for (const column of [1, 2, 1, 2, 1, 2, 1]) {
      await events.click(await screen.findByRole('button', { name: `Drop a disc in column ${column}` }));
    }

    const banner = screen.getByText('Player 1 wins!');
    expect(banner.parentElement).toHaveClass('bg-surface-2');
    expect(liveRegion(container)).toHaveTextContent('Player 1 wins!');
  });
});

describe('online match', () => {
  const alice = makeUser();

  it('shows both players, marks you, and says it is your turn', async () => {
    fakeApi({ ...quietApi, [`GET /matches/${MATCH_ID}`]: makeMatch({ id: MATCH_ID }, [3, 3]) });
    const { container } = renderRoute(`/matches/${MATCH_ID}`, { user: alice });

    expect(await screen.findByRole('heading', { level: 1, name: 'alice vs bob' })).toBeInTheDocument();
    expect(screen.getByText('alice (you)')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('Your turn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resign' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('sends the column of a move to the server', async () => {
    const api = fakeApi({
      ...quietApi,
      [`GET /matches/${MATCH_ID}`]: makeMatch({ id: MATCH_ID }, [3, 3]),
      [`POST /matches/${MATCH_ID}/moves`]: makeMatch({ id: MATCH_ID }, [3, 3, 0]),
    });
    const { events } = renderRoute(`/matches/${MATCH_ID}`, { user: alice });

    await events.click(await screen.findByRole('button', { name: 'Drop a disc in column 1' }));

    const move = api.requests.find((request) => request.method === 'POST');
    expect(move?.path).toBe(`/matches/${MATCH_ID}/moves`);
    expect(move?.body).toEqual({ col: 0 });
  });

  it('cannot be played while it is the other player’s turn', async () => {
    fakeApi({ ...quietApi, [`GET /matches/${MATCH_ID}`]: makeMatch({ id: MATCH_ID }, [3]) });
    renderRoute(`/matches/${MATCH_ID}`, { user: alice });

    expect(await screen.findByText('Waiting for bob…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Drop a disc in column 1' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows a lost match with a red banner and the next steps', async () => {
    fakeApi({
      ...quietApi,
      [`GET /matches/${MATCH_ID}`]: makeMatch(
        {
          id: MATCH_ID,
          status: 'finished',
          endReason: 'resign',
          winnerSeat: 2,
          players: [
            { seat: 1, userId: 'u1', displayName: 'alice', result: 'loss' },
            { seat: 2, userId: 'u2', displayName: 'bob', result: 'win' },
          ],
        },
        [3, 3],
      ),
    });
    const { container } = renderRoute(`/matches/${MATCH_ID}`, { user: alice });

    const banner = (await screen.findByText('You lost.')).parentElement;
    expect(banner).toHaveClass('bg-danger-soft');
    expect(within(banner as HTMLElement).getByText('You resigned.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rematch' })).toBeInTheDocument();
    expect(liveRegion(container)).toHaveTextContent('You lost. You resigned.');
  });
});

describe('spectator screen', () => {
  it('shows who plays and that the viewer only watches', async () => {
    fakeApi({
      ...quietApi,
      [`GET /matches/${WATCH_MATCH_ID}`]: makeMatch({ id: WATCH_MATCH_ID, yourSeat: null }, [3, 3, 2]),
    });
    const { container } = renderRoute(`/watch/${WATCH_MATCH_ID}`, { user: makeUser() });

    expect(await screen.findByRole('heading', { level: 1, name: 'alice vs bob' })).toBeInTheDocument();
    expect(screen.getByText('bob to play')).toBeInTheDocument();
    expect(screen.getByText('You are watching')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    // A picture of the board: nothing can be played from here.
    expect(screen.getByRole('img', { name: /Board with 7 columns/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Drop a disc/ })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('same-screen tournament match', () => {
  it('shows the pairing, then the winner with a Continue button', async () => {
    saveLocalTournament(createLocalTournament(['Ana', 'Ben', 'Cleo', 'Dan'], DEFAULT_BOARD_SETTINGS, () => 0));
    const { events, container } = renderRoute('/tournaments/local', { user: null });

    // A tournament saved on this device is offered back before anything else.
    await events.click(await screen.findByRole('button', { name: 'Resume your tournament' }));
    await events.click(await screen.findByRole('button', { name: 'Play this match' }));
    const title = (await screen.findByRole('heading', { level: 1 })).textContent ?? '';
    const [first] = title.split(' vs ');
    expect(screen.getByText(`${first} to play`)).toBeInTheDocument();

    // The first player stacks column 1, the second column 2.
    for (const column of [1, 2, 1, 2, 1, 2, 1]) {
      await events.click(screen.getByRole('button', { name: `Drop a disc in column ${column}` }));
    }

    expect(screen.getByText(`${first} wins!`).parentElement).toHaveClass('bg-success-soft');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(liveRegion(container)).toHaveTextContent(`${first} wins!`);
  });
});
