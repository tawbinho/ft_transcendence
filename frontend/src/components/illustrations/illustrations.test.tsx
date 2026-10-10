import { render } from '@testing-library/react';
import { ILLUSTRATIONS } from '.';

describe('illustrations', () => {
  it('has the four pictures', () => {
    expect(Object.keys(ILLUSTRATIONS).sort()).toEqual(['board', 'chat', 'notFound', 'trophy']);
  });

  it.each(Object.entries(ILLUSTRATIONS))(
    '%s is hidden from screen readers and cannot be focused',
    (_name, Illustration) => {
      const { container } = render(<Illustration />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('focusable', 'false');
      // Nothing a screen reader could read inside it.
      expect(container.querySelector('title, desc, text')).toBeNull();
    },
  );

  it('passes a class name on, so the caller sets the size', () => {
    const { container } = render(<ILLUSTRATIONS.trophy className="h-10" />);
    expect(container.querySelector('svg')).toHaveClass('h-10');
  });
});
