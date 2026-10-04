import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameState } from '@cf/engine';

interface BoardProps {
  game: GameState;
  /** Provide to make the board interactive; omit for a read-only/decorative board. */
  onDrop?: (col: number) => void;
  disabled?: boolean;
}

export function Board({ game, onDrop, disabled = false }: BoardProps) {
  const { t } = useTranslation();
  const interactive = Boolean(onDrop);
  const columnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const winning = new Set((game.winningLine ?? []).map((c) => `${c.col}-${c.row}`));
  const columnFull = (col: number) => game.board[col]![game.rows - 1] !== 0;
  const playable = (col: number) =>
    interactive && !disabled && game.status === 'playing' && !columnFull(col);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!interactive) return;
    const current = columnRefs.current.findIndex((b) => b === document.activeElement);
    if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowRight') next = Math.min(game.cols - 1, current + 1);
    else if (event.key === 'ArrowLeft') next = Math.max(0, current - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = game.cols - 1;
    else return;
    event.preventDefault();
    columnRefs.current[next]?.focus();
  }

  const cells = (col: number) =>
    Array.from({ length: game.rows }).map((_, row) => {
      const cell = game.board[col]![row];
      const isWin = winning.has(`${col}-${row}`);
      const isLast = game.lastMove?.col === col && game.lastMove?.row === row;
      return (
        <span
          key={row}
          className="aspect-square rounded-full bg-well shadow-[inset_4px_4px_8px_#b3a6e8,inset_-4px_-4px_8px_#ffffff]"
        >
          {cell !== 0 && (
            <span
              className={`block h-full w-full rounded-full ${isLast ? 'disc-drop' : ''} ${isWin ? 'ring-4 ring-white' : ''}`}
              style={{
                background:
                  cell === 1
                    ? 'radial-gradient(circle at 34% 28%, #ff9a8f, var(--disc1))'
                    : 'radial-gradient(circle at 34% 28%, #ffe08a, var(--disc2))',
              }}
            />
          )}
        </span>
      );
    });

  const columnClass = 'flex flex-col-reverse gap-1.5 rounded-2xl p-1 sm:gap-2';

  return (
    <div
      className="rounded-toy bg-gradient-to-b from-[#b9a9ff] to-[#9f8cf5] p-2.5 shadow-clay sm:p-3.5"
      role={interactive ? undefined : 'img'}
      aria-label={interactive ? undefined : 'Connect Four board'}
      onKeyDown={handleKeyDown}
    >
      <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${game.cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: game.cols }).map((_, col) =>
          interactive ? (
            <button
              key={col}
              ref={(el) => {
                columnRefs.current[col] = el;
              }}
              type="button"
              disabled={!playable(col)}
              onClick={() => onDrop?.(col)}
              aria-label={t('game.drop', { n: col + 1 })}
              className={`${columnClass} ${playable(col) ? 'hover:bg-white/15 focus-visible:bg-white/20' : 'cursor-not-allowed'}`}
            >
              {cells(col)}
            </button>
          ) : (
            <div key={col} className={columnClass}>
              {cells(col)}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
