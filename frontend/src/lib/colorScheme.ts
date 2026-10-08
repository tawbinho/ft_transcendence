import { useEffect, useSyncExternalStore } from 'react';
import { readStorage, writeStorage } from './storage';

export const COLOR_SCHEMES = ['system', 'light', 'dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

// Must match the inline script in index.html, which applies the scheme before
// the first paint to avoid a flash of the wrong colors.
const STORAGE_KEY = 'color-scheme';
const listeners = new Set<() => void>();
const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

function isColorScheme(value: unknown): value is ColorScheme {
  return COLOR_SCHEMES.includes(value as ColorScheme);
}

export function getColorScheme(): ColorScheme {
  const saved = readStorage(STORAGE_KEY);
  return isColorScheme(saved) ? saved : 'system';
}

export function applyColorScheme(scheme: ColorScheme = getColorScheme()): void {
  const dark = scheme === 'dark' || (scheme === 'system' && Boolean(darkQuery()?.matches));
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function setColorScheme(scheme: ColorScheme): void {
  writeStorage(STORAGE_KEY, scheme);
  applyColorScheme(scheme);
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** The saved preference, and a setter that applies it everywhere. */
export function useColorScheme(): [ColorScheme, (scheme: ColorScheme) => void] {
  const scheme = useSyncExternalStore(subscribe, getColorScheme, () => 'system' as const);

  // Follow the operating system while the preference is "system".
  useEffect(() => {
    const query = darkQuery();
    if (scheme !== 'system' || !query) return;
    const onChange = () => applyColorScheme('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [scheme]);

  return [scheme, setColorScheme];
}
