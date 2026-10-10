import { replay } from '@/features/game/engine';
import { positionAfter, replayFrames, seatOfMove, stepForKey, toReplayModel } from './replay';

// Seat 1 stacks column 0, seat 2 column 1: seat 1 wins on move 7.
const WINNING_GAME = [0, 1, 0, 1, 0, 1, 0];

describe('replayFrames', () => {
  it('has the empty board first and one position per move', () => {
    const frames = replayFrames({}, WINNING_GAME);
    expect(frames).toHaveLength(WINNING_GAME.length + 1);
    expect(frames[0]!.moveCount).toBe(0);
    expect(frames[3]!.moveCount).toBe(3);
  });

  it('ends on the same position as playing the whole match', () => {
    const frames = replayFrames({}, WINNING_GAME);
    const last = frames[frames.length - 1]!;
    expect(last.board).toEqual(replay({}, WINNING_GAME).board);
    expect(last.status).toBe('won');
    expect(last.winningLine).toHaveLength(4);
  });

  it('only shows the winning line on the last move', () => {
    const frames = replayFrames({}, WINNING_GAME);
    expect(frames[6]!.winningLine).toBeNull();
  });

  it('stops at a move the rules refuse', () => {
    const frames = replayFrames({}, [0, 1, 99, 2]);
    expect(frames).toHaveLength(3);
  });

  it('uses the board size of the match', () => {
    const frames = replayFrames({ cols: 5, rows: 4, winLength: 3 }, [2]);
    expect(frames[1]!.board).toHaveLength(5);
    expect(frames[1]!.board[2]).toHaveLength(4);
  });
});

describe('positionAfter', () => {
  const frames = replayFrames({}, [3, 3, 2]);

  it('returns the position after n moves', () => {
    expect(positionAfter(frames, 2).moveCount).toBe(2);
  });

  it('keeps a step outside the match inside it', () => {
    expect(positionAfter(frames, -4).moveCount).toBe(0);
    expect(positionAfter(frames, 50).moveCount).toBe(3);
  });
});

describe('toReplayModel', () => {
  it('carries the board, the last disc and the winning line', () => {
    const last = replayFrames({}, WINNING_GAME).at(-1)!;
    const model = toReplayModel(last);
    expect(model.cols).toBe(7);
    expect(model.lastMove).toEqual({ col: 0, row: 3 });
    expect(model.winningLine).toHaveLength(4);
  });
});

describe('seatOfMove', () => {
  it('alternates, starting with seat 1', () => {
    expect([1, 2, 3, 4].map(seatOfMove)).toEqual([1, 2, 1, 2]);
  });
});

describe('stepForKey', () => {
  it('moves one move with the arrows', () => {
    expect(stepForKey('ArrowRight', 4, 10)).toBe(5);
    expect(stepForKey('ArrowLeft', 4, 10)).toBe(3);
  });

  it('jumps to the ends with Home and End', () => {
    expect(stepForKey('Home', 4, 10)).toBe(0);
    expect(stepForKey('End', 4, 10)).toBe(10);
  });

  it('does not leave the match', () => {
    expect(stepForKey('ArrowLeft', 0, 10)).toBe(0);
    expect(stepForKey('ArrowRight', 10, 10)).toBe(10);
  });

  it('ignores other keys', () => {
    expect(stepForKey('a', 4, 10)).toBeNull();
  });
});
