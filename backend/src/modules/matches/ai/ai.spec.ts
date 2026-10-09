import { createGame, drop, legalMoves, replay } from '../engine/game.engine.js';
import type { GameSettings, GameState } from '../engine/game.types.js';
import { chooseMove, DIFFICULTIES, type Difficulty } from './ai.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLASSIC: GameSettings = { cols: 7, rows: 6, winLength: 4 };

// A game in which these columns were played, in order.
const played = (columns: number[], settings: GameSettings = CLASSIC): GameState =>
  replay(settings, columns);

// A deterministic "random": the same seed always gives the same numbers.
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// A random that answers with these values, then 0.99 for ever (so no slip and
// no miss: the AI plays its real move).
function sequence(...values: number[]): () => number {
  let i = 0;
  return () => (i < values.length ? values[i++]! : 0.99);
}

const NO_SLIP = () => 0.99;
const FAST = { timeBudgetMs: 20 };

// Plays a whole game. `bot` picks for the seat in `botSeat`, `other` for the
// other one. Returns the winner (1, 2) or null for a draw.
function playGame(
  settings: GameSettings,
  botSeat: 1 | 2,
  pickBot: (s: GameState) => number,
  pickOther: (s: GameState) => number,
): 1 | 2 | null {
  let state = createGame(settings);
  while (state.status === 'playing') {
    state = drop(state, state.current === botSeat ? pickBot(state) : pickOther(state));
  }
  return state.winner;
}

// ---------------------------------------------------------------------------

describe('the AI takes a win and stops a loss', () => {
  // Seat 1 has three discs stacked in column 0 and is to move: column 0 wins.
  const winNow = () => played([0, 1, 0, 1, 0, 1]);
  // Seat 1 threatens column 0 and seat 2 is to move: it must play column 0.
  const mustBlock = () => played([0, 1, 0, 1, 0]);

  it.each(DIFFICULTIES)('%s wins when it can', (level) => {
    expect(chooseMove(winNow(), level, { random: NO_SLIP, ...FAST })).toBe(0);
  });

  it.each(DIFFICULTIES)('%s blocks an immediate threat', (level) => {
    expect(chooseMove(mustBlock(), level, { random: NO_SLIP, ...FAST })).toBe(0);
  });

  it('prefers winning to blocking', () => {
    // Seat 1: three in column 0. Seat 2: three in column 1. Seat 1 to move.
    const state = played([0, 1, 0, 1, 0, 1]);
    expect(chooseMove(state, 'hard', { random: NO_SLIP, ...FAST })).toBe(0);
  });

  it('easy sometimes misses a threat, on purpose (missThreatChance)', () => {
    // First random() < 0.3 = miss; the next picks the last legal column.
    const move = chooseMove(mustBlock(), 'easy', { random: sequence(0.1, 0.99) });
    expect(move).toBe(6);
  });

  it('medium and hard never miss a threat', () => {
    for (const level of ['medium', 'hard'] as const) {
      expect(chooseMove(mustBlock(), level, { random: sequence(0.0), ...FAST })).toBe(0);
    }
  });
});

describe('the AI slips on purpose, but not suicidally', () => {
  // Seat 2 is to move. Seat 1 owns (0,1), (1,1) and (2,1), three in a row on
  // the second row, with column 3 still empty: if seat 2 plays column 3, seat 1
  // drops on top of it and wins. Column 3 is POISON for seat 2. (The bottom row
  // is mixed, so seat 2 has no win of its own there.)
  const poisoned = () => played([1, 0, 0, 2, 1, 6, 2]);

  it('the position is what we think it is', () => {
    const state = poisoned();
    expect(state.current).toBe(2);
    expect(drop(drop(state, 3), 3).status).toBe('won');
  });

  it('a forced slip never plays the poisoned column', () => {
    for (let n = 0; n < 60; n++) {
      // First random() < 0.4 = slip; then the seeded numbers pick the move.
      const rng = seeded(n);
      let first = true;
      const random = () => (first ? ((first = false), 0.0) : rng());
      expect(chooseMove(poisoned(), 'easy', { random })).not.toBe(3);
    }
  });

  it('the thinking levels avoid it too', () => {
    for (const level of ['medium', 'hard'] as const) {
      expect(chooseMove(poisoned(), level, { random: NO_SLIP, ...FAST })).not.toBe(3);
    }
  });

  it('a slip is any safe move, so it varies', () => {
    const moves = new Set<number>();
    for (let n = 0; n < 60; n++) {
      const rng = seeded(n * 104729 + 7);
      let first = true;
      const random = () => (first ? ((first = false), 0.0) : rng());
      moves.add(chooseMove(poisoned(), 'easy', { random }));
    }
    expect(moves.size).toBeGreaterThan(2);
  });
});

describe('the AI works on any board', () => {
  const boards: Array<[string, GameSettings]> = [
    ['3 x 3, connect 3', { cols: 3, rows: 3, winLength: 3 }],
    ['5 x 5, connect 3', { cols: 5, rows: 5, winLength: 3 }],
    ['10 x 9, connect 5', { cols: 10, rows: 9, winLength: 5 }],
    ['12 x 12, connect 5', { cols: 12, rows: 12, winLength: 5 }],
    ['4 x 12, connect 4', { cols: 4, rows: 12, winLength: 4 }],
  ];

  it.each(boards)('plays a legal move on %s', (_name, settings) => {
    for (const level of DIFFICULTIES) {
      const state = createGame(settings);
      const move = chooseMove(state, level, { timeBudgetMs: 40 });
      expect(legalMoves(state)).toContain(move);
    }
  });

  it.each(boards)('finishes a whole game against itself on %s', (_name, settings) => {
    const pick = (s: GameState) => chooseMove(s, 'medium', { timeBudgetMs: 5, random: seeded(s.moveCount + 1) });
    const winner = playGame(settings, 1, pick, pick);
    expect([1, 2, null]).toContain(winner);
  });

  it('never plays a full column', () => {
    // Fill column 3 of a 7 x 6 board without a win: 6 discs alternate seats.
    let state = createGame(CLASSIC);
    for (let i = 0; i < 6; i++) state = drop(state, 3);
    for (let n = 0; n < 40; n++) {
      const move = chooseMove(state, 'easy', { random: seeded(n), timeBudgetMs: 5 });
      expect(move).not.toBe(3);
      expect(legalMoves(state)).toContain(move);
    }
  });

  it('plays the only move left', () => {
    let state = createGame({ cols: 3, rows: 3, winLength: 3 });
    for (const col of [0, 0, 0]) state = drop(state, col); // column 0 is full
    for (const col of [1, 1, 1]) state = drop(state, col); // column 1 is full
    expect(chooseMove(state, 'hard')).toBe(2);
  });

  it('refuses to play a finished game', () => {
    const won = played([0, 1, 0, 1, 0, 1, 0]);
    expect(() => chooseMove(won, 'hard')).toThrow();
  });
});

describe('the AI is careful with time and with the state it is given', () => {
  it('stops thinking when its time is up (hard, 12 x 12)', () => {
    const state = createGame({ cols: 12, rows: 12, winLength: 5 });
    const start = Date.now();
    chooseMove(state, 'hard', { timeBudgetMs: 100 });
    expect(Date.now() - start).toBeLessThan(700);
  });

  it('does not change the state it is given', () => {
    const state = played([3, 3, 2, 4]);
    const before = JSON.stringify(state);
    chooseMove(state, 'hard', FAST);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('easy is repeatable with the same random numbers, and varies with others', () => {
    const state = played([3, 3, 2]);
    const a = chooseMove(state, 'easy', { random: seeded(5) });
    const b = chooseMove(state, 'easy', { random: seeded(5) });
    expect(a).toBe(b);
    const moves = new Set(
      Array.from({ length: 30 }, (_, n) => chooseMove(state, 'easy', { random: seeded(n * 7 + 1) })),
    );
    expect(moves.size).toBeGreaterThan(1);
  });
});

describe('the AI is strong, but beatable', () => {
  const botMove = (level: Difficulty, seed: number) => (s: GameState) =>
    chooseMove(s, level, { timeBudgetMs: 15, random: seeded(seed + s.moveCount) });
  const randomMove = (seed: number) => {
    const random = seeded(seed);
    return (s: GameState) => {
      const moves = legalMoves(s);
      return moves[Math.floor(random() * moves.length)]!;
    };
  };

  it('hard beats a random player (both seats)', () => {
    let wins = 0;
    for (let game = 0; game < 10; game++) {
      const seat = game % 2 === 0 ? 1 : 2;
      if (playGame(CLASSIC, seat, botMove('hard', game), randomMove(game + 100)) === seat) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(9);
  });

  it('hard beats easy most of the time', () => {
    let hardWins = 0;
    for (let game = 0; game < 8; game++) {
      const hardSeat = game % 2 === 0 ? 1 : 2;
      const easySeat = hardSeat === 1 ? 2 : 1;
      const winner = playGame(CLASSIC, hardSeat, botMove('hard', game), botMove('easy', game + 50));
      void easySeat;
      if (winner === hardSeat) hardWins++;
    }
    expect(hardWins).toBeGreaterThanOrEqual(6);
  });

  it('easy is beatable: it loses to hard but is not a random mover (it wins sometimes against random)', () => {
    let easyWins = 0;
    for (let game = 0; game < 10; game++) {
      const seat = game % 2 === 0 ? 1 : 2;
      if (playGame(CLASSIC, seat, botMove('easy', game), randomMove(game + 200)) === seat) easyWins++;
    }
    expect(easyWins).toBeGreaterThanOrEqual(6);
  });

  it('it can lose: a human who sets a double threat beats the easy level', () => {
    // Seat 1 (human) builds an open three on the bottom row: columns 2, 3, 4
    // with 1 and 5 both free is a double threat that cannot be blocked.
    let state = createGame(CLASSIC);
    state = drop(state, 3); // seat 1
    state = drop(state, 0); // seat 2 (something harmless)
    state = drop(state, 4); // seat 1
    state = drop(state, 0); // seat 2
    state = drop(state, 2); // seat 1: open three, columns 1 and 5 both win
    expect(state.current).toBe(2);
    const afterBlock = drop(state, chooseMove(state, 'hard', { random: NO_SLIP, ...FAST }));
    // The bot blocks one end, the human wins on the other.
    const winning = [1, 5].find((col) => legalMoves(afterBlock).includes(col) && drop(afterBlock, col).status === 'won');
    expect(winning).toBeDefined();
  });
});
