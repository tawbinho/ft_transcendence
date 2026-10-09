import { BOARD_THEMES } from '@/features/game/settings';
import { THEMES, sceneTheme } from './themes';

describe('3D board themes', () => {
  it('has a scene for every theme a match can have', () => {
    for (const theme of BOARD_THEMES) expect(THEMES).toHaveProperty(theme);
  });

  it('gives each theme its own colours', () => {
    expect(sceneTheme('ocean')).toBe(THEMES.ocean);
    expect(THEMES.ocean.frame).not.toBe(THEMES.classic.frame);
  });

  it('falls back to classic for a missing or unknown name', () => {
    expect(sceneTheme(undefined)).toBe(THEMES.classic);
    expect(sceneTheme('neon')).toBe(THEMES.classic);
    // Names of plain object members are not themes.
    expect(sceneTheme('toString')).toBe(THEMES.classic);
  });
});
