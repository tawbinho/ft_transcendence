// WHY THIS FILE EXISTS
// The shape of a single-elimination bracket, as PURE functions: no database,
// no Nest, so every rule can be tested by hand. The service stores the result.
//
// A bracket is a list of "pairings" (slots), grouped in rounds. Round 0 is the
// first round. The winner of pairing `position` in round `r` moves to pairing
// `floor(position / 2)` of round `r + 1`, in place `position % 2`.
//
//   round 0:  [0] [1] [2] [3]
//               \ /     \ /
//   round 1:    [0]     [1]
//                 \     /
//   round 2:       [0]       <- the final: its winner wins the tournament

export interface Slot {
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  // One player had no opponent and goes through without playing.
  bye: boolean;
  winnerId: string | null;
  // Set by the service when the match of this pairing is created.
  matchId: string | null;
}

// 3 or 4 players need a bracket of 4 places, 5 to 8 players one of 8.
export function bracketSize(playerCount: number): 4 | 8 {
  return playerCount <= 4 ? 4 : 8;
}

export function roundCount(size: number): number {
  return Math.log2(size);
}

// A fair shuffle (Fisher-Yates). `random` can be replaced in a test.
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

const emptySlot = (round: number, position: number): Slot => ({
  round,
  position,
  player1Id: null,
  player2Id: null,
  bye: false,
  winnerId: null,
  matchId: null,
});

// Builds the whole bracket for these players: shuffles them, fills round 0,
// gives the empty places to byes (at most one per pairing, spread out so two
// byes do not meet if it can be avoided), and moves the bye players on to
// round 1. The later rounds are empty, waiting for winners.
export function buildBracket(
  playerIds: string[],
  random: () => number = Math.random,
): Slot[] {
  const size = bracketSize(playerIds.length);
  const firstRoundPairings = size / 2;
  const byes = size - playerIds.length;

  const slots: Slot[] = [];
  for (let round = 0; round < roundCount(size); round++) {
    const pairings = size / 2 ** (round + 1);
    for (let position = 0; position < pairings; position++) {
      slots.push(emptySlot(round, position));
    }
  }

  // Which round-0 pairings get a bye: the even positions first, then the odd
  // ones, so the byes land in different halves of the next round.
  const positions = Array.from({ length: firstRoundPairings }, (_, i) => i);
  const byeOrder = [
    ...positions.filter((p) => p % 2 === 0),
    ...positions.filter((p) => p % 2 === 1),
  ];
  const byePositions = new Set(byeOrder.slice(0, byes));

  const queue = shuffle(playerIds, random);
  for (const slot of slots.filter((s) => s.round === 0)) {
    slot.player1Id = queue.shift() ?? null;
    if (byePositions.has(slot.position)) {
      slot.bye = true;
    } else {
      slot.player2Id = queue.shift() ?? null;
    }
  }

  // A bye player wins their pairing at once and moves on.
  for (const slot of slots.filter((s) => s.bye)) {
    placeWinner(slots, slot.round, slot.position, slot.player1Id!);
  }
  return slots;
}

// Records the winner of a pairing and puts them in their place in the next
// round. Returns the slots that changed (the pairing itself, and the next
// pairing if there is one), so the caller knows what to save. The winner of
// the last pairing has no next one: they win the tournament.
export function placeWinner(
  slots: Slot[],
  round: number,
  position: number,
  winnerId: string,
): Slot[] {
  const slot = find(slots, round, position);
  slot.winnerId = winnerId;
  const changed = [slot];

  const next = slots.find(
    (s) => s.round === round + 1 && s.position === Math.floor(position / 2),
  );
  if (next) {
    if (position % 2 === 0) next.player1Id = winnerId;
    else next.player2Id = winnerId;
    changed.push(next);
  }
  return changed;
}

// Is this the final? Its winner is the winner of the tournament.
export function isFinal(slots: Slot[], slot: Slot): boolean {
  return slot.round === Math.max(...slots.map((s) => s.round));
}

// A pairing whose match can be created now: both players known, nobody got a
// bye, no winner yet and no match yet.
export function isReady(slot: Slot): boolean {
  return (
    slot.player1Id !== null &&
    slot.player2Id !== null &&
    !slot.bye &&
    slot.winnerId === null &&
    slot.matchId === null
  );
}

function find(slots: Slot[], round: number, position: number): Slot {
  const slot = slots.find((s) => s.round === round && s.position === position);
  if (!slot) throw new Error(`No pairing at round ${round}, position ${position}`);
  return slot;
}
