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

/** The theme a preference gives right now: "system" follows the operating system. */
export function resolveColorScheme(scheme: ColorScheme, systemIsDark: boolean): 'light' | 'dark' {
  return scheme === 'dark' || (scheme === 'system' && systemIsDark) ? 'dark' : 'light';
}

export function applyColorScheme(scheme: ColorScheme = getColorScheme()): void {
  document.documentElement.dataset.theme = resolveColorScheme(scheme, Boolean(darkQuery()?.matches));
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

function subscribeToSystem(notify: () => void) {
  const query = darkQuery();
  query?.addEventListener('change', notify);
  return () => query?.removeEventListener('change', notify);
}

/** The theme on screen, light or dark, even while the preference is "system". */
export function useResolvedTheme(): 'light' | 'dark' {
  const [scheme] = useColorScheme();
  const systemIsDark = useSyncExternalStore(
    subscribeToSystem,
    () => Boolean(darkQuery()?.matches),
    () => false,
  );
  return resolveColorScheme(scheme, systemIsDark);
}
