# Frontend

The web app of ft_transcendence: Connect Four on one screen, against the computer or online, with profiles, friends,
chat, tournaments, a leaderboard, replays and a spectator mode, in English, French and Arabic, with an optional 3D
board.

Built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router and i18next; the optional 3D board
uses Three.js through React Three Fiber.

**Requirements:** Node.js 20.19 or newer (22 recommended; `.nvmrc` says 22). Node 18 is too old (six tests fail on
it), so check `node -v` before running anything. With [nvm](https://github.com/nvm-sh/nvm), in the `frontend` folder:

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
https://localhost:8443, so logins, cookies and routes behave as in production. The home page, the games on one screen
and against the computer, the same-screen tournament, the design page and the legal pages also work without the
backend.

## Scripts

| Command                | What it does                                               |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Development server, with instant reload                    |
| `npm run build`        | Type-checks, then builds the production files into `dist/` |
| `npm run preview`      | Serves `dist/` on http://localhost:4173                    |
| `npm run typecheck`    | Type-checks only                                           |
| `npm test`             | Runs the tests once                                        |
| `npm run test:watch`   | Runs the tests again on every change                       |
| `npm run format`       | Formats every file with Prettier                           |
| `npm run format:check` | Checks the formatting without changing anything            |

Before a commit: `npm run format`, then `npm run typecheck && npm test && npm run format:check`.

## Settings

Build-time settings, listed in `.env.example`. For `npm run dev`, copy it to `.env.local` (ignored by git) and change
what you need. With Docker, pass them as build arguments (`args:` of the `frontend` service in the root
`docker-compose.yml`).

| Name                 | What it does                                                                                                                                           | Default                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `VITE_DEMO_FEATURES` | Features answered by the in-browser demo server until the backend has their routes: `users`, `friends`, `chat`, `spectate`, `tournaments`. Empty: none | users, friends, chat, spectate |
| `VITE_REALTIME`      | `socket` to receive live updates over Socket.IO, once the backend has a gateway                                                                        | Polling only                   |
| `VITE_BOARD_3D`      | `off` leaves the 3D board and Three.js out of the build; anything else keeps the 2D / 3D switch                                                        | `on`                           |
| `API_PROXY_TARGET`   | Development only: where `npm run dev` forwards `/api` and `/socket.io`                                                                                 | `https://localhost:8443`       |

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
  pages/        One folder per area: home, auth, play, tournaments, profile, settings, community, watch, history,
                info. One route component per address, with the pieces only that area uses next to it
  features/     Code shared by several areas, one folder per subject: api.ts (calls), types.ts (shapes),
                hooks.ts (data), components/, and small tested helpers. board3d/ is the optional 3D board
  components/   Shared components; ui/ is the design system (buttons, fields, dialogs, tabs...), plus icons,
                the logo and illustrations
  layout/       Header, menus, demo banner, footer
  lib/          Code without pages: the API client, live events, formatting, storage, validation
  i18n/         Translations, one file per area and language (locales/en, fr, ar), and the language switch
  demo/         The in-browser demo server (temporary, see below)
  styles/       Tailwind setup, color tokens for light and dark, the board's look
  test/         Test helpers and shared test data
```

Where a file goes: used by one area only, next to its page in `pages/<area>/`; used by several areas, in
`features/<subject>/`; used everywhere, in `components/`.

A few rules keep it easy to follow:

- A page never calls `fetch`. It uses a feature's hooks, which call the feature's `api.ts`, which uses
  `lib/api/http.ts`. Data from the server lives in the TanStack Query cache; after a change the matching keys are
  refreshed and every page showing that data follows.
- Every game screen (same screen, computer, online match, spectator, same-screen tournament) is built from the same
  pieces in `features/game/components/`: `GameLayout`, `PlayersBar`, `GameStatus`, `GameBoard` and `MoveAnnouncer`.
- The game rules (`features/game/engine`) are plain TypeScript, with the same rules and error codes as the backend's
  engine. The computer opponent (`features/game/bot`) runs in a Web Worker, so the page never freezes while it thinks.
- Decisions (texts, ranks, which buttons show) are plain functions in small `*.ts` files with tests; page components
  compose.
- Live events only write into the cache (`app/realtime.ts`): pages never know where an update came from.

### Translations and right-to-left

`src/i18n/locales/en/` is the reference: one file per area (`play.ts`, `profile.ts`...). `fr/` and `ar/` have the same
files with exactly the same keys: a test checks it, and TypeScript checks every key given to `t()`. Arabic turns the
whole page right-to-left (`dir="rtl"` on `<html>`), and layouts use logical properties (`ms-`, `me-`, `start`, `end`)
so they mirror by themselves.

### The demo server

`src/demo` answers, inside the browser, the routes the backend does not have yet (players, friends, chat, spectating)
with made-up players saved in `localStorage`. Online tournament registration is served by the backend; list `tournaments`
in `VITE_DEMO_FEATURES` to use the demo version again. Requests for the features in `VITE_DEMO_FEATURES` are
answered there; everything else, like login and real matches, goes to the backend. A banner says so, with a Reset
button. When the backend serves every route, set `VITE_DEMO_FEATURES` to an empty value; the folder can then be
deleted, with the lines that load it in `main.tsx` and `layout/DemoBanner.tsx`. Every route the backend still has to
add is in [`docs/api-contract.md`](docs/api-contract.md).

## The 3D board (optional)

Every game screen has a 2D / 3D switch above the board (2D by default; the choice is saved in the browser). The 3D
board lives in `src/features/board3d/`, and only one definition outside that folder knows about it, in
`src/features/game/components/GameBoard.tsx`. Three.js is downloaded only when someone picks 3D. The switch shows only
in browsers with WebGL 2, and if the 3D board fails, the 2D board comes back.

- **Turn it off** without deleting anything: build with `VITE_BOARD_3D=off`.
- **Remove it**: delete `src/features/board3d`, replace the `Board3D` definition in `GameBoard.tsx` with
  `const Board3D: React.ComponentType<BoardProps> | null = null;`, then run
  `npm uninstall three @react-three/fiber @types/three`. Type check, tests and build pass after these three steps.

Details, and answers to the usual 3D questions, in [`src/features/board3d/README.md`](src/features/board3d/README.md).

## Testing

`npm test` runs more than 800 tests with Vitest and Testing Library: the game engine and the computer opponent,
brackets, rankings, achievements, form validation, the API client, the demo server, the translations, the shared
components, and every page rendered and used like a person would (clicks, typing, keys). Most page tests also run
axe-core for accessibility, and any console error or warning fails a test.

Helpers in `src/test/` keep page tests short:

- `renderWithProviders(ui, { user })` and `renderRoute('/path', { user })` render with the data cache, the router and
  English texts; `user: null` is a visitor. They also return `events` (user-event).
- `fakeApi({ 'GET /friends': {...} })` answers the requests of the test (an `ApiError` value makes a request fail).
  A request without an answer fails with a message that names it.
- `expectNoA11yViolations(container)` runs axe-core on what was rendered.
- `allowConsole()` (from `test/console`) lets a test print a console message it expects.
- `app/routes.test.tsx` opens every page for a visitor and a member; its fake answers come from
  `test/fixtures/api/<area>.ts`.

## Browsers

Checked in Chromium (the engine of Chrome, which the subject requires): every page in English at 1280 and 390 pixels
wide, in Arabic at 390, in light and dark mode, and the games in 3D, with no console message, no sideways scrolling
and no serious accessibility issue (color contrast included). Firefox and Safari (or Edge) have not been checked yet; the
browser support module needs that done by hand, with any limits written here.
