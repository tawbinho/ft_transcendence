import type { ComponentType } from 'react';

/**
 * Places where an optional feature can add something to a page without the page knowing about the feature.
 * The feature calls `add...` once, from its own `register.ts`; src/main.tsx imports that file. Without the
 * feature nothing is added and the page looks as it did.
 */
const appearanceControls: ComponentType[] = [];

/** Adds a control to the "Language and appearance" card of Settings > Preferences, below the accent color. */
export function addAppearanceControl(control: ComponentType): void {
  if (!appearanceControls.includes(control)) appearanceControls.push(control);
}

export function getAppearanceControls(): readonly ComponentType[] {
  return appearanceControls;
}
