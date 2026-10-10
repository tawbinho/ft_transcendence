/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { ACCENT_PREVIEW } from '@/lib/accent';

const css = readFileSync('src/styles/index.css', 'utf8');

// Reads the colors straight from index.css and checks the contrast of every
// pair of text and background the components use, in both themes and with
// every accent color. WCAG asks for 4.5:1 for normal text.

type Tokens = Record<string, string>;

/** The `--c-*: #hex` lines of the first rule whose selector is exactly `selector`. */
function readRule(selector: string): Tokens {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) return {};
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(--c-[\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
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

/** A color drawn at the given opacity on top of a background (what `bg-primary/12` looks like). */
function over(color: Rgb, background: Rgb, opacity: number): Rgb {
  return color.map((c, i) => Math.round(c * opacity + background[i]! * (1 - opacity))) as Rgb;
}

const ACCENTS = ['violet', 'teal', 'rose', 'orange'];
const MIN = 4.5;

const themes = {
  light: readRule(":root,\n[data-theme='light']"),
  dark: readRule("[data-theme='dark']"),
};

/** The theme's tokens with an accent's primary colors on top (the first rule is the light one). */
function withAccent(theme: 'light' | 'dark', accent?: string): Tokens {
  if (!accent) return themes[theme];
  const selector = theme === 'light' ? `[data-accent='${accent}']` : `[data-theme='dark'][data-accent='${accent}']`;
  return { ...themes[theme], ...readRule(selector) };
}

describe.each(['light', 'dark'] as const)('%s theme contrast', (theme) => {
  it('reads every token', () => {
    expect(Object.keys(themes[theme]).length).toBeGreaterThanOrEqual(18);
  });

  it('keeps the text colors readable on the three surfaces', () => {
    const t = themes[theme];
    for (const text of ['--c-fg', '--c-muted']) {
      for (const background of ['--c-bg', '--c-surface', '--c-surface-2']) {
        expect(contrast(toRgb(t[text]!), toRgb(t[background]!)), `${text} on ${background}`).toBeGreaterThanOrEqual(
          MIN,
        );
      }
    }
  });

  it('keeps the status colors readable on the page and on their own soft background', () => {
    const t = themes[theme];
    for (const name of ['danger', 'success', 'warning']) {
      const color = toRgb(t[`--c-${name}`]!);
      for (const background of [t['--c-bg'], t['--c-surface'], t['--c-surface-2'], t[`--c-${name}-soft`]]) {
        expect(contrast(color, toRgb(background!)), `${name} on ${background}`).toBeGreaterThanOrEqual(MIN);
      }
      expect(contrast(toRgb(t['--c-fg']!), toRgb(t[`--c-${name}-soft`]!))).toBeGreaterThanOrEqual(MIN);
    }
  });

  it('keeps the text of a danger button readable', () => {
    const t = themes[theme];
    for (const background of ['--c-danger', '--c-danger-hover']) {
      expect(contrast(toRgb(t['--c-danger-fg']!), toRgb(t[background]!)), background).toBeGreaterThanOrEqual(MIN);
    }
  });

  it.each([undefined, ...ACCENTS])('keeps the primary color readable (accent: %s)', (accent) => {
    const t = withAccent(theme, accent);
    const primary = toRgb(t['--c-primary']!);
    for (const background of ['--c-bg', '--c-surface', '--c-surface-2']) {
      const base = toRgb(t[background]!);
      // As text on the surface, and as text on a 12 % tint of itself (badges, active tabs).
      expect(contrast(primary, base), `primary on ${background}`).toBeGreaterThanOrEqual(MIN);
      expect(contrast(primary, over(primary, base, 0.12)), `primary on tint of ${background}`).toBeGreaterThanOrEqual(
        MIN,
      );
    }
    // As the background of a button.
    for (const color of ['--c-primary', '--c-primary-hover']) {
      expect(contrast(toRgb(t['--c-primary-fg']!), toRgb(t[color]!)), `button on ${color}`).toBeGreaterThanOrEqual(MIN);
    }
  });
});

describe('accent previews', () => {
  it.each(Object.entries(ACCENT_PREVIEW))(
    '%s preview matches the primary colors of the stylesheet',
    (accent, preview) => {
      const light = accent === 'blue' ? themes.light : withAccent('light', accent);
      const dark = accent === 'blue' ? themes.dark : withAccent('dark', accent);

      expect(preview.light).toBe(light['--c-primary']);
      expect(preview.dark).toBe(dark['--c-primary']);
    },
  );
});
