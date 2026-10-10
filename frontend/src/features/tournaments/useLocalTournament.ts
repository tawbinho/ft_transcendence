import { useState } from 'react';
import type { BoardSettings } from '@/features/game/settings';
import { championOf, type Slot } from './bracket';
import {
  createLocalTournament,
  loadLocalTournament,
  recordLocalResult,
  saveLocalTournament,
  type LocalTournament,
} from './local';

/**
 * The state of the same-screen tournament. Every change is saved on this
 * device, so after a reload the tournament is still there.
 *
 * `undecided` is true when the page opens on a saved tournament that is not
 * finished: the player then chooses between resuming it and starting a new one.
 */
export function useLocalTournament() {
  const [saved] = useState(loadLocalTournament);
  const [tournament, setTournament] = useState<LocalTournament | null>(saved);
  const [undecided, setUndecided] = useState(saved !== null && championOf(saved.bracket) === null);

  function change(next: LocalTournament | null) {
    saveLocalTournament(next);
    setTournament(next);
    setUndecided(false);
  }

  return {
    tournament,
    undecided,
    /** Keeps the saved tournament. */
    resume: () => setUndecided(false),
    /** Draws a new bracket for these names (see validateAliases). */
    start: (names: readonly string[], settings: BoardSettings) => change(createLocalTournament(names, settings)),
    /** Draws the same players again, with the same board. */
    startAgain: () => tournament && change(createLocalTournament(tournament.players, tournament.settings)),
    /** Records the winner of a match. */
    recordWinner: (round: number, index: number, slot: Slot) =>
      tournament && change(recordLocalResult(tournament, round, index, slot)),
    /** Forgets the tournament. */
    clear: () => change(null),
  };
}
