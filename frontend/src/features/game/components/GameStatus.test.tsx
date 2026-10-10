import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { GameStatus } from './GameStatus';

describe('GameStatus', () => {
  it('shows the text and an optional detail line', () => {
    renderWithProviders(
      <GameStatus tone="loss" detail="by resignation">
        You lost.
      </GameStatus>,
    );

    expect(screen.getByText('You lost.')).toBeInTheDocument();
    expect(screen.getByText('by resignation')).toBeInTheDocument();
  });

  it('has no detail line without a detail', () => {
    const { container } = renderWithProviders(<GameStatus tone="none">Your turn</GameStatus>);
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it.each([
    ['win', 'bg-success-soft'],
    ['loss', 'bg-danger-soft'],
    ['draw', 'bg-surface-2'],
    ['over', 'bg-surface-2'],
  ] as const)('colors the banner for "%s"', (tone, color) => {
    const { container } = renderWithProviders(<GameStatus tone={tone}>Done</GameStatus>);
    expect(container.firstElementChild).toHaveClass(color);
  });

  it('has no background while the game goes on', () => {
    const { container } = renderWithProviders(<GameStatus tone="none">Your turn</GameStatus>);
    expect(container.firstElementChild?.className).not.toMatch(/bg-/);
  });
});
