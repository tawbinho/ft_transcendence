import { useSyncExternalStore } from 'react';
import { readStorage, removeStorage, writeStorage } from './storage';

// The accent color replaces the primary color (buttons, links, active tabs).
// Its name goes in data-accent on <html>, where styles/index.css has one rule
// per accent. Blue is the default and has no attribute.
export const ACCENTS = ['blue', 'violet', 'teal', 'rose', 'orange'] as const;
export type Accent = (typeof ACCENTS)[number];

/** The primary color of each accent in the light and in the dark theme, only used to paint a small preview. */
export const ACCENT_PREVIEW: Record<Accent, { light: string; dark: string }> = {
  blue: { light: '#2b4fd8', dark: '#8ba5ff' },
  violet: { light: '#6a3fd1', dark: '#b7a0ff' },
  teal: { light: '#096661', dark: '#3fd0c4' },
  rose: { light: '#b01d4f', dark: '#ff85ad' },
  orange: { light: '#934107', dark: '#ffa24d' },
};

// Must match the inline script in index.html, which applies the accent before
// the first paint to avoid a flash of blue.
const STORAGE_KEY = 'accent';
const listeners = new Set<() => void>();

function isAccent(value: unknown): value is Accent {
  return ACCENTS.includes(value as Accent);
}

export function getAccent(): Accent {
  const saved = readStorage(STORAGE_KEY);
  return isAccent(saved) ? saved : 'blue';
}

export function applyAccent(accent: Accent = getAccent()): void {
  if (accent === 'blue') delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = accent;
}

export function setAccent(accent: Accent): void {
  if (accent === 'blue') removeStorage(STORAGE_KEY);
  else writeStorage(STORAGE_KEY, accent);
  applyAccent(accent);
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** The saved accent, and a setter that applies it everywhere. */
export function useAccent(): [Accent, (accent: Accent) => void] {
  const accent = useSyncExternalStore(subscribe, getAccent, () => 'blue' as const);
  return [accent, setAccent];
}
