// WHY THIS FILE EXISTS
// The bridge between the app's 2D board and the 3D board. It takes exactly the
// same props as the 2D board (BoardProps) and renames them for Board3D, so
// GameBoard can swap one for the other. This is the only file of the folder
// that knows about the rest of the app; Board3D and its helpers do not.

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { BoardProps } from '@/features/game/components/Board';
import { Board3D } from './Board3D';

// lazy() in GameBoard needs a default export.
export default function Board3DView({ model, theme, onPlay, disabled, previewSeat, autoFocus, className }: BoardProps) {
  const { t } = useTranslation();
  const { cols, rows, board, lastMove, winningLine } = model;

  return (
    <Board3D
      game={{ board, current: previewSeat, lastMove, winningLine }}
      onDrop={onPlay}
      disabled={disabled}
      theme={theme}
      label={t(onPlay ? 'board3d.labelPlay' : 'board3d.label', { cols, rows })}
      describeColumn={(col) => t('board3d.column', { n: col + 1 })}
      fallback={t('board3d.noWebgl')}
      autoFocus={autoFocus}
      className={cn('relative aspect-[4/3] max-h-[70vh] w-full rounded-xl', className)}
    />
  );
}
