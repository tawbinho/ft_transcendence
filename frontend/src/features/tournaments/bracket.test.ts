import { bracketSize, championOf, createBracket, nextPairing, recordWinner, shuffle } from './bracket';

describe('bracketSize', () => {
  it('rounds up to a power of two', () => {
    expect([2, 3, 4, 5, 8].map(bracketSize)).toEqual([2, 4, 4, 8, 8]);
  });
});

describe('createBracket', () => {
  it('pairs four players without byes', () => {
    const bracket = createBracket(['a', 'b', 'c', 'd']);
    expect(bracket).toHaveLength(2);
    expect(bracket[0]!.map((p) => p.players)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(bracket[1]![0]!.players).toEqual([null, null]);
  });

  it('gives byes to the first pairings and moves those players on', () => {
    const bracket = createBracket(['a', 'b', 'c', 'd', 'e']);
    // 8 places, 3 byes.
    expect(bracket[0]!.map((p) => p.bye)).toEqual([true, true, true, false]);
    expect(bracket[0]![3]!.players).toEqual(['d', 'e']);
    expect(bracket[1]!.map((p) => p.players)).toEqual([
      ['a', 'b'],
      ['c', null],
    ]);
  });

  it('refuses fewer than two players', () => {
    expect(() => createBracket(['a'])).toThrow();
  });
});

describe('playing a bracket', () => {
  it('advances winners round by round up to the champion', () => {
    let bracket = createBracket(['a', 'b', 'c']);
    // a has a bye; b plays c first.
    expect(nextPairing(bracket)).toEqual({ round: 0, index: 1 });

    bracket = recordWinner(bracket, 0, 1, 1); // c beats b
    expect(bracket[1]![0]!.players).toEqual(['a', 'c']);
    expect(nextPairing(bracket)).toEqual({ round: 1, index: 0 });
    expect(championOf(bracket)).toBeNull();

    bracket = recordWinner(bracket, 1, 0, 0); // a wins the final
    expect(nextPairing(bracket)).toBeNull();
    expect(championOf(bracket)).toBe('a');
  });

  it('does not change the bracket it was given', () => {
    const bracket = createBracket(['a', 'b']);
    recordWinner(bracket, 0, 0, 0);
    expect(bracket[0]![0]!.winner).toBeNull();
  });

  it('refuses a second result for the same pairing', () => {
    const bracket = recordWinner(createBracket(['a', 'b']), 0, 0, 0);
    expect(() => recordWinner(bracket, 0, 0, 1)).toThrow();
  });
});

describe('shuffle', () => {
  it('keeps every item', () => {
    expect(shuffle([1, 2, 3, 4], () => 0.3).sort()).toEqual([1, 2, 3, 4]);
  });
});
