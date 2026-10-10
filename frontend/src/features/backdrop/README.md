# Page background (optional)

Members pick a background for the whole page in Settings > Preferences, below the accent color: plain (the default,
today's look), a soft glow in the accent color, dots, a fine grid, or a faint Connect Four board. The choice is saved
on this device (`localStorage`, key `backdrop`) and applies to every page, including the visitor, login and sign up
pages. Everything is CSS: no image files and no uploads.

## How it works

`backdrops.ts` puts the choice in `data-backdrop` on `<html>` (the same idea as the accent color's `data-accent`).
`backdrop.css` has one rule per background. Each one is drawn on a single layer behind the page
(`body::before`, `position: fixed`, `z-index: -1`, no clicks), only with the color tokens `--c-fg` and `--c-primary`,
so it follows light and dark mode and the accent color by itself. It is mirrored in right to left languages. Nothing
moves, so there is nothing to switch off for "reduced motion".

The patterns are faint on purpose: `backdrop.test.ts` reads their strength from the CSS and checks that every text
color keeps a contrast of 4.5:1 on the strongest pixel of each one (both themes, all accent colors).

## Files

| File                 | Job                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `backdrops.ts`       | The list of backgrounds, saving the choice, putting it on the page, the `useBackdrop` hook |
| `backdrop.css`       | The drawing of each background (and of the small previews in Settings)                     |
| `BackdropPicker.tsx` | The choice in Settings: five cards, each with a small piece of the real background         |
| `texts.ts`           | The texts in English, French and Arabic (kept here so deleting the folder leaves nothing)  |
| `register.ts`        | Switches the feature on: applies the saved choice and adds the picker to Settings          |
| `*.test.ts(x)`       | Tests (they are deleted with the folder)                                                   |

## How it is connected

One line outside this folder: `import '@/features/backdrop/register';` in `src/main.tsx`. The picker reaches Settings
through `src/app/extensions.ts`, a small list that Settings reads: without the feature the list is empty and Settings
looks as before. The inline script in `index.html` also reads the key, so the background is there from the first paint;
if you remove the feature, those lines may stay (they only set an attribute that nothing reads).

## Remove it

1. `rm -r src/features/backdrop`
2. Delete the line `import '@/features/backdrop/register';` in `src/main.tsx`.

`npm run typecheck`, `npm test` and `npm run build` pass after these two steps (checked).
