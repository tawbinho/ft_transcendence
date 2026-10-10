import { screen, waitFor } from '@testing-library/react';
import { saveLastSettings } from '@/features/game/lastSettings';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

/** Waits until the header and the page have received their answers, so axe does not run during an update. */
async function settled(queryClient: { isFetching: () => number }) {
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
}

const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

beforeEach(() => localStorage.clear());

describe('PlayPage', () => {
  it('offers the four ways to play to a member', async () => {
    fakeApi(quietApi);
    const { container, queryClient } = renderRoute('/play', { user: makeUser() });

    expect(await screen.findByRole('heading', { level: 1, name: 'Play' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Same screen' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Against the computer' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a match' })).toHaveAttribute('href', '/play/online');
    expect(screen.getByRole('link', { name: 'See tournaments' })).toHaveAttribute('href', '/tournaments');
    await settled(queryClient);
    await expectNoA11yViolations(container);
  });

  it('asks a visitor to log in to play online', async () => {
    renderRoute('/play', { user: null });

    const login = await screen.findByRole('link', { name: 'Log in to play online' });
    expect(login).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('link', { name: 'Create a match' })).not.toBeInTheDocument();
  });

  it('restarts with the board of the last game', async () => {
    saveLastSettings({ cols: 8, rows: 7, winLength: 5, theme: 'midnight' });
    renderRoute('/play', { user: null });

    expect(await screen.findByText(/8 × 7, connect 5/)).toBeInTheDocument();
    const [local, computer] = [
      screen.getAllByRole('link', { name: 'Same screen' }).at(-1),
      screen.getAllByRole('link', { name: 'Against the computer' }).at(-1),
    ];
    expect(local).toHaveAttribute('href', '/play/local?start=1');
    expect(computer).toHaveAttribute('href', '/play/computer?start=1');
  });

  it('explains the rules and the keyboard controls', async () => {
    renderRoute('/play', { user: null });

    const help = (await screen.findByRole('heading', { level: 2, name: 'How to play' })).closest('section');
    expect(help).toHaveTextContent('Be the first to line up 4 discs');
    expect(screen.getByRole('heading', { level: 2, name: 'Keyboard' })).toBeInTheDocument();
    expect(screen.getByText('Drop a disc in that column')).toBeInTheDocument();
  });
});

describe('quick start', () => {
  it('skips the setup form and starts a same-screen game on the last board', async () => {
    saveLastSettings({ cols: 8, rows: 7, winLength: 4, theme: 'classic' });
    renderRoute('/play/local?start=1', { user: null });

    expect(await screen.findByText('Player 1 to play')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Board with 8 columns and 7 rows' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start game' })).not.toBeInTheDocument();
  });

  it('shows the setup form without ?start', async () => {
    renderRoute('/play/local', { user: null });

    expect(await screen.findByRole('button', { name: 'Start game' })).toBeInTheDocument();
  });

  it('comes back to the setup form with "Change settings"', async () => {
    const { events } = renderRoute('/play/local?start=1', { user: null });

    await events.click(await screen.findByRole('button', { name: 'Change settings' }));

    expect(await screen.findByRole('button', { name: 'Start game' })).toBeInTheDocument();
  });
});
