# How the frontend works

A guide for someone new to frontend work who has to explain this code. Read it once from top to bottom; each part
says where to look in the code. The [README](../README.md) says how to run, test and build the app.

- [1. What happens when someone opens the app](#1-what-happens-when-someone-opens-the-app)
- [2. Where things live](#2-where-things-live)
- [3. How a page gets its data](#3-how-a-page-gets-its-data)
- [4. Stack and why](#4-stack-and-why)
- [5. Area by area](#5-area-by-area)
- [6. The 3D board and the page background: on, off, removed](#6-the-3d-board-and-the-page-background-on-off-removed)
- [7. Where the data comes from](#7-where-the-data-comes-from)
- [8. Tests and checks](#8-tests-and-checks)
- [9. Questions evaluators are likely to ask](#9-questions-evaluators-are-likely-to-ask)
- [10. Known limits](#10-known-limits)

## 1. What happens when someone opens the app

1. The browser asks for any address, say `/play`. nginx (`nginx.conf`) answers `index.html` for every address that is
   not a file, so the app itself decides what to show. This is a "single-page application": one HTML page, and
   JavaScript changes what is inside it.
2. `index.html` loads the JavaScript built by Vite. A few inline lines first apply the saved light or dark mode and
   accent color and page background, so the page does not flash in the wrong colors.
3. `src/main.tsx` starts the app: it loads the translations (`src/i18n`) and the styles, and renders `App`.
4. `src/app/App.tsx` wraps everything in two providers: the data cache (TanStack Query) and the router.
5. `src/app/router.tsx` is the route table: one line per address, each pointing to a page in `src/pages/`. Pages are
   loaded lazily (`lazy: () => import(...)`), so the browser downloads a page's code only when it is opened.
6. Member pages sit under `RequireAuth` (`src/app/guards.tsx`): it asks the backend who is logged in
   (`GET /api/auth/me`) and sends visitors to `/login`, remembering where they wanted to go. Login and signup sit
   under `GuestOnly`, which sends a logged-in member on.
7. The page draws its components, and each component asks for the data it needs (section 3).

## 2. Where things live

```text
src/
  app/          the shell: route table, addresses (paths.ts), guards, data cache, live updates, navigation links
                (nav.ts), places where optional features plug in (extensions.ts)
  pages/        one folder per area: home, auth, play, tournaments, profile, settings, community, watch, history, info
  features/     code shared by several areas, one folder per subject: game, matches, tournaments, users, friends,
                chat, spectate, auth, account, board3d (the optional 3D board), backdrop (the optional page background)
  components/   pieces used everywhere: ui/ (the design system), icons, logo, illustrations, PageHeader, ModeCard
  layout/       the frame of every page: header, menus, footer
  i18n/         translations: locales/<en|fr|ar>/<area>.ts
  lib/          code without pages: the API client, live events, storage, formatting, validation
  styles/       Tailwind setup and the color tokens
  test/         test helpers and shared test data
```

The rule for where a file goes: used by one area only, next to its page in `pages/<area>/`; used by several areas, in
`features/<subject>/`; used everywhere, in `components/`.

A route file is `pages/<area>/<Name>Page.tsx`. It is kept short: it loads data and chooses what to show, and the
pieces it shows sit next to it (for example `pages/play/online/WaitingRoom.tsx`). Decisions that need no React (which
text to show, whose turn it is, which rank a player has) are plain functions in small `*.ts` files with their own
tests, such as `pages/play/offline/offlineText.ts` or `pages/community/leaderboard/ranking.ts`.

Inside a feature folder the files always have the same jobs:

| File           | Job                                                                          |
| -------------- | ---------------------------------------------------------------------------- |
| `types.ts`     | The shapes of the data the backend sends (TypeScript types)                  |
| `api.ts`       | One function per backend route, for example `matchesApi.listMine()`          |
| `hooks.ts`     | React hooks that load or change that data through the cache (`useMatchList`) |
| `components/`  | Components that several areas show                                           |
| `*.ts` helpers | Rules and calculations, tested on their own                                  |

## 3. How a page gets its data

Take the match history page, `/matches`:

1. `pages/history/HistoryPage.tsx` reads the filter and page number from the address (`?status=finished&page=2`, see
   `historyQuery.ts`) and calls `useMatchList(params)`.
2. `useMatchList` (`features/matches/hooks.ts`) is a TanStack Query hook. It looks in the cache under the key
   `['matches', 'list', params]`. If the data is not there, it calls `matchesApi.listMine(params)`.
3. `matchesApi.listMine` (`features/matches/api.ts`) is one line: `http.get('/matches/mine', { query: params })`.
4. `http` (`lib/api/http.ts`) is the only code that talks to the network. It adds `/api`, sends the request with the
   session cookie, returns the `data` of the answer, or throws an `ApiError` with the backend's error `code`.
5. Back in the page, the hook gives `isPending`, `error` or `data`. The page shows a spinner or skeleton while loading,
   `LoadError` with a Retry button on an error, `EmptyState` when the list is empty, and the list otherwise. Every
   panel handles these three states on its own.

What the cache adds, without any code in the page:

- Two components asking for the same key share one request and one answer.
- After a change (a move, a new match), the code calls `invalidateQueries` on the matching keys, and every page
  showing that data reloads it.
- Retries: timeouts (408), rate limits (429), server errors (5xx) and lost connections are tried twice more, after about
  1 and 3 seconds; other errors are not (`app/queryClient.ts`, `shouldRetry`). A `401` means the session ended: the app
  forgets the user.
- Polling: data that changes on its own is reloaded on a timer (`refetchInterval`). An online match is reloaded every
  2 seconds while the other player is expected (to join or to move), and every 5 seconds on your own turn
  (`pollInterval` in `features/matches/model.ts`).

A page never calls `fetch` itself. Error codes become sentences in the reader's language in `lib/errorMessage.ts`.
Every route, shape and error code is listed in [`api-contract.md`](api-contract.md).

Live updates: when the app is built with `VITE_REALTIME=socket`, `lib/realtime/socket.ts` opens one Socket.IO
connection after login. Events only write into the cache (`app/realtime.ts`), so pages never know whether new data
came from polling or from the socket. The Docker build turns live updates on (`VITE_REALTIME: socket` in the root
`docker-compose.yml`); without them, polling does the job alone.

## 4. Stack and why

Checked against `package.json`. Where the honest reason is only "it is the usual choice", it says so.

| Tool                      | What it does in this app                                                            | Why this one                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React 19                  | Every screen is built from components (functions that return what to draw)          | The mainstream choice: the most widely used UI library, so examples and help are everywhere. The subject lists it among the frontend frameworks of its framework modules                        |
| TypeScript (strict)       | Types for every value, checked before the code runs                                 | Catches mistakes before the browser does; a missing French or Arabic text even fails the type check                                                                                             |
| Vite                      | Development server with instant reload, and the production build                    | The usual tool for a new React app today; almost no configuration, and it splits each page into its own file                                                                                    |
| Tailwind CSS 4            | Styling with small classes (`bg-surface`, `p-4`, `ms-2`) that read the color tokens | Mainly the usual choice for React apps. Real gains here: no separate stylesheet per component, light and dark through tokens, and logical sides (`ms-`, `me-`) that mirror Arabic by themselves |
| React Router 7            | Matches the address to a page, guards member pages, loads pages lazily              | The standard router for React; one route table is easy to read                                                                                                                                  |
| TanStack Query 5          | The data cache: loading, errors, retries, polling, refresh after a change           | Without it every page would hand-write the same loading and refresh code (section 3)                                                                                                            |
| i18next and react-i18next | English, French and Arabic texts, with placeholders such as `{{name}}`              | The usual translation library for React                                                                                                                                                         |
| socket.io-client          | Live updates, only with `VITE_REALTIME=socket`                                      | The backend sends live events through Socket.IO, and this client reconnects by itself                                                                                                           |
| three, @react-three/fiber | The optional 3D board                                                               | Three.js is the standard WebGL library; React Three Fiber lets the 3D scene be written as React components like the rest of the app                                                             |
| Vitest                    | Runs the tests                                                                      | Reuses Vite's setup, so tests understand the same imports as the app                                                                                                                            |
| Testing Library and jsdom | Render components in tests and use them like a person: by role, label and text      | Tests then check what a user meets, not how the code is written. jsdom imitates a browser inside Node                                                                                           |
| axe-core                  | Accessibility checks in tests and in the browser                                    | The common open source engine for WCAG rules                                                                                                                                                    |
| Prettier                  | Formats every file the same way                                                     | Removes formatting debates; `npm run format` before each commit                                                                                                                                 |

Not used: ESLint (TypeScript's strict mode and Prettier are the only automatic checks), a component library (every
`ui` piece is written here, which the design system module needs) and a state library (the data cache plus React's own
state are enough).

Written here instead of taken from a library:

- the game rules (`features/game/engine`), with the same rules and error codes as the backend's engine;
- the computer opponent (`features/game/bot`): a negamax search with alpha-beta pruning and iterative deepening, run in
  a Web Worker so the page never freezes; each level searches more or less deeply and sometimes "slips", so it plays
  like a person and not perfectly, as the subject asks;
- the API client (`lib/api/http.ts`) and form validation (`lib/validation.ts`, `features/*/validation.ts`).

## 5. Area by area

### Shell and navigation (`app/nav.ts`, `layout/`)

- `app/nav.ts` is the one list of links: address, name, icon, whether visitors see it, whether it needs an account,
  which count it shows and when it is highlighted. The top bar, the phone menu and the login hint all read it.
  `inMenus: false` keeps a page out of the top bar and the phone menu while its route, its highlight and the login
  hint stay (Watch and Players are set this way for now).
- `layout/header/` splits the bar into small files: `Header` (asks who is logged in and the counts), `DesktopNav`,
  `MobileMenu`, `AccountMenu`, `LanguageMenu`, `SessionActions` (avatar menu, or Log in and Sign up, also when the server did not answer),
  `ThemeToggle`, `CountBadge`.
- Page width rule (a comment in `layout/AppLayout.tsx`): every page's title starts at the left edge of the column
  (`max-w-6xl`). A form or a long text below it may be narrower, but stays against that edge: no `mx-auto`. Only short
  notices such as "page not found" are centered.
- The two drop-down menus of the bar, the account menu and the language menu, are built the same way: a button with
  `aria-expanded`, a panel in the same style (`header/menuStyles.ts`), Tab to move through it, and `useDismiss` for
  Escape, a click outside and the focus going back to the button. Where there is room (Settings, the phone menu)
  language and appearance are rows of buttons (`LanguagePicker`, `ColorSchemePicker`), like the accent color. Native
  `<select>` is kept for form fields (sort order, the history filter on phones).
- The phone menu dims the page behind it; a tap on the dim layer, Escape or a click outside closes it.
- `features/auth/session.ts` turns the answer of `/auth/me` into four states: loading, visitor, member, failed. A
  member whose later check fails stays a member, because the cache keeps the last answer.
- A visitor sent to `/login` from a member page reads "Log in to open Watch." (`features/auth/loginHint.ts`) and comes
  back there after logging in.
- `pages/home/HomePage.tsx` only chooses: `Landing` for visitors, `Dashboard` for members. Each dashboard panel is its
  own file with loading, empty and error states. "Your turn" works without a backend field: seat 1 always starts and
  players alternate, so after an even number of moves it is seat 1's turn (`isMyTurn` in `dashboard/dashboard.ts`).

### Play (`pages/play/`, `features/game/`)

- Every game screen is built from the same pieces in `features/game/components/`: `GameLayout` (board column and side
  panel), `PlayersBar`, `GameStatus` (the banner), `GameBoard` (draws every board) and `MoveAnnouncer` (the line
  screen readers hear).
- The same-screen and computer pages share `offline/OfflineGamePage.tsx`, which shows `OfflineSetup` (the form) or
  `OfflineGame` (the game). The game state lives in the `useOfflineGame` hook; every sentence (whose turn, who won,
  after how many moves) comes from `offline/offlineText.ts`.
- `MatchPage.tsx` only loads the online match and picks a screen from `pages/play/online/`: `JoinMatch`,
  `WaitingRoom`, `OnlineGame` (with `ResultActions`: rematch, replay, new match) or `Unavailable`.
- Both boards stand in one box, the stage (`GameBoard.tsx` and `boardStage.css`): full column width, as high as the
  board's shape or the screen allows, in the page's surface color. Switching between 2D and 3D therefore moves
  nothing. The 3D scene reads the same color token as its backdrop, so it is light on a light page and dark on a
  dark one. Size the parent, not the board: a class on `<Board>` cannot change its width (`AuthLayout` does it with a
  20 rem box).
- Keyboard: the board takes focus when a game starts; arrow keys move, Enter or Space drops. There are no number keys: 1 to 9
  cannot reach a tenth column, and on a French keyboard the digits need Shift (`features/game/components/Board.tsx`).
- A win shows confetti (`pages/play/components/Celebration.tsx`): 36 pieces placed by arithmetic, none for people
  who asked their system for less motion, and none for a game that was already won when the page opened
  (`useJustWon.ts`, next to it).
- The setup forms start from the board of the last game on this device (`features/game/lastSettings.ts`, key
  `board-settings`). "Play again" on the hub starts a game at once with those settings.

### Tournaments (`pages/tournaments/`, `features/tournaments/`)

- Four short route files: `TournamentsPage`, `TournamentPage`, `NewTournamentPage`, `LocalTournamentPage`. Their pieces
  are in `online/` and `local/` next to them.
- Decisions are plain functions in `features/tournaments/view.ts`: `roundName` (Final, Semi-finals...), `canJoin`,
  `canLeave`, `canStart`, `canCancel` (which buttons show), `pairingToPlay`, `countMatches`.
- Online tournaments (list, create, join, leave, cancel, start, the bracket and its matches) all talk to the real
  backend, which also writes "your match is ready" in the chat of the two players. The two warnings in
  `Registration.tsx` (`startUnavailable` when Start now finds no route, and `fullWaiting` when a full tournament is
  still open) date from before the backend could start a tournament. This backend starts one at once when the last
  place is taken, so neither shows. `TournamentPage` checks the address with `isUuid` (`lib/ids.ts`) before asking the
  server.
- Each registered player's name links to their profile.
- The same-screen tournament is saved in the browser (`useLocalTournament.ts`, key `local-tournament`) after every
  result. Coming back to an unfinished one shows "Resume your tournament?" first. A match left halfway is not saved:
  only results are.
- `features/tournaments/components/BracketView.tsx` draws both kinds of tournament from one simple list of pairings;
  on a phone the bracket scrolls inside its own box, never the page. That box is `components/ui/ScrollFade.tsx`, the
  same piece as the row of tabs uses (`TabLinks`): `lib/useScrollEdges.ts` tells which edge hides more content and the
  `.scroll-fade` class draws the fade, so it follows the reading direction in Arabic.

### Profile and settings (`pages/profile/`, `pages/settings/`)

- `ProfilePage` only loads; `ProfileView` composes `ProfileHeader`, `ProfileActions` (friend, challenge, message,
  block), `ProfileStats`, `Achievements` and `RecentMatches`. Your own profile shows "Edit profile" instead of actions.
- Level and badges are computed, not stored (`features/users/achievements.ts`): 30 XP per win, 10 per draw, 5 per
  loss, a new level every 100 XP, and six badges that are simple comparisons. They can never disagree with the match
  history, and the page says how they are computed.
- `/settings` has four tabs (`TabLinks`): Profile (picture, display name), Security (two-factor, log out), Preferences
  (language, light or dark, accent color, page background, board colors for new games) and Blocked players. `resolveSection` in
  `settings/sections.ts` reads the tab from the address; an unknown tab goes back to `/settings`.
- Two-factor shows only the button that fits when the backend says whether it is on; it does not send that yet, so
  "Turn on" is the main button and a quiet "Already on? Turn it off" sits under it (section 10).

### Community (`pages/community/`, `features/chat/`, `features/friends/`)

- Players, Leaderboard and Friends share a row of tabs (`CommunityTabs`).
- The player search keeps its filters in the address (`?q=li&online=1&sort=wins&page=2`, `players/playerFilters.ts`),
  so a search can be reloaded or shared.
- The leaderboard asks the player search sorted by wins. `leaderboard/ranking.ts`: rank = offset + index + 1, win rate
  = wins / played, podium for the first three on page 1. The ranking is a real `<table>`, so screen readers read it by
  column.
- Friends: requests, friend list (online first, `friends/friendOrder.ts`) and sent requests. Blocked players are
  managed in Settings.
- Chat: on a phone only the list or one conversation shows (`features/chat/panes.ts`). `ChatThread` finds the player
  and handles errors, `Conversation` shows messages and the composer.

### Watch and history (`pages/watch/`, `pages/history/`)

- `features/matches/replay.ts` replays the list of columns of a match through the game engine and keeps every
  position. A replay therefore follows the real rules; a move the rules refuse stops the list instead of crashing.
- `pages/watch/useReplay.ts` holds the current move and the play timer; `ReplayControls` is only buttons, a slider and
  keys (left and right arrows, Home, End), and announces "Move 5 of 23".
- `WatchMatchPage` follows a live match, and turns into a replay once the match is over.
- `BoardShape` draws a small picture of a board from its size and colors. The live list has no positions, so each
  card on the Watch page asks for its own match once (`useMatchPreview`, the same cache entry as the match page,
  refreshed every 15 seconds) and passes the position as the optional `board` prop. That is at most 12 extra requests
  per page, well under the backend's limit.
- The live list asks again every 5 seconds, even when live events are on (`features/spectate/hooks.ts`): those events
  only cover matches you play or watch, never a new match of other people.
- History keeps its filter and page in the address (`historyQuery.ts`). Each row has one big link to the match and a
  Replay link above it (no link inside a link). Match rows follow the width of their list (`@container`), because the
  same list is shown full width in History and in a narrow card on the home page.

### Design system and identity (`styles/index.css`, `components/`, `pages/info/`)

- Every color is a token in `styles/index.css` (`--c-bg`, `--c-primary`...), with one value for light and one for
  dark. Tailwind classes such as `bg-surface` read the tokens, so no component has a raw color.
- Corner radii, shadows and animation durations are tokens too (`rounded-card`, `shadow-card`, `--duration-*`).
- The accent color only replaces the primary color (`lib/accent.ts`, `data-accent` on `<html>`). Blue is the default.
- `styles/tokens.test.ts` checks the contrast of every text and background pair in both themes and with each accent
  (at least 4.5 to 1, the WCAG AA level).
- `/design` shows the identity, both palettes, the type scale, every icon and every `ui` component with its variants
  (`pages/info/design/`, one file per section).
- Four illustrations in `components/illustrations/` are small inline SVGs, hidden from screen readers; `EmptyState`
  shows one.

### Translations and right-to-left (`src/i18n/`)

- One file per area and language: `locales/en/play.ts`, `locales/fr/play.ts`, `locales/ar/play.ts`. English is the
  reference; the French and Arabic files are typed with the English type, so a missing key fails `npm run typecheck`.
- A test checks that every language has the same keys and placeholders, and that a section of texts lives in one file.
- Choosing Arabic sets `dir="rtl"` on `<html>` (`i18n/index.ts`). Layouts use logical sides (`ms-`, `me-`, `start`,
  `end`), so they mirror by themselves. Text written by players gets `dir="auto"`.

### Accessibility

- One `<h1>` per page (`PageHeader`) and a page title (`useDocumentTitle`).
- Every field has a label, and its error is linked to it; the login and signup forms move the focus to the first
  wrong field.
- The board is played with the keyboard, and each move is announced (`MoveAnnouncer`, an `aria-live` region).
- Dialogs and menus close on Escape and give the focus back; icon-only buttons have a label (`IconButton`).
- Animations stop when the system asks for reduced motion.

## 6. The 3D board and the page background: on, off, removed

What it is: `src/features/board3d/` draws the board with Three.js. It has no game rules: it draws the state it is
given and calls `onPlay(column)`, so the engine (or the server) still decides every move. Its own
[README](../src/features/board3d/README.md) explains each file and answers the usual 3D questions (how the frame is
made, how a disc falls, how a click finds its column).

How it is connected: one definition in `src/features/game/components/GameBoard.tsx`. Every game screen draws its board
through `GameBoard`, so play, same-screen tournaments and spectating all get the 2D / 3D switch at once. The 3D code is
loaded lazily: Three.js (about 250 kB compressed) is downloaded only when someone picks 3D. The choice is saved in the
browser (key `board-view`). The switch shows only when the browser has WebGL 2; if the 3D code fails, the 2D board
comes back and the switch hides.

Turn it off without deleting anything: build with `VITE_BOARD_3D=off`. Three.js is then left out of the build.

Remove it for good:

1. `rm -r src/features/board3d`
2. In `src/features/game/components/GameBoard.tsx`, replace the definition of `Board3D` with
   `const Board3D: React.ComponentType<BoardProps> | null = null;`
3. `npm uninstall three @react-three/fiber @types/three`

`npm run typecheck`, `npm test` and `npm run build` pass after these three steps (checked). The `board3d` texts and
the `VITE_BOARD_3D` lines can stay; they do no harm.

### The page background, also optional (`features/backdrop/`)

Members pick a background for every page in Settings > Preferences: plain (the default), a soft glow in the accent
color, dots, a fine grid or a faint Connect Four board. The choice is saved on this device (key `backdrop`) and the
name goes in `data-backdrop` on `<html>`, the same idea as the accent color. `backdrop.css` draws each one on a single
fixed layer behind the page (`body::before`, `z-index: -1`), with CSS only and the color tokens, so it follows light
and dark mode and the accent color, is mirrored in Arabic and never moves. `backdrop.test.ts` checks that every text
color keeps a contrast of 4.5 to 1 on the strongest pixel of each background. Its own
[README](../src/features/backdrop/README.md) explains each file.

How it is connected: one line in `src/main.tsx`, `import '@/features/backdrop/register'`. The picker reaches Settings
through `src/app/extensions.ts`, a short list that Settings reads (empty when the feature is absent).

Remove it: `rm -r src/features/backdrop` and delete that one line in `src/main.tsx`. `npm run typecheck`, `npm test`
and `npm run build` pass after that (checked). The lines about `backdrop` in `index.html` can stay.

## 7. Where the data comes from

Every page that shows players, friends, chat, matches or tournaments reads them from the real backend: every route in
[`api-contract.md`](api-contract.md) is served there. Only the games on one screen, the games against the computer
and the same-screen tournament run in the browser alone, as the subject allows.

While the backend was being written, an in-browser demo server answered the missing routes with made-up players. It
was removed once chat, the last missing part, was built. What remains of that time is `setTransport` in
`lib/api/http.ts`, which the tests use to answer API calls with prepared data (`src/test/fakeApi.ts`).

## 8. Tests and checks

`npm test` runs more than 800 tests in about 100 files with Vitest:

- plain functions (engine, computer opponent, brackets, ranking, achievements, texts, URL filters...);
- components and whole pages rendered in jsdom and used like a person would (click, type, keys);
- accessibility: most page tests end with `expectNoA11yViolations(container)` (axe-core);
- `src/app/routes.test.tsx` opens every page of the route table as a visitor and as a member and expects one `<h1>`;
- any `console.error` or `console.warn` during a test fails it, because the subject rejects console messages.

Helpers in `src/test/`: `renderRoute('/path', { user })` and `renderWithProviders(ui)` render with the cache, the
router and English texts (`user: null` is a visitor); `fakeApi({ 'GET /friends': ... })` answers the requests of a test;
the fixture files in `test/fixtures/` hold sample data.

The other checks: `npm run typecheck` (TypeScript), `npm run format:check` (Prettier) and `npm run build`. Every page
was also opened in a real Chromium browser: in English at 1280 and 390 pixels wide, in Arabic at 390, in light and
dark mode, and the games in 3D (also in French), looking for console messages, sideways scrolling and accessibility
problems (color contrast included). Two members also played a real online match against the backend and opened its
replay.

## 9. Questions evaluators are likely to ask

**Which framework, and why?** React with TypeScript, built by Vite (section 4). Mostly because it is the mainstream
choice; TypeScript because it catches mistakes before they reach the browser.

**What happens when I reload `/tournaments`?** nginx answers `index.html` for any address that is not a file, the app
starts, and the router shows the page for that address (section 1).

**Where is the session kept? Can JavaScript read the token?** The backend sets an httpOnly `session` cookie at login.
JavaScript cannot read it, and the app stores no token itself: the browser sends the cookie with every request. The
app only asks `GET /api/auth/me` who is logged in.

**How are member pages protected?** `RequireAuth` in `app/guards.tsx` sends visitors to the login page. That is only
for comfort: the real protection is the backend, which answers `401` without a valid session.

**How are forms validated?** Twice: in the browser before sending (`lib/validation.ts` and the `validation.ts` files of
the features), and by the backend, whose error codes are shown as sentences (`lib/errorMessage.ts`).

**What stops a player from injecting HTML or scripts (XSS)?** React escapes every text it shows, and the app never
inserts raw HTML (no `dangerouslySetInnerHTML`). Chat messages and names are shown as plain text.

**Show me where a page gets its data.** Section 3, with `/matches` as the example.

**How does online play stay in sync?** In the Docker build (`VITE_REALTIME: socket`), the backend sends each move as
a `match:update` event, which goes straight into the cache (`src/app/realtime.ts`); the match is then reloaded only
every 30 seconds, in case an event was missed. Without live events it is reloaded every 2 seconds while waiting for
the other player (`pollInterval`). Either way, your own move shows at once and is confirmed by the server.

**How does the computer play? Is it unbeatable?** Section 4 ("Written here"): a search over the next moves, in a Web
Worker, with three levels that sometimes slip on purpose, so it is not perfect.

**How do translations work, and how would you add a language?** Section 5, "Translations". A new language is a new
folder in `locales/` with the same files, and one entry in `LANGUAGES` and in `resources` in `i18n/index.ts` (the
language menu reads that list).

**How is accessibility checked?** axe-core in the tests and in the browser, keyboard play with announcements, focus
management, a contrast test for every color pair (section 5, "Accessibility").

**How do you remove the 3D view?** Three steps (section 6). **The page background?** Two: delete its folder and one
line in `src/main.tsx` (section 6).

**Can you make a small change now?** Places that change one behavior each:

| Change                        | Where                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| XP per win or per level       | `XP_PER_RESULT`, `XP_PER_LEVEL` in `features/users/achievements.ts`                    |
| A link in the top bar         | `app/nav.ts`                                                                           |
| A text                        | `src/i18n/locales/<en, fr, ar>/<area>.ts` (all three languages)                        |
| A color                       | the tokens at the top of `styles/index.css` (the contrast test says if it is too pale) |
| How often a match is reloaded | `pollInterval` in `features/matches/model.ts`                                          |
| How fast a replay plays       | the timer in `pages/watch/useReplay.ts`                                                |
| The computer's levels         | `PROFILES` in `features/game/bot/bot.ts`                                               |

After a change: `npm run typecheck && npm test`.

## 10. Known limits

- The backend does not yet send `twoFactorEnabled` with the user, so Settings shows both two-factor buttons with a hint.
- The backend allows 100 requests a minute per route and per address. With live events on, a minute of chat between
  two windows on one computer uses about 40 of them, but many busy tabs or fast reloads on one computer can still reach
  it. The app retries and keeps the logged-in user when it happens.
- Any answer of 400 or more prints a red line in Chrome's console, even an expected one, such as a blocked player
  trying to send a message (`403 BLOCKED`).
- Tested in Chromium only. Firefox and Safari (or Edge) must be checked by hand for the browser support module.
- On a 1280 by 900 screen the 3D board is a little taller than the window, so the page scrolls slightly in 3D.
- On a 1280 by 800 laptop screen the game board starts about 355 px from the top (header, title, players, status,
  2D / 3D switch), so the page scrolls about 115 px to see all of it. The board is already as large as the
  screen allows; making it fit would need a smaller header and cards, not a smaller board.
