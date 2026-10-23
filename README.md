*This project has been created as part of the 42 curriculum by atawbi, rnehme, fel-ghaz.*

# ft_transcendence — Connect Four

## Description

**Connect Four** is a web application where players play Connect Four against each other online, against a
computer opponent, or on the same screen. Players have accounts, profiles, friends and private chat, can enter
tournaments, and the whole interface is available in English, French and Arabic (with right-to-left layout).

**Key features**

- Online Connect Four with live updates, reconnection after a refresh or a network cut, and server-side rules (the
  server judges every move).
- Computer opponents (3 levels) that run on the server and can be beaten.
- Accounts with email and password (Argon2), database sessions, optional two-factor authentication with backup codes.
- Profiles, avatars, friends with online status, blocking, private chat with invitations and read receipts.
- Single-elimination tournaments (4 or 8 places, byes, turn timeout).
- Statistics, match history, leaderboard, levels and badges.
- Custom boards (size, win length, theme) and light/dark appearance.
- Privacy Policy and Terms of Service pages, linked in the footer.

## Instructions

**Prerequisites:** Docker with the Compose plugin (nothing else is needed to run the project) and `openssl`
(only to generate a key).

```bash
# 1. create the local env file (it is ignored by Git)
cp .env.example .env
# 2. put a real key in .env: TWO_FACTOR_KEY must be 64 hex characters
#      openssl rand -hex 32
# 3. one command builds and starts everything (database, backend, frontend, HTTPS proxy)
docker compose up --build -d
```

Open **https://localhost:8443** (the port is `HTTPS_PORT` in `.env`). The certificate is self-signed and created
automatically at the first start, so the browser shows a warning: click *Advanced*, then *Proceed to localhost*.
Database tables are created automatically at startup (migrations run when the backend starts).

Useful addresses: the app at `/` and the legal pages at `/privacy` and `/terms`.
More commands, the configuration table and every API route are in [Technical documentation](#technical-documentation)
below. The frontend has its own README in [frontend/README.md](frontend/README.md).

## Team Information

| Login | Role(s) | Responsibilities |
| ----- | ------- | ---------------- |
| **atawbi** | Technical Lead, Developer, Project Manager | Chose the architecture and stack (NestJS, TypeORM, PostgreSQL, Docker, HTTPS proxy). Built the backend core: authentication, sessions, 2FA, the game engine, matches, real-time (Socket.IO), the AI opponent, tournaments and chat. Organised the work and reviewed merges. |
| **rnehme** | Frontend Developer, Product Owner | Built the whole frontend: pages, game board, design system, three languages with RTL, accessibility, legal pages. Defined what the product must do and validated finished features. |
| **fel-ghaz** | Backend Developer, Product Owner | Built the backend social side: player search and presence, profiles and match history, display name, avatars, friends and blocks. Defined what the product must do and validated finished features. |

## Project Management

- **Organisation:** the work was split by area: backend core (atawbi), social backend (fel-ghaz) and frontend
  (rnehme). The backend API was designed and documented first (`backend/docs/openapi.yaml`, Swagger), so the frontend
  could be built against a stable contract. Each area was developed on its own branch and merged into `main`.
- **Meetings:** TODO (team to fill in: how often the team met).
- **Tools:** Git and GitHub (branches and merges), the Swagger page and `frontend/docs/api-contract.md` as the
  shared API contract.
- **Communication:** Gmail, Whatsapp , OnCampus Meetings

## Technical Stack

| Part | Technology |
| ---- | ---------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, i18next, Socket.IO client |
| Backend | NestJS (Node 22), TypeScript, TypeORM, Socket.IO, Argon2, class-validator |
| Database | PostgreSQL 17 |
| Deployment | Docker Compose: `db`, `backend`, `frontend` (nginx), `proxy` (nginx, HTTPS) |
| Tests | Vitest (backend) |

**Justification of the main choices**

- **PostgreSQL:** the data is strongly relational (users, matches, tournaments, friendships) and we need
  transactions and row locks so that two players can never take the same seat or play the same move twice.
- **NestJS + TypeORM:** a structured framework (modules, guards, validation pipes) and an ORM with migrations, so the
  schema changes only through reviewed migration files (`synchronize` is off).
- **Database sessions instead of JWT:** one httpOnly `session` cookie; only its SHA-256 hash is stored, and logout
  takes effect immediately.
- **Socket.IO:** reconnection and rooms (one room per user, one per open match) come built in.
- **React + Tailwind:** components, colour tokens for light/dark, and logical sides (`ms-`, `me-`) that mirror
  automatically for Arabic.
- **nginx HTTPS proxy:** the subject requires HTTPS for every connection to the backend; the backend port is not
  published, so there is no plain-HTTP way in.

## Database Schema

PostgreSQL, 15 tables (all primary keys are UUIDs unless a composite key is shown). `⟶` means a foreign key.

```
users (id, email UNIQUE, display_name UNIQUE, password_hash, avatar_url, locale, is_bot,
       last_seen_at, created_at, updated_at)
 ├─ sessions            (id, user_id ⟶ users, token_hash UNIQUE, pending_two_factor, expires_at)
 ├─ two_factor          (user_id ⟶ users [PK], secret [AES-256-GCM], enabled, last_used_step)
 ├─ two_factor_backup_codes (id, user_id ⟶ users, code_hash [HMAC-SHA256], used_at)
 ├─ oauth_accounts      (id, user_id ⟶ users, provider, provider_account_id)   -- table only, not used yet
 ├─ friendships         (user_low_id ⟶ users, user_high_id ⟶ users [PK pair], requester_id, status, accepted_at)
 ├─ blocks              (blocker_id ⟶ users, blocked_id ⟶ users [PK pair])
 ├─ messages            (id, user_low_id, user_high_id, sender_id ⟶ users, kind text|invite|system, body,
 │                       match_id ⟶ matches, tournament_id ⟶ tournaments, event)
 └─ conversation_reads  (user_id, peer_id ⟶ users [PK pair], read_at)

matches (id, status, end_reason, cols, rows, win_length, theme, invited_user_id ⟶ users,
         created_at, started_at, ended_at)
 ├─ match_players (match_id ⟶ matches, seat [PK pair], user_id ⟶ users, result)
 └─ match_moves   (match_id ⟶ matches, ply [PK pair], seat, col, played_at)

tournaments (id, name, status, size 4|8, cols, rows, win_length, theme,
             created_by_id ⟶ users, winner_id ⟶ users, created_at, started_at, ended_at)
 ├─ tournament_players  (tournament_id ⟶ tournaments, user_id ⟶ users [PK pair], joined_at)
 └─ tournament_pairings (id, tournament_id ⟶ tournaments, round, position, player1_id, player2_id,
                         winner_id ⟶ users, match_id ⟶ matches, bye)
```

Design notes: the board is never stored, it is rebuilt from `match_moves`; pairs (friendships, messages) store the
smaller user id first so one row represents both directions; CHECK constraints enforce board limits and what each
message kind may contain; wins, losses and draws are computed from finished matches, never stored.

## Features List

| Feature | Description | Who |
| ------- | ----------- | --- |
| Signup, login, logout | Email and password (Argon2), database session in an httpOnly cookie, rate limited | atawbi |
| Two-factor authentication | TOTP with an authenticator app, 10 one-time backup codes | atawbi |
| Game engine and matches | Connect Four rules on any board size, server-side validation, concurrency-safe transactions | atawbi |
| Real-time | Socket.IO: live moves, presence, reconnection with a 30 s grace period, forfeit after a disconnection | atawbi |
| Computer opponent | 3 levels, minimax with alpha-beta, deliberate mistakes, runs in a worker thread | atawbi |
| Tournaments | Single elimination, byes, automatic matches, replayed draws, turn timeout | atawbi |
| Private chat | Messages, match invitations, system notices, typing indicator, read receipts, history | atawbi |
| Player search and presence | Search, filters, sorting, pagination, online status | fel-ghaz |
| Profiles, statistics, match history | Public profile, stats, finished matches | fel-ghaz (API), rnehme (UI) |
| Display name and avatars | Rename, upload (type checked from file bytes), default avatar | fel-ghaz (API), rnehme (UI) |
| Friends and blocks | Requests, accept/decline, remove, block | fel-ghaz (API), rnehme (UI) |
| Deployment and HTTPS | Docker Compose, nginx HTTPS proxy, automatic migrations | atawbi |
| Whole user interface | Home, play, tournaments, community, settings, legal pages | rnehme |
| Languages and RTL | English, French, Arabic, language switcher, mirrored layout | rnehme |
| Appearance | Light/dark mode and board colours | rnehme |
| Privacy Policy and Terms of Service | Real content in three languages, linked in the footer | rnehme |

## Modules

| # | Module | Type | Points | Who | How it is implemented |
| - | ------ | ---- | ------ | --- | --------------------- |
| 1 | Web: frameworks for frontend and backend | Major | 2 | rnehme, atawbi | React 19 for the frontend, NestJS for the backend |
| 2 | Web: ORM | Minor | 1 | atawbi, fel-ghaz | TypeORM entities and migrations on PostgreSQL |
| 3 | Web: real-time features (WebSockets) | Major | 2 | atawbi | Socket.IO gateway authenticated by the session cookie; rooms, presence, graceful disconnection, broadcast of match, chat, friends and tournament events |
| 4 | Web: user interaction (chat, profile, friends) | Major | 2 | atawbi, fel-ghaz, rnehme | Private chat, public profiles, friends list with add/remove |
| 5 | User management: standard | Major | 2 | atawbi, fel-ghaz, rnehme | Profile update, avatar upload with default avatar, friends with online status, profile page |
| 6 | Gaming: complete web game | Major | 2 | atawbi, rnehme | Connect Four with clear win/draw/resign rules, live matches, 2D board |
| 7 | Gaming: remote players | Major | 2 | atawbi, rnehme | Two players on different computers, server-authoritative moves, reconnection logic, forfeit after the grace period |
| 8 | AI: opponent for games | Major | 2 | atawbi | Server-side bots (Easy, Medium, Hard): win/block rules, minimax with alpha-beta and iterative deepening, deliberate mistakes; works with every board size and win length |
| 9 | User management: 2FA | Minor | 1 | atawbi, rnehme | TOTP (authenticator app) with QR setup, one-time backup codes, replay protection |
| 10 | User management: game statistics and match history | Minor | 1 | fel-ghaz, rnehme | Wins/losses/draws, win rate, history with opponents and dates, leaderboard |
| 11 | Gaming: tournament system | Minor | 1 | atawbi, rnehme | Bracket, registration, matchups tracked, automatic match creation |
| 12 | Gaming: game customization | Minor | 1 | atawbi, rnehme | Board size (5-10 x 5-9), win length (3-5), themes; defaults available; the AI uses them |
| 14 | Accessibility and i18n: multiple languages | Minor | 1 | rnehme | i18next, English / French / Arabic, language switcher, all texts translatable |
| 15 | Accessibility and i18n: RTL support | Minor | 1 | rnehme | Arabic with mirrored layout (logical Tailwind classes), switch without reload |
| 16 | Gaming: advanced chat features | Minor | 1 | atawbi, rnehme | Block users, invite to a match from chat, tournament notices, profile access, persistent history, typing indicator and read receipts |
| 17 | Web: custom design system | Minor | 1 | rnehme | 21 reusable components (`frontend/src/components/ui`), colour tokens with light/dark, typography and icons |

**Total: 7 Major x 2 = 14, 9 Minor x 1 = 9, giving 23 points** against the 14 required. The bonus counts at most 5
points beyond 14, so the modules above the first 14 points are the safety margin if one is not validated.

**Justification.** The project is a game, so the Gaming modules are the core of the product; real-time, remote play
and the interaction modules (chat, friends, profiles) make it a social game; the AI opponent lets a single player
play at any time; 2FA, languages and RTL improve security and reach; the design system keeps the interface
consistent. Every module builds on the web game (module 6), which is implemented first.

## Individual Contributions

**atawbi** — Authentication and sessions, 2FA and backup codes, the pure Connect Four engine with its tests,
matches (create, join, move, resign) with row-locking transactions, Socket.IO real-time layer, disconnection
forfeit, the AI opponent (worker thread), tournaments and bracket, chat, Docker Compose, the HTTPS proxy, automatic
migrations, rate limiting, the API documentation. *Challenges:* concurrent actions (two players taking the same
seat or racing a move) were solved with transactions that lock the match row; blocking the event loop with the AI
search was solved by running it in a worker thread; HTTPS everywhere on rootless Docker was solved with a proxy on
port 8443.

**rnehme** — The complete frontend: design system and colour tokens, all pages, the game board, the same-screen game,
the three languages and RTL, accessibility, the legal pages and the frontend documentation. *Challenges:* a layout
that mirrors correctly in Arabic, and keeping the browser console free of errors and warnings.

**fel-ghaz** — Player search and online presence, public profiles and match history, display-name change, avatar
upload with validation of the real file type, friends and blocks (one row per pair, safe when both players ask at
the same moment). *Challenges:* making friend requests idempotent and race-safe, and validating uploaded images
without trusting the declared type.

## Resources

- NestJS: https://docs.nestjs.com — TypeORM: https://typeorm.io — PostgreSQL: https://www.postgresql.org/docs/
- Socket.IO: https://socket.io/docs/v4/ — React: https://react.dev — Tailwind CSS: https://tailwindcss.com/docs
- i18next: https://www.i18next.com — TanStack Query: https://tanstack.com/query/latest
- Docker Compose: https://docs.docker.com/compose/ — nginx: https://nginx.org/en/docs/
- Argon2 (RFC 9106), TOTP (RFC 6238), OWASP session management and password storage cheat sheets
- Minimax and alpha-beta pruning: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning
- WCAG 2.1: https://www.w3.org/TR/WCAG21/

**How AI was used.** We used an AI assistant (Claude Code) as a helper, never as a replacement for understanding.
It was used to: explain concepts (sessions, TOTP, transactions and locks, minimax), draft and review parts of the
backend code and the documentation, suggest test cases, and review code for bugs. Every generated piece was read,
tested and corrected by the team member responsible, and each member can explain their own part.

---

# Technical documentation

Details for people working on the project: running and configuring the stack, migrations, and every API route and
mechanism.

## Run the project (details)

Requirements: Docker with the Compose plugin.

```bash
# 1. create your local env file and set TWO_FACTOR_KEY (openssl rand -hex 32)
cp .env.example .env

# 2. build and start everything
docker compose up --build -d

# 3. check it works (the database tables are created automatically at startup)
curl -k https://localhost:8443/api/auth/me    # {"data":null}
```

Everything is served over **HTTPS** at `https://localhost:8443`. The
certificate is self-signed and created automatically at the first start, so the
browser shows a "connection not private" warning: click *Advanced*, then
*Proceed to localhost*. `curl` needs `-k` for the same reason. The certificate
is kept in a Docker volume, so the warning choice stays valid across restarts.

The backend refuses to start if a required variable is missing or if
`TWO_FACTOR_KEY` is not 64 hex characters, and says which one.

The backend runs in dev mode: the `backend/` folder is mounted into the
container, so saving a file reloads the server.

| Service  | URL / port                                          |
| -------- | --------------------------------------------------- |
| backend  | https://localhost:8443/api (`HTTPS_PORT`)           |
| database | `localhost:5433` (`DB_PORT`), from the host         |

The only way in from outside is the **proxy** container (nginx): it decrypts
HTTPS (TLS 1.2 and 1.3 only) and forwards to the backend over plain HTTP inside
the Docker network. The backend's own port 3000 is not published, so there is
no plain-HTTP door. WebSockets (`wss://`) go through the same proxy. Port
8443 is used instead of 443 because rootless Docker cannot bind ports below
1024. Inside Docker the backend reaches the database at `db:5432`.

### Everyday commands

```bash
docker compose up -d              # start
docker compose logs -f backend    # follow backend logs
docker compose ps                 # status
docker compose down               # stop
docker compose down -v            # stop and delete the database data
docker compose up --build -d      # rebuild after changing the Dockerfile
docker compose up --build -d -V   # rebuild after adding an npm package
```

Connect to the database from the host:

```bash
psql -h localhost -p 5433 -U connect4 connect4    # password: connect4
# or without installing psql:
docker compose exec db psql -U connect4 -d connect4
```

### Configuration

All settings are in `.env` (copied from `.env.example`, never committed):

| Variable                 | Default    | Meaning                                                 |
| ------------------------ | ---------- | ------------------------------------------------------- |
| `HTTPS_PORT`             | `8443`     | host port of the HTTPS entry point                      |
| `DB_PORT`                | `5433`     | host port of PostgreSQL                                 |
| `DB_USER`                | `connect4` | database user                                           |
| `DB_PASSWORD`            | `connect4` | database password                                       |
| `DB_NAME`                | `connect4` | database name                                           |
| `TWO_FACTOR_KEY`         | none       | **required**, 64 hex chars, encrypts the 2FA secrets    |
| `SESSION_TTL_DAYS`       | `7`        | how long a login lasts, optional                        |
| `TOURNAMENT_TURN_TIMEOUT_SECONDS` | `180` | how long a tournament player may take to move before losing, optional |
| `DISCONNECT_GRACE_SECONDS` | `30`     | how long a player may be disconnected from a running match before losing, optional |
| `AVATAR_DIR`             | `./uploads/avatars` | where profile pictures are stored; Docker sets it to a volume |

If a port is already used on your machine, change it in `.env`.
Do not change `TWO_FACTOR_KEY` once users have enabled 2FA: their stored
secrets can no longer be decrypted.
`SESSION_TTL_DAYS` is optional and is not passed to the container by
`docker-compose.yml` yet; add it there to change the default.

## Database migrations

The schema changes only through migrations (`synchronize` is off). Pending
migrations are applied **automatically every time the backend starts**, so
`docker compose up` is enough. The commands below, run inside the backend
container, are for working on the schema:

```bash
docker compose exec backend npm run migration:run       # apply pending migrations now
docker compose exec backend npm run migration:revert    # undo the last one
# after changing an entity, generate a new migration:
docker compose exec backend npm run migration:generate -- src/database/migrations/Name
```

Review a generated migration before running it, and never edit one that has
already run. Careful: in dev mode the backend restarts when files change and
applies pending migrations at once, so a freshly generated migration may run
before you have read it. If you need to edit it, revert it first. The
generator also does not notice tables whose entity you deleted: add the
`DROP TABLE` by hand.

## API

All routes are under `/api` and answer `{ "data": ... }` on success or
`{ "error": { "code": "...", "message": "..." } }` on failure. The browser
must send requests with `credentials: "include"` so the cookies travel.

| Route                    | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `POST /api/auth/signup`  | create an account and log in                       |
| `POST /api/auth/login`   | log in with email and password (see 2FA below)     |
| `POST /api/auth/logout`  | end the session on the server and clear the cookie |
| `GET  /api/auth/me`      | the logged-in user, or `data: null` if not logged in (status 200, never 401) |
| `POST /api/auth/2fa/setup`   | start 2FA setup, returns a QR code (logged in) |
| `POST /api/auth/2fa/enable`  | turn 2FA on with a code from the app; returns the 10 backup codes, once (logged in) |
| `POST /api/auth/2fa/disable` | turn 2FA off, needs a valid code or a backup code (logged in) |
| `POST /api/auth/2fa/verify`  | finish a 2FA login with the 6-digit code or a backup code |
| `GET  /api/auth/2fa/backup-codes` | how many backup codes are left (logged in)     |
| `POST /api/auth/2fa/backup-codes` | make 10 new backup codes, the old ones stop working (needs a valid code) |
| `POST /api/matches`           | create a match (optional settings, optional invited player) |
| `GET  /api/matches/mine`      | my matches, newest first (`status`, `limit`, `offset`) |
| `GET  /api/matches/:id`       | the full state of a match (anyone with the link while it waits, then its players only; anyone else gets `MATCH_NOT_FOUND`) |
| `POST /api/matches/:id/join`  | join a waiting match, the match starts         |
| `POST /api/matches/:id/moves` | play a column, body `{ "col": 3 }`             |
| `POST /api/matches/:id/resign`| give up, or cancel a match still waiting       |

All `/api/matches` routes need a logged-in user.

| Route                              | Description                                         |
| ---------------------------------- | --------------------------------------------------- |
| `GET  /api/tournaments`            | list tournaments, newest first (`status`, `limit`, `offset`) |
| `POST /api/tournaments`            | create one: `{ "name", "size": 4 or 8, "settings"? }` |
| `GET  /api/tournaments/:id`        | one tournament with its registered players          |
| `DELETE /api/tournaments/:id`      | cancel it (creator only, while registering)         |
| `POST /api/tournaments/:id/join`   | take a place                                        |
| `POST /api/tournaments/:id/start`  | start before it is full (creator only, 3 players or more) |
| `POST /api/tournaments/:id/leave`  | give the place back                                 |

All `/api/tournaments` routes need a logged-in user.

| Route                              | Description                                         |
| ---------------------------------- | --------------------------------------------------- |
| `GET  /api/users`                  | search players: `search`, `online`, `friends`, `sort` (`name`, `wins`, `newest`), `limit`, `offset` |
| `GET  /api/users/:displayName`     | one player's profile: stats, `online`, `lastSeenAt` (exact name, case-sensitive) |
| `GET  /api/users/:displayName/matches` | their finished matches, newest first (`limit`, `offset`) |
| `PATCH /api/users/me`              | change my display name: `{ "displayName" }` (same rules as signup) |
| `PUT  /api/users/me/avatar`        | upload my picture: form file `avatar` (PNG, JPEG or WebP, 2 MB) |
| `DELETE /api/users/me/avatar`      | back to the default avatar                          |
| `GET  /api/avatars/:file`          | a stored picture (the file itself, no login needed) |
| `GET  /api/friends`                | my friends, requests sent to me, requests I sent    |
| `PUT  /api/friends/:userId`        | send a friend request, or accept theirs             |
| `DELETE /api/friends/:userId`      | remove a friend, cancel or decline a request        |
| `GET  /api/blocks`                 | the players I blocked                               |
| `PUT  /api/blocks/:userId`         | block a player (also ends any friendship)           |
| `DELETE /api/blocks/:userId`       | unblock                                             |
| `GET  /api/chat/conversations`     | my conversations, latest message first (with `unread`, read receipt, `blocked`) |
| `GET  /api/chat/:userId/messages`  | one conversation, newest page first (`limit`, `before`) |
| `POST /api/chat/:userId/messages`  | send `{ "body" }` (1 to 500 chars) or an invitation `{ "matchId" }` |
| `POST /api/chat/:userId/read`      | mark the conversation as read (the other player sees "Seen") |
| `POST /api/chat/:userId/typing`    | tell the other player I am typing (nothing is stored) |

Needs a logged-in user, and every logged-in user can read every profile and
history. Each player comes with `online` and their `stats` (played, wins,
losses, draws). Error codes: `USER_NOT_FOUND`, `DISPLAY_NAME_TAKEN`,
`AVATAR_TOO_LARGE`, `AVATAR_INVALID_TYPE`.

**Friends and blocks.** One row per pair of players in `friendships` (the two
ids are stored smaller first, so a request in either direction meets in the same
row; a CHECK enforces it). `PUT /friends/:id` sends a request, or accepts the
one the other player already sent; asking twice, or both players asking at the
same moment, is safe. Declining, cancelling and removing all delete the row.
Blocking ends any friendship, and while EITHER player blocks the other, friend
requests and match invitations between them answer `BLOCKED`. Error codes:
`CANNOT_FRIEND_SELF`, `BLOCKED`, `USER_NOT_FOUND`. An id that is not a UUID
answers `VALIDATION_ERROR`.

**Profile pictures.** The file type is decided from the file's first bytes, not
from the type the browser declares. A picture is stored under a new random
name (so browsers never show an old cached copy) in the `avatar-data` Docker
volume, mounted at `/data/avatars` (`AVATAR_DIR`, default `./uploads/avatars`
for a run without Docker). The old file is deleted when a picture is replaced
or removed. The app shrinks pictures to 256 x 256 before sending; the backend
does not re-encode them, so it only accepts what the checks above let through.

**Login uses database sessions.** Signup and login set one httpOnly cookie,
`session`, holding a random token (valid `SESSION_TTL_DAYS`, 7 by default).
The `sessions` table stores only the SHA-256 hash of that token, so a leaked
database cannot be used to hijack a login. Logout deletes the row, so it takes
effect immediately. A frontend only has to send requests with
`credentials: "include"` and call `GET /api/auth/me` to know who is logged in:
there is no token refresh to handle.

**Two-factor authentication** uses an authenticator app (TOTP). When a user
has 2FA enabled, `login` does not log them in: it answers
`{ "user": null, "twoFactorRequired": true }`. The `session` cookie it sets is
only a *pending* session that lasts 5 minutes and is refused by every route
except `/api/auth/2fa/verify`; the user must call that route with the 6-digit
code, which replaces the cookie with a full session. A code cannot be used
twice. The TOTP secret is stored encrypted
(AES-256-GCM) with `TWO_FACTOR_KEY`.

**Matches.** The Connect Four rules live in a pure engine
(`backend/src/modules/matches/engine`, with its own tests); the server judges
every move, so a browser can never decide an outcome. A match starts as
`waiting`; the second player joins and it becomes `in_progress`; it ends as
`finished` (win, draw or resignation) or `abandoned` (cancelled while
waiting). The board is never stored: it is rebuilt from the saved moves
(`match_moves`) with the engine. The creator gets seat 1 or 2 at random.
Settings you can choose: 5 to 10 columns, 5 to 9 rows, 3 to 5 in a row to win
(never more than the smaller side), and a theme (`classic`, `ocean`,
`sunset`, `midnight`). A match can be reserved for one player with
`opponentDisplayName`. A user can have at most 3 matches waiting at once. A
waiting match can be read by anyone with its link, so they can join it; once it
starts, someone who is not a player in it gets `MATCH_NOT_FOUND`.

Concurrent actions are safe: every change to a match runs in a database
transaction that first locks the match row, so two players cannot take the
same seat and a move cannot be stored twice. Common error codes:
`NOT_YOUR_TURN`, `COLUMN_FULL`, `INVALID_COLUMN`, `MATCH_NOT_ACTIVE`,
`MATCH_NOT_JOINABLE`, `ALREADY_IN_MATCH`, `NOT_INVITED`, `USER_NOT_FOUND`,
`TOO_MANY_WAITING_MATCHES`.

**Tournaments.** A single-elimination tournament with 4 or 8 places, created
with a name and an optional board (the same settings as a match). The creator
takes the first place; others join and leave while it is `registering`.
Cancelling deletes it. Every change runs in a transaction that locks the
tournament row, so two players cannot take the last place together. Error
codes: `TOURNAMENT_NOT_FOUND`, `TOURNAMENT_NOT_OPEN`, `TOURNAMENT_FULL`,
`ALREADY_JOINED`, `NOT_JOINED`, `CREATOR_CANNOT_LEAVE`, `NOT_CREATOR`,
`NOT_ENOUGH_PLAYERS`.

**Tournament bracket.** Taking the last place starts the tournament at once;
the creator can also start it earlier with at least 3 players. The players are
shuffled into a bracket of the next power of two (4 places for 3 or 4 players,
8 for 5 to 8): empty places are byes, one at most per first-round pairing, and
a player with a bye goes straight to the next round. The bracket is the
`tournament_pairings` table, and `GET /tournaments/:id` returns it as `rounds`
(round 0 first). As soon as both players of a pairing are known the server
creates their match (both seated, already `in_progress`, seats at random, the
tournament's board). The winner of pairing `i` of round `r` takes place `i % 2`
of pairing `floor(i/2)` of round `r+1`; a **draw is replayed** with a new match
for the same pairing; the final's winner ends the tournament (`finished`).
Winners advance when a match ends by a win, a resignation or a disconnection,
and every change sends `tournament:update`. In a tournament match the player
whose turn it is **loses if no move is made for
`TOURNAMENT_TURN_TIMEOUT_SECONDS`** (180 by default; the clock restarts after
each move; ordinary matches have no clock). A sweep every 15 seconds checks
the database, so a restart cannot lose a clock. That loss is recorded as
`endReason: "disconnect"`.

**2FA backup codes.** Turning 2FA on returns 10 one-time backup codes (like
`ABCDE-FGHJK`, from an alphabet without 0, 1, I, L and O so they are easy to
copy from paper), shown ONLY that once. A user who lost their phone types one in
the same `code` field instead of the 6 digits, to log in, to turn 2FA off or to
make new codes. Each code works once: it is spent atomically, so five requests
racing with the same code produce one login. The server stores only an
HMAC-SHA256 of each code, keyed with `TWO_FACTOR_KEY` (a code has about 50 bits,
so a plain hash could be brute-forced offline from a stolen database, a keyed one
cannot; for the same reason, changing `TWO_FACTOR_KEY` also invalidates the
codes). Making new codes replaces the whole list. Turning 2FA off deletes them.
Only the app's 6-digit code can turn 2FA on.

**Presence.** A player is online if they made a request while logged in during
the last minute: the session guard writes `users.last_seen_at` (at most every
30 seconds per user), and by the live connection (see below). The wins, losses and
draws of the search are counted from the finished matches on every request,
never stored. 

**Live updates (Socket.IO).** The app opens a WebSocket on `/socket.io` (same
origin, through the proxy). The server refuses the connection unless the
`session` cookie belongs to a real login, and every 20 seconds it closes the
sockets whose login ended (logout, expiry). Every tab of a user is in the room
`user:<id>`. Events (names in `backend/src/modules/realtime/realtime.constants.ts`):
`match:update` (the whole match, to every socket that sent `match:watch` for it:
the match page does), `presence` (`{ userId, online }`, to everyone), `friends:update`
(both players of a request or block), the three `chat:*` events and `tournament:update` (`{ id }`, to
everyone). They are hints: the app also polls, so a missed event only delays an
update. A user counts as online while they have a socket open (or made a
request in the last minute), and the REST `online` value can lag the `presence`
event by up to a minute after the last tab closes. The frontend opens its
socket after login.

**Leaving a running match.** When a player's LAST socket closes, each running
match of theirs gets a countdown (`DISCONNECT_GRACE_SECONDS`, 30 by default).
If they open a socket again in time (a page refresh, a network cut) the game
goes on. Otherwise they lose, the match ends with `endReason: "disconnect"` and
the opponent gets a `match:update`. The opponent also sees the `presence` event
at once. Only players who were connected by socket can be forfeited, so an app
that polls never triggers it. The countdowns live in memory: a server restart
drops them.

**Computer opponents (AI).** Three bots exist as ordinary players, `AI_Easy`,
`AI_Medium` and `AI_Hard`, created at startup (`users.is_bot`, no password: nobody
can log in as them, they are always shown online, and `isBot` is true in the
player list and profile). To play one, create a match with
`"opponentDisplayName": "AI_Hard"` (in the app: the Easy, Medium and Hard
buttons of the Play page): the server joins for the bot, and after each
of your moves the bot answers (after 0.5 to 1.2 s, like a human) through the
same move code a person uses, so the rules, live events, history and stats all
apply to it. It works on any board size and win length. How the AI chooses
(`backend/src/modules/matches/ai/ai.ts`): it wins if it can, blocks your
immediate threat, sometimes makes a careless move on purpose, and otherwise
looks ahead with minimax (alpha-beta pruning, iterative deepening, a time
limit, a line-counting score). The levels differ in depth (2, 4, up to 12 moves),
time (150, 400, 900 ms) and mistakes (easy misses a threat 30% of the time and
slips 40%, medium slips 12%, hard 4%), so even the hard level can be beaten.
The AI thinks in a **worker thread**, so a long search never freezes the other
players. After a server restart the bots pick up their waiting and running
matches again.

**Chat.** Private conversations between two players. A message is stored ONCE
per conversation (`messages`, the two ids ordered smaller first, like friendships),
so both players read the same row; `conversation_reads` holds "I read up to here",
which gives `unread` and the "Seen" receipts. There are three kinds: `text`
(1 to 500 characters, trimmed), `invite` (a match you created, still waiting,
reserved for that player, otherwise `INVALID_INVITE`) and `system` (written by the
server: when a tournament creates a match, both players get a
`tournament_match` notice with the match and the tournament). Database CHECKs
enforce what each kind contains. History is read page by page: the latest
messages, then `before` = the oldest id you have. While either player blocked the
other, sending answers `BLOCKED`, typing is not relayed, and old messages stay
readable. Live events: `chat:message` (to both players, each seeing the other as
`peerId`, so the sender's other tabs update too), `chat:typing` and `chat:read`.
Sending is limited to 30 per minute per address.

All parts of the API design (`backend/docs/openapi.yaml`) are now built.

**Rate limits** (per IP, per minute): 100 requests overall; login 10; signup 5;
2FA verify, enable and disable 5; creating a match or a tournament 20;
renaming and uploading a picture 10. Beyond that the API answers `429` with the
code `RATE_LIMITED`. The counters are kept in memory and reset when the
backend restarts.

## Backend without Docker

```bash
cd backend
npm install --legacy-peer-deps    # the flag is needed, plain `npm install` crashes
npm test
```

Running `npm run start:dev` on your machine also needs the variables from
`.env` (with `DB_HOST=localhost`, `DB_PORT=5433`) in your shell, and the
database from `docker compose up -d db`.

## Frontend

Built and served by the `frontend` container of `docker compose up` (nginx, behind the HTTPS proxy). To work on it
with hot reload see [frontend/README.md](frontend/README.md) (`npm ci && npm run dev`, then http://localhost:5173).
