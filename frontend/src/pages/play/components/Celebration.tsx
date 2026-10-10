import { useEffect, useState, type CSSProperties } from 'react';
import type { BoardTheme } from '@/features/game/settings';
import './celebration.css';

const PIECES = 36;
const SHOW_MS = 4500;

/** People who asked their system for less motion get no confetti at all. */
function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A short burst of confetti in the colors of the board, shown over the page
 * for a few seconds. It is decoration: hidden from screen readers and it
 * never catches clicks. The pieces are spread by simple arithmetic on their
 * number, so every burst looks the same and nothing is random.
 */
export function Celebration({ theme }: { theme: BoardTheme }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), SHOW_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || prefersReducedMotion()) return null;

  return (
    <div className="celebration" data-board-theme={theme} aria-hidden="true" data-testid="celebration">
      {Array.from({ length: PIECES }, (_, i) => (
        <span
          key={i}
          className={`confetti confetti-${i % 5}`}
          style={
            {
              '--x': `${(i * 37) % 100}vw`,
              '--drift': `${((i * 53) % 120) - 60}px`,
              '--delay': `${(i % 9) * 70}ms`,
              '--time': `${2200 + (i % 5) * 350}ms`,
              '--turn': `${(i % 2 ? 1 : -1) * (360 + (i % 4) * 180)}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
