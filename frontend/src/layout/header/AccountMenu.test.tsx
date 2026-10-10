import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { renderWithProviders } from '@/test/render';
import { makeUser } from '@/test/fixtures/users';
import { AccountMenu } from './AccountMenu';

const user = makeUser();

describe('the account menu', () => {
  it('is closed at first and opens with the keyboard', async () => {
    fakeApi();
    const { events } = renderWithProviders(<AccountMenu user={user} />, { user });
    const button = screen.getByRole('button', { name: /Account menu/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'My profile' })).not.toBeInTheDocument();

    await events.tab();
    expect(button).toHaveFocus();
    await events.keyboard('{Enter}');

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'My profile' })).toHaveAttribute('href', '/users/alice');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('lets Tab reach each entry in turn', async () => {
    fakeApi();
    const { events } = renderWithProviders(<AccountMenu user={user} />, { user });
    await events.click(screen.getByRole('button', { name: /Account menu/ }));

    await events.tab();
    expect(screen.getByRole('link', { name: 'My profile' })).toHaveFocus();
    await events.tab();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveFocus();
    await events.tab();
    expect(screen.getByRole('button', { name: 'Log out' })).toHaveFocus();
  });

  it('closes on Escape and gives the focus back to the button', async () => {
    fakeApi();
    const { events } = renderWithProviders(<AccountMenu user={user} />, { user });
    const button = screen.getByRole('button', { name: /Account menu/ });
    await events.click(button);
    await events.tab();

    await events.keyboard('{Escape}');

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('closes on a click outside', async () => {
    fakeApi();
    const { events } = renderWithProviders(<AccountMenu user={user} />, { user });
    const button = screen.getByRole('button', { name: /Account menu/ });
    await events.click(button);

    await events.click(document.body);

    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('logs out through the Log out button', async () => {
    const api = fakeApi({ 'POST /auth/logout': null });
    const { events } = renderWithProviders(<AccountMenu user={user} />, { user });
    await events.click(screen.getByRole('button', { name: /Account menu/ }));

    await events.click(screen.getByRole('button', { name: 'Log out' }));

    await vi.waitFor(() =>
      expect(api.requests.map((request) => `${request.method} ${request.path}`)).toContain('POST /auth/logout'),
    );
  });

  it('has no accessibility problems, open or closed', async () => {
    fakeApi();
    const { events, container } = renderWithProviders(<AccountMenu user={user} />, { user });
    await expectNoA11yViolations(container);
    await events.click(screen.getByRole('button', { name: /Account menu/ }));
    await expectNoA11yViolations(container);
  });
});
