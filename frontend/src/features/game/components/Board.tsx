import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { Position, Seat } from '../engine';
import type { BoardTheme } from '../settings';

/** Everything the board needs to draw a position, local or online. */
export interface BoardModel {
  cols: number;
  rows: number;
  /** board[col][row], row 0 at the bottom; 0 = empty, 1 or 2 = a disc. */
  board: readonly (readonly number[])[];
  lastMove: Position | null;
  winningLine: readonly Position[] | null;
}

interface BoardProps {
  model: BoardModel;
  theme: BoardTheme;
  /** Called with the chosen column. Without it the board is a picture. */
  onPlay?: (col: number) => void;
  /** Blocks input (not your turn, game over, request in flight). */
  disabled?: boolean;
  /** Whose disc to preview above the hovered column. */
  previewSeat?: Seat | null;
  className?: string;
}

const key = (col: number, row: number) => `${col}:${row}`;

export function Board({ model, theme, onPlay, disabled = false, previewSeat = null, className }: BoardProps) {
  const { t } = useTranslation();
  const { cols, rows, board, lastMove, winningLine } = model;
  const interactive = Boolean(onPlay);
  const winning = new Set((winningLine ?? []).map(({ col, row }) => key(col, row)));

  const isFull = (col: number) => board[col]?.[rows - 1] !== 0;
  const canPlay = (col: number) => interactive && !disabled && !isFull(col);

  // Roving focus: only one column is in the tab order, arrows move between them.
  const [focusCol, setFocusCol] = useState(() => Math.floor((cols - 1) / 2));
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const activeCol = Math.min(focusCol, cols - 1);

  function moveFocus(col: number) {
    const next = Math.max(0, Math.min(cols - 1, col));
    setFocusCol(next);
    buttons.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowLeft: activeCol - 1,
      ArrowRight: activeCol + 1,
      Home: 0,
      End: cols - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    moveFocus(next);
  }

  const previewCol = hoverCol ?? null;
  const style = { '--cols': cols, '--rows': rows } as CSSProperties;

  const renderColumn = (col: number) =>
    Array.from({ length: rows }, (_, i) => {
      const row = rows - 1 - i; // top of the board first
      const cell = board[col]?.[row] ?? 0;
      const isLast = lastMove?.col === col && lastMove.row === row;
      return (
        <span key={row} className="board-cell">
          {cell !== 0 && (
            <span
              className={cn(
                'disc',
                cell === 1 ? 'disc-1' : 'disc-2',
                isLast && 'disc-drop',
                winning.has(key(col, row)) && 'disc-win',
              )}
              style={{ '--fall': rows - row } as CSSProperties}
            />
          )}
        </span>
      );
    });

  return (
    <div
      className={cn('board-frame', className)}
      data-board-theme={theme}
      style={style}
      // Column 0 is on the left for both players, whatever their language.
      dir="ltr"
    >
      {interactive && (
        <div className="board-preview" aria-hidden="true">
          {Array.from({ length: cols }, (_, col) => (
            <span key={col} className="board-preview-slot">
              {previewSeat && previewCol === col && canPlay(col) && (
                <span className={cn('disc disc-ghost', previewSeat === 1 ? 'disc-1' : 'disc-2')} />
              )}
            </span>
          ))}
        </div>
      )}

      {interactive ? (
        <div
          role="group"
          aria-label={t('game.boardLabel', { cols, rows })}
          className="board-grid"
          onKeyDown={onKeyDown}
          onMouseLeave={() => setHoverCol(null)}
        >
          {Array.from({ length: cols }, (_, col) => (
            <button
              key={col}
              ref={(element) => {
                buttons.current[col] = element;
              }}
              type="button"
              tabIndex={col === activeCol ? 0 : -1}
              aria-disabled={!canPlay(col)}
              aria-label={isFull(col) ? t('game.columnFull', { n: col + 1 }) : t('game.dropIn', { n: col + 1 })}
              className={cn('board-column', canPlay(col) && 'board-column-playable')}
              onClick={() => canPlay(col) && onPlay?.(col)}
              onFocus={() => setFocusCol(col)}
              onMouseEnter={() => setHoverCol(col)}
            >
              {renderColumn(col)}
            </button>
          ))}
        </div>
      ) : (
        <div role="img" aria-label={t('game.boardLabel', { cols, rows })} className="board-grid">
          {Array.from({ length: cols }, (_, col) => (
            <div key={col} className="board-column">
              {renderColumn(col)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
