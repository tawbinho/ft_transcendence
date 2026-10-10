import { useEffect, type RefObject } from 'react';

/**
 * Closes an open menu on Escape (and puts the focus back on the button that
 * opened it, the element with `aria-expanded`), on a click outside it, and when
 * the focus moves outside it. `root` holds both the button and the menu.
 */
export function useDismiss(open: boolean, root: RefObject<HTMLElement | null>, close: () => void): void {
  useEffect(() => {
    if (!open) return;
    const isOutside = (target: EventTarget | null) => !root.current?.contains(target as Node);
    const onPointerDown = (event: PointerEvent) => {
      if (isOutside(event.target)) close();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isOutside(event.target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      root.current?.querySelector<HTMLElement>('[aria-expanded]')?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, root, close]);
}
