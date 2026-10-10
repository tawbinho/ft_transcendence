import { act, renderHook, render, screen } from '@testing-library/react';
import { Celebration } from './Celebration';
import { useJustWon } from './useJustWon';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Celebration', () => {
  it('draws confetti that screen readers skip', () => {
    render(<Celebration theme="classic" />);

    const confetti = screen.getByTestId('celebration');
    expect(confetti).toHaveAttribute('aria-hidden', 'true');
    expect(confetti.children.length).toBeGreaterThan(10);
  });

  it('goes away by itself after a few seconds', () => {
    vi.useFakeTimers();
    render(<Celebration theme="classic" />);

    act(() => vi.advanceTimersByTime(5000));

    expect(screen.queryByTestId('celebration')).not.toBeInTheDocument();
  });

  it('draws nothing when the system asks for less motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    render(<Celebration theme="classic" />);

    expect(screen.queryByTestId('celebration')).not.toBeInTheDocument();
  });
});

describe('useJustWon', () => {
  it('turns on when a game is won while the page is open', () => {
    const { result, rerender } = renderHook(({ won }) => useJustWon(won), { initialProps: { won: false } });
    expect(result.current).toBe(false);

    rerender({ won: true });
    expect(result.current).toBe(true);

    rerender({ won: false });
    expect(result.current).toBe(false);
  });

  it('stays off for a game that was already won when the page opened', () => {
    const { result, rerender } = renderHook(({ won }) => useJustWon(won), { initialProps: { won: true } });
    expect(result.current).toBe(false);

    // A later game on the same page is celebrated again.
    rerender({ won: false });
    rerender({ won: true });
    expect(result.current).toBe(true);
  });
});
