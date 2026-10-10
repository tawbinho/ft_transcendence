import { renderHook, act } from '@testing-library/react';
import { getColorScheme, resolveColorScheme, setColorScheme, useResolvedTheme } from './colorScheme';

describe('resolveColorScheme', () => {
  it('follows the operating system only for "system"', () => {
    expect(resolveColorScheme('system', true)).toBe('dark');
    expect(resolveColorScheme('system', false)).toBe('light');
    expect(resolveColorScheme('light', true)).toBe('light');
    expect(resolveColorScheme('dark', false)).toBe('dark');
  });
});

describe('the saved preference', () => {
  it('is "system" until a choice is saved, and ignores a broken value', () => {
    expect(getColorScheme()).toBe('system');
    window.localStorage.setItem('color-scheme', 'purple');
    expect(getColorScheme()).toBe('system');
  });

  it('is applied to the page and kept', () => {
    setColorScheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(getColorScheme()).toBe('dark');
    setColorScheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('useResolvedTheme', () => {
  it('changes when the preference changes', () => {
    setColorScheme('light');
    const { result } = renderHook(() => useResolvedTheme());
    expect(result.current).toBe('light');
    act(() => setColorScheme('dark'));
    expect(result.current).toBe('dark');
  });
});
