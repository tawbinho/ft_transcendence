import { screen, waitFor, within } from '@testing-library/react';
import type { User } from '@/features/auth/types';
import { ApiError } from '@/lib/api/errors';
import { readStorage } from '@/lib/storage';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi, type FakeAnswers } from '@/test/fakeApi';
import { answers as headerAnswers } from '@/test/fixtures/api/home';
import { makeSummary, makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const alice = makeUser();

afterEach(() => {
  window.localStorage.clear();
  // The accent test puts the chosen accent on <html>.
  delete document.documentElement.dataset.accent;
});

async function openSettings(path: string, answers: FakeAnswers = {}, user: User = alice) {
  const api = fakeApi({ ...headerAnswers, 'GET /blocks': [], ...answers });
  const view = renderRoute(path, { user });
  await screen.findByRole('heading', { level: 1, name: 'Settings' });
  // The header's own requests may still be running: let them finish before the test looks.
  await waitFor(() => expect(view.queryClient.isFetching()).toBe(0));
  return { api, ...view };
}

describe('tabs', () => {
  it('opens the profile section at /settings and marks its tab', async () => {
    const { container } = await openSettings('/settings');

    const tabs = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Profile', 'Security', 'Preferences', 'Blocked players']);
    expect(within(tabs).getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 2, name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toHaveValue('alice');
    await expectNoA11yViolations(container);
  });

  it('switches section when a tab is clicked', async () => {
    const { events, router } = await openSettings('/settings');

    await events.click(screen.getByRole('link', { name: 'Security' }));

    expect(router.state.location.pathname).toBe('/settings/security');
    expect(await screen.findByRole('heading', { level: 2, name: 'Two-factor authentication' })).toBeInTheDocument();
    const tabs = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(within(tabs).getByRole('link', { name: 'Security' })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current');
  });

  it.each(['/settings/billing', '/settings/profile', '/account'])('shows the profile section for %s', async (path) => {
    const { router } = await openSettings(path);

    expect(router.state.location.pathname).toBe('/settings');
    expect(screen.getByLabelText('Display name')).toBeInTheDocument();
  });
});

describe('profile section', () => {
  it('links to the public profile and shows the email without editing it', async () => {
    await openSettings('/settings');

    expect(screen.getByRole('link', { name: 'View my profile' })).toHaveAttribute('href', '/users/alice');
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a picture' })).toBeInTheDocument();
  });

  it('checks the display name before asking the server', async () => {
    const { events, api } = await openSettings('/settings');
    const field = screen.getByLabelText('Display name');

    await events.clear(field);
    await events.type(field, 'ab');
    await events.click(screen.getByRole('button', { name: 'Save name' }));
    expect(await screen.findByText('Use 3 to 20 characters.')).toBeInTheDocument();

    await events.clear(field);
    await events.type(field, 'no spaces');
    await events.click(screen.getByRole('button', { name: 'Save name' }));
    expect(await screen.findByText('Use only letters, numbers, _ and -.')).toBeInTheDocument();
    expect(api.requests.filter((request) => request.method === 'PATCH')).toEqual([]);
  });

  it('keeps Save name off until the name changes', async () => {
    const { events } = await openSettings('/settings');

    expect(screen.getByRole('button', { name: 'Save name' })).toBeDisabled();
    await events.type(screen.getByLabelText('Display name'), '2');
    expect(screen.getByRole('button', { name: 'Save name' })).toBeEnabled();
  });

  it('saves a valid name and confirms it', async () => {
    const { events, api } = await openSettings('/settings', {
      'PATCH /users/me': makeUser({ displayName: 'alice2' }),
    });

    await events.type(screen.getByLabelText('Display name'), '2');
    await events.click(screen.getByRole('button', { name: 'Save name' }));

    expect(await screen.findByText('Display name saved.')).toBeInTheDocument();
    const patch = api.requests.find((request) => request.method === 'PATCH');
    expect(patch?.body).toEqual({ displayName: 'alice2' });
  });

  it('tells the user when the name is taken', async () => {
    const { events } = await openSettings('/settings', {
      'PATCH /users/me': new ApiError('DISPLAY_NAME_TAKEN', 'Taken', 409),
    });

    await events.type(screen.getByLabelText('Display name'), '2');
    await events.click(screen.getByRole('button', { name: 'Save name' }));

    expect(await screen.findByText('This display name is already taken.')).toBeInTheDocument();
  });
});

describe('security section', () => {
  it('offers only “Turn off” when two-factor is known to be on', async () => {
    const { container } = await openSettings('/settings/security', {}, makeUser({ twoFactorEnabled: true }));

    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turn off' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Turn on' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('offers only “Turn on” when two-factor is known to be off', async () => {
    await openSettings('/settings/security', {}, makeUser({ twoFactorEnabled: false }));

    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turn on' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Turn off' })).not.toBeInTheDocument();
  });

  it('offers “Turn on” and a quieter “Already on?” when the backend does not say', async () => {
    const { container } = await openSettings('/settings/security');

    expect(screen.getByRole('button', { name: 'Turn on' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Already on? Turn it off' })).toBeInTheDocument();
    expect(screen.queryByText(/We cannot tell yet/)).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('turns two-factor on with a QR code and a first code, then only offers “Turn off”', async () => {
    const { events, api, container } = await openSettings('/settings/security', {
      'POST /auth/2fa/setup': { qr: 'data:image/png;base64,AAAA', secret: 'ABCDEF' },
      'POST /auth/2fa/enable': null,
    });

    await events.click(screen.getByRole('button', { name: 'Turn on' }));
    expect(await screen.findByRole('img', { name: 'QR code for your authenticator app' })).toBeInTheDocument();
    expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    await expectNoA11yViolations(container);

    await events.type(screen.getByLabelText('Authentication code'), '123456');
    await events.click(screen.getByRole('button', { name: 'Confirm and turn on' }));

    expect(await screen.findByText('Two-factor authentication is on.')).toBeInTheDocument();
    expect(api.requests.find((request) => request.path === '/auth/2fa/enable')?.body).toEqual({ code: '123456' });
    expect(screen.getByRole('button', { name: 'Turn off' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Turn on' })).not.toBeInTheDocument();
  });

  it('rejects a code that is not 6 digits without asking the server', async () => {
    const { events, api } = await openSettings('/settings/security', {}, makeUser({ twoFactorEnabled: true }));

    await events.click(screen.getByRole('button', { name: 'Turn off' }));
    await events.type(screen.getByLabelText('Authentication code'), '12');
    await events.click(screen.getByRole('button', { name: 'Turn off' }));

    expect(await screen.findByText('Enter the 6 digits of the code.')).toBeInTheDocument();
    expect(api.requests.filter((request) => request.path === '/auth/2fa/disable')).toEqual([]);
  });

  it('shows who is logged in and logs out', async () => {
    const { events, api } = await openSettings('/settings/security', { 'POST /auth/logout': null });

    expect(screen.getByText('Logged in as alice@example.com')).toBeInTheDocument();
    await events.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(api.requests.some((request) => request.path === '/auth/logout')).toBe(true));
  });
});

describe('preferences section', () => {
  it('remembers the board colors for new games and keeps the other board options', async () => {
    window.localStorage.setItem('board-settings', JSON.stringify({ cols: 9, rows: 8, winLength: 5, theme: 'classic' }));
    const { events, container } = await openSettings('/settings/preferences');

    // The header has a language menu too; the page's own buttons are inside <main>.
    const page = within(screen.getByRole('main'));
    expect(page.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(page.getByRole('group', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Classic/ })).toBeChecked();
    await events.click(screen.getByRole('radio', { name: /Ocean/ }));

    expect(screen.getByRole('radio', { name: /Ocean/ })).toBeChecked();
    expect(JSON.parse(readStorage('board-settings') ?? '{}')).toEqual({
      cols: 9,
      rows: 8,
      winLength: 5,
      theme: 'ocean',
    });
    await expectNoA11yViolations(container);
  });

  it('lets the member pick an accent color, saved on this device', async () => {
    const { events, container } = await openSettings('/settings/preferences');

    expect(screen.getByRole('group', { name: 'Accent color' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeChecked();
    await events.click(screen.getByText('Violet'));

    expect(screen.getByRole('radio', { name: 'Violet' })).toBeChecked();
    expect(document.documentElement.dataset.accent).toBe('violet');
    expect(readStorage('accent')).toBe('violet');
    await expectNoA11yViolations(container);
  });
});

describe('blocked players section', () => {
  it('says so when nobody is blocked', async () => {
    const { container } = await openSettings('/settings/blocked');

    expect(await screen.findByText('You have not blocked anyone.')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('lists blocked players and unblocks one', async () => {
    let blocked = [makeSummary()];
    const { events, api, container } = await openSettings('/settings/blocked', {
      'GET /blocks': () => blocked,
      'DELETE /blocks/u2': () => {
        blocked = [];
        return null;
      },
    });

    expect(await screen.findByRole('link', { name: 'bob' })).toHaveAttribute('href', '/users/bob');
    await expectNoA11yViolations(container);
    await events.click(screen.getByRole('button', { name: 'Unblock' }));

    expect(await screen.findByText('You have not blocked anyone.')).toBeInTheDocument();
    expect(api.requests.some((request) => request.method === 'DELETE' && request.path === '/blocks/u2')).toBe(true);
  });

  it('offers to try again when the list cannot be loaded', async () => {
    await openSettings('/settings/blocked', { 'GET /blocks': new ApiError('INTERNAL_ERROR', 'Server error', 500) });

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
