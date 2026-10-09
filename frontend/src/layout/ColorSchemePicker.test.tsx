import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { ColorSchemePicker } from './ColorSchemePicker';

describe('the appearance picker', () => {
  it('follows the system until the member chooses', () => {
    renderWithProviders(<ColorSchemePicker />);
    expect(screen.getByRole('group', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
  });

  it('applies the chosen theme at once and remembers it', async () => {
    const { events, container } = renderWithProviders(<ColorSchemePicker />);

    await events.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('color-scheme')).toBe('dark');
    await expectNoA11yViolations(container);
  });
});
