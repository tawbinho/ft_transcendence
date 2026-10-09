import { screen } from '@testing-library/react';
import { getColorScheme, setColorScheme } from '@/lib/colorScheme';
import { renderWithProviders } from '@/test/render';
import { ThemeToggle } from './ThemeToggle';

describe('the theme button', () => {
  it('switches to dark and back, and remembers the choice', async () => {
    setColorScheme('light');
    const { events } = renderWithProviders(<ThemeToggle />);

    await events.click(screen.getByRole('button', { name: 'Switch to the dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(getColorScheme()).toBe('dark');

    await events.click(screen.getByRole('button', { name: 'Switch to the light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(getColorScheme()).toBe('light');
  });
});
