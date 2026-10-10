import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { AccentPicker } from './AccentPicker';

afterEach(() => {
  delete document.documentElement.dataset.accent;
});

describe('AccentPicker', () => {
  it('is a group of radio buttons with blue selected', async () => {
    const { container } = renderWithProviders(<AccentPicker />);

    expect(screen.getByRole('group', { name: 'Accent color' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('changes the accent of the whole page and keeps it', async () => {
    const { events } = renderWithProviders(<AccentPicker />);

    await events.click(screen.getByText('Teal'));

    expect(screen.getByRole('radio', { name: 'Teal' })).toBeChecked();
    expect(document.documentElement.dataset.accent).toBe('teal');
    expect(window.localStorage.getItem('accent')).toBe('teal');
  });
});
