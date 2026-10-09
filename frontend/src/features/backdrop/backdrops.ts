import { useSyncExternalStore } from 'react';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';

// The page background replaces nothing: it is a decoration drawn behind every page. Its name goes in
// data-backdrop on <html>, where backdrop.css has one rule per background. "plain" is today's look
// and has no attribute. Same idea as the accent color (src/lib/accent.ts).
export const BACKDROPS = ['plain', 'glow', 'dots', 'grid', 'board'] as const;
export type Backdrop = (typeof BACKDROPS)[number];

// Must match the inline script in index.html, which applies the background before the first paint.
const STORAGE_KEY = 'backdrop';
const listeners = new Set<() => void>();

export function isBackdrop(value: unknown): value is Backdrop {
  return BACKDROPS.includes(value as Backdrop);
}

export function getBackdrop(): Backdrop {
  const saved = readStorage(STORAGE_KEY);
  return isBackdrop(saved) ? saved : 'plain';
}

export function applyBackdrop(backdrop: Backdrop = getBackdrop()): void {
  if (backdrop === 'plain') delete document.documentElement.dataset.backdrop;
  else document.documentElement.dataset.backdrop = backdrop;
}

export function setBackdrop(backdrop: Backdrop): void {
  if (backdrop === 'plain') removeStorage(STORAGE_KEY);
  else writeStorage(STORAGE_KEY, backdrop);
  applyBackdrop(backdrop);
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** The saved background, and a setter that applies it everywhere. */
export function useBackdrop(): [Backdrop, (backdrop: Backdrop) => void] {
  const backdrop = useSyncExternalStore(subscribe, getBackdrop, () => 'plain' as const);
  return [backdrop, setBackdrop];
}
