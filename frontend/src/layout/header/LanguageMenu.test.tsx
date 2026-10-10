import { screen } from '@testing-library/react';
import i18n from '@/i18n';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { LanguageMenu } from './LanguageMenu';

const openButton = () => screen.getByRole('button', { name: 'Language: English' });

describe('the language menu', () => {
  it('is closed at first and opens with the keyboard', async () => {
    const { events } = renderWithProviders(<LanguageMenu />);
    expect(openButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Français' })).not.toBeInTheDocument();

    await events.tab();
    expect(openButton()).toHaveFocus();
    await events.keyboard('{Enter}');

    expect(openButton()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Français' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'العربية' })).toBeInTheDocument();
  });

  it('lets Tab reach each language in turn', async () => {
    const { events } = renderWithProviders(<LanguageMenu />);
    await events.click(openButton());

    await events.tab();
    expect(screen.getByRole('button', { name: 'English' })).toHaveFocus();
    await events.tab();
    expect(screen.getByRole('button', { name: 'Français' })).toHaveFocus();
    await events.tab();
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveFocus();
  });

  it('changes the language, closes and gives the focus back to the button', async () => {
    const { events } = renderWithProviders(<LanguageMenu />);
    await events.click(openButton());

    await events.click(screen.getByRole('button', { name: 'Français' }));

    expect(i18n.language).toBe('fr');
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
    const button = screen.getByRole('button', { name: 'Langue: Français' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('turns the page right to left for Arabic', async () => {
    const { events } = renderWithProviders(<LanguageMenu />);
    await events.click(openButton());

    await events.click(screen.getByRole('button', { name: 'العربية' }));

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('closes on Escape and gives the focus back to the button', async () => {
    const { events } = renderWithProviders(<LanguageMenu />);
    await events.click(openButton());
    await events.tab();

    await events.keyboard('{Escape}');

    expect(openButton()).toHaveAttribute('aria-expanded', 'false');
    expect(openButton()).toHaveFocus();
  });

  it('closes on a click outside', async () => {
    const { events } = renderWithProviders(<LanguageMenu />);
    await events.click(openButton());

    await events.click(document.body);

    expect(openButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no accessibility problems, open or closed', async () => {
    const { container, events } = renderWithProviders(<LanguageMenu />);
    await expectNoA11yViolations(container);
    await events.click(openButton());
    await expectNoA11yViolations(container);
  });
});
