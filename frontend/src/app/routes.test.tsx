import { screen, waitFor } from '@testing-library/react';
import { MATCH_ID, TOURNAMENT_ID, WATCH_MATCH_ID } from '@/test/fixtures/ids';
import { makeUser } from '@/test/fixtures/users';
import { fakeApi, type FakeAnswers } from '@/test/fakeApi';
import { renderRoute } from '@/test/render';

// Every page of the route table opens for a visitor and for a member: one
// <h1>, nothing printed to the console (the setup fails the test otherwise),
// and no request the test has no answer for.
//
// The answers come from src/test/fixtures/api/<area>.ts, one file per area, so
// a page that starts asking the API for something new only changes its own
// area's file.
const answerFiles = import.meta.glob<{ answers: FakeAnswers }>('../test/fixtures/api/*.ts', { eager: true });
const answers: FakeAnswers = Object.assign({}, ...Object.values(answerFiles).map((file) => file.answers));

type Access = 'everyone' | 'visitors' | 'members';

const PAGES: [path: string, access: Access][] = [
  ['/', 'everyone'],
  ['/login', 'visitors'],
  ['/signup', 'visitors'],
  ['/play', 'everyone'],
  ['/play/local', 'everyone'],
  ['/play/computer', 'everyone'],
  ['/play/online', 'members'],
  [`/matches/${MATCH_ID}`, 'members'],
  ['/matches', 'members'],
  ['/tournaments', 'everyone'],
  ['/tournaments/local', 'everyone'],
  ['/tournaments/new', 'members'],
  [`/tournaments/${TOURNAMENT_ID}`, 'members'],
  ['/users/bob', 'members'],
  ['/settings', 'members'],
  ['/settings/security', 'members'],
  ['/account', 'members'],
  ['/players', 'members'],
  ['/leaderboard', 'members'],
  ['/friends', 'members'],
  ['/chat', 'members'],
  ['/chat/bob', 'members'],
  ['/watch', 'members'],
  [`/watch/${WATCH_MATCH_ID}`, 'members'],
  ['/privacy', 'everyone'],
  ['/terms', 'everyone'],
  ['/design', 'everyone'],
  ['/no-such-page', 'everyone'],
];

describe.each([
  ['a visitor', null],
  ['a member', makeUser()],
] as const)('every page opens for %s', (_who, user) => {
  it.each(PAGES)('%s', async (path) => {
    const api = fakeApi(answers);
    const { queryClient, container } = renderRoute(path, { user });

    await screen.findByRole('heading', { level: 1 });
    // Let the page's own requests finish: an unanswered one is a failure.
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));

    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(api.unanswered).toEqual([]);
  });
});

describe('settings and the old account address', () => {
  it('sends a member who opens /account to /settings', async () => {
    fakeApi(answers);
    const { router } = renderRoute('/account', { user: makeUser() });

    await screen.findByRole('heading', { level: 1, name: 'Account' });
    expect(router.state.location.pathname).toBe('/settings');
  });

  it('keeps the section of the settings address', async () => {
    fakeApi(answers);
    const { router } = renderRoute('/settings/security', { user: makeUser() });

    await screen.findByRole('heading', { level: 1, name: 'Account' });
    expect(router.state.location.pathname).toBe('/settings/security');
  });

  it('sends a visitor who opens /account to the login page', async () => {
    fakeApi(answers);
    const { router } = renderRoute('/account', { user: null });

    await screen.findByRole('heading', { level: 1, name: 'Welcome back' });
    expect(router.state.location.pathname).toBe('/login');
  });
});

describe('visitors and members', () => {
  it('sends a member who opens the login page on to the play page', async () => {
    fakeApi(answers);
    const { router } = renderRoute('/login', { user: makeUser() });

    await screen.findByRole('heading', { level: 1, name: 'Play' });
    expect(router.state.location.pathname).toBe('/play');
  });

  it('shows the design page to visitors too', async () => {
    fakeApi(answers);
    renderRoute('/design', { user: null });
    await screen.findByRole('heading', { level: 1, name: 'Design system' });
  });
});
