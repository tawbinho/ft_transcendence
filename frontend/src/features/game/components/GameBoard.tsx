import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { readStorage, writeStorage } from '@/lib/storage';
import { Board, type BoardProps } from './Board';
import './boardStage.css';

// The only link to the optional 3D board (src/features/board3d). It is loaded
// lazily, so the 3D code is downloaded only when a game opens it, and not at
// all when the app is built with VITE_BOARD_3D=off. To remove the 3D board,
// delete that folder and make this line `= null;` (see its README).
const Board3D: React.ComponentType<BoardProps> | null =
  import.meta.env.VITE_BOARD_3D !== 'off' ? React.lazy(() => import('@/features/board3d/Board3DView')) : null;

type View = '2d' | '3d';
const STORAGE_KEY = 'board-view';

// Set when the 3D board crashed: no toggle for the rest of the visit.
let board3dFailed = false;

// The 3D board needs WebGL 2. Creating a context is what proves it works, but a
// browser without a graphics card may print a console warning when it is asked
// to, so this is only called when someone actually wants 3D.
function hasWebGL2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

/** Shows the 2D board if loading or drawing the 3D board fails, so the game can always be played. */
class Board3DBoundary extends React.Component<
  { fallback: React.ReactNode; onError: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    this.props.onError();
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Every game screen draws its board through this component, so how boards are
 * drawn can change in one place. It shows the 2D board, and a 2D/3D switch
 * when the 3D board is built in and this browser can draw it.
 */
export function GameBoard(props: BoardProps) {
  const { t } = useTranslation();
  // The switch needs the 3D board in the build and a browser that knows WebGL 2 at all
  // (jsdom, the tests' browser, does not).
  const [available, setAvailable] = React.useState(
    () => Board3D !== null && !board3dFailed && 'WebGL2RenderingContext' in window,
  );
  const [view, setView] = React.useState<View>(() =>
    available && readStorage(STORAGE_KEY) === '3d' && hasWebGL2() ? '3d' : '2d',
  );

  // Both boards stand in the same box (boardStage.css), so switching between them moves nothing.
  const stage = (board: React.ReactNode) => (
    <div
      className="board-stage"
      style={{ '--cols': props.model.cols, '--rows': props.model.rows } as React.CSSProperties}
    >
      {board}
    </div>
  );

  const flat = <Board {...props} />;
  if (!available || !Board3D) return stage(flat);

  function choose(next: View) {
    if (next === '3d' && !hasWebGL2()) {
      setAvailable(false); // this browser cannot draw it: no switch for the rest of the visit
      return;
    }
    setView(next);
    writeStorage(STORAGE_KEY, next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={t('board3d.viewLabel')} className="flex justify-end gap-1">
        {(['2d', '3d'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={view === option}
            onClick={() => choose(option)}
            className={cn(
              'h-8 min-w-12 rounded-lg border border-border px-3 text-sm font-semibold transition',
              view === option ? 'bg-primary text-primary-fg' : 'bg-surface text-muted hover:bg-surface-2',
            )}
          >
            {t(`board3d.view${option}`)}
          </button>
        ))}
      </div>
      {stage(
        view === '2d' ? (
          flat
        ) : (
          <Board3DBoundary
            fallback={flat}
            onError={() => {
              board3dFailed = true;
              setAvailable(false);
            }}
          >
            <React.Suspense fallback={flat}>
              <Board3D {...props} />
            </React.Suspense>
          </Board3DBoundary>
        ),
      )}
    </div>
  );
}
