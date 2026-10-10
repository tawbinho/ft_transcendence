import { screen, within } from '@testing-library/react';
import { ApiError } from '@/lib/api/errors';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { renderRoute } from '@/test/render';
import { makeUser } from '@/test/fixtures/users';

const noMember = { 'GET /friends': { friends: [], incoming: [], outgoing: [] }, 'GET /chat/conversations': [] };

describe('the login page', () => {
  it('has no hint when the visitor opened it directly', async () => {
    fakeApi();
    renderRoute('/login', { user: null });
    await screen.findByRole('heading', { level: 1, name: 'Welcome back' });
    expect(screen.queryByText(/^Log in to (open|continue)/)).not.toBeInTheDocument();
  });

  it('says which section the visitor wanted, when sent from a members page', async () => {
    fakeApi();
    renderRoute('/watch', { user: null });
    expect(await screen.findByText('Log in to open Watch.')).toBeInTheDocument();
  });

  it('asks to log in to continue for a page that is not a section', async () => {
    fakeApi();
    renderRoute('/settings', { user: null });
    expect(await screen.findByText('Log in to continue.')).toBeInTheDocument();
  });

  it('keeps the section when going to the sign up page and back', async () => {
    fakeApi();
    const { events, router } = renderRoute('/players', { user: null });
    await screen.findByText('Log in to open Players.');

    await events.click(within(screen.getByRole('main')).getByRole('link', { name: 'Sign up' }));
    await screen.findByRole('heading', { level: 1, name: 'Create your account' });
    await events.click(within(screen.getByRole('main')).getByRole('link', { name: 'Log in' }));

    expect(await screen.findByText('Log in to open Players.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('returns to the wanted page after logging in', async () => {
    fakeApi({
      ...noMember,
      'POST /auth/login': { user: makeUser() },
      'GET /matches/live': { items: [], total: 0, limit: 12, offset: 0 },
    });
    const { events, router } = renderRoute('/watch', { user: null });
    await screen.findByText('Log in to open Watch.');

    await events.type(screen.getByLabelText('Email'), 'alice@example.com');
    await events.type(screen.getByLabelText('Password'), 'secret-password');
    await events.click(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByRole('heading', { level: 1, name: 'Watch' });
    expect(router.state.location.pathname).toBe('/watch');
  });

  it('shows the server’s answer to wrong credentials', async () => {
    fakeApi({ 'POST /auth/login': new ApiError('INVALID_CREDENTIALS', 'no', 401) });
    const { events } = renderRoute('/login', { user: null });
    await events.type(await screen.findByLabelText('Email'), 'alice@example.com');
    await events.type(screen.getByLabelText('Password'), 'wrong-password');
    await events.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.');
  });

  it('puts the focus on the first field with a mistake', async () => {
    fakeApi();
    const { events } = renderRoute('/login', { user: null });
    await screen.findByRole('heading', { level: 1 });

    await events.click(screen.getByRole('button', { name: 'Log in' }));

    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveFocus();
    expect(screen.getAllByText('This field is required.')).toHaveLength(2);
  });

  it('has no accessibility problems', async () => {
    fakeApi();
    const { container } = renderRoute('/watch', { user: null });
    await screen.findByText('Log in to open Watch.');
    await expectNoA11yViolations(container);
  });
});

describe('the password field', () => {
  it('hides the password until the button is pressed', async () => {
    fakeApi();
    const { events } = renderRoute('/login', { user: null });
    const password = await screen.findByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    await events.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');

    await events.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});

describe('the sign up page', () => {
  it('has a show button on both password fields', async () => {
    fakeApi();
    renderRoute('/signup', { user: null });
    await screen.findByRole('heading', { level: 1, name: 'Create your account' });
    expect(screen.getAllByRole('button', { name: 'Show password' })).toHaveLength(2);
  });

  it('tells which name is taken and puts the message next to the field', async () => {
    fakeApi({ 'POST /auth/signup': new ApiError('DISPLAY_NAME_TAKEN', 'taken', 409) });
    const { events } = renderRoute('/signup', { user: null });
    await events.type(await screen.findByLabelText('Email'), 'new@example.com');
    await events.type(screen.getByLabelText('Display name'), 'alice');
    await events.type(screen.getByLabelText('Password'), 'long-enough-1');
    await events.type(screen.getByLabelText('Confirm password'), 'long-enough-1');
    await events.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('This display name is already taken.')).toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('has no accessibility problems', async () => {
    fakeApi();
    const { container } = renderRoute('/signup', { user: null });
    await screen.findByRole('heading', { level: 1 });
    await expectNoA11yViolations(container);
  });
});
