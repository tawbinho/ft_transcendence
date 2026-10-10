// WHY THIS FILE EXISTS
// Every size of the 3D board in one place. The unit is the distance between
// the centres of two neighbouring holes, so a 7 x 6 board is about 7 units
// wide. The frame, the discs, the click areas and the camera all use these
// numbers, so they always line up.

export const HOLE_RADIUS = 0.42;
export const DISC_RADIUS = 0.36; // a bit smaller than a hole, so it slides through
export const DISC_DEPTH = 0.2; // thickness of a disc
export const FRAME_DEPTH = 0.32; // thickness of the frame; the discs sit inside it
export const FRAME_BORDER = 0.45; // plastic around the outer holes
export const FOOT_HEIGHT = 0.35; // the feet lift the frame above the table
export const DROP_HEIGHT = 1.5; // a new disc starts this far above the top hole

// Centre of the hole at (col, row), with the middle of the frame at x = 0,
// y = 0. Columns go left to right and row 0 is the BOTTOM row, as in the
// engine.
export function holeX(col: number, cols: number): number {
  return col - (cols - 1) / 2;
}

export function holeY(row: number, rows: number): number {
  return row - (rows - 1) / 2;
}

// Outer size of the frame.
export function frameSize(cols: number, rows: number) {
  return {
    width: cols + 2 * FRAME_BORDER,
    height: rows + 2 * FRAME_BORDER,
  };
}
