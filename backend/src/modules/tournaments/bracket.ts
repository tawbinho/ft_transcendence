// The shape of the 4-player single-elimination bracket, as PURE functions: no
// database, no Nest, so every rule can be tested by hand. The service stores
// the result.

export interface Slot {
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  // Set by the service when the match of this pairing is created.
  matchId: string | null;
}

// Every tournament has 4 players: round 0 is two semi-finals, round 1 the final.
const PLAYERS = 4;

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
  winnerId: null,
  matchId: null,
});

// Builds the whole bracket for these 4 players: shuffles them, seats them in the
// two semi-finals and leaves the final empty until the semi-finals are played.
export function buildBracket(
  playerIds: string[],
  random: () => number = Math.random,
): Slot[] {
  if (playerIds.length !== PLAYERS) {
    throw new Error(`A bracket needs exactly ${PLAYERS} players`);
  }
  const queue = shuffle(playerIds, random);
  const slots: Slot[] = [];
  for (let position = 0; position < PLAYERS / 2; position++) {
    slots.push({
      ...emptySlot(0, position),
      player1Id: queue.shift()!,
      player2Id: queue.shift()!,
    });
  }
  slots.push(emptySlot(1, 0));
  return slots;
}

// Records the winner of a pairing and puts them in their place in the next
// round.
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

// A pairing whose match can be created now: both players known, no winner yet
// and no match yet.
export function isReady(slot: Slot): boolean {
  return (
    slot.player1Id !== null &&
    slot.player2Id !== null &&
    slot.winnerId === null &&
    slot.matchId === null
  );
}

function find(slots: Slot[], round: number, position: number): Slot {
  const slot = slots.find((s) => s.round === round && s.position === position);
  if (!slot) throw new Error(`No pairing at round ${round}, position ${position}`);
  return slot;
}
