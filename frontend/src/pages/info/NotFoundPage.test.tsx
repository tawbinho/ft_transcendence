import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderRoute } from '@/test/render';

describe('not found page', () => {
  it('opens for an address that does not exist, with links home and to Play', async () => {
    renderRoute('/no/such/page', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the home page' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Play a game' })).toHaveAttribute('href', '/play');
  });

  it('hides its picture from screen readers and has no accessibility problems', async () => {
    const { container } = renderRoute('/no/such/page', { user: null });
    await screen.findByRole('heading', { level: 1 });

    const main = container.querySelector('main') ?? container;
    expect(main.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    await expectNoA11yViolations(container);
  });
});
