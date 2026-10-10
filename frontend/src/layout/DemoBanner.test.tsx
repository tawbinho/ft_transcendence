import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { DemoBanner } from './DemoBanner';

// The test setup turns every demo feature on, so the banner is shown.
describe('the demo banner', () => {
  it('is one line, with the details hidden', () => {
    renderWithProviders(<DemoBanner />);
    expect(screen.getByText('Demo data in this browser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/made-up players/)).not.toBeVisible();
  });

  it('shows which parts use demo data under Details', async () => {
    const { events } = renderWithProviders(<DemoBanner />);
    await events.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/made-up players/)).toBeVisible();
  });

  it('asks before resetting the demo data', async () => {
    const { events } = renderWithProviders(<DemoBanner />);
    await events.click(screen.getByRole('button', { name: 'Reset demo' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Reset the demo data?');
    await events.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no accessibility problems', async () => {
    const { container } = renderWithProviders(<DemoBanner />);
    await expectNoA11yViolations(container);
  });
});
