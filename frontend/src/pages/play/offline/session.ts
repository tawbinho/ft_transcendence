import { loadLastSettings } from '@/features/game/lastSettings';
import type { BoardSettings } from '@/features/game/settings';

/** What the setup form collects. */
export interface SetupValues {
  settings: BoardSettings;
  /** Names typed for the two players ('' = default "Player n"). */
  names: [string, string];
}

/** One game being played: the rules it started with and who plays. */
export interface Session {
  id: number;
  settings: BoardSettings;
  names: [string, string];
}

/** The form's starting point: the board of the last game on this device, no names. */
export function startingValues(): SetupValues {
  return { settings: loadLastSettings(), names: ['', ''] };
}

/** Turns the form into a game. */
export function buildSession(values: SetupValues): Session {
  return {
    id: Date.now(),
    settings: values.settings,
    names: [values.names[0].trim(), values.names[1].trim()],
  };
}
