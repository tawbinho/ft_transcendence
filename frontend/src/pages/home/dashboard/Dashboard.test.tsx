import { screen, within } from '@testing-library/react';
import { ApiError } from '@/lib/api/errors';
import type { Friend } from '@/features/friends/types';
import { makeMatchSummary } from '@/test/fixtures/matchSummary';
import { emptyPage, pageOf } from '@/test/fixtures/pages';
import { makeSummary, makeUser } from '@/test/fixtures/users';
import { fakeApi, type FakeAnswers } from '@/test/fakeApi';
import { renderWithProviders } from '@/test/render';
import { Dashboard } from './Dashboard';

const user = makeUser();
const noFriends = { friends: [], incoming: [], outgoing: [] };
const friend = (name: string, online: boolean): Friend => ({
  ...makeSummary({ id: name, displayName: name, online }),
  since: '2026-09-01T10:00:00.000Z',
});

/** The answers of a dashboard whose lists are empty; a test replaces what it looks at. */
function answers(overrides: FakeAnswers = {}): FakeAnswers {
  return {
    'GET /friends': noFriends,
    'GET /chat/conversations': [],
    'GET /matches/mine': emptyPage(),
    'GET /matches/live': emptyPage(),
    ...overrides,
  };
}

/** `GET /matches/mine` answers by the status in the question. */
const mine =
  (byStatus: { in_progress?: unknown[]; finished?: unknown[] }) => (request: { query?: { status?: string } }) =>
    pageOf(byStatus[request.query?.status as 'in_progress' | 'finished'] ?? []);

const panel = (name: string) => within(screen.getByRole('region', { name }));

describe('the "Your turn" panel', () => {
  it('lists only the matches where the member has to move', async () => {
    const myMove = makeMatchSummary({ id: 'm-mine', yourSeat: 1 }, 2);
    const theirMove = makeMatchSummary({ id: 'm-theirs', yourSeat: 1 }, 3);
    fakeApi(answers({ 'GET /matches/mine': mine({ in_progress: [theirMove, myMove] }) }));
    renderWithProviders(<Dashboard user={user} />, { user });

    const links = await panel('Your turn').findAllByRole('link', { name: /Against bob/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/matches/m-mine');
    expect(panel('Your turn').getByText('Your move')).toBeInTheDocument();
  });

  it('says nothing is waiting and counts the other matches in progress', async () => {
    const theirMove = makeMatchSummary({ yourSeat: 1 }, 3);
    fakeApi(answers({ 'GET /matches/mine': mine({ in_progress: [theirMove] }) }));
    renderWithProviders(<Dashboard user={user} />, { user });

    expect(
      await panel('Your turn').findByText('No match is waiting for your move. Matches in progress: 1.'),
    ).toBeInTheDocument();
  });

  it('says nothing is waiting when there is no match at all', async () => {
    fakeApi(answers());
    renderWithProviders(<Dashboard user={user} />, { user });
    expect(await panel('Your turn').findByText('No match is waiting for your move.')).toBeInTheDocument();
  });

  it('shows the error with a button to try again', async () => {
    let failing = true;
    fakeApi(
      answers({
        'GET /matches/mine': (request) =>
          failing && request.query?.status === 'in_progress'
            ? new ApiError('INTERNAL_ERROR', 'boom', 500)
            : emptyPage(),
      }),
    );
    const { events } = renderWithProviders(<Dashboard user={user} />, { user });

    const retry = await panel('Your turn').findByRole('button', { name: 'Try again' });
    failing = false;
    await events.click(retry);
    expect(await panel('Your turn').findByText('No match is waiting for your move.')).toBeInTheDocument();
  });
});

describe('the "Recent results" panel', () => {
  it('lists finished matches', async () => {
    const won = makeMatchSummary({ id: 'm-won', status: 'finished', winnerSeat: 1, endReason: 'win' }, 9);
    fakeApi(answers({ 'GET /matches/mine': mine({ finished: [won] }) }));
    renderWithProviders(<Dashboard user={user} />, { user });

    const link = await panel('Recent results').findByRole('link', { name: /bob/ });
    expect(link).toHaveAttribute('href', '/matches/m-won');
    expect(panel('Recent results').getByText('Won')).toBeInTheDocument();
  });

  it('explains that finished matches will show up here', async () => {
    fakeApi(answers());
    renderWithProviders(<Dashboard user={user} />, { user });
    expect(await panel('Recent results').findByText('Your finished matches will appear here.')).toBeInTheDocument();
  });
});

describe('the "Friends online" panel', () => {
  it('shows the online friends with a link to challenge each', async () => {
    fakeApi(answers({ 'GET /friends': { ...noFriends, friends: [friend('bob', true), friend('carol', false)] } }));
    renderWithProviders(<Dashboard user={user} />, { user });

    const challenge = await panel('Friends online').findByRole('link', { name: 'Challenge bob' });
    expect(challenge).toHaveAttribute('href', '/play/online?opponent=bob');
    expect(panel('Friends online').queryByText('carol')).not.toBeInTheDocument();
  });

  it('says when no friend is online', async () => {
    fakeApi(answers({ 'GET /friends': { ...noFriends, friends: [friend('carol', false)] } }));
    renderWithProviders(<Dashboard user={user} />, { user });
    expect(await panel('Friends online').findByText('None of your friends is online right now.')).toBeInTheDocument();
  });

  it('suggests adding friends when there are none', async () => {
    fakeApi(answers());
    renderWithProviders(<Dashboard user={user} />, { user });
    expect(await panel('Friends online').findByText('Add friends to see when they are online.')).toBeInTheDocument();
  });
});

describe('the "Live matches" panel', () => {
  it('counts the matches being played', async () => {
    fakeApi(answers({ 'GET /matches/live': { items: [makeMatchSummary()], total: 4, limit: 12, offset: 0 } }));
    renderWithProviders(<Dashboard user={user} />, { user });

    expect(await panel('Live matches').findByText('Matches being played right now: 4')).toBeInTheDocument();
    expect(panel('Live matches').getByRole('link', { name: 'Watch' })).toHaveAttribute('href', '/watch');
  });

  it('says when no match is being played', async () => {
    fakeApi(answers());
    renderWithProviders(<Dashboard user={user} />, { user });
    expect(await panel('Live matches').findByText('No match is being played right now.')).toBeInTheDocument();
  });
});
