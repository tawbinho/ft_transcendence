import { screen, waitFor, within } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi, type FakeAnswers } from '@/test/fakeApi';
import { renderRoute } from '@/test/render';
import { answers as homeAnswers } from '@/test/fixtures/api/home';
import { makeUser } from '@/test/fixtures/users';

const answers: FakeAnswers = { ...homeAnswers };

describe('the home page for a visitor', () => {
  it('presents the game with ways to play and a sign up call', async () => {
    fakeApi(answers);
    renderRoute('/', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: /Four in a row/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Play now' })).toHaveAttribute('href', '/play');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: /Same screen/ })).toHaveAttribute('href', '/play/local');
    expect(screen.getByRole('link', { name: /Against the computer/ })).toHaveAttribute('href', '/play/computer');
    expect(screen.getByRole('link', { name: /Sign up to play online/ })).toHaveAttribute('href', '/signup');
  });

  it('lists three short points and shows no dashboard', async () => {
    fakeApi(answers);
    renderRoute('/', { user: null });

    const points = within(await screen.findByRole('region', { name: 'And there is more' }));
    expect(points.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('heading', { name: 'Your turn' })).not.toBeInTheDocument();
  });

  it('has no accessibility problems', async () => {
    fakeApi(answers);
    const { container } = renderRoute('/', { user: null });
    await screen.findByRole('heading', { level: 1 });
    await expectNoA11yViolations(container);
  });
});

describe('the home page for a member', () => {
  it('greets the member by name and shows the dashboard, not the presentation', async () => {
    fakeApi(answers);
    renderRoute('/', { user: makeUser() });

    expect(
      await screen.findByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening), alice$/ }),
    ).toBeInTheDocument();
    for (const name of ['Your turn', 'Recent results', 'Friends online', 'Live matches']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument();
  });

  it('starts games from the quick action buttons', async () => {
    fakeApi(answers);
    renderRoute('/', { user: makeUser() });

    const actions = within(await screen.findByRole('region', { name: 'Start a game' }));
    expect(actions.getByRole('link', { name: 'New online match' })).toHaveAttribute('href', '/play/online');
    expect(actions.getByRole('link', { name: 'Against the computer' })).toHaveAttribute('href', '/play/computer');
    expect(actions.getByRole('link', { name: 'Same screen' })).toHaveAttribute('href', '/play/local');
    expect(actions.getByRole('link', { name: 'Tournaments' })).toHaveAttribute('href', '/tournaments');
  });

  it('waits for the session before choosing a page', async () => {
    fakeApi({ ...answers, 'GET /auth/me': makeUser() });
    renderRoute('/');

    expect(screen.queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: /alice/ })).toBeInTheDocument();
  });

  it('has no accessibility problems', async () => {
    fakeApi(answers);
    const { container, queryClient } = renderRoute('/', { user: makeUser() });
    await screen.findByRole('heading', { level: 1, name: /alice/ });
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    await expectNoA11yViolations(container);
  });
});
