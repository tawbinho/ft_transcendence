import { screen, waitFor, within } from '@testing-library/react';
import { ApiError } from '@/lib/api/errors';
import { makeConversation } from '@/test/fixtures/chat';
import { makeSummary, makeUser } from '@/test/fixtures/users';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { renderWithProviders } from '@/test/render';
import { authKeys } from '@/features/auth/hooks';
import { Header } from './Header';

const nothingNew = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

// The phone parts and the wide-screen parts are both in the page (a stylesheet hides one of them, jsdom has none),
// so tests look inside the menu they mean.
const desktopNav = () => screen.getAllByRole('navigation', { name: 'Main navigation' })[0]!;

describe('the bar for a visitor', () => {
  it('shows Play, Tournaments, Watch, Players, Log in and Sign up', () => {
    fakeApi();
    renderWithProviders(<Header />, { user: null });

    const nav = within(desktopNav());
    for (const name of ['Play', 'Tournaments', 'Watch', 'Players']) {
      expect(nav.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('link', { name: 'Log in' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: 'Sign up' })[0]).toHaveAttribute('href', '/signup');
  });

  it('hides the member links', () => {
    fakeApi();
    renderWithProviders(<Header />, { user: null });
    for (const name of ['History', /^Chat/, /^Friends/]) {
      expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument();
  });

  it('has no accessibility problems', async () => {
    fakeApi();
    const { container } = renderWithProviders(<Header />, { user: null });
    await expectNoA11yViolations(container);
  });
});

describe('the bar for a member', () => {
  it('shows every section, the theme button, the language and the account menu', async () => {
    fakeApi(nothingNew);
    renderWithProviders(<Header />, { user: makeUser() });

    const nav = within(desktopNav());
    for (const name of ['Play', 'Tournaments', 'Watch', 'Players', 'History', 'Chat', 'Friends']) {
      expect(nav.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('combobox', { name: 'Language' })[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to the dark theme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Account menu/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Play' })).toBeInTheDocument());
  });

  it('shows the unread messages and friend requests on their icons', async () => {
    fakeApi({
      'GET /friends': {
        friends: [],
        incoming: [makeSummary(), makeSummary({ id: 'u3', displayName: 'carol' })],
        outgoing: [],
      },
      'GET /chat/conversations': [makeConversation(2), makeConversation(1, { peer: makeSummary({ id: 'u4' }) })],
    });
    renderWithProviders(<Header />, { user: makeUser() });

    const nav = within(desktopNav());
    expect(await nav.findByRole('link', { name: 'Chat, new: 3' })).toBeInTheDocument();
    expect(await nav.findByRole('link', { name: 'Friends, new: 2' })).toBeInTheDocument();
  });

  it('puts the count in the name of the phone menu button too', async () => {
    fakeApi({ ...nothingNew, 'GET /chat/conversations': [makeConversation(4)] });
    renderWithProviders(<Header />, { user: makeUser() });
    expect(await screen.findByRole('button', { name: 'Open menu, new: 4' })).toBeInTheDocument();
  });

  it('highlights the section of the current page', () => {
    fakeApi(nothingNew);
    renderWithProviders(<Header />, { user: makeUser(), route: '/play/local' });

    const nav = within(desktopNav());
    expect(nav.getByRole('link', { name: 'Play' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Tournaments' })).not.toHaveAttribute('aria-current');
  });

  it('has no accessibility problems', async () => {
    fakeApi(nothingNew);
    const { container, queryClient } = renderWithProviders(<Header />, { user: makeUser() });
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    await expectNoA11yViolations(container);
  });
});

describe('while the session is unknown', () => {
  it('shows the public links and no Log in button until /auth/me answers', async () => {
    fakeApi({ 'GET /auth/me': null });
    renderWithProviders(<Header />);

    expect(within(desktopNav()).getByRole('link', { name: 'Play' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(await screen.findAllByRole('link', { name: 'Log in' })).not.toHaveLength(0);
  });

  it('offers Retry instead of Log in when the session could not be loaded, and recovers', async () => {
    let up = false;
    // The server is down until `up` is set.
    fakeApi({
      ...nothingNew,
      'GET /auth/me': () => (up ? makeUser() : new ApiError('SERVER_UNAVAILABLE', 'down', 503)),
    });
    const { events } = renderWithProviders(<Header />);
    expect(await screen.findByRole('button', { name: /Try again/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();

    up = true;
    await events.click(screen.getByRole('button', { name: /Try again/ }));
    expect(await screen.findByRole('button', { name: /Account menu/ })).toBeInTheDocument();
  });

  it('keeps a member a member when the next /auth/me fails', async () => {
    fakeApi({ ...nothingNew, 'GET /auth/me': new ApiError('SERVER_UNAVAILABLE', 'down', 503) });
    const { queryClient } = renderWithProviders(<Header />, { user: makeUser() });

    await queryClient.refetchQueries({ queryKey: authKeys.me });

    expect(screen.getByRole('button', { name: /Account menu/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });
});
