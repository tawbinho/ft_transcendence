import { cn } from '@/lib/cn';
import { toBoardTheme } from '@/features/game/settings';

const CELL = 10; // one square of the drawing, in drawing units
const PADDING = 3;

/** The color of a square: the disc of the seat that holds it, or a dark hole. */
function fillOf(seat: number | undefined): string {
  if (seat === 1 || seat === 2) return `var(--disc-${seat})`;
  return 'var(--hole)';
}

/** A small picture of a board: its colour and its holes. */
export function BoardShape({
  cols,
  rows,
  theme,
  board,
  className,
}: {
  cols: number;
  rows: number;
  /** The theme name sent by the backend; an unknown name is drawn as the classic theme. */
  theme: string;
  /** board[col][row], row 0 at the bottom, 0 for an empty square (the shape of a match's `game.board`). */
  board?: readonly (readonly number[])[];
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
          style={{ fill: fillOf(board?.[i % cols]?.[rows - 1 - Math.floor(i / cols)]) }}
        />
      ))}
    </svg>
  );
}
