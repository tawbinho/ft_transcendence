import { useLayoutEffect, useRef, type UIEvent } from 'react';

/** Closer than this to the bottom, new messages keep the view scrolled down. */
const STICK_TO_BOTTOM_PX = 80;

/**
 * Scrolling of the message list:
 * - a new message scrolls into view if the reader was at the bottom (or wrote it);
 * - older messages loaded at the top keep the view where it was.
 *
 * Put `scroller` and `onScroll` on the scrolling element and call
 * `rememberPosition()` just before asking for older messages.
 */
export function useChatScroll({
  firstId,
  lastId,
  lastIsMine,
  typing,
}: {
  firstId: string | undefined;
  lastId: string | undefined;
  lastIsMine: boolean;
  typing: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const distanceFromBottom = useRef<number | null>(null);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (element && (atBottom.current || lastIsMine)) element.scrollTop = element.scrollHeight;
  }, [lastId, lastIsMine, typing]);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element || distanceFromBottom.current === null) return;
    element.scrollTop = element.scrollHeight - distanceFromBottom.current;
    distanceFromBottom.current = null;
  }, [firstId]);

  function onScroll(event: UIEvent<HTMLElement>) {
    const element = event.currentTarget;
    atBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < STICK_TO_BOTTOM_PX;
  }

  function rememberPosition() {
    const element = scroller.current;
    if (element) distanceFromBottom.current = element.scrollHeight - element.scrollTop;
  }

  return { scroller, onScroll, rememberPosition };
}
