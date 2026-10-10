/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { BACKDROPS } from './backdrops';

// The backgrounds are drawn with color-mix(... N%, transparent) over the page color. This reads those
// strengths from backdrop.css and checks that every text color the app puts straight on the page still
// has the contrast WCAG asks for (4.5:1) on the strongest pixel of each background, in both themes and
// with every accent color. Text inside cards sits on the card's own color and is not affected.

const tokensCss = readFileSync('src/styles/index.css', 'utf8');
const backdropCss = readFileSync('src/features/backdrop/backdrop.css', 'utf8');

type Rgb = [number, number, number];
type Tokens = Record<string, Rgb>;

const hex = (value: string): Rgb => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;

/** The `--c-*: #hex` lines of the rule that starts with `selector` (the light rule is listed with :root). */
function readRule(selector: string): Tokens {
  const start = tokensCss.indexOf(`\n${selector} {`);
  const body = tokensCss.slice(start, tokensCss.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(--c-[\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1]!, hex(m[2]!)]));
}

const ACCENTS = ['blue', 'violet', 'teal', 'rose', 'orange'];
function tokens(theme: 'light' | 'dark', accent: string): Tokens {
  const base = readRule(theme === 'light' ? ":root,\n[data-theme='light']" : "[data-theme='dark']");
  if (accent === 'blue') return base;
  return {
    ...base,
    ...readRule(theme === 'light' ? `[data-accent='${accent}']` : `[data-theme='dark'][data-accent='${accent}']`),
  };
}

function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr! + 0.7152 * lg! + 0.0722 * lb!;
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

const over = (color: Rgb, background: Rgb, opacity: number): Rgb =>
  color.map((c, i) => Math.round(c * opacity + background[i]! * (1 - opacity))) as Rgb;

/** The css of one background's page rule: from `html[data-backdrop='name'] body::before` to its closing brace. */
function pageRule(name: string): string {
  const start = backdropCss.indexOf(`html[data-backdrop='${name}'] body::before`);
  return backdropCss.slice(start, backdropCss.indexOf('\n}', start));
}

/** Every `color-mix(in srgb, <color> N%, transparent)` of a rule: which color and how strong. */
function mixes(rule: string): { color: string; percent: number }[] {
  return [...rule.matchAll(/color-mix\(in srgb,\s*(var\(--c-\w+\)|#[0-9a-f]{6})\s+(\d+)%,\s*transparent\)/g)].map(
    (m) => ({
      color: m[1]!,
      percent: Number(m[2]),
    }),
  );
}

const TEXT_COLORS = ['--c-fg', '--c-muted', '--c-primary', '--c-danger', '--c-success', '--c-warning'];
const MIN = 4.5;

describe('the page backgrounds', () => {
  it('has a rule in backdrop.css for every background except plain', () => {
    for (const name of BACKDROPS.filter((backdrop) => backdrop !== 'plain')) {
      expect(mixes(pageRule(name)).length, name).toBeGreaterThan(0);
    }
  });

  describe.each(['light', 'dark'] as const)('in the %s theme', (theme) => {
    it.each(ACCENTS)('keeps text readable on the strongest pixel of each background (%s accent)', (accent) => {
      const t = tokens(theme, accent);
      for (const name of BACKDROPS.filter((backdrop) => backdrop !== 'plain')) {
        // Each layer alone at full strength. The two glows peak in opposite corners, and in the board the discs
        // sit inside the holes and the ring replaces the tint, so layers never add up at full strength.
        for (const { color, percent } of mixes(pageRule(name))) {
          const ink = color.startsWith('#') ? hex(color) : t[color.slice(4, -1)]!;
          const strongest = over(ink, t['--c-bg']!, percent / 100);
          for (const text of TEXT_COLORS) {
            expect(contrast(t[text]!, strongest), `${text} on ${name} (${color} ${percent}%)`).toBeGreaterThanOrEqual(
              MIN,
            );
          }
        }
      }
    });
  });

  it('never animates, so reduced motion has nothing to switch off', () => {
    expect(backdropCss).not.toMatch(/animation|@keyframes|transition/);
  });

  it('never covers the page: the layer is behind the content and takes no clicks', () => {
    expect(backdropCss).toMatch(/z-index:\s*-1/);
    expect(backdropCss).toMatch(/pointer-events:\s*none/);
  });
});
