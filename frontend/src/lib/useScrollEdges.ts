import { useEffect, useState, type RefObject } from 'react';

/**
 * Tells whether a sideways-scrolling element has more content hidden before
 * its start edge and after its end edge, so the page can show a fade there.
 * "Start" and "end" follow the reading direction, so Arabic works too.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): { start: boolean; end: boolean } {
  const [start, setStart] = useState(false);
  const [end, setEnd] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function update() {
      if (!element) return;
      // scrollLeft is negative in right-to-left pages, so only its size matters.
      const scrolled = Math.abs(element.scrollLeft);
      const hidden = element.scrollWidth - element.clientWidth;
      setStart(scrolled > 1);
      setEnd(scrolled < hidden - 1);
    }

    update();
    element.addEventListener('scroll', update, { passive: true });
    // The element changes size with the window, and its content with a count or a language.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(element);
    if (element.firstElementChild) observer?.observe(element.firstElementChild);
    return () => {
      element.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [ref]);

  return { start, end };
}
