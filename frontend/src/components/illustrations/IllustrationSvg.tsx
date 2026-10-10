import type { SVGProps } from 'react';

/**
 * The frame of every illustration. They are decoration only, so they are
 * hidden from screen readers; the text next to them says what they mean.
 * Colors come from the theme tokens (and the two disc colors), so the
 * drawings follow light mode, dark mode and the accent color.
 */
export function IllustrationSvg(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" focusable="false" {...props} />;
}

export const DISC_RED = '#e5383b';
export const DISC_YELLOW = '#f9c623';
