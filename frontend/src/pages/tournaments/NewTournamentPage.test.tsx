import { screen } from '@testing-library/react';
import { saveLastSettings } from '@/features/game/lastSettings';
import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { TOURNAMENT_ID } from '@/test/fixtures/ids';
import { makeTournament } from '@/test/fixtures/tournaments';
import { makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

describe('new online tournament', () => {
  it('checks the name before sending anything', async () => {
    const api = fakeApi(quietApi);
    const { events, container } = renderRoute('/tournaments/new', { user: makeUser() });

    await events.click(await screen.findByRole('button', { name: 'Create a tournament' }));
    expect(screen.getByText('This field is required.')).toBeInTheDocument();
    await events.type(screen.getByRole('textbox', { name: /Name/ }), 'x');
    expect(await screen.findByText('Use 3 to 30 characters.')).toBeInTheDocument();

    expect(api.requests.some((request) => request.method === 'POST')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('creates the tournament and opens its page', async () => {
    const api = fakeApi({
      ...quietApi,
      'POST /tournaments': makeTournament({ name: 'Friday cup' }),
      [`GET /tournaments/${TOURNAMENT_ID}`]: makeTournament({ name: 'Friday cup' }),
    });
    const { events } = renderRoute('/tournaments/new', { user: makeUser() });

    await events.type(await screen.findByRole('textbox', { name: /Name/ }), '  Friday cup ');
    await events.click(screen.getByRole('radio', { name: '8 players' }));
    await events.click(screen.getByRole('button', { name: 'Create a tournament' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Friday cup' })).toBeInTheDocument();
    const post = api.requests.find((request) => request.method === 'POST' && request.path === '/tournaments');
    expect(post?.body).toMatchObject({ name: 'Friday cup', size: 8, settings: DEFAULT_BOARD_SETTINGS });
  });

  it('starts from the board used in the last game on this device', async () => {
    saveLastSettings({ ...DEFAULT_BOARD_SETTINGS, cols: 9, rows: 7, winLength: 5 });
    const api = fakeApi({
      ...quietApi,
      'POST /tournaments': makeTournament(),
      [`GET /tournaments/${TOURNAMENT_ID}`]: makeTournament(),
    });
    const { events } = renderRoute('/tournaments/new', { user: makeUser() });

    await events.type(await screen.findByRole('textbox', { name: /Name/ }), 'Friday cup');
    await events.click(screen.getByRole('button', { name: 'Create a tournament' }));

    await screen.findByRole('heading', { level: 1, name: 'Friday cup' });
    const post = api.requests.find((request) => request.method === 'POST' && request.path === '/tournaments');
    expect(post?.body).toMatchObject({ settings: { cols: 9, rows: 7, winLength: 5 } });
  });
});
