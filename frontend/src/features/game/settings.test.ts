import { maxWinLength, normalizeSettings, toBoardTheme } from './settings';

describe('board settings', () => {
  it('keeps the win length within the shorter side and the limits', () => {
    expect(maxWinLength(7, 6)).toBe(5);
    expect(maxWinLength(5, 9)).toBe(5);
    expect(normalizeSettings({ cols: 5, rows: 5, winLength: 9, theme: 'ocean' })).toEqual({
      cols: 5,
      rows: 5,
      winLength: 5,
      theme: 'ocean',
    });
  });

  it('clamps sizes to what the backend accepts', () => {
    expect(normalizeSettings({ cols: 3, rows: 20, winLength: 1, theme: 'classic' })).toEqual({
      cols: 5,
      rows: 9,
      winLength: 3,
      theme: 'classic',
    });
  });

  it('falls back to the classic theme for unknown values', () => {
    expect(toBoardTheme('neon')).toBe('classic');
    expect(toBoardTheme('midnight')).toBe('midnight');
  });
});
