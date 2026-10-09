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
