import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ScrollFade } from './ScrollFade';

describe('ScrollFade', () => {
  it('is a named group that takes the keyboard focus, so the arrow keys scroll it', () => {
    renderWithProviders(
      <ScrollFade label="Bracket">
        <p>Round 1</p>
      </ScrollFade>,
    );

    const box = screen.getByRole('group', { name: 'Bracket' });
    expect(box).toHaveAttribute('tabindex', '0');
    expect(box).toHaveTextContent('Round 1');
  });

  it('shows no fade while everything fits (jsdom has no layout)', () => {
    renderWithProviders(
      <ScrollFade label="Bracket">
        <p>Round 1</p>
      </ScrollFade>,
    );

    expect(screen.getByRole('group').className).not.toContain('--fade-');
  });
});
