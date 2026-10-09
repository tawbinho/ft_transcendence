import { screen, within } from '@testing-library/react';
import { Link } from 'react-router';
import type { Session } from '@/features/auth/session';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { renderWithProviders } from '@/test/render';
import { makeUser } from '@/test/fixtures/users';
import { MobileMenu } from './MobileMenu';

const member: Session = { status: 'member', user: makeUser() };
const visitor: Session = { status: 'visitor' };
const noCounts = { chat: 0, friends: 0 };

function renderMenu(session: Session, counts = noCounts) {
  fakeApi();
  const user = session.status === 'member' ? session.user : null;
  return renderWithProviders(
    <>
      <MobileMenu session={session} counts={counts} onRetry={() => {}} retrying={false} />
      <Link to="/elsewhere">Elsewhere</Link>
    </>,
    { user },
  );
}

const openMenu = (events: ReturnType<typeof renderMenu>['events']) =>
  events.click(screen.getByRole('button', { name: /Open menu/ }));

describe('the phone menu for a member', () => {
  it('is closed until the button is pressed', () => {
    renderMenu(member);
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Play' })).not.toBeInTheDocument();
  });

  it('groups the links under Play, Community and You', async () => {
    const { events } = renderMenu(member);
    await openMenu(events);

    const links = (group: string) =>
      within(screen.getByRole('group', { name: group }))
        .getAllByRole('link')
        .map((link) => link.textContent);
    expect(links('Play')).toEqual(['Play', 'Tournaments', 'Watch']);
    expect(links('Community')).toEqual(['Players', 'Friends', 'Chat']);
    expect(links('You')).toEqual(['My profile', 'History', 'Settings']);
    expect(
      within(screen.getByRole('group', { name: 'You' })).getByRole('button', { name: 'Log out' }),
    ).toBeInTheDocument();
  });

  it('ends with the language and appearance choices', async () => {
    const { events } = renderMenu(member);
    await openMenu(events);
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Appearance' })).toBeInTheDocument();
  });

  it('shows the counts next to Friends and Chat', async () => {
    const { events } = renderMenu(member, { chat: 3, friends: 1 });
    await openMenu(events);
    const community = within(screen.getByRole('group', { name: 'Community' }));
    expect(community.getByRole('link', { name: /^Friends ?, new: 1$/ })).toBeInTheDocument();
    expect(community.getByRole('link', { name: /^Chat ?, new: 3$/ })).toBeInTheDocument();
  });

  it('closes on Escape and gives the focus back to the button', async () => {
    const { events } = renderMenu(member);
    await openMenu(events);
    await events.tab();

    await events.keyboard('{Escape}');

    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('closes when the person goes to another page', async () => {
    const { events, queryByRole, container } = renderMenu(member);
    await openMenu(events);
    await events.click(within(screen.getByRole('group', { name: 'Play' })).getByRole('link', { name: 'Watch' }));
    expect(queryByRole('group', { name: 'Play' })).not.toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it('has no accessibility problems when open', async () => {
    const { events, container } = renderMenu(member, { chat: 2, friends: 0 });
    await openMenu(events);
    await expectNoA11yViolations(container);
  });
});

describe('the phone menu for a visitor', () => {
  it('shows the public links and Log in and Sign up', async () => {
    const { events } = renderMenu(visitor);
    await openMenu(events);

    expect(screen.getByRole('link', { name: 'Watch' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Players' })).toBeInTheDocument();
    const you = within(screen.getByRole('group', { name: 'You' }));
    expect(you.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(you.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
    expect(screen.queryByRole('link', { name: 'Chat' })).not.toBeInTheDocument();
  });
});
