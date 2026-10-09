// WHY THIS FILE EXISTS
// The colours of the 3D scene for each board theme. The names are the themes a
// match can have on the backend (MATCH_THEMES in match.constants.ts), so an
// online match is drawn in the theme its players chose.

export interface SceneTheme {
  sky: string; // background, and the fog colour the table fades into
  table: string;
  frame: string;
  disc1: string; // seat 1, who plays first
  disc2: string; // seat 2
}

export const THEMES = {
  classic: {
    sky: '#dde5f1',
    table: '#c6d1e2',
    frame: '#1f55d6',
    disc1: '#e3363a',
    disc2: '#f6c423',
  },
  ocean: {
    sky: '#0d3946',
    table: '#124b5a',
    frame: '#0e8798',
    disc1: '#ff7a5a',
    disc2: '#f2eee0',
  },
  sunset: {
    sky: '#f3c39d',
    table: '#e6a77c',
    frame: '#692b7d',
    disc1: '#ff7b2c',
    disc2: '#25b3a6',
  },
  midnight: {
    sky: '#0a0f1f',
    table: '#141b33',
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
