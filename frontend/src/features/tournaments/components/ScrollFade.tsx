import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Which physical edges of the box still have content hidden behind them. */
interface HiddenEdges {
  left: boolean;
  right: boolean;
}

/** How wide the faded strip at an edge is. */
const FADE = '2.5rem';

/** A mask that makes the box transparent at the edges that have more content behind them. */
function fadeMask({ left, right }: HiddenEdges) {
  if (!left && !right) return undefined;
  const from = left ? `transparent, #000 ${FADE}` : '#000, #000';
  const to = right ? `#000 calc(100% - ${FADE}), transparent` : '#000, #000';
  return `linear-gradient(to right, ${from}, ${to})`;
}

/**
 * A box that scrolls sideways and fades its edges while there is more to see
 * in that direction. It can take the keyboard focus, so the arrow keys scroll it.
 */
export function ScrollFade({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<HiddenEdges>({ left: false, right: false });

  const update = useCallback(() => {
    const el = box.current;
    if (!el) return;
    // scrollLeft counts from the start edge: 0 at the start, then positive (left to right) or negative (right to left).
    const fromStart = Math.abs(el.scrollLeft);
    const moreBefore = fromStart > 1;
    const moreAfter = fromStart + el.clientWidth < el.scrollWidth - 1;
    const rtl = getComputedStyle(el).direction === 'rtl';
    setHidden(rtl ? { left: moreAfter, right: moreBefore } : { left: moreBefore, right: moreAfter });
  }, []);

  // Look again when the box or its content changes size (a resized window, a new round).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [update]);

  const mask = fadeMask(hidden);
  return (
    <div
      ref={box}
      role="group"
      aria-label={label}
      tabIndex={0}
      onScroll={update}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className={cn('max-w-full overflow-x-auto', className)}
    >
      {children}
    </div>
  );
}
