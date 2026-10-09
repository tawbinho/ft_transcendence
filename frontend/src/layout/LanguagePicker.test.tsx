import { screen } from '@testing-library/react';
import i18n from '@/i18n';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { LanguagePicker } from './LanguagePicker';

describe('the language picker', () => {
  it('shows each language in its own name and marks the current one', () => {
    renderWithProviders(<LanguagePicker />);
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Français' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'العربية' })).not.toBeChecked();
  });

  it('changes the language and the page direction, and remembers the choice', async () => {
    const { events, container } = renderWithProviders(<LanguagePicker />);

    await events.click(screen.getByRole('radio', { name: 'العربية' }));

    expect(i18n.language).toBe('ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(window.localStorage.getItem('language')).toBe('ar');
    expect(screen.getByRole('radio', { name: 'العربية' })).toBeChecked();
    await expectNoA11yViolations(container);
  });
});
