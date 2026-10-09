import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows its text, a picture and the next step', async () => {
    const { container } = renderWithProviders(
      <EmptyState action={<Button>Start a match</Button>}>No match yet.</EmptyState>,
    );

    expect(screen.getByText('No match yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start a match' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });

  it('draws the empty board by default and another picture when asked', () => {
    const board = renderWithProviders(<EmptyState>Nothing.</EmptyState>);
    const boardDrawing = board.container.querySelector('svg')?.innerHTML;
    board.unmount();

    const trophy = renderWithProviders(<EmptyState illustration="trophy">Nothing.</EmptyState>);
    const trophyDrawing = trophy.container.querySelector('svg')?.innerHTML;

    expect(boardDrawing).toBeTruthy();
    expect(trophyDrawing).toBeTruthy();
    expect(trophyDrawing).not.toEqual(boardDrawing);
  });

  it('shows no picture with illustration={null}', () => {
    const { container } = renderWithProviders(<EmptyState illustration={null}>Nothing.</EmptyState>);
    expect(container.querySelector('svg')).toBeNull();
  });
});
