// WHY THIS FILE EXISTS
// The bridge between the app's 2D board and the 3D board. It takes exactly the
// same props as the 2D board (BoardProps) and renames them for Board3D, so
// GameBoard can swap one for the other. This is the only file of the folder
// that knows about the rest of the app; Board3D and its helpers do not.

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useResolvedTheme } from '@/lib/colorScheme';
import type { BoardProps } from '@/features/game/components/Board';
import { Board3D } from './Board3D';

// The colour of the board's stage on the page (the same token GameBoard paints it with),
// so the canvas takes the page's light or dark look.
function stageColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--c-surface-2').trim() || '#e8ecf6';
}

// lazy() in GameBoard needs a default export.
export default function Board3DView({ model, theme, onPlay, disabled, previewSeat, autoFocus, className }: BoardProps) {
  const { t } = useTranslation();
  const { cols, rows, board, lastMove, winningLine } = model;
  // Read again when the page switches between light and dark.
  const scheme = useResolvedTheme();
  const backdrop = useMemo(stageColor, [scheme]);

  return (
    <Board3D
      game={{ board, current: previewSeat, lastMove, winningLine }}
      onDrop={onPlay}
      disabled={disabled}
      theme={theme}
      backdrop={backdrop}
      label={t(onPlay ? 'board3d.labelPlay' : 'board3d.label', { cols, rows })}
      describeColumn={(col) => t('board3d.column', { n: col + 1 })}
      fallback={t('board3d.noWebgl')}
      autoFocus={autoFocus}
      // The board fills the stage GameBoard puts it in, the same box the 2D board stands in.
      // Its focus ring is drawn inside, so the box edge does not cut it.
      className={cn(
        'relative size-full overflow-hidden rounded-[calc(1rem-1px)] focus-visible:-outline-offset-3',
        className,
      )}
    />
  );
}
