import { screen, within } from '@testing-library/react';
import type { Tournament } from '@/features/tournaments/types';
import { ApiError } from '@/lib/api/errors';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { TOURNAMENT_ID } from '@/test/fixtures/ids';
import { makeRunningTournament, SEMI_MATCH_ID } from '@/test/fixtures/runningTournament';
import { makeTournament } from '@/test/fixtures/tournaments';
import { makeSummary, makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

const alice = makeUser(); // u1, who created the tournament of the fixtures
const bob = makeUser({ id: 'u2', displayName: 'bob' });
const carol = makeUser({ id: 'u3', displayName: 'carol' });
const url = `/tournaments/${TOURNAMENT_ID}`;
const detail = `GET /tournaments/${TOURNAMENT_ID}`;

function open(tournament: Tournament, user = alice, extra = {}) {
  const api = fakeApi({ ...quietApi, [detail]: tournament, ...extra });
  return { api, ...renderRoute(url, { user }) };
}

describe('registration', () => {
  it('lets a member who is not in the tournament join, then leave', async () => {
    let joined = false;
    const waiting = makeTournament({ joined: false, createdBy: { id: 'u9', displayName: 'zoe' } });
    const { api, events, container } = open(waiting, bob, {
      [detail]: () => ({ ...waiting, joined, playerCount: joined ? 3 : 2 }),
      [`POST ${url}/join`]: () => {
        joined = true;
        return { ...waiting, joined: true, playerCount: 3 };
      },
    });

    await events.click(await screen.findByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('button', { name: 'Leave' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join' })).not.toBeInTheDocument();
    expect(api.requests.some((request) => request.method === 'POST' && request.path === `${url}/join`)).toBe(true);
    await expectNoA11yViolations(container);
  });

  it('shows a registered member who is not the creator only the Leave button', async () => {
    open(makeTournament({ joined: true }), bob);

    expect(await screen.findByRole('button', { name: 'Leave' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start now' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel tournament' })).not.toBeInTheDocument();
  });

  it('shows the creator Start and Cancel, with Start off until 3 players are in', async () => {
    const { container } = open(makeTournament());

    expect(await screen.findByRole('button', { name: 'Start now' })).toBeDisabled();
    expect(screen.getByText('At least 3 players are needed to start.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel tournament' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Leave' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('lets the creator start once 3 players are in', async () => {
    const three = makeTournament({
      playerCount: 3,
      players: [
        makeSummary({ id: 'u1', displayName: 'alice' }),
        makeSummary(),
        makeSummary({ id: 'u3', displayName: 'carol' }),
      ],
    });
    const { api, events } = open(three, alice, { [`POST ${url}/start`]: makeRunningTournament({ playerCount: 3 }) });

    const start = await screen.findByRole('button', { name: 'Start now' });
    expect(start).toBeEnabled();
    expect(screen.queryByText('At least 3 players are needed to start.')).not.toBeInTheDocument();
    await events.click(start);

    expect(await screen.findByRole('heading', { level: 3, name: 'Final' })).toBeInTheDocument();
    expect(api.requests.some((request) => request.method === 'POST' && request.path === `${url}/start`)).toBe(true);
    expect(screen.queryByRole('button', { name: 'Start now' })).not.toBeInTheDocument();
  });

  it('asks before cancelling a tournament', async () => {
    const { api, events } = open(makeTournament(), alice, { [`DELETE ${url}`]: null });

    await events.click(await screen.findByRole('button', { name: 'Cancel tournament' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Cancel this tournament?')).toBeInTheDocument();
    expect(api.requests.some((request) => request.method === 'DELETE')).toBe(false);
  });

  it('shows the server’s reason when joining fails', async () => {
    const waiting = makeTournament({ joined: false, createdBy: { id: 'u9', displayName: 'zoe' } });
    const { events } = open(waiting, bob, { [`POST ${url}/join`]: new ApiError('TOURNAMENT_FULL', 'Full', 409) });

    await events.click(await screen.findByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('a server that cannot start tournaments yet', () => {
  const three = makeTournament({
    playerCount: 3,
    players: [
      makeSummary({ id: 'u1', displayName: 'alice' }),
      makeSummary(),
      makeSummary({ id: 'u3', displayName: 'carol' }),
    ],
  });

  it('tells the creator so when Start now finds no route', async () => {
    const { events } = open(three, alice, {
      [`POST ${url}/start`]: new ApiError('NOT_FOUND', 'Cannot POST /api/tournaments/x/start', 404),
    });

    await events.click(await screen.findByRole('button', { name: 'Start now' }));

    expect(await screen.findByText(/cannot start a tournament yet/)).toBeInTheDocument();
    expect(screen.queryByText('This page or item does not exist.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start now' })).toBeEnabled();
  });

  it('says why a full tournament stays open', async () => {
    const full = makeTournament({ playerCount: 4, joined: false, createdBy: { id: 'u9', displayName: 'zoe' } });
    open(full, bob);

    expect(await screen.findByText(/All places are taken/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join' })).not.toBeInTheDocument();
  });

  it('does not say it for a tournament with room left', async () => {
    open(three);

    await screen.findByRole('button', { name: 'Start now' });
    expect(screen.queryByText(/All places are taken/)).not.toBeInTheDocument();
  });
});

describe('the players of a tournament', () => {
  it('link to their profile', async () => {
    open(makeTournament());

    expect(await screen.findByRole('link', { name: /bob/ })).toHaveAttribute('href', '/users/bob');
  });
});

describe('a running tournament', () => {
  it('shows a player the bracket, their match to play and who is in', async () => {
    const { container } = open(makeRunningTournament());

    expect(await screen.findByRole('heading', { level: 1, name: 'Friday cup' })).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(['Semi-finals', 'Final']);
    expect(screen.getByText('Your match against bob is ready.')).toBeInTheDocument();
    // Both the banner and the highlighted pairing link to the match.
    const play = within(screen.getByRole('main')).getAllByRole('link', { name: 'Play' });
    expect(play.length).toBeGreaterThan(0);
    for (const link of play) expect(link).toHaveAttribute('href', `/matches/${SEMI_MATCH_ID}`);
    expect(screen.queryByRole('button', { name: 'Join' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('marks the winner of a finished pairing', async () => {
    open(makeRunningTournament());

    const bracket = await screen.findByRole('group', { name: 'Bracket' });
    const winners = within(bracket).getAllByText('Winner');
    expect(winners).toHaveLength(1); // carol won her semi-final; the final is not played
  });

  it('lets someone who is not playing watch the match in progress instead', async () => {
    open(makeRunningTournament(), carol);

    const watch = await within(await screen.findByRole('main')).findByRole('link', { name: 'Watch' });
    expect(watch).toHaveAttribute('href', `/watch/${SEMI_MATCH_ID}`);
    expect(screen.queryByText(/Your match against/)).not.toBeInTheDocument();
    expect(within(screen.getByRole('main')).queryByRole('link', { name: 'Play' })).not.toBeInTheDocument();
  });
});

describe('a finished tournament', () => {
  it('crowns the champion in a banner and in the bracket', async () => {
    const running = makeRunningTournament();
    const finished: Tournament = {
      ...running,
      status: 'finished',
      winner: { id: 'u3', displayName: 'carol' },
      rounds: running.rounds.map((round, r) => ({
        pairings: round.pairings.map((pairing) =>
          r === 1 ? { ...pairing, winnerId: 'u3', players: [running.players[0]!, running.players[2]!] } : pairing,
        ),
      })) as Tournament['rounds'],
    };
    const { container } = open(finished);

    expect(await screen.findByRole('heading', { level: 2, name: 'carol wins the tournament!' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Champion' })).toBeInTheDocument();
    expect(screen.queryByText(/Your match against/)).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('a tournament that does not exist', () => {
  it('says so and links back to the list', async () => {
    fakeApi({ ...quietApi, [detail]: new ApiError('TOURNAMENT_NOT_FOUND', 'No such tournament', 404) });
    renderRoute(url, { user: alice });

    expect(await screen.findByRole('heading', { level: 1, name: 'Tournament not found' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Tournaments' })).toHaveAttribute(
      'href',
      '/tournaments',
    );
  });

  it('does not ask the server when the address is not a tournament id', async () => {
    const api = fakeApi(quietApi);
    renderRoute('/tournaments/not-a-uuid', { user: alice });

    expect(await screen.findByRole('heading', { level: 1, name: 'Tournament not found' })).toBeInTheDocument();
    expect(api.requests.some((request) => request.path.startsWith('/tournaments/'))).toBe(false);
  });
});
