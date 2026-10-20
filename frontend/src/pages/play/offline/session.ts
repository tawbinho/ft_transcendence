import type { Difficulty } from '@/features/game/bot';
import { loadLastSettings } from '@/features/game/lastSettings';
import type { BoardSettings } from '@/features/game/settings';
import type { Opponent } from '@/features/game/useOfflineGame';

export type Mode = 'local' | 'computer';
export type FirstPlayer = 'you' | 'computer' | 'random';

/** What the setup form collects. */
export interface SetupValues {
  settings: BoardSettings;
  difficulty: Difficulty;
  firstPlayer: FirstPlayer;
  /** Names typed for a same-screen game ('' = default "Player n"). */
  names: [string, string];
}

/** One game being played: the rules it started with and who plays. */
export interface Session {
  id: number;
  settings: BoardSettings;
  opponent: Opponent;
  names: [string, string];
}

/** The form's starting point: the board of the last game on this device, medium level, you first. */
export function startingValues(): SetupValues {
  return { settings: loadLastSettings(), difficulty: 'medium', firstPlayer: 'you', names: ['', ''] };
}

/** Turns the form into a game. `random` is a parameter so the caller can decide who starts. */
export function buildSession(mode: Mode, values: SetupValues, random: () => number = Math.random): Session {
  let opponent: Opponent = { kind: 'human' };
  if (mode === 'computer') {
    const computerFirst = values.firstPlayer === 'computer' || (values.firstPlayer === 'random' && random() < 0.5);
    opponent = { kind: 'computer', difficulty: values.difficulty, computerSeat: computerFirst ? 1 : 2 };
  }
  return {
    id: Date.now(),
    settings: values.settings,
    opponent,
    names: [values.names[0].trim(), values.names[1].trim()],
  };
}
