// Single-elimination brackets, used by the same-screen tournament (players
// are names) and by the demo server's online tournaments (players are ids).
//
// Rounds are arrays of pairings. The winner of pairing i in round r plays in
// round r + 1, pairing floor(i / 2), in slot i % 2. With a number of players
// that is not a power of two, some first-round players have no opponent
// (a "bye") and go straight to the second round.

export type Slot = 0 | 1;

export interface BracketPairing<P> {
  /** null: waiting for the winner of an earlier pairing, or empty (bye). */
  players: [P | null, P | null];
  /** The slot of the winner, once known. */
  winner: Slot | null;
  /** Only one player: they go through without playing. */
  bye: boolean;
}

export type Bracket<P> = BracketPairing<P>[][];

/** The smallest power of two that holds `count` players. */
export function bracketSize(count: number): number {
  let size = 1;
  while (size < count) size *= 2;
  return size;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Builds the bracket for players in the given order (shuffle them first for a
 * random draw). The first pairings get the byes, one each, so no pairing is
 * left without players. Players with a bye are already placed in the second
 * round.
 */
export function createBracket<P>(players: readonly P[]): Bracket<P> {
  if (players.length < 2) throw new Error('A tournament needs at least 2 players');
  const size = bracketSize(players.length);
  const byes = size - players.length;

  const queue = [...players];
  const first: BracketPairing<P>[] = [];
  for (let i = 0; i < size / 2; i++) {
    const a = queue.shift()!;
    const b = i < byes ? null : queue.shift()!;
    first.push({ players: [a, b], winner: null, bye: b === null });
  }

  let bracket: Bracket<P> = [first];
  for (let count = size / 4; count >= 1; count /= 2) {
    bracket.push(Array.from({ length: count }, () => ({ players: [null, null], winner: null, bye: false })));
  }

  first.forEach((pairing, index) => {
    if (pairing.bye) bracket = recordWinner(bracket, 0, index, 0);
  });
  return bracket;
}

/** The bracket after the player in `slot` won pairing `index` of round `round`. */
export function recordWinner<P>(bracket: Bracket<P>, round: number, index: number, slot: Slot): Bracket<P> {
  const pairing = bracket[round]?.[index];
  if (!pairing) throw new Error(`No pairing ${index} in round ${round}`);
  const winner = pairing.players[slot];
  if (winner === null) throw new Error('This slot is empty');
  if (pairing.winner !== null) throw new Error('This pairing already has a winner');

  const next = bracket.map((pairings) =>
    pairings.map((p) => ({ ...p, players: [...p.players] as [P | null, P | null] })),
  );
  next[round]![index]!.winner = slot;

  const later = next[round + 1];
  if (later) later[Math.floor(index / 2)]!.players[index % 2 === 0 ? 0 : 1] = winner;
  return next;
}

/** Both players known and no winner yet. */
export function isPlayable<P>(pairing: BracketPairing<P>): boolean {
  return pairing.winner === null && pairing.players[0] !== null && pairing.players[1] !== null;
}

/** The next pairing to play, earliest round first; null when the bracket is done. */
export function nextPairing<P>(bracket: Bracket<P>): { round: number; index: number } | null {
  for (let round = 0; round < bracket.length; round++) {
    const index = bracket[round]!.findIndex(isPlayable);
    if (index !== -1) return { round, index };
  }
  return null;
}

/** The tournament winner, once the final is played. */
export function championOf<P>(bracket: Bracket<P>): P | null {
  const final = bracket[bracket.length - 1]?.[0];
  return final && final.winner !== null ? final.players[final.winner] : null;
}
