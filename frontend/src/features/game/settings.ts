import { DEFAULT_SETTINGS, type GameSettings } from './engine';

// Board options offered in the UI. They match what the backend accepts for an
// online match (SETTINGS_API_LIMITS and MATCH_THEMES in
// backend/src/modules/matches/match.constants.ts), so a board chosen for a
// local game can always be used online too.

export const BOARD_LIMITS = {
  cols: { min: 5, max: 10 },
  rows: { min: 5, max: 9 },
  winLength: { min: 3, max: 5 },
} as const;

export const BOARD_THEMES = ['classic', 'ocean', 'sunset', 'midnight'] as const;
export type BoardTheme = (typeof BOARD_THEMES)[number];

export interface BoardSettings extends GameSettings {
  theme: BoardTheme;
}

export const DEFAULT_BOARD_SETTINGS: BoardSettings = { ...DEFAULT_SETTINGS, theme: 'classic' };

export function isBoardTheme(value: unknown): value is BoardTheme {
  return BOARD_THEMES.includes(value as BoardTheme);
}

/** A theme the backend may add later falls back to the classic colors. */
export function toBoardTheme(value: unknown): BoardTheme {
  return isBoardTheme(value) ? value : 'classic';
}

/** A run can never be longer than the shorter side of the board. */
export function maxWinLength(cols: number, rows: number): number {
  return Math.min(BOARD_LIMITS.winLength.max, cols, rows);
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

/** Brings any settings back inside the limits. */
export function normalizeSettings(settings: BoardSettings): BoardSettings {
  const cols = clamp(settings.cols, BOARD_LIMITS.cols.min, BOARD_LIMITS.cols.max);
  const rows = clamp(settings.rows, BOARD_LIMITS.rows.min, BOARD_LIMITS.rows.max);
  const winLength = clamp(settings.winLength, BOARD_LIMITS.winLength.min, maxWinLength(cols, rows));
  return { cols, rows, winLength, theme: toBoardTheme(settings.theme) };
}

export function isClassic(settings: GameSettings): boolean {
  return (
    settings.cols === DEFAULT_SETTINGS.cols &&
    settings.rows === DEFAULT_SETTINGS.rows &&
    settings.winLength === DEFAULT_SETTINGS.winLength
  );
}
