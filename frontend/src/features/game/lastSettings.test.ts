import { loadLastSettings, saveLastSettings } from './lastSettings';
import { DEFAULT_BOARD_SETTINGS } from './settings';

describe('last board settings', () => {
  it('gives the defaults when nothing was saved', () => {
    expect(loadLastSettings()).toEqual(DEFAULT_BOARD_SETTINGS);
  });

  it('gives back what was saved', () => {
    saveLastSettings({ cols: 9, rows: 7, winLength: 5, theme: 'ocean' });
    expect(loadLastSettings()).toEqual({ cols: 9, rows: 7, winLength: 5, theme: 'ocean' });
  });

  it('keeps the saved values inside the limits', () => {
    localStorage.setItem('board-settings', JSON.stringify({ cols: 99, rows: 1, winLength: 9, theme: 'neon' }));
    expect(loadLastSettings()).toEqual({ cols: 10, rows: 5, winLength: 5, theme: 'classic' });
  });

  it('fills missing fields from the defaults', () => {
    localStorage.setItem('board-settings', JSON.stringify({ theme: 'sunset' }));
    expect(loadLastSettings()).toEqual({ ...DEFAULT_BOARD_SETTINGS, theme: 'sunset' });
  });

  it.each(['not json', 'null', '42', '"text"', '[1,2]'])('uses the defaults for %s', (saved) => {
    localStorage.setItem('board-settings', saved);
    expect(loadLastSettings()).toEqual(DEFAULT_BOARD_SETTINGS);
  });

  it('does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadLastSettings()).toEqual(DEFAULT_BOARD_SETTINGS);
    expect(() => saveLastSettings(DEFAULT_BOARD_SETTINGS)).not.toThrow();
  });
});
