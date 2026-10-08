import { normalizeSettings, type BoardSettings } from '@/features/game/settings';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
import type { ValidationKey } from '@/lib/validation';
import { createBracket, recordWinner, shuffle, type Bracket, type Slot } from './bracket';

// The same-screen tournament: players type their names (aliases) on one
// device, the order of play is drawn at random, and every match is played
// on this screen. Nothing goes to the server; the tournament is saved in
// localStorage so a reload does not lose it.

export const LOCAL_MIN_PLAYERS = 3;
export const LOCAL_MAX_PLAYERS = 8;
export const ALIAS_MAX = 20;

const STORAGE_KEY = 'local-tournament';

export interface LocalTournament {
  version: 1;
  /** The names, in the order they were typed. */
  players: string[];
  settings: BoardSettings;
  bracket: Bracket<string>;
  createdAt: string;
}

/** One error (or null) per name: empty, too long, or used twice. */
export function validateAliases(names: readonly string[]): (ValidationKey | null)[] {
  const seen = new Set<string>();
  return names.map((raw) => {
    const name = raw.trim();
    if (!name) return 'validation.required';
    if (name.length > ALIAS_MAX) return 'validation.aliasLength';
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) return 'validation.aliasTaken';
    seen.add(key);
    return null;
  });
}

/** Draws the bracket. The names must be valid (see validateAliases). */
export function createLocalTournament(
  names: readonly string[],
  settings: BoardSettings,
  random: () => number = Math.random,
): LocalTournament {
  const players = names.map((name) => name.trim());
  if (players.length < LOCAL_MIN_PLAYERS || players.length > LOCAL_MAX_PLAYERS) {
    throw new Error(`A tournament needs ${LOCAL_MIN_PLAYERS} to ${LOCAL_MAX_PLAYERS} players`);
  }
  return {
    version: 1,
    players,
    settings: normalizeSettings(settings),
    bracket: createBracket(shuffle(players, random)),
    createdAt: new Date().toISOString(),
  };
}

/** The tournament after `slot` won pairing `index` of `round`. A draw is not a result: the match is played again. */
export function recordLocalResult(
  tournament: LocalTournament,
  round: number,
  index: number,
  slot: Slot,
): LocalTournament {
  return { ...tournament, bracket: recordWinner(tournament.bracket, round, index, slot) };
}

export function loadLocalTournament(): LocalTournament | null {
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LocalTournament>;
    // Anything that does not look like a saved tournament is ignored.
    if (value.version !== 1 || !Array.isArray(value.players) || !Array.isArray(value.bracket) || !value.settings) {
      return null;
    }
    return { ...(value as LocalTournament), settings: normalizeSettings(value.settings) };
  } catch {
    return null;
  }
}

/** Saves the tournament, or forgets it (null). */
export function saveLocalTournament(tournament: LocalTournament | null): void {
  if (tournament) writeStorage(STORAGE_KEY, JSON.stringify(tournament));
  else removeStorage(STORAGE_KEY);
}
