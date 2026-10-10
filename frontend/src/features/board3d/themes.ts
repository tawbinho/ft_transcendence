// WHY THIS FILE EXISTS
// The colours of the board and discs for each board theme. The names are the
// themes a match can have on the backend (MATCH_THEMES in match.constants.ts),
// so an online match is drawn in the theme its players chose. The room around
// the board (background and table) is not here: it follows the page's light or
// dark theme, so the canvas never clashes with the page (see Stage.tsx).

export interface SceneTheme {
  frame: string;
  disc1: string; // seat 1, who plays first
  disc2: string; // seat 2
}

export const THEMES = {
  classic: {
    frame: '#1f55d6',
    disc1: '#e3363a',
    disc2: '#f6c423',
  },
  ocean: {
    frame: '#0e8798',
    disc1: '#ff7a5a',
    disc2: '#f2eee0',
  },
  sunset: {
    frame: '#692b7d',
    disc1: '#ff7b2c',
    disc2: '#25b3a6',
  },
  midnight: {
    frame: '#2a3d8f',
    disc1: '#ff4b8b',
    disc2: '#3dd0ff',
  },
} satisfies Record<string, SceneTheme>;

export type ThemeName = keyof typeof THEMES;

// Unknown names, or no name, fall back to the classic theme.
export function sceneTheme(name: string | undefined): SceneTheme {
  if (name !== undefined && Object.hasOwn(THEMES, name)) {
    return THEMES[name as ThemeName];
  }
  return THEMES.classic;
}
