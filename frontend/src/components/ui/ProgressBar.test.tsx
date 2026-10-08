import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('reports its value, range and label', async () => {
    const { container } = renderWithProviders(<ProgressBar value={30} max={50} label="Wins to the next level" />);

    const bar = screen.getByRole('progressbar', { name: 'Wins to the next level' });
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '50');
    expect(bar.firstElementChild).toHaveStyle({ width: '60%' });
    await expectNoA11yViolations(container);
  });

  it('counts out of 100 by default', () => {
    renderWithProviders(<ProgressBar value={25} label="Progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });

  it.each([
    [-5, 0],
    [80, 50],
  ])('keeps %s inside the range', (value, shown) => {
    renderWithProviders(<ProgressBar value={value} max={50} label="Progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(shown));
  });

  it('shows an empty bar when the range is empty', () => {
    renderWithProviders(<ProgressBar value={0} max={0} label="Progress" />);
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '0%' });
  });
});
