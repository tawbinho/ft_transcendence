import { screen, waitFor, within } from '@testing-library/react';
import { ApiError } from '@/lib/api/errors';
import { expectNoA11yViolations } from '@/test/axe';
import { allowConsole } from '@/test/console';
import { fakeApi } from '@/test/fakeApi';
import { answers as headerAnswers } from '@/test/fixtures/api/home';
import { MATCH_ID } from '@/test/fixtures/ids';
import { pageOf, emptyPage } from '@/test/fixtures/pages';
import { makeProfile, makeStats, makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';
import type { ProfileMatch } from '@/features/users/types';

const alice = makeUser();

function makeProfileMatch(overrides: Partial<ProfileMatch> = {}): ProfileMatch {
  return {
    id: MATCH_ID,
    opponent: { id: 'u3', displayName: 'carol' },
    result: 'win',
    settings: { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
    endedAt: '2026-10-07T18:30:00.000Z',
    moveCount: 21,
    ...overrides,
  };
}

async function openProfile(name: string, answers: Parameters<typeof fakeApi>[0]) {
  const api = fakeApi({ ...headerAnswers, [`GET /users/${name}/matches`]: emptyPage(), ...answers });
  const view = renderRoute(`/users/${name}`, { user: alice });
  await screen.findByRole('heading', { level: 1, name });
  // The matches load after the profile: let them finish before the test looks.
  await waitFor(() => expect(view.queryClient.isFetching()).toBe(0));
  return { api, ...view };
}

describe('another player’s profile', () => {
  it('shows their results, level and the actions that fit', async () => {
    const { container } = await openProfile('bob', { 'GET /users/bob': makeProfile() });

    // 6 wins, 1 draw and 3 losses: 205 XP, level 3.
    expect(screen.getByText('Level 3', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('95 XP to level 4', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progress to level 4' })).toHaveAttribute('aria-valuenow', '5');
    const tiles = screen.getByRole('region', { name: 'Statistics' });
    expect(within(tiles).getByText('Win rate').nextSibling).toHaveTextContent('60%');

    expect(screen.getByRole('link', { name: 'Message' })).toHaveAttribute('href', '/chat/bob');
    expect(screen.getByRole('link', { name: 'Challenge' })).toHaveAttribute('href', '/play/online?opponent=bob');
    expect(screen.getByRole('button', { name: 'Add friend' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Block' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit profile' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('shows a win rate dash and level 1 before the first match', async () => {
    await openProfile('bob', {
      'GET /users/bob': makeProfile({ stats: makeStats({ played: 0, wins: 0, losses: 0, draws: 0 }) }),
    });

    const tiles = screen.getByRole('region', { name: 'Statistics' });
    expect(within(tiles).getByText('Win rate').nextSibling).toHaveTextContent('—');
    expect(screen.getByText('Level 1', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('No finished match yet.')).toBeInTheDocument();
  });

  it('asks to confirm before blocking', async () => {
    const { events } = await openProfile('bob', { 'GET /users/bob': makeProfile() });

    await events.click(screen.getByRole('button', { name: 'Block' }));

    expect(await screen.findByRole('dialog', { name: 'Block bob?' })).toBeInTheDocument();
  });
});

describe('your own profile', () => {
  it('offers to edit the profile instead of the player actions', async () => {
    const { container } = await openProfile('alice', {
      'GET /users/alice': makeProfile({ id: 'u1', displayName: 'alice', friendship: 'self' }),
    });

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/settings');
    expect(screen.queryByRole('link', { name: 'Message' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add friend' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Block' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('opens a match from the list of your matches', async () => {
    await openProfile('alice', {
      'GET /users/alice': makeProfile({ id: 'u1', displayName: 'alice', friendship: 'self' }),
      'GET /users/alice/matches': pageOf([makeProfileMatch()]),
    });

    const link = await screen.findByRole('link', { name: 'Open match against carol' });
    expect(link).toHaveAttribute('href', `/matches/${MATCH_ID}`);
  });
});

describe('a blocked player’s profile', () => {
  it('shows the notice with Unblock and hides the actions', async () => {
    const { events, api } = await openProfile('bob', {
      'GET /users/bob': makeProfile({ blocked: true }),
      [`DELETE /blocks/u2`]: null,
    });

    expect(screen.getByText('You blocked this player')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Message' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add friend' })).not.toBeInTheDocument();

    await events.click(screen.getByRole('button', { name: 'Unblock' }));
    await waitFor(() => expect(api.requests.some((request) => request.method === 'DELETE')).toBe(true));
  });
});

describe('a player who does not exist', () => {
  it('says so and links to the player search', async () => {
    fakeApi({
      ...headerAnswers,
      'GET /users/ghost': new ApiError('USER_NOT_FOUND', 'No such player', 404),
    });
    const { container } = renderRoute('/users/ghost', { user: alice });

    expect(await screen.findByRole('heading', { level: 1, name: 'Player not found' })).toBeInTheDocument();
    expect(screen.getByText('No player is called “ghost”.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find players' })).toHaveAttribute('href', '/players');
    await expectNoA11yViolations(container);
  });

  it('offers to try again when the profile cannot be loaded', async () => {
    fakeApi({ ...headerAnswers, 'GET /users/bob': new ApiError('INTERNAL_ERROR', 'Server error', 500) });
    renderRoute('/users/bob', { user: alice });

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('badges', () => {
  it('marks the earned badges and leaves the others locked', async () => {
    const { container } = await openProfile('bob', {
      // 12 wins out of 20: first game, first win, 10 wins and the win rate badge (60%).
      'GET /users/bob': makeProfile({ stats: makeStats({ played: 20, wins: 12, losses: 8, draws: 0 }) }),
    });

    const list = screen.getByRole('region', { name: 'Achievements' });
    expect(within(list).getByText('4 of 6 earned')).toBeInTheDocument();
    const badge = (name: string) => within(list).getByText(name).closest('li') as HTMLElement;
    expect(badge('10 wins')).toHaveTextContent('Earned');
    expect(badge('Sharp player')).toHaveTextContent('Earned');
    expect(badge('50 games')).toHaveTextContent('Locked');
    expect(badge('5 draws')).toHaveTextContent('Locked');
    expect(screen.getByText('Badges are computed from match results.')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('recent matches', () => {
  it('lists the opponent, the result and the board, and pages through them', async () => {
    // The test router is not the DOM one, so changing the page prints a flushSync warning the real app does not.
    allowConsole();
    const rows = [
      makeProfileMatch({ id: 'a1', opponent: { id: 'u3', displayName: 'carol' }, result: 'win' }),
      makeProfileMatch({ id: 'a2', opponent: { id: 'u4', displayName: 'dave' }, result: 'loss' }),
      makeProfileMatch({ id: 'a3', opponent: { id: 'u5', displayName: 'erin' }, result: 'draw' }),
    ];
    const { events, container } = await openProfile('bob', {
      'GET /users/bob': makeProfile(),
      'GET /users/bob/matches': { items: rows, total: 25, limit: 10, offset: 0 },
    });

    expect(await screen.findByText('carol')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getAllByText('7 × 6')).toHaveLength(3);
    expect(screen.getAllByText(/Connect 4/)).toHaveLength(3);
    // Someone else's matches are not links: only your own can be opened.
    expect(screen.queryByRole('link', { name: /Open match/ })).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    await expectNoA11yViolations(container);

    await events.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
  });
});
