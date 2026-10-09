import { Board } from '@/features/game/components/Board';
import { replay } from '@/features/game/engine';

// A game in progress for the picture next to the login and signup forms.
const PICTURE = replay({}, [3, 3, 2, 4, 2, 2, 4, 1, 3, 5]);

/**
 * A board with a few discs, only to decorate the auth pages (nobody can play on it).
 * The board is as wide as its parent (up to a limit set by the board itself), so size it
 * with the parent, not with a class on the board.
 */
export function AuthBoard() {
  return (
    <Board
      theme="classic"
      model={{
        cols: PICTURE.settings.cols,
        rows: PICTURE.settings.rows,
        board: PICTURE.board,
        // No last move: it would play the falling animation, and a picture should stand still.
        lastMove: null,
        winningLine: PICTURE.winningLine,
      }}
    />
  );
}
