import { renderWithProviders } from '@/test/render';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from screen readers, which hear the loading text instead', () => {
    const { container } = renderWithProviders(<Skeleton className="h-4 w-24" />);

    const block = container.firstElementChild;
    expect(block).toHaveAttribute('aria-hidden', 'true');
    expect(block).toHaveClass('h-4', 'w-24', 'animate-pulse');
    expect(block).toBeEmptyDOMElement();
  });
});
