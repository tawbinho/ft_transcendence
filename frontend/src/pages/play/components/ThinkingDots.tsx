import './thinkingDots.css';

/** Three bouncing dots after "The computer is thinking". Decoration only: the words carry the meaning. */
export function ThinkingDots() {
  return (
    <span className="thinking-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
