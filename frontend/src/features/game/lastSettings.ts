import { readStorage, writeStorage } from '@/lib/storage';
import { DEFAULT_BOARD_SETTINGS, normalizeSettings, type BoardSettings } from './settings';

const STORAGE_KEY = 'board-settings';

/**
 * The board options used in the last game on this device. Game setup forms
 * start from them. Anything missing, broken or out of range falls back to the
 * defaults, so a bad saved value can never break a page.
 */
export function loadLastSettings(): BoardSettings {
  const saved = readStorage(STORAGE_KEY);
  if (!saved) return DEFAULT_BOARD_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_BOARD_SETTINGS;
    // Missing fields are filled from the defaults before the limits are applied.
    return normalizeSettings({ ...DEFAULT_BOARD_SETTINGS, ...parsed });
  } catch {
    return DEFAULT_BOARD_SETTINGS;
  }
}

export function saveLastSettings(settings: BoardSettings): void {
  writeStorage(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
}
