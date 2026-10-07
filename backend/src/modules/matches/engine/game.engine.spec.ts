import {
  canDrop,
  createGame,
  drop,
  legalMoves,
  replay,
} from './game.engine.js';
import { GameRuleError } from './game.errors.js';
import type { GameSettings, GameState, Position, Seat } from './game.types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Runs `fn` and returns the code of the GameRuleError it throws (null if it
// does not throw, 'OTHER' if it throws something else).
function ruleCode(fn: () => unknown): string | null {
  try {
    fn();
    return null;
  } catch (error) {
    return error instanceof GameRuleError ? error.code : 'OTHER';
  }
}

// Positions in a stable order, so lines can be compared whatever the order.
function sorted(positions: readonly Position[] | null): Position[] {
  return [...(positions ?? [])].sort((a, b) => a.col - b.col || a.row - b.row);
}

// Plays the given columns in order from a fresh game.
const play = (moves: number[], settings: Partial<GameSettings> = {}) =>
  replay(settings, moves);

// Depth-first search over every possible game of a SMALL board, returning the
// first sequence of moves whose finished state satisfies `wanted`. Used to
// find draws, which are hard to write by hand.
function findGame(
  settings: GameSettings,
  wanted: (state: GameState) => boolean,
): number[] | null {
  const search = (state: GameState, moves: number[]): number[] | null => {
    if (state.status !== 'playing') return wanted(state) ? moves : null;
    for (const col of legalMoves(state)) {
      const found = search(drop(state, col), [...moves, col]);
      if (found) return found;
    }
    return null;
  };
  return search(createGame(settings), []);
}

// ---------------------------------------------------------------------------
// Creating a game
// ---------------------------------------------------------------------------

describe('createGame', () => {
  it('starts with an empty classic 7x6 board and seat 1 to play', () => {
    const game = createGame();
    expect(game.settings).toEqual({ cols: 7, rows: 6, winLength: 4 });
    expect(game.board).toHaveLength(7);
    for (const column of game.board) {
      expect(column).toEqual([0, 0, 0, 0, 0, 0]);
    }
    expect(game.current).toBe(1);
    expect(game.status).toBe('playing');
    expect(game.winner).toBeNull();
    expect(game.winningLine).toBeNull();
    expect(game.lastMove).toBeNull();
    expect(game.moveCount).toBe(0);
  });

  it('accepts custom settings and fills in the missing ones with defaults', () => {
    const game = createGame({ cols: 9 });
    expect(game.settings).toEqual({ cols: 9, rows: 6, winLength: 4 });
    expect(game.board).toHaveLength(9);
  });

  it.each([
    ['too few columns', { cols: 2 }],
    ['too many columns', { cols: 13 }],
    ['too few rows', { rows: 2 }],
    ['too many rows', { rows: 13 }],
    ['a fractional size', { cols: 7.5 }],
    ['NaN', { rows: NaN }],
    ['a win length below 3', { winLength: 2 }],
    [
      'a win length longer than the smaller side',
      { cols: 4, rows: 5, winLength: 5 },
    ],
    ['a fractional win length', { winLength: 3.5 }],
  ])('rejects impossible settings: %s', (_name, settings) => {
    expect(ruleCode(() => createGame(settings))).toBe('INVALID_SETTINGS');
  });
});

// ---------------------------------------------------------------------------
// Dropping discs
// ---------------------------------------------------------------------------

describe('drop', () => {
  it('makes the disc fall to the bottom of an empty column', () => {
    const game = drop(createGame(), 3);
    expect(game.board[3]![0]).toBe(1);
    expect(game.lastMove).toEqual({ col: 3, row: 0 });
    expect(game.moveCount).toBe(1);
  });

  it('stacks discs on top of each other', () => {
    const game = play([3, 3]);
    expect(game.board[3]!.slice(0, 3)).toEqual([1, 2, 0]);
    expect(game.lastMove).toEqual({ col: 3, row: 1 });
  });

  it('alternates the players, seat 1 first', () => {
    let game = createGame();
    const seen: Seat[] = [];
    for (const col of [0, 1, 2, 3]) {
      seen.push(game.current);
      game = drop(game, col);
    }
    expect(seen).toEqual([1, 2, 1, 2]);
  });

  it.each([[-1], [7], [2.5], [NaN], [Infinity]])(
    'rejects the column %s as invalid',
    (col) => {
      expect(ruleCode(() => drop(createGame(), col))).toBe('INVALID_COLUMN');
      expect(canDrop(createGame(), col)).toBe(false);
    },
  );

  it('refuses a full column', () => {
    // Six discs fill a column of height 6; they alternate seats so nobody
    // wins vertically.
    const full = play([0, 0, 0, 0, 0, 0]);
    expect(full.status).toBe('playing');
    expect(canDrop(full, 0)).toBe(false);
    expect(ruleCode(() => drop(full, 0))).toBe('COLUMN_FULL');
    // The other columns are still open.
    expect(canDrop(full, 1)).toBe(true);
  });

  it('never changes the state it was given', () => {
    const before = createGame();
    const after = drop(before, 0);
    expect(after).not.toBe(before);
    expect(before.board[0]![0]).toBe(0);
    expect(before.moveCount).toBe(0);
    expect(before.current).toBe(1);
    expect(before.lastMove).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Winning
// ---------------------------------------------------------------------------

describe('winning', () => {
  it('detects four in a row horizontally', () => {
    // Seat 1 plays 0,1,2,3 on the bottom row; seat 2 stacks above.
    const game = play([0, 0, 1, 1, 2, 2, 3]);
    expect(game.status).toBe('won');
    expect(game.winner).toBe(1);
    expect(sorted(game.winningLine)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
    ]);
  });

  it('detects four in a row vertically', () => {
    const game = play([0, 1, 0, 1, 0, 1, 0]);
    expect(game.status).toBe('won');
    expect(game.winner).toBe(1);
    expect(sorted(game.winningLine)).toEqual([
      { col: 0, row: 0 },
      { col: 0, row: 1 },
      { col: 0, row: 2 },
      { col: 0, row: 3 },
    ]);
  });

  it('detects a diagonal going up to the right', () => {
    const game = play([0, 1, 1, 2, 3, 2, 2, 3, 6, 3, 3]);
    expect(game.status).toBe('won');
    expect(game.winner).toBe(1);
    expect(sorted(game.winningLine)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 1 },
      { col: 2, row: 2 },
      { col: 3, row: 3 },
    ]);
  });

  it('detects a diagonal going down to the right', () => {
    // The mirror image of the previous game (column c becomes 6 - c).
    const game = play([6, 5, 5, 4, 3, 4, 4, 3, 0, 3, 3]);
    expect(game.status).toBe('won');
    expect(game.winner).toBe(1);
    expect(sorted(game.winningLine)).toEqual([
      { col: 3, row: 3 },
      { col: 4, row: 2 },
      { col: 5, row: 1 },
      { col: 6, row: 0 },
    ]);
  });

  it('lets seat 2 win too', () => {
    // Seat 2 stacks four discs in column 1; seat 1 wastes a move on column 6.
    const game = play([0, 1, 0, 1, 0, 1, 6, 1]);
    expect(game.status).toBe('won');
    expect(game.winner).toBe(2);
  });

  it('wins when the LAST disc fills a gap in the middle of a run', () => {
    // Seat 1 takes columns 0, 1, 3, 4 on the bottom row, then drops in 2:
    // the run is five discs long, all of it is returned.
    const game = play([0, 0, 1, 1, 3, 3, 4, 4, 2]);
    expect(game.status).toBe('won');
    expect(game.winner).toBe(1);
    expect(sorted(game.winningLine)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
    ]);
  });

  it('does not report a win for three in a row', () => {
    const game = play([0, 1, 0, 1, 0]);
    expect(game.status).toBe('playing');
    expect(game.winner).toBeNull();
    expect(game.winningLine).toBeNull();
  });

  it('respects a shorter win length', () => {
    const game = play([0, 1, 0, 1, 0], { cols: 5, rows: 5, winLength: 3 });
    expect(game.status).toBe('won');
    expect(game.winner).toBe(1);
    expect(game.winningLine).toHaveLength(3);
  });

  it('respects a longer win length on a bigger board', () => {
    const settings = { cols: 8, rows: 8, winLength: 5 };
    const four = play([0, 1, 0, 1, 0, 1, 0], settings);
    expect(four.status).toBe('playing'); // four is not enough here
    const five = drop(drop(four, 1), 0);
    expect(five.status).toBe('won');
    expect(five.winningLine).toHaveLength(5);
  });

  it('detects a win in the corners of a small board', () => {
    // 4x4 with four in a row: the whole main diagonal, corner to corner.
    // Seat 1 owns (0,0), (1,1), (2,2), (3,3).
    const game = play([0, 1, 1, 2, 3, 2, 2, 3, 0, 3, 3], {
      cols: 4,
      rows: 4,
      winLength: 4,
    });
    expect(game.status).toBe('won');
    expect(game.winner).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// After the game is over
// ---------------------------------------------------------------------------

describe('a finished game', () => {
  it('accepts no more moves', () => {
    const won = play([0, 1, 0, 1, 0, 1, 0]);
    expect(canDrop(won, 4)).toBe(false);
    expect(legalMoves(won)).toEqual([]);
    expect(ruleCode(() => drop(won, 4))).toBe('GAME_OVER');
  });
});

// ---------------------------------------------------------------------------
// Draws
// ---------------------------------------------------------------------------

describe('draws', () => {
  // 3x3 with three in a row is small enough to search exhaustively.
  const small: GameSettings = { cols: 3, rows: 3, winLength: 3 };

  it('ends in a draw when the board is full and nobody connected', () => {
    const moves = findGame(small, (s) => s.status === 'draw');
    expect(moves).not.toBeNull();

    const game = play(moves!, small);
    expect(game.status).toBe('draw');
    expect(game.winner).toBeNull();
    expect(game.winningLine).toBeNull();
    expect(game.moveCount).toBe(9);
    expect(legalMoves(game)).toEqual([]);
    expect(ruleCode(() => drop(game, 0))).toBe('GAME_OVER');
  });

  it('counts a win on the very last square as a win, not a draw', () => {
    const moves = findGame(
      small,
      (s) => s.status === 'won' && s.moveCount === 9,
    );
    expect(moves).not.toBeNull();

    const game = play(moves!, small);
    expect(game.moveCount).toBe(9);
    expect(game.status).toBe('won');
    expect(game.winner).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Legal moves
// ---------------------------------------------------------------------------

describe('legalMoves', () => {
  it('lists every column on an empty board', () => {
    expect(legalMoves(createGame())).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('leaves out a full column', () => {
    const state = play([2, 2, 2, 2, 2, 2]);
    expect(legalMoves(state)).toEqual([0, 1, 3, 4, 5, 6]);
  });
});

// ---------------------------------------------------------------------------
// Replaying a saved game
// ---------------------------------------------------------------------------

describe('replay', () => {
  it('gives the same state as playing the moves one by one', () => {
    const moves = [3, 3, 4, 2, 4, 4, 1, 5];
    let manual = createGame();
    for (const col of moves) manual = drop(manual, col);
    expect(replay({}, moves)).toEqual(manual);
  });

  it('returns a fresh game for an empty list of moves', () => {
    expect(replay({}, [])).toEqual(createGame());
  });

  it('rejects a list that contains an illegal move', () => {
    expect(ruleCode(() => replay({}, [0, 0, 0, 0, 0, 0, 0]))).toBe(
      'COLUMN_FULL',
    );
    expect(ruleCode(() => replay({}, [9]))).toBe('INVALID_COLUMN');
  });

  it('rejects moves played after the game ended', () => {
    // The 7th move wins; the 8th must be refused.
    expect(ruleCode(() => replay({}, [0, 1, 0, 1, 0, 1, 0, 1]))).toBe(
      'GAME_OVER',
    );
  });
});

// ---------------------------------------------------------------------------
// Cross-check against a slow, independent implementation
// ---------------------------------------------------------------------------
// The engine only looks around the last disc, which is fast but easy to get
// subtly wrong. This test plays hundreds of random games and, after EVERY
// move, compares the engine's verdict with a deliberately simple scan of the
// whole board.

// Small seeded random generator, so a failure can be reproduced.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

// Looks at every square and every direction: returns the seat that has
// `length` discs in a row somewhere, or null.
function scanForWinner(state: GameState): Seat | null {
  const { cols, rows, winLength } = state.settings;
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const seat = state.board[col]![row]!;
      if (seat === 0) continue;
      for (const [dc, dr] of directions) {
        let count = 0;
        while (
          count < winLength &&
          state.board[col + dc * count]?.[row + dr * count] === seat
        ) {
          count++;
        }
        if (count === winLength) return seat;
      }
    }
  }
  return null;
}

describe('cross-check with a full-board scan', () => {
  const boards: GameSettings[] = [
    { cols: 7, rows: 6, winLength: 4 },
    { cols: 5, rows: 5, winLength: 4 },
    { cols: 4, rows: 4, winLength: 3 },
    { cols: 3, rows: 3, winLength: 3 },
    { cols: 8, rows: 8, winLength: 5 },
    { cols: 10, rows: 7, winLength: 4 },
    { cols: 6, rows: 9, winLength: 5 },
  ];

  it.each(boards)('agrees on every move of random games: %j', (settings) => {
    const random = seededRandom(
      settings.cols * 1000 + settings.rows * 10 + settings.winLength,
    );
    let wins = 0;
    let draws = 0;

    for (let game = 0; game < 150; game++) {
      let state = createGame(settings);

      while (state.status === 'playing') {
        const moves = legalMoves(state);
        state = drop(state, moves[Math.floor(random() * moves.length)]!);

        const scanned = scanForWinner(state);
        if (scanned) {
          // The engine must have noticed, with the right winner...
          expect(state.status).toBe('won');
          expect(state.winner).toBe(scanned);
          // ...and its highlighted line must be real: long enough and made
          // only of the winner's discs.
          expect(state.winningLine!.length).toBeGreaterThanOrEqual(
            settings.winLength,
          );
          for (const { col, row } of state.winningLine!) {
            expect(state.board[col]![row]).toBe(scanned);
          }
        } else if (state.moveCount === settings.cols * settings.rows) {
          expect(state.status).toBe('draw');
          expect(state.winner).toBeNull();
        } else {
          // Nobody has won and the board is not full: still playing.
          expect(state.status).toBe('playing');
        }
      }

      if (state.status === 'won') wins++;
      else draws++;
    }

    // Sanity: the random games really did finish, mostly with a winner.
    expect(wins + draws).toBe(150);
    expect(wins).toBeGreaterThan(0);
  });
});
