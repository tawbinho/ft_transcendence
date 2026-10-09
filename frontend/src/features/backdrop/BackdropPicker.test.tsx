import { act, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { applyBackdrop } from './backdrops';
import { BackdropPicker } from './BackdropPicker';

afterEach(() => applyBackdrop('plain'));

describe('the page background picker', () => {
  it('offers five backgrounds and starts on plain', () => {
    renderWithProviders(<BackdropPicker />);
    expect(screen.getByRole('group', { name: 'Page background' })).toBeInTheDocument();
    for (const name of ['Plain', 'Soft glow', 'Dots', 'Fine grid', 'Game board']) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('radio', { name: 'Plain' })).toBeChecked();
  });

  it('applies a background at once, with the keyboard too', async () => {
    const { events } = renderWithProviders(<BackdropPicker />);

    await events.click(screen.getByRole('radio', { name: 'Dots' }));
    expect(document.documentElement).toHaveAttribute('data-backdrop', 'dots');

    await events.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Fine grid' })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-backdrop', 'grid');

    await events.click(screen.getByRole('radio', { name: 'Plain' }));
    expect(document.documentElement).not.toHaveAttribute('data-backdrop');
  });

  it('is written in the chosen language', async () => {
    renderWithProviders(<BackdropPicker />);
    await act(() => i18n.changeLanguage('fr'));
    expect(await screen.findByRole('group', { name: 'Arrière-plan de la page' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Halo doux' })).toBeInTheDocument();
    await act(() => i18n.changeLanguage('ar'));
    expect(await screen.findByRole('group', { name: 'خلفية الصفحة' })).toBeInTheDocument();
  });

  it('has no accessibility problems', async () => {
    const { container } = renderWithProviders(<BackdropPicker />);
    await expectNoA11yViolations(container);
  });
});
