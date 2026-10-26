# How the frontend works

A guide for someone new to frontend work who has to explain this code. Read it once from top to bottom; each part
says where to look in the code. The [README](../README.md) says how to run and build the app.

- [1. What happens when someone opens the app](#1-what-happens-when-someone-opens-the-app)
- [2. Where things live](#2-where-things-live)
- [3. How a page gets its data](#3-how-a-page-gets-its-data)
- [4. Stack and why](#4-stack-and-why)
- [5. Area by area](#5-area-by-area)
- [6. Games against the computer](#6-games-against-the-computer)
- [7. Where the data comes from](#7-where-the-data-comes-from)
- [8. Checks](#8-checks)
- [9. Questions evaluators are likely to ask](#9-questions-evaluators-are-likely-to-ask)
- [10. Known limits](#10-known-limits)

## 1. What happens when someone opens the app

1. The browser asks for any address, say `/play`. nginx (`nginx.conf`) answers `index.html` for every address that is
   not a file, so the app itself decides what to show. This is a "single-page application": one HTML page, and
   JavaScript changes what is inside it.
2. `index.html` loads the JavaScript built by Vite. A few inline lines first apply the saved light or dark mode, so the
   page does not flash in the wrong colors.
3. `src/main.tsx` starts the app: it loads the translations (`src/i18n`) and the styles, and renders `App`.
4. `src/app/App.tsx` wraps everything in two providers: the data cache (TanStack Query) and the router.
5. `src/app/router.tsx` is the route table: one line per address, each pointing to a page in `src/pages/`. Pages are
   loaded lazily (`lazy: () => import(...)`), so the browser downloads a page's code only when it is opened.
6. Member pages sit under `RequireAuth` (`src/app/guards.tsx`): it asks the backend who is logged in
   (`GET /api/auth/me`) and sends visitors to `/login`, remembering where they wanted to go. Login and signup sit
   under `GuestOnly`, which sends a logged-in member on. The email code pages (`/verify-email`, `/forgot-password`)
   are open to everyone.
7. The page draws its components, and each component asks for the data it needs (section 3).

## 2. Where things live

```text
src/
  app/          the shell: route table, addresses (paths.ts), guards, data cache, live updates, navigation links
                (nav.ts)
  pages/        one folder per area: home, auth, play, tournaments, profile, settings, community, history, info
  features/     code shared by several areas, one folder per subject: game, matches, tournaments, users, friends,
                chat, auth, account
  components/   pieces used everywhere: ui/ (the design system), icons, logo, illustrations, PageHeader, ModeCard
  layout/       the frame of every page: header, menus, footer
  i18n/         translations: locales/<en|fr|ar>/<area>.ts
  lib/          code without pages: the API client, live events, storage, formatting, validation
  styles/       Tailwind setup and the color tokens
```

The rule for where a file goes: used by one area only, next to its page in `pages/<area>/`; used by several areas, in
`features/<subject>/`; used everywhere, in `components/`.

A route file is `pages/<area>/<Name>Page.tsx`. It is kept short: it loads data and chooses what to show, and the
pieces it shows sit next to it (for example `pages/play/online/WaitingRoom.tsx`). Decisions that need no React (which
text to show, whose turn it is, which rank a player has) are plain functions in small `*.ts` files next to
the page, such as `pages/play/offline/offlineText.ts` or `pages/community/leaderboard/ranking.ts`.

Inside a feature folder the files always have the same jobs:

| File           | Job                                                                          |
| -------------- | ---------------------------------------------------------------------------- |
| `types.ts`     | The shapes of the data the backend sends (TypeScript types)                  |
| `api.ts`       | One function per backend route, for example `matchesApi.listMine()`          |
| `hooks.ts`     | React hooks that load or change that data through the cache (`useMatchList`) |
| `components/`  | Components that several areas show                                           |
| `*.ts` helpers | Rules and calculations, kept out of the components                           |

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
  (`pollInterval` in `features/matches/model.ts`). While live events arrive, these timers slow down to 30 seconds
  (`LIVE_POLL_MS`), except for a match still waiting for its second player (section 6).

A page never calls `fetch` itself. Error codes become sentences in the reader's language in `lib/errorMessage.ts`.
Every route, shape and error code is listed in [`api-contract.md`](api-contract.md).

Live updates: after login, `lib/realtime/socket.ts` opens one Socket.IO connection, and closes it at logout. It is the
same in Docker and with `npm run dev`, whose server forwards `/socket.io` too. Events only write into the cache
(`app/realtime.ts`), so pages never know whether new data came from polling or from the socket. Polling stays as the
safety net: when the connection drops, the timers above go back to full speed until Socket.IO reconnects by itself.
Every login and logout reaches every player as a `presence` event: the online dot is changed in the friend list and
conversations already loaded (`setOnlineInLists`), without a request, because both are loaded on every page for the
menu badges.

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
| socket.io-client          | Live updates: one connection per logged-in tab                                      | The backend sends live events through Socket.IO, and this client reconnects by itself                                                                                                           |
| Prettier                  | Formats every file the same way                                                     | Removes formatting debates; `npm run format` before each commit                                                                                                                                 |

Not used: ESLint (TypeScript's strict mode and Prettier are the only automatic checks), a component library (every
`ui` piece is written here, which the design system module needs) and a state library (the data cache plus React's own
state are enough).

Written here instead of taken from a library:

- the game rules (`features/game/engine`), with the same rules and error codes as the backend's engine;
- the API client (`lib/api/http.ts`) and form validation (`lib/validation.ts`, `features/*/validation.ts`).

The computer opponent is not written here: the server plays it (section 6).

## 5. Area by area

### Shell and navigation (`app/nav.ts`, `layout/`)

- `app/nav.ts` is the one list of links: address, name, icon, whether visitors see it, whether it needs an account,
  which count it shows and when it is highlighted. The top bar, the phone menu and the login hint all read it.
  `inMenus: false` keeps a page out of the top bar and the phone menu while its route, its highlight and the login
  hint stay (Players is set this way for now).
- `layout/header/` splits the bar into small files: `Header` (asks who is logged in and the counts), `DesktopNav`,
  `MobileMenu`, `AccountMenu`, `LanguageMenu`, `SessionActions` (avatar menu, or Log in and Sign up, also when the server did not answer),
  `ThemeToggle`, `CountBadge`.
- Page width rule (a comment in `layout/AppLayout.tsx`): every page's title starts at the left edge of the column
  (`max-w-6xl`). A form or a long text below it may be narrower, but stays against that edge: no `mx-auto`. Only short
  notices such as "page not found" are centered.
- The two drop-down menus of the bar, the account menu and the language menu, are built the same way: a button with
  `aria-expanded`, a panel in the same style (`header/menuStyles.ts`), Tab to move through it, and `useDismiss` for
  Escape, a click outside and the focus going back to the button. Where there is room (Settings, the phone menu)
  language and appearance are rows of buttons (`LanguagePicker`, `ColorSchemePicker`). The sort and filter drop-downs
  (sort order, the history filter) are `components/ui/SelectField.tsx`: a button that opens a list of buttons, like the
  language menu.
- On phones a visitor (or an unknown session) sees Log in and Sign up in the bar next to the menu button; the name beside
  the logo is hidden then, so both fit at 320px in English, French and Arabic. A member sees chat and the menu button.
- The phone menu dims the page behind it; a tap on the dim layer, Escape or a click outside closes it.
- `features/auth/session.ts` turns the answer of `/auth/me` into four states: loading, visitor, member, failed. A
  member whose later check fails stays a member, because the cache keeps the last answer.
- A visitor sent to `/login` from a member page reads "Log in to open Players." (`features/auth/loginHint.ts`) and comes
  back there after logging in.
- Signing up does not log in: the backend emails a 6-digit code and the app opens `/verify-email`
  (`pages/auth/VerifyEmailPage.tsx`), where six boxes take it (`components/ui/OtpInput.tsx`, an empty box is a space
  in its value) and a full code is sent at once. A login refused with `EMAIL_NOT_VERIFIED` links to that page.
  `/forgot-password` asks for the email, then the code with the new password. "Send a new code" waits 30 seconds
  (`features/auth/components/ResendCode.tsx`). Without Gmail settings in the root `.env`, the code is only in the
  backend log.
- `pages/home/HomePage.tsx` only chooses: `Landing` for visitors, `Dashboard` for members. Each dashboard panel is its
  own file with loading, empty and error states. "Your turn" works without a backend field: seat 1 always starts and
  players alternate, so after an even number of moves it is seat 1's turn (`isMyTurn` in `dashboard/dashboard.ts`).

### Play (`pages/play/`, `features/game/`)

- The two game screens, same screen and online, are built from the same pieces in `features/game/components/`:
  `GameLayout` (board column and side panel), `PlayersBar`, `GameStatus` (the banner), `GameBoard` (draws every board)
  and `MoveAnnouncer` (the line screen readers hear).
- The same-screen page, `LocalGamePage.tsx`, shows `offline/OfflineSetup` (two names and the board) or
  `offline/OfflineGame` (the game). The game is the list of moves kept by the `useOfflineGame` hook: the board is
  rebuilt from it, and Undo removes the last one. Every sentence (whose turn, who won, after how many moves) comes from
  `offline/offlineText.ts`.
- "Against the computer" is an online match against one of the server's computer players (section 6).
- The online form, `NewMatchPage.tsx`, has nothing to type: the opponent is "Anyone with the link" or a friend
  (`online/OpponentPicks.tsx`), or the player a Challenge or Invite link filled in (`?opponent=<name>&invite=<id>`).
  The server tells a picked player nothing, so after "Create match" the form posts the invitation in your chat with
  them. The Play page and the form show `online/OpenMatchNotice.tsx`: your match in progress or still waiting, with a
  link back to it.
- `MatchPage.tsx` only loads the online match and picks a screen from `pages/play/online/`: `JoinMatch`,
  `WaitingRoom`, `OnlineGame` (with `ResultActions`: rematch, which invites a person in the chat again, and new match)
  or `Unavailable`.
- The board stands in a box, the stage (`GameBoard.tsx` and `boardStage.css`): full column width, as high as the
  board's shape or the screen allows, in the page's surface color. Size the parent, not the board: a class on
  `<Board>` cannot change its width (`AuthLayout` does it with a 20 rem box).
- Keyboard: the board takes focus when a game starts; arrow keys move, Enter or Space drops. There are no number keys: 1 to 9
  cannot reach a tenth column, and on a French keyboard the digits need Shift (`features/game/components/Board.tsx`).
- A win shows confetti (`pages/play/components/Celebration.tsx`): 36 pieces placed by arithmetic, none for people
  who asked their system for less motion, and none for a game that was already won when the page opened
  (`useJustWon.ts`, next to it).
- The setup forms start from the board of the last game on this device (`features/game/lastSettings.ts`, key
  `board-settings`).

### Tournaments (`pages/tournaments/`, `features/tournaments/`)

- Three short route files: `TournamentsPage`, `TournamentPage`, `NewTournamentPage`. Their pieces are in `online/`
  next to them. Tournaments are online only: the backend builds the bracket and creates the matches.
- Decisions are plain functions in `features/tournaments/view.ts`: `roundName` (Semi-finals or Final), `canJoin`,
  `canLeave`, `canCancel` (which buttons show), `pairingToPlay`.
- Online tournaments (list, create, join, leave, cancel, the bracket and its matches) all talk to the real backend,
  which also writes "your match is ready" in the chat of the two players. Every tournament has 4 places and nobody
  starts it by hand: the backend starts it when the 4th player joins, and `Registration.tsx` shows "Waiting for 4
  players" until then. `TournamentPage` checks the address with `isUuid` (`lib/ids.ts`) before asking the server.
- Each registered player's name links to their profile.
- `features/tournaments/components/BracketView.tsx` draws the bracket from one simple list of pairings, which
  `online/TournamentBracket.tsx` makes from the server's rounds. On a phone the bracket scrolls sideways inside its own
  box (`overflow-x-auto`), never the page, like the row of tabs (`TabLinks`). The box can take the keyboard focus, so
  the arrow keys scroll it too.

### Profile and settings (`pages/profile/`, `pages/settings/`)

- `ProfilePage` only loads; `ProfileView` composes `ProfileHeader`, `ProfileActions` (friend, challenge, message,
  block), `ProfileStats`, `Achievements` and `RecentMatches`. Your own profile shows "Edit profile" instead of actions.
- Level and badges are computed, not stored (`features/users/achievements.ts`): 30 XP per win, 10 per draw, 5 per
  loss, a new level every 100 XP, and six badges that are simple comparisons. They can never disagree with the match
  history, and the page says how they are computed.
- `/settings` has four tabs (`TabLinks`): Profile (picture, display name), Security (two-factor, log out), Preferences
  (language, light or dark, board colors for new games) and Blocked (the players you blocked). `resolveSection` in
  `settings/sections.ts` reads the tab from the address; an unknown tab goes back to `/settings`. On a phone the tabs
  are smaller, so the four fit at 360 px in the three languages.
- Two-factor shows only the button that fits when the backend says whether it is on; it does not send that yet, so
  "Turn on" is the main button and a quiet "Already on? Turn it off" sits under it (section 10). Right after turning it
  on, the 10 backup codes are shown once (`features/account/BackupCodes.tsx`, with a copy button); the login code field
  and "Turn off" accept one of them instead of the 6 digits (`validateCodeOrBackupCode`).

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
  and handles errors, `Conversation` shows messages and the composer. "Invite to play" opens the online match form
  with the player picked (`paths.challenge`); after "Create match" the invitation is posted in the chat of whoever is
  picked (`pages/play/NewMatchPage.tsx`).

### History (`pages/history/`)

- The statistics at the top (`HistoryStats.tsx`) are the server's numbers for your profile (`useProfile`, the `stats`
  of `GET /api/users/:displayName`), so they always equal your profile page. They count finished matches only.
- `BoardShape` draws a small picture of a board from its size and colors (used by the rows of the match list).
- History keeps its filter and page in the address (`historyQuery.ts`). Each row is one big link to the match. Match
  rows follow the width of their list (`@container`), because the same list is shown full width in History and in a
  narrow card on the home page.

### Design system and identity (`styles/index.css`, `components/`, `pages/info/`)

- Every color is a token in `styles/index.css` (`--c-bg`, `--c-primary`...), with one value for light and one for
  dark. Tailwind classes such as `bg-surface` read the tokens, so no component has a raw color.
- Corner radii, shadows and animation durations are tokens too (`rounded-card`, `shadow-card`, `--duration-*`).
- Every text and background pair keeps a contrast of at least 4.5 to 1 (the WCAG AA level) in both themes. A test used
  to check it and was removed, so after changing a color, check the ratio by hand (the browser's developer tools show
  it).
- Four illustrations in `components/illustrations/` are small inline SVGs, hidden from screen readers; `EmptyState`
  shows one.

### Translations and right-to-left (`src/i18n/`)

- One file per area and language: `locales/en/play.ts`, `locales/fr/play.ts`, `locales/ar/play.ts`. English is the
  reference; the French and Arabic files are typed with the English type, so a missing key fails `npm run typecheck`.
- `t()` only accepts keys that exist in the English texts (`i18n/i18next.d.ts`), so a misspelled key fails `npm run typecheck`.
- Choosing Arabic sets `dir="rtl"` on `<html>` (`i18n/index.ts`). Layouts use logical sides (`ms-`, `me-`, `start`,
  `end`), so they mirror by themselves. Text written by players gets `dir="auto"`.

### Accessibility

- One `<h1>` per page (`PageHeader`) and a page title (`useDocumentTitle`).
- Every field has a label, and its error is linked to it; the login and signup forms move the focus to the first
  wrong field.
- The board is played with the keyboard, and each move is announced (`MoveAnnouncer`, an `aria-live` region).
- Dialogs and menus close on Escape and give the focus back; icon-only buttons have a label (`IconButton`).
- Animations stop when the system asks for reduced motion.

## 6. Games against the computer

The computer opponents belong to the backend: three accounts, `AI_Easy`, `AI_Medium` and `AI_Hard`, whose moves the
server chooses (the root README explains how). The frontend never chooses a move for them:

1. The Play page's "Against the computer" card and the dashboard's button open `/play/computer`
   (`pages/play/ComputerGamePage.tsx`): a level (`COMPUTER_PLAYERS` in `features/users/computerPlayers.ts`, Medium
   first), the board and a preview. A visitor logs in first and comes back to the page.
2. "Start game" sends `POST /api/matches` with the computer's name as `opponentDisplayName`, exactly like a match kept
   for a person (but no chat invitation: a computer has no chat).
3. The server makes the computer join at once, often before the page has asked for the match's live events. So
   `useMatch` asks for the match again whenever the page opens, and keeps polling every 2 seconds while a match waits,
   even with live events (`features/matches/hooks.ts`). The game starts within a second.
4. From then on it is an ordinary online match (`OnlineGame`): your move goes to `POST /api/matches/:id/moves`, and the
   computer's answer arrives a second or two later as a `match:update` event ("The computer is thinking…" meanwhile).
   After it, New match goes back to `/play/computer`. The results count in History, on the profile and on the
   leaderboard like any other match.

The computer players are hidden where a person would be expected: the friends pages, the player search and the
leaderboard (`withoutComputerPlayers`). Their names are not links, and they have no profile page and no chat
(`isComputerPlayer`).

## 7. Where the data comes from

Every page that shows players, friends, chat, matches or tournaments reads them from the real backend: every route in
[`api-contract.md`](api-contract.md) is served there. Only the game on one screen runs in the browser alone, as the
subject allows; a game against the computer is an online match (section 6).

While the backend was being written, an in-browser demo server answered the missing routes with made-up players. It
was removed once chat, the last missing part, was built.

## 8. Checks

The checks are `npm run typecheck` (TypeScript, which also checks every translation key), `npm run format:check`
(Prettier), `npm run build` and `npm test`. The tests (Vitest, with Testing Library for the two that draw a page) sit
next to the code they check, in `*.test.ts` and `*.test.tsx`. There are only a few, for the three bugs found while testing
the whole site: `features/users/computerPlayers.test.ts`, `pages/play/MatchPage.test.tsx` and
`features/account/TwoFactorPanel.test.tsx` (with `features/auth/api.test.ts`).

Every page was also opened by hand in a real Chromium browser, in English at 1280 and 390 pixels wide, in Arabic at
390, in light and dark mode, looking for console messages, sideways scrolling and accessibility problems (color
contrast included). Two members also played a real online match against the backend, and the computer was played at
the easy and hard levels, on the classic board and on a 9 by 7 board. Repeat this after a big change.

## 9. Questions evaluators are likely to ask

**Which framework, and why?** React with TypeScript, built by Vite (section 4). Mostly because it is the mainstream
choice; TypeScript because it catches mistakes before they reach the browser.

**What happens when I reload `/tournaments`?** nginx answers `index.html` for any address that is not a file, the app
starts, and the router shows the page for that address (section 1).

**Where is the session kept? Can JavaScript read the token?** The backend sets an httpOnly `session` cookie at login.
JavaScript cannot read it, and the app stores no token itself: the browser sends the cookie with every request. The
app only asks `GET /api/auth/me` who is logged in.

**Why does sign up ask for a code from an email?** The backend proves the person owns the email before the first
login. Signup creates the account unverified and emails a 6-digit code; only its hash is stored, it lasts 15 minutes,
works once and stops after 5 wrong tries. The app's part is the code page and the login alert that links to it
(section 5, "Shell and navigation").

**How are member pages protected?** `RequireAuth` in `app/guards.tsx` sends visitors to the login page. That is only
for comfort: the real protection is the backend, which answers `401` without a valid session.

**How are forms validated?** Twice: in the browser before sending (`lib/validation.ts` and the `validation.ts` files of
the features), and by the backend, whose error codes are shown as sentences (`lib/errorMessage.ts`).
The email and password rules live in `features/auth/validation.ts` and copy the backend's DTOs: an email is
`local@domain` (local part at most 64 characters, no leading, trailing or double dot; domain labels of letters, digits
and hyphens; a last label of at least 2 letters; 254 characters in all), a new password has 8 to 128 characters
(counted like the backend, one emoji is one character), and login only checks that the password is not empty and not
longer than 128. Length limits are shown as messages instead of cutting what is typed with `maxLength`.

**What stops a player from injecting HTML or scripts (XSS)?** React escapes every text it shows, and the app never
inserts raw HTML (no `dangerouslySetInnerHTML`). Chat messages and names are shown as plain text.

**Show me where a page gets its data.** Section 3, with `/matches` as the example.

**How does online play stay in sync?** After login the app keeps one Socket.IO connection. The backend sends each
move as a `match:update` event, which goes straight into the cache (`src/app/realtime.ts`); the match is then reloaded
only every 30 seconds, in case an event was missed. While the connection is down, it is reloaded every 2 seconds while
waiting for the other player (`pollInterval`). Either way, your own move shows at once and is confirmed by the server.

**What if a player closes the tab or loses the network?** The backend waits `DISCONNECT_GRACE_SECONDS` (30 by
default) for them to come back, so a reload or a short cut does not end the match. Meanwhile the other player sees
"bob lost the connection…" (`pages/play/online/useOpponentAway.ts`, from the live `presence` event). If they do not
come back, they lose (`endReason: "disconnect"`) and the banner says "bob left the match."

**How does the computer play? Is it unbeatable?** The server plays it (section 6): the app only creates an online
match against `AI_Easy`, `AI_Medium` or `AI_Hard`. The backend's search sometimes slips on purpose, more at the easy
level, so it is not perfect (the root README explains it).

**How do translations work, and how would you add a language?** Section 5, "Translations". A new language is a new
folder in `locales/` with the same files, and one entry in `LANGUAGES` and in `resources` in `i18n/index.ts` (the
language menu reads that list).

**How is accessibility handled?** Labels linked to their errors, keyboard play with announcements, focus management,
reduced motion, and color pairs that keep a contrast of 4.5 to 1 (section 5, "Accessibility"). It was checked by hand in
the browser, with no automatic test at the moment.

**Can you make a small change now?** Places that change one behavior each:

| Change                        | Where                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| XP per win or per level       | `XP_PER_RESULT`, `XP_PER_LEVEL` in `features/users/achievements.ts`                |
| A link in the top bar         | `app/nav.ts`                                                                       |
| A text                        | `src/i18n/locales/<en, fr, ar>/<area>.ts` (all three languages)                    |
| A color                       | the tokens at the top of `styles/index.css` (keep text and background at 4.5 to 1) |
| How often a match is reloaded | `pollInterval` in `features/matches/model.ts`                                      |
| The level picked first        | `DEFAULT_COMPUTER_PLAYER` in `features/users/computerPlayers.ts`                   |

After a change: `npm run typecheck && npm run format:check && npm test`.

## 10. Known limits

- The backend does not send `twoFactorEnabled` with the user, so Settings asks `GET /auth/2fa/backup-codes` once
  (`useTwoFactorStatus`): an answer means two-factor is on, `TWO_FACTOR_NOT_ENABLED` means it is off.
- The app does not count or renew the backup codes (`GET` and `POST /auth/2fa/backup-codes`): turning two-factor off
  and on again gives 10 new ones.
- The backend allows 100 requests a minute per route and per address. A minute of chat between two windows on one
  computer uses about 40 of them, but many busy tabs or fast reloads on one computer can still reach it. The app
  retries and keeps the logged-in user when it happens.
- Any answer of 400 or more prints a red line in Chrome's console, even an expected one, such as a blocked player
  trying to send a message (`403 BLOCKED`), or someone opening the link of a match that has already started without
  playing in it (`404`: only its players can read it then).
- Tested in Chromium only. Firefox and Safari (or Edge) must be checked by hand for the browser support module.
- On a 1280 by 800 laptop screen the game board starts well below the top (header, title, players, status), so the page
  scrolls a little to see all of it. The board is already as large as the screen allows; making it fit would need a
  smaller header and cards, not a smaller board. Not measured again since the 2D / 3D switch was removed.
