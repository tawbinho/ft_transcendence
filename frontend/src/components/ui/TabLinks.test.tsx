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

  it('fades the edge that hides more tabs', () => {
    // jsdom has no layout, so say that the row is 300 px wide but holds 500 px of tabs.
    const sizes = { scrollWidth: 500, clientWidth: 300 };
    for (const [name, value] of Object.entries(sizes)) {
      vi.spyOn(HTMLElement.prototype, name as keyof typeof sizes, 'get').mockReturnValue(value);
    }
    renderWithProviders(<TabLinks label="Sections" tabs={tabs} />);

    // Not scrolled yet: only the end side has more to show.
    expect(screen.getByRole('navigation')).toHaveClass('[--fade-end:2.5rem]');
    expect(screen.getByRole('navigation')).not.toHaveClass('[--fade-start:2.5rem]');
    vi.restoreAllMocks();
  });
});
