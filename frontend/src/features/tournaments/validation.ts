import type { ValidationKey } from '@/lib/validation';

// Mirrors the backend's rules for tournament names (docs/api-contract.md).

export const TOURNAMENT_NAME_MIN = 3;
export const TOURNAMENT_NAME_MAX = 30;

/** Letters, numbers, spaces and - _ ' . (starting with a letter or number). */
export const TOURNAMENT_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _'.-]*$/u;

export function validateTournamentName(value: string): ValidationKey | null {
  const name = value.trim();
  if (!name) return 'validation.required';
  if (name.length < TOURNAMENT_NAME_MIN || name.length > TOURNAMENT_NAME_MAX) {
    return 'validation.tournamentNameLength';
  }
  if (!TOURNAMENT_NAME_PATTERN.test(name)) return 'validation.tournamentNameChars';
  return null;
}
