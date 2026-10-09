import {
  bracketSize,
  buildBracket,
  isFinal,
  isReady,
  placeWinner,
  shuffle,
  type Slot,
} from './bracket.js';

const players = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => `p${i + 1}`);

// A deterministic "random" so a failing test can be replayed.
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const byText = (a: unknown, b: unknown): number =>
  String(a).localeCompare(String(b));

const round = (slots: Slot[], r: number): Slot[] =>
  slots.filter((s) => s.round === r).sort((a, b) => a.position - b.position);

describe('bracketSize', () => {
  it('uses the next power of two', () => {
    expect([3, 4, 5, 6, 7, 8].map(bracketSize)).toEqual([4, 4, 8, 8, 8, 8]);
  });
});

describe('shuffle', () => {
  it('keeps every item exactly once and does not touch its input', () => {
    const input = players(8);
    const copy = [...input];
    const result = shuffle(input, seeded(1));
    expect([...result].sort(byText)).toEqual([...input].sort(byText));
    expect(input).toEqual(copy);
  });
});

describe('buildBracket', () => {
  it.each([3, 4, 5, 6, 7, 8])('seats %i players once each in round 0', (n) => {
    const slots = buildBracket(players(n), seeded(n));
    const seated = round(slots, 0).flatMap((s) => [s.player1Id, s.player2Id]);
    expect(seated.filter(Boolean).sort(byText)).toEqual(players(n).sort(byText));
  });

  it('has the right number of pairings per round', () => {
    expect(round(buildBracket(players(4)), 0)).toHaveLength(2);
    expect(round(buildBracket(players(4)), 1)).toHaveLength(1);
    const eight = buildBracket(players(8));
    expect([0, 1, 2].map((r) => round(eight, r).length)).toEqual([4, 2, 1]);
  });

  it.each([
    [3, 1],
    [4, 0],
    [5, 3],
    [6, 2],
    [7, 1],
    [8, 0],
  ])('%i players give %i byes', (n, byes) => {
    expect(buildBracket(players(n), seeded(7)).filter((s) => s.bye)).toHaveLength(byes);
  });

  it('never gives two byes to one pairing, and a bye pairing has one player', () => {
    for (let n = 3; n <= 8; n++) {
      for (const slot of buildBracket(players(n), seeded(n)).filter((s) => s.bye)) {
        expect(slot.player1Id).not.toBeNull();
        expect(slot.player2Id).toBeNull();
        expect(slot.winnerId).toBe(slot.player1Id);
      }
    }
  });

  it('moves a bye player to round 1 at once, in the right place', () => {
    const slots = buildBracket(players(3), seeded(3));
    const bye = slots.find((s) => s.bye)!;
    const next = round(slots, 1)[0]!;
    const arrived = bye.position % 2 === 0 ? next.player1Id : next.player2Id;
    expect(arrived).toBe(bye.player1Id);
  });

  it('spreads two byes into different halves of round 1 (6 players)', () => {
    const slots = buildBracket(players(6), seeded(11));
    const byePositions = round(slots, 0).filter((s) => s.bye).map((s) => s.position);
    expect(new Set(byePositions.map((p) => Math.floor(p / 2))).size).toBe(2);
  });

  it('is random: different seeds give different brackets', () => {
    const a = JSON.stringify(buildBracket(players(8), seeded(1)));
    const b = JSON.stringify(buildBracket(players(8), seeded(2)));
    expect(a).not.toBe(b);
  });

  it('starts with no match and only bye winners', () => {
    for (const slot of buildBracket(players(8), seeded(5))) {
      expect(slot.matchId).toBeNull();
      expect(slot.winnerId).toBeNull();
    }
  });
});

describe('isReady', () => {
  it('is true only with two known players, no bye, no winner, no match', () => {
    const base: Slot = { round: 0, position: 0, player1Id: 'a', player2Id: 'b', bye: false, winnerId: null, matchId: null };
    expect(isReady(base)).toBe(true);
    expect(isReady({ ...base, player2Id: null })).toBe(false);
    expect(isReady({ ...base, bye: true })).toBe(false);
    expect(isReady({ ...base, winnerId: 'a' })).toBe(false);
    expect(isReady({ ...base, matchId: 'm' })).toBe(false);
  });

  it('makes a round-1 match ready at once when two bye players meet (5 players)', () => {
    // 5 players: 3 byes in 4 pairings; some round-1 pairing may already be full.
    const slots = buildBracket(players(5), seeded(2));
    const readyLater = round(slots, 1).filter(isReady);
    const full = round(slots, 1).filter((s) => s.player1Id && s.player2Id);
    expect(readyLater).toHaveLength(full.length);
  });
});

describe('placeWinner', () => {
  it('moves winners up: even positions to place 1, odd positions to place 2', () => {
    const slots = buildBracket(players(4), seeded(9));
    const [first, second] = round(slots, 0);
    const changed = placeWinner(slots, 0, 0, first!.player1Id!);
    expect(changed).toHaveLength(2);
    placeWinner(slots, 0, 1, second!.player2Id!);
    const final = round(slots, 1)[0]!;
    expect(final.player1Id).toBe(first!.player1Id);
    expect(final.player2Id).toBe(second!.player2Id);
    expect(isReady(final)).toBe(true);
  });

  it('plays a whole 8-player tournament down to one winner', () => {
    const slots = buildBracket(players(8), seeded(4));
    // The player1 of every pairing always wins.
    for (let r = 0; r < 3; r++) {
      for (const slot of round(slots, r)) {
        expect(slot.player1Id && slot.player2Id).toBeTruthy();
        placeWinner(slots, r, slot.position, slot.player1Id!);
      }
    }
    const final = round(slots, 2)[0]!;
    expect(isFinal(slots, final)).toBe(true);
    expect(final.winnerId).toBe(final.player1Id);
    expect(placeWinner(slots, 2, 0, final.player1Id!)).toHaveLength(1); // nothing after the final
  });

  it('tells the final from other pairings', () => {
    const slots = buildBracket(players(4));
    expect(isFinal(slots, round(slots, 0)[0]!)).toBe(false);
    expect(isFinal(slots, round(slots, 1)[0]!)).toBe(true);
  });
});
