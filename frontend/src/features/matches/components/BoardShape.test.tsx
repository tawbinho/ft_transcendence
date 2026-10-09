import { render } from '@testing-library/react';
import { BoardShape } from './BoardShape';

describe('BoardShape', () => {
  it('draws one hole for each square of the board', () => {
    const { container } = render(<BoardShape cols={7} rows={6} theme="classic" />);
    expect(container.querySelectorAll('circle')).toHaveLength(42);
  });

  it('follows the size of the board', () => {
    const { container } = render(<BoardShape cols={5} rows={4} theme="classic" />);
    expect(container.querySelectorAll('circle')).toHaveLength(20);
  });

  it('draws the discs of a position, row 0 at the bottom', () => {
    // Seat 1 in the bottom-left corner, seat 2 on top of it.
    const board = [[1, 2, 0, 0], ...Array.from({ length: 4 }, () => [0, 0, 0, 0])];
    const { container } = render(<BoardShape cols={5} rows={4} theme="classic" board={board} />);
    const fills = [...container.querySelectorAll('circle')].map((circle) => circle.style.fill);
    expect(fills[15]).toBe('var(--disc-1)'); // bottom row, first column
    expect(fills[10]).toBe('var(--disc-2)'); // one row above
    expect(fills.filter((fill) => fill === 'var(--hole)')).toHaveLength(18);
  });

  it('wears the theme of the match', () => {
    const { container } = render(<BoardShape cols={7} rows={6} theme="ocean" />);
    expect(container.querySelector('svg')).toHaveAttribute('data-board-theme', 'ocean');
  });

  it('falls back to the classic theme for an unknown name', () => {
    const { container } = render(<BoardShape cols={7} rows={6} theme="neon" />);
    expect(container.querySelector('svg')).toHaveAttribute('data-board-theme', 'classic');
  });

  it('is hidden from screen readers, the text beside it says the size', () => {
    const { container } = render(<BoardShape cols={7} rows={6} theme="classic" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
