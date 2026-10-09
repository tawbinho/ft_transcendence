import { Board } from '@/features/game/components/Board';
import { replay } from '@/features/game/engine';

// A game in progress for the picture next to the login and signup forms.
const PICTURE = replay({}, [3, 3, 2, 4, 2, 2, 4, 1, 3, 5]);

/** A board with a few discs, only to decorate the auth pages (nobody can play on it). */
export function AuthBoard({ className }: { className?: string }) {
  return (
    <Board
      theme="classic"
      className={className}
      model={{
        cols: PICTURE.settings.cols,
        rows: PICTURE.settings.rows,
        board: PICTURE.board,
        lastMove: PICTURE.lastMove,
        winningLine: PICTURE.winningLine,
      }}
    />
  );
}
