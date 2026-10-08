import { screen, within } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { TabLinks } from './TabLinks';

const tabs = [
  { to: '/settings', label: 'Profile', end: true },
  { to: '/settings/security', label: 'Security' },
  { to: '/settings/blocked', label: 'Blocked', count: 3 },
];

describe('TabLinks', () => {
  it('is a navigation with one link per tab', async () => {
    const { container } = renderWithProviders(<TabLinks label="Settings sections" tabs={tabs} />, {
      route: '/settings',
    });

    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/settings', '/settings/security', '/settings/blocked']);
    await expectNoA11yViolations(container);
  });

  it('marks the current page with aria-current', () => {
    renderWithProviders(<TabLinks label="Sections" tabs={tabs} />, { route: '/settings/security' });

    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current');
  });

  it('with "end", the first tab is not current on the pages below it', () => {
    renderWithProviders(<TabLinks label="Sections" tabs={tabs} />, { route: '/settings/blocked' });
    expect(screen.getByRole('link', { name: /Profile/ })).not.toHaveAttribute('aria-current');
  });

  it('shows a count only when it is above zero', () => {
    renderWithProviders(
      <TabLinks
        label="Sections"
        tabs={[
          { to: '/a', label: 'Requests', count: 3 },
          { to: '/b', label: 'Sent', count: 0 },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Requests 3' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sent' })).toBeInTheDocument();
  });

  it('scrolls inside itself instead of widening the page', () => {
    renderWithProviders(<TabLinks label="Sections" tabs={tabs} />);
    expect(screen.getByRole('navigation')).toHaveClass('overflow-x-auto', 'max-w-full');
  });
});
