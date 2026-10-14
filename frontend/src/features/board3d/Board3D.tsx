// WHY THIS FILE EXISTS
// The Connect Four board in 3D, drawn with Three.js through react-three-fiber
// (a React renderer: <mesh>, <boxGeometry>, <directionalLight>... create the
// matching Three.js objects).
//
// It reads the same game state as the 2D board: board[col][row], row 0 at the
// bottom, 0 = empty, 1 or 2 = a player's disc. It does not know the rules:
// clicking a column only calls onDrop(col), and the engine (or the server, in
// an online match) decides what happens. Without onDrop the board is
// read-only, which is what a spectator gets.

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping } from 'three';
import { CameraRig } from './CameraRig';
import { Confetti } from './Confetti';
import { Disc, PreviewDisc } from './Disc';
import { Frame } from './Frame';
import { Stage } from './Stage';
import { DROP_HEIGHT, FOOT_HEIGHT, frameSize, holeX, holeY } from './layout';
import { sceneTheme } from './themes';

interface Square {
  col: number;
  row: number;
}

// What the 3D view needs from a game. The engine's GameState and the
// backend's MatchView.game both have this shape.
export interface Board3DGame {
  board: readonly (readonly number[])[];
  current?: number | null; // whose turn it is: colours the preview disc
  lastMove?: Square | null; // this disc falls in; the others appear in place
  winningLine?: readonly Square[] | null; // these discs glow
}

interface Board3DProps {
  game: Board3DGame;
  onDrop?: (col: number) => void; // leave out for a read-only board
  disabled?: boolean; // true while the player may not move
  theme?: string; // classic, ocean, sunset or midnight
  backdrop?: string; // colour of the room around the board: use the page's, so the canvas blends in
  label?: string; // read by screen readers
  describeColumn?: (col: number) => string; // announced when a column is chosen with the keyboard
  autoFocus?: boolean; // focus the board once, when it appears, so a game can start with the keyboard
  fallback?: ReactNode; // shown instead when the browser has no WebGL 2
  className?: string; // give the board its size here
}

// Three.js needs WebGL 2. Without it, show the fallback instead of crashing.
function hasWebGL2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

// Players who asked their system for less motion get no confetti.
function prefersLessMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Board3D({
  game,
  onDrop,
  disabled = false,
  theme,
  backdrop = '#e8ecf6',
  label = 'Connect Four board in 3D',
  describeColumn,
  autoFocus = false,
  fallback = 'This 3D view needs WebGL 2.',
  className,
}: Board3DProps) {
  const container = useRef<HTMLDivElement>(null);
  const [webgl] = useState(hasWebGL2);
  const [calm] = useState(prefersLessMotion);
  // The column under the mouse, or chosen with the arrow keys.
  const [selected, setSelected] = useState<number | null>(null);

  const { board, current, lastMove, winningLine } = game;
  const cols = board.length;
  const rows = board[0]?.length ?? 0;
  const colors = sceneTheme(theme);

  const interactive = onDrop !== undefined && !disabled;
  const isOpen = (col: number) => board[col]?.[rows - 1] === 0; // top square free
  const play = (col: number) => {
    if (onDrop && !disabled && isOpen(col)) onDrop(col);
  };
  const isWinning = (col: number, row: number) =>
    winningLine?.some((square) => square.col === col && square.row === row) ?? false;

  // Heights, with y = 0 at the centre of the frame.
  const { width, height } = frameSize(cols, rows);
  const dropY = holeY(rows - 1, rows) + DROP_HEIGHT; // new discs start here
  const top = dropY + 0.5; // top of the preview disc
  const bottom = -height / 2 - FOOT_HEIGHT; // the table
  const middle = (top + bottom) / 2; // moved to y = 0, where the camera aims

  // The confetti starts from the middle of the winning line.
  const burst =
    winningLine && winningLine.length > 0
      ? {
          x: winningLine.reduce((sum, s) => sum + holeX(s.col, cols), 0) / winningLine.length,
          y: winningLine.reduce((sum, s) => sum + holeY(s.row, rows), 0) / winningLine.length,
        }
      : null;

  // Only on mount: later renders must not pull focus back from wherever the player went.
  useEffect(() => {
    // preventScroll: the page must not jump just because a new game started (same as the 2D board).
    if (autoFocus) container.current?.focus({ preventScroll: true });
  }, []);

  // Arrow keys choose a column, Home and End jump to the first and last, Enter or Space drops the disc.
  // No number keys on purpose: 1 to 9 cannot reach a tenth column, and on a French keyboard the digits need Shift.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      setSelected((col) => (col === null ? Math.floor(cols / 2) : Math.min(cols - 1, Math.max(0, col + step))));
    } else if (event.key === 'Home' || event.key === 'End') {
      setSelected(event.key === 'Home' ? 0 : cols - 1);
    } else if ((event.key === 'Enter' || event.key === ' ') && selected !== null) {
      play(selected);
    } else {
      return;
    }
    event.preventDefault(); // the keys must not scroll the page
  }

  if (!webgl) return <div className={className}>{fallback}</div>;

  return (
    <div
      ref={container}
      className={className}
      role={interactive ? 'application' : 'img'}
      aria-label={label}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      style={{ cursor: interactive && selected !== null && isOpen(selected) ? 'pointer' : 'grab' }}
    >
      {/* Canvas creates the WebGL renderer, the scene and a perspective
          camera (35 degree angle of view), and redraws every frame. Tone
          mapping turns the light computed by the shaders into screen colours;
          the "neutral" one keeps the plastic colours bright and true. */}
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        gl={{ toneMapping: NeutralToneMapping }}
        camera={{ fov: 35, position: [0, 5, 20] }}
      >
        <Stage backdrop={backdrop} floorY={bottom - middle} />
        <CameraRig width={width} height={top - bottom} />

        <group position={[0, -middle, 0]}>
          <Frame cols={cols} rows={rows} color={colors.frame} />

          {board.map((column, col) =>
            column.map((seat, row) =>
              seat === 0 ? null : (
                <Disc
                  key={`${col}-${row}`}
                  x={holeX(col, cols)}
                  y={holeY(row, rows)}
                  color={seat === 1 ? colors.disc1 : colors.disc2}
                  dropFrom={lastMove?.col === col && lastMove.row === row ? dropY : null}
                  glowing={isWinning(col, row)}
                />
              ),
            ),
          )}

          {/* One invisible box per column catches the mouse. react-three-fiber
              casts a ray from the camera through the mouse (Three.js
              Raycaster) and calls the handlers of the first box it hits. */}
          {interactive &&
            board.map((_, col) => (
              <mesh
                key={col}
                visible={false}
                position={[holeX(col, cols), (top - height / 2) / 2, 0]}
                onPointerOver={(event) => {
                  event.stopPropagation();
                  setSelected(col);
                }}
                onPointerOut={() => setSelected((previous) => (previous === col ? null : previous))}
                onClick={(event) => {
                  event.stopPropagation();
                  if (event.delta < 8) play(col); // a drag to turn the board is not a click
                }}
              >
                <boxGeometry args={[1, top + height / 2, 1]} />
              </mesh>
            ))}

          {interactive && selected !== null && isOpen(selected) && (
            <PreviewDisc x={holeX(selected, cols)} y={dropY} color={current === 2 ? colors.disc2 : colors.disc1} />
          )}

          {burst && !calm && (
            <Confetti x={burst.x} y={burst.y} floorY={bottom} color1={colors.disc1} color2={colors.disc2} />
          )}
        </group>
      </Canvas>
      {/* Tells screen reader users which column the arrow keys chose. */}
      <span className="sr-only" aria-live="polite">
        {interactive && selected !== null ? describeColumn?.(selected) : ''}
      </span>
    </div>
  );
}
