import { useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { authKeys, useCurrentUser } from '@/features/auth/hooks';
import { ApiError } from '@/lib/api/errors';
import { http } from '@/lib/api/http';
import { expectNoA11yViolations } from './axe';
import { allowConsole } from './console';
import { fakeApi } from './fakeApi';
import { makeProfile, makeUser } from './fixtures/users';
import { renderRoute, renderWithProviders } from './render';

describe('fakeApi', () => {
  it('answers a request with its data', async () => {
    fakeApi({ 'GET /friends': { friends: [] } });
    await expect(http.get('/friends')).resolves.toEqual({ friends: [] });
  });

  it('ignores the query string when matching, and records the request', async () => {
    const api = fakeApi({ 'GET /users': { items: [] } });

    await http.get('/users', { query: { search: 'bo' } });

    expect(api.requests).toHaveLength(1);
    expect(api.requests[0]).toMatchObject({ method: 'GET', path: '/users', query: { search: 'bo' } });
  });

  it('fails a request with an ApiError the way the backend would', async () => {
    fakeApi({ 'POST /matches': new ApiError('MATCH_NOT_JOINABLE', 'Closed', 409) });

    await expect(http.post('/matches')).rejects.toMatchObject({ code: 'MATCH_NOT_JOINABLE', status: 409 });
  });

  it('lets a function decide from the request', async () => {
    fakeApi({ 'POST /chat/u2/messages': (request) => ({ echoed: request.body }) });
    await expect(http.post('/chat/u2/messages', { body: 'hi' })).resolves.toEqual({ echoed: { body: 'hi' } });
  });

  it('matches :parameters, but an exact key wins', async () => {
    fakeApi({ 'GET /users/:name': { who: 'any' }, 'GET /users/bob': { who: 'bob' } });

    await expect(http.get('/users/alice')).resolves.toEqual({ who: 'any' });
    await expect(http.get('/users/bob')).resolves.toEqual({ who: 'bob' });
  });

  it('does not let a :parameter swallow a longer path', async () => {
    const api = fakeApi({ 'GET /users/:name': {} });
    await expect(http.get('/users/bob/matches')).rejects.toThrow();
    expect(api.unanswered).toEqual(['GET /users/bob/matches']);
  });

  it('fails an unknown request with a message that names it', async () => {
    const api = fakeApi({});

    await expect(http.get('/blocks')).rejects.toThrow('fakeApi has no answer for "GET /blocks"');
    expect(api.unanswered).toEqual(['GET /blocks']);
  });
});

describe('renderWithProviders', () => {
  function Greeting() {
    const { t } = useTranslation();
    return <p>{t('common.loading')}</p>;
  }

  it('renders in English', () => {
    renderWithProviders(<Greeting />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('puts the given user in the cache, so the page does not ask the API', () => {
    const api = fakeApi({});
    function Name() {
      return <p>{useCurrentUser().data?.displayName ?? 'nobody'}</p>;
    }

    const { queryClient } = renderWithProviders(<Name />, { user: makeUser({ displayName: 'zoe' }) });

    expect(screen.getByText('zoe')).toBeInTheDocument();
    expect(queryClient.getQueryData(authKeys.me)).toMatchObject({ displayName: 'zoe' });
    expect(api.requests).toEqual([]);
  });

  it('a visitor is a cached null', () => {
    function Name() {
      return <p>{useCurrentUser().data === null ? 'visitor' : 'unknown'}</p>;
    }
    renderWithProviders(<Name />, { user: null });
    expect(screen.getByText('visitor')).toBeInTheDocument();
  });

  it('does not try a failing request again', async () => {
    const api = fakeApi({ 'GET /thing': new ApiError('SERVER_UNAVAILABLE', 'Down', 503) });
    function Thing() {
      const { error } = useQuery({ queryKey: ['thing'], queryFn: () => http.get('/thing') });
      return <p>{error ? 'failed' : 'loading'}</p>;
    }

    renderWithProviders(<Thing />);

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(api.requests).toHaveLength(1);
  });

  it('gives back user-event for clicking and typing', async () => {
    const onClick = vi.fn();
    const { events } = renderWithProviders(<button onClick={onClick}>Go</button>);
    await events.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('starts at the given route', () => {
    function Path() {
      return <p>{window.location.pathname === '/' ? 'jsdom is at /' : ''}</p>;
    }
    // The memory router does not touch the real address.
    renderWithProviders(<Path />, { route: '/somewhere' });
    expect(screen.getByText('jsdom is at /')).toBeInTheDocument();
  });
});

describe('renderRoute', () => {
  it('renders a page of the app inside its layout', async () => {
    fakeApi({ 'GET /friends': { friends: [], incoming: [], outgoing: [] }, 'GET /chat/conversations': [] });
    renderRoute('/privacy', { user: makeUser() });

    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('sends a visitor from a members page to the login page', async () => {
    const { router } = renderRoute('/players', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('shows the page-not-found page for an unknown address', async () => {
    renderRoute('/nothing-here', { user: null });
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('expectNoA11yViolations', () => {
  it('accepts a labelled button', async () => {
    const { container } = renderWithProviders(<button type="button">Save</button>);
    await expectNoA11yViolations(container);
  });

  it('rejects an image without a text alternative and names the element', async () => {
    const { container } = renderWithProviders(<img src="/x.png" />);
    await expect(expectNoA11yViolations(container)).rejects.toThrow(/image-alt/);
  });

  it('rejects a form field without a label', async () => {
    const { container } = renderWithProviders(<input type="text" />);
    await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/);
  });
});

describe('console guard', () => {
  it('lets a test that expects console output through', () => {
    allowConsole();
    console.error('expected in this test');
    console.warn('and this');
    expect(console.error).toHaveBeenCalledOnce();
  });
});

describe('test data', () => {
  it('builds users and profiles that can be changed field by field', () => {
    expect(makeUser({ displayName: 'zoe' })).toMatchObject({ displayName: 'zoe', email: 'alice@example.com' });
    expect(makeProfile({ friendship: 'friends' })).toMatchObject({ displayName: 'bob', friendship: 'friends' });
  });
});
