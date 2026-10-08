import { canDrop, createGame, drop, replay } from '../engine';
import { chooseMove, DIFFICULTIES } from './bot';

// Reproducible random numbers.
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

// 0.99 never slips or misses a threat, and picks the last of the best moves.
const noBlunder = () => 0.99;

describe('chooseMove', () => {
  it('always returns a legal column', () => {
    const random = seeded(42);
    for (const difficulty of DIFFICULTIES) {
      let state = createGame();
      while (state.status === 'playing') {
        const col = chooseMove(state, difficulty, { random, timeBudgetMs: 20 });
        expect(canDrop(state, col)).toBe(true);
        state = drop(state, col);
      }
    }
  });

  it.each(DIFFICULTIES)('takes an immediate win (%s)', (difficulty) => {
    // Seat 1 has three on the bottom row (columns 0-2) and is to move.
    const state = replay({}, [0, 0, 1, 1, 2, 2]);
    expect(chooseMove(state, difficulty, { random: noBlunder })).toBe(3);
  });

  it.each(['medium', 'hard'] as const)('blocks the opponent’s immediate win (%s)', (difficulty) => {
    // Seat 2 has three stacked in column 6; seat 1 must play there.
    const state = replay({}, [0, 6, 1, 6, 0, 6]);
    expect(chooseMove(state, difficulty, { random: noBlunder })).toBe(6);
  });

  it('can overlook the opponent’s immediate win on easy', () => {
    const state = replay({}, [0, 6, 1, 6, 0, 6]);
    // random() = 0 always overlooks, then plays the first legal column.
    expect(chooseMove(state, 'easy', { random: () => 0 })).toBe(0);
  });

  it('never slips into a move that hands over a win', () => {
    // Seat 2 has three on the second row (columns 0-2): a disc in column 3
    // would let them complete the row on top of it.
    const state = replay({}, [0, 0, 1, 1, 5, 2, 6, 2]);
    expect(state.status).toBe('playing');
    for (const difficulty of DIFFICULTIES) {
      // random() = 0.01 always slips.
      expect(chooseMove(state, difficulty, { random: () => 0.01 })).not.toBe(3);
    }
  });

  it('finds a forced win two moves ahead (hard)', () => {
    // Seat 1 owns columns 2 and 3 on the bottom row. Playing 1 or 4 makes an
    // open three that cannot be blocked on both ends.
    const state = replay({}, [3, 3, 2, 2]);
    expect([1, 4]).toContain(chooseMove(state, 'hard', { random: noBlunder }));
  });

  it('plays the only legal move without searching', () => {
    // Fill every column but the last one, avoiding any win.
    const settings = { cols: 3, rows: 3, winLength: 3 };
    const state = replay(settings, [0, 1, 0, 0, 1, 1, 2, 2]);
    expect(state.status).toBe('playing');
    expect(chooseMove(state, 'hard')).toBe(2);
  });

  it('respects its time budget on the largest board', () => {
    const state = createGame({ cols: 10, rows: 9, winLength: 5 });
    const started = performance.now();
    chooseMove(state, 'hard', { random: noBlunder, timeBudgetMs: 150 });
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it('rejects a finished game', () => {
    const won = replay({}, [0, 1, 0, 1, 0, 1, 0]);
    expect(() => chooseMove(won, 'easy')).toThrow();
  });
});
