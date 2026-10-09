import { cn } from '@/lib/cn';
import { toBoardTheme } from '@/features/game/settings';

const CELL = 10; // one square of the drawing, in drawing units
const PADDING = 3;

/**
 * A small picture of a board: its colour and its holes, no discs. The lists
 * only know a match's size and theme (not its positions), so this is what they
 * can show for it. Decorative: the text next to it names the size.
 */
export function BoardShape({
  cols,
  rows,
  theme,
  className,
}: {
  cols: number;
  rows: number;
  /** The theme name sent by the backend; an unknown name is drawn as the classic theme. */
  theme: string;
  className?: string;
}) {
  const width = cols * CELL + PADDING * 2;
  const height = rows * CELL + PADDING * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      data-board-theme={toBoardTheme(theme)}
      aria-hidden="true"
      focusable="false"
      className={cn('h-10 w-auto flex-none', className)}
    >
      <rect width={width} height={height} rx={4} style={{ fill: 'var(--board)' }} />
      {Array.from({ length: cols * rows }, (_, i) => (
        <circle
          key={i}
          cx={PADDING + (i % cols) * CELL + CELL / 2}
          cy={PADDING + Math.floor(i / cols) * CELL + CELL / 2}
          r={CELL * 0.36}
          style={{ fill: 'var(--hole)' }}
        />
      ))}
    </svg>
  );
}
