/** Tells screen readers about each move and the result; nothing is shown on screen. */
export function MoveAnnouncer({ text }: { text: string }) {
  return (
    <p className="sr-only" aria-live="polite">
      {text}
    </p>
  );
}
