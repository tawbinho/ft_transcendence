# Frontend

The web app of ft_transcendence: Connect Four on one screen, against the computer or online, with profiles, friends,
chat, tournaments and a leaderboard, in English, French and Arabic. Sign-up asks for a
6-digit code sent by email, and there is a "forgot password" page that works the same way.

Built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router and i18next.

**Requirements:** Node.js 20.19 or newer (22 recommended; `.nvmrc` says 22). Older versions are too old for Vite 7, so
check `node -v` before running anything. With [nvm](https://github.com/nvm-sh/nvm), in the `frontend` folder:

```sh
nvm install   # installs the version in .nvmrc
nvm use
```

**New to this code?** Read [`docs/how-it-works.md`](docs/how-it-works.md): how a page gets its data, where things live,
why each tool was chosen, and the questions evaluators are likely to ask.

## Quick start

You need Node.js (see Requirements above) and the stack of the repository running (`docker compose up` at the root)
for everything that needs an account.

```sh
cd frontend
npm ci
npm run dev
```

Then open http://localhost:5173. The development server forwards `/api` and `/socket.io` to the HTTPS proxy on
https://localhost:8443, so logins, cookies, routes and live updates behave as in production. The home page, the game on
one screen and the legal pages also work without the backend.

**Creating an account:** the sign-up form sends a 6-digit code by email, and the account works only after the code is
typed on the next page. If the root `.env` has no Gmail settings (`SMTP_USER` and `SMTP_PASSWORD`), nothing is sent;
the code is written in the backend log instead:

```sh
docker compose logs backend | grep "Code for"
```

The "forgot password" page uses the same kind of code. The computer opponents (`AI_Easy`, `AI_Medium`, `AI_Hard`) are
accounts of the backend, which also chooses their moves: the computer page of Play (`/play/computer`) creates an
online match against the chosen one, so it needs an account. The app hides them from the friends pages, the player
search and the leaderboard (see `src/features/users/computerPlayers.ts`). It knows them by the backend's `isBot` flag, or by their exact three names where only a name is sent, so a real player called `AI_Fan` stays visible.

## Scripts

| Command                | What it does                                               |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Development server, with instant reload                    |
| `npm run build`        | Type-checks, then builds the production files into `dist/` |
| `npm run preview`      | Serves `dist/` on http://localhost:4173                    |
| `npm run typecheck`    | Type-checks only                                           |
| `npm test`             | Runs the tests once                                        |
| `npm run format`       | Formats every file with Prettier                           |
| `npm run format:check` | Checks the formatting without changing anything            |

Before a commit: `npm run format`, then `npm run typecheck && npm run format:check && npm test`.

## Settings

One setting, for `npm run dev` only, listed in `.env.example`: copy it to `.env.local` (ignored by git) to change it.
The Docker build needs none.

| Name               | What it does                                         | Default                  |
| ------------------ | ---------------------------------------------------- | ------------------------ |
| `API_PROXY_TARGET` | Where `npm run dev` forwards `/api` and `/socket.io` | `https://localhost:8443` |

## Running with Docker

`docker compose up` at the root of the repository starts everything, and the app is served on
https://localhost:8443 (`HTTPS_PORT` in the root `.env`), next to the API.

The `Dockerfile` here builds the app with Node, then serves `dist/` with nginx (`nginx.conf`): any path that is not a
file answers `index.html`, so the app's router shows the page, and the built files are cached for a year since their
names change with their content. In front of it, the HTTPS proxy (`proxy/nginx.conf` at the root) sends `/api` and
`/socket.io` to the backend and every other path to this container.

## How the code is organized

```text
src/
  app/          The shell: route table, addresses, guards, data cache, live updates, navigation links
  pages/        One folder per area: home, auth, play, tournaments, profile, settings, community, history,
                info. One route component per address, with the pieces only that area uses next to it
  features/     Code shared by several areas, one folder per subject: api.ts (calls), types.ts (shapes),
                hooks.ts (data), components/, and small helpers
  components/   Shared components; ui/ is the design system (buttons, fields, dialogs, tabs...), plus icons,
                the logo and illustrations
  layout/       Header, menus, footer
  lib/          Code without pages: the API client, live events, formatting, storage, validation
  i18n/         Translations, one file per area and language (locales/en, fr, ar), and the language switch
  styles/       Tailwind setup, color tokens for light and dark, the board's look
```

Where a file goes: used by one area only, next to its page in `pages/<area>/`; used by several areas, in
`features/<subject>/`; used everywhere, in `components/`.

A few rules keep it easy to follow:

- A page never calls `fetch`. It uses a feature's hooks, which call the feature's `api.ts`, which uses
  `lib/api/http.ts`. Data from the server lives in the TanStack Query cache; after a change the matching keys are
  refreshed and every page showing that data follows.
- The two game screens, same screen and online (which also serves the games against the computer), are built from the
  same pieces in `features/game/components/`: `GameLayout`, `PlayersBar`, `GameStatus`, `GameBoard` and
  `MoveAnnouncer`.
- The game rules (`features/game/engine`) are plain TypeScript, with the same rules and error codes as the backend's
  engine. The same-screen game uses them, and an online match uses them only to show your disc before the server
  answers. The server decides every online move, the computer's included.
- Decisions (texts, ranks, which buttons show) are plain functions in small `*.ts` files; page components compose.
- Live events only write into the cache (`app/realtime.ts`): pages never know where an update came from.

### Translations and right-to-left

`src/i18n/locales/en/` is the reference: one file per area (`play.ts`, `profile.ts`...). `fr/` and `ar/` have the same
files with exactly the same keys: TypeScript checks it, and checks every key given to `t()`. Arabic turns the
whole page right-to-left (`dir="rtl"` on `<html>`), and layouts use logical properties (`ms-`, `me-`, `start`, `end`)
so they mirror by themselves.

## Checks

`npm run typecheck` (TypeScript, which also checks every key given to `t()` and that French and Arabic have every
English text), `npm run format:check` (Prettier), `npm run build` and `npm test` are the automatic checks.

`npm test` (needs Node 22) runs a few small tests with Vitest and Testing Library (`*.test.ts` and `*.test.tsx`, next to the code they
check). They cover three things that once went wrong: the hiding of the computer opponents (a real player called
`AI_Fan` must stay visible), the page of a match that is not open (it says "unavailable", not "Join this match?"),
and the two-factor panel after a page reload.

## Browsers

Checked in Chromium (the engine of Chrome, which the subject requires): every page in English at 1280 and 390 pixels
wide, in Arabic at 390, in light and dark mode, with no console message, no sideways scrolling and no serious
accessibility issue (color contrast included). Firefox and Safari (or Edge) have not been checked yet; the
browser support module needs that done by hand, with any limits written here.
