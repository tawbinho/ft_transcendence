# Frontend

The web app of ft_transcendence: Connect Four on one screen, against the computer or online, with profiles, friends,
chat, tournaments and a spectator mode, in English, French and Arabic.

Built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router and i18next.

## Quick start

You need Node.js 20.19 or newer, and the stack of the repository running (`docker compose up` at the root) for
everything that needs an account.

```sh
cd frontend
npm ci
npm run dev
```

Then open http://localhost:5173. The development server forwards `/api` and `/socket.io` to the HTTPS proxy on
https://localhost:8443, so logins, cookies and routes behave as in production. The home page, the games on one screen
and against the computer, the same-screen tournament and the legal pages also work without the backend.

## Scripts

| Command                | What it does                                               |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Development server, with instant reload                    |
| `npm run build`        | Type-checks, then builds the production files into `dist/` |
| `npm run preview`      | Serves `dist/` on http://localhost:4173                    |
| `npm run typecheck`    | Type-checks only                                           |
| `npm test`             | Runs the unit tests once                                   |
| `npm run test:watch`   | Runs the unit tests again on every change                  |
| `npm run format`       | Formats every file with Prettier                           |
| `npm run format:check` | Checks the formatting without changing anything            |

Before a commit: `npm run typecheck && npm test && npm run format:check`.

## Settings

Build-time settings, listed in `.env.example`. For `npm run dev`, copy it to `.env.local` (ignored by git) and change
what you need. With Docker, pass them as build arguments.

| Name                 | What it does                                                                                                                                           | Default                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `VITE_DEMO_FEATURES` | Features answered by the in-browser demo server until the backend has their routes: `users`, `friends`, `chat`, `spectate`, `tournaments`. Empty: none | All five                 |
| `VITE_REALTIME`      | `socket` to receive live updates over Socket.IO, once the backend has a gateway                                                                        | Polling only             |
| `API_PROXY_TARGET`   | Development only: where `npm run dev` forwards `/api` and `/socket.io`                                                                                 | `https://localhost:8443` |

## Running with Docker

The `Dockerfile` builds the app with Node, then serves `dist/` with nginx (`nginx.conf`): any path that is not a file
answers `index.html`, so the app's router shows the page, and the built files are cached for a year since their names
change with their content.

To start it with `docker compose up`, two files outside this folder need the lines below.

In `docker-compose.yml`, a `frontend` service, and the proxy waits for it:

```yaml
services:
  # db and backend stay as they are.

  frontend:
    build:
      context: ./frontend
      args:
        VITE_DEMO_FEATURES: users,friends,chat,spectate,tournaments
    restart: unless-stopped
    expose:
      - '80'

  proxy:
    # Everything else stays as it is; only frontend is added here.
    depends_on:
      - backend
      - frontend
```

In `proxy/nginx.conf`, only `/api` and `/socket.io` go to the backend, and every other path goes to the app. Replace
the line `location / {` with these two lines, and keep the block's content as it is:

```nginx
    # API calls and the live connection go to the backend.
    location ~ ^/(api|socket\.io)/ {
```

Then add this block before the last `}` of `server`:

```nginx
    # Everything else is the app, served by the frontend container.
    location / {
        set $frontend http://frontend:80;
        proxy_pass $frontend;
        # HTTP/1.1, or the frontend's nginx does not compress its answers.
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
```

The app is then served on https://localhost:8443 (`HTTPS_PORT` in the root `.env`), next to the API.

## How the code is organized

```text
src/
  app/          The shell: router, data cache, login guards, live updates
  components/   Shared components; ui/ is the design system (buttons, fields, dialogs...)
  features/     One folder per feature: api.ts (calls), types.ts (shapes), hooks.ts (data), components/
  pages/        One component per URL, built from features and components
  layout/       Header, footer, menus, demo banner
  lib/          Code without pages: the API client, live events, formatting, storage
  i18n/         Translations (en, fr, ar) and the language switch
  demo/         The in-browser demo server (temporary, see below)
  styles/       Tailwind setup, color palette, the board's look
  test/         Test setup and shared test data
```

A few rules keep it easy to follow:

- A page never calls `fetch`. It uses a feature's hooks, which call the feature's `api.ts`, which uses
  `lib/api/http.ts`.
- Data from the server lives in the TanStack Query cache, under keys defined per feature (`matchKeys`, `chatKeys`...).
  A change updates or refreshes those keys, and every page showing that data follows.
- Live events only write into that cache (`app/realtime.ts`): pages never know where an update came from.
- The game rules (`features/game/engine`) are plain TypeScript, without React, with the same rules and error codes as
  the backend's engine. Local games, the computer opponent and online matches all use them.
- The computer opponent (`features/game/bot`) runs in a Web Worker, so the page never freezes while it thinks. Its
  three levels search more or fewer moves ahead, and sometimes slip like a person would.

### Talking to the backend

`lib/api/http.ts` holds one `request` function: it adds `/api`, sends the session cookie, returns the `data` of the
answer, and throws an `ApiError` carrying the backend's `code` when the answer is an error. `lib/errorMessage.ts` turns
that code into a sentence in the reader's language. Any `401` logs the user out of the app (`app/queryClient.ts`).

Every route, shape, error code and live event is described in [`docs/api-contract.md`](docs/api-contract.md), with what
the backend still has to add.

### Live updates

Pages refresh their data by polling, on intervals listed in the API contract. With `VITE_REALTIME=socket`,
`lib/realtime/socket.ts` also opens one Socket.IO connection after login. Its events go through `lib/realtime/bus.ts`
to `app/realtime.ts`, which updates the cache, and polling slows down to every 30 seconds as a safety net.

### Translations and right-to-left

`src/i18n/locales/en.ts` is the reference. `fr.ts` and `ar.ts` must have exactly the same keys: a test checks it, and
TypeScript checks every key given to `t()`. Arabic turns the whole page right-to-left (`dir="rtl"` on `<html>`), and
layouts use logical properties (`ms-`, `me-`, `start`, `end`) so they mirror by themselves. Text written by players gets
`dir="auto"`, so a message keeps its own direction whatever the page's.

### Accessibility

Every form field has a label and its error is linked to it. The board is played with the keyboard (arrow keys, Home,
End, then Enter), and each move is announced to screen readers. Dialogs keep the focus inside them, and animations stop
when the system asks for reduced motion.

### The demo server

`src/demo` answers, inside the browser, the routes the backend does not have yet (players, friends, chat, spectating,
tournaments) with made-up players, saved in `localStorage`. It sits in front of the network (`setTransport` in
`lib/api/http.ts`): requests for the features in `VITE_DEMO_FEATURES` are answered there, and everything else, like
login and real matches, goes to the backend. A banner tells which pages use demo data, with a button to reset it.

When the backend serves every route, set `VITE_DEMO_FEATURES` to an empty value. The folder can then be deleted, with
the lines that load it in `main.tsx` and `layout/DemoBanner.tsx`.

## Testing

`npm test` runs the unit tests with Vitest and Testing Library: the game engine and the computer opponent, brackets,
the match model and statistics, form validation, the API client, the demo server, and the translations.
