import {
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
  it('seats the 4 players once each in the two semi-finals', () => {
    const slots = buildBracket(players(4), seeded(4));
    const seated = round(slots, 0).flatMap((s) => [s.player1Id, s.player2Id]);
    expect(seated.sort(byText)).toEqual(players(4).sort(byText));
  });

  it('has 2 pairings in round 0 and the final in round 1', () => {
    const slots = buildBracket(players(4));
    expect([0, 1].map((r) => round(slots, r).length)).toEqual([2, 1]);
  });

  it('leaves the final empty until the semi-finals are played', () => {
    const final = round(buildBracket(players(4)), 1)[0]!;
    expect(final.player1Id).toBeNull();
    expect(final.player2Id).toBeNull();
  });

  it('starts with no match and no winner', () => {
    for (const slot of buildBracket(players(4), seeded(5))) {
      expect(slot.matchId).toBeNull();
      expect(slot.winnerId).toBeNull();
    }
  });

  it('is random: different seeds give different brackets', () => {
    const a = JSON.stringify(buildBracket(players(4), seeded(1)));
    const b = JSON.stringify(buildBracket(players(4), seeded(2)));
    expect(a).not.toBe(b);
  });

  it.each([0, 3, 5, 8])('refuses %i players', (n) => {
    expect(() => buildBracket(players(n))).toThrow();
  });
});

describe('isReady', () => {
  it('is true only with two known players, no winner, no match', () => {
    const base: Slot = { round: 0, position: 0, player1Id: 'a', player2Id: 'b', winnerId: null, matchId: null };
    expect(isReady(base)).toBe(true);
    expect(isReady({ ...base, player2Id: null })).toBe(false);
    expect(isReady({ ...base, winnerId: 'a' })).toBe(false);
    expect(isReady({ ...base, matchId: 'm' })).toBe(false);
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

  it('plays a whole 4-player tournament down to one winner', () => {
    const slots = buildBracket(players(4), seeded(4));
    const [first, second] = round(slots, 0);
    expect(isReady(first!) && isReady(second!)).toBe(true);

    // The player1 of every pairing always wins.
    placeWinner(slots, 0, 0, first!.player1Id!);
    const final = round(slots, 1)[0]!;
    expect(isReady(final)).toBe(false); // waits for the other semi-final
    placeWinner(slots, 0, 1, second!.player1Id!);
    expect(isReady(final)).toBe(true);

    expect(isFinal(slots, final)).toBe(true);
    placeWinner(slots, 1, 0, final.player1Id!);
    expect(final.winnerId).toBe(first!.player1Id);
    expect(placeWinner(slots, 1, 0, final.player1Id!)).toHaveLength(1); // nothing after the final
  });

  it('tells the final from other pairings', () => {
    const slots = buildBracket(players(4));
    expect(isFinal(slots, round(slots, 0)[0]!)).toBe(false);
    expect(isFinal(slots, round(slots, 1)[0]!)).toBe(true);
  });
});
