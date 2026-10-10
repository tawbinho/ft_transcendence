import { frameSize, holeX, holeY } from './layout';

describe('3D board layout', () => {
  it('puts the holes of a 7 x 6 board around the middle of the frame', () => {
    expect(holeX(0, 7)).toBe(-3);
    expect(holeX(3, 7)).toBe(0);
    expect(holeX(6, 7)).toBe(3);
    // Row 0 is the bottom row, like the engine's board[col][row].
    expect(holeY(0, 6)).toBe(-2.5);
    expect(holeY(5, 6)).toBe(2.5);
  });

  it('keeps an even number of columns centred', () => {
    expect(holeX(0, 4) + holeX(3, 4)).toBe(0);
    expect(holeX(1, 4)).toBe(-0.5);
  });

  it('makes the frame a border wider than the holes on every side', () => {
    const { width, height } = frameSize(7, 6);
    expect(width).toBeGreaterThan(7);
    expect(height).toBeGreaterThan(6);
    expect(frameSize(8, 6).width - width).toBe(1);
  });
});
