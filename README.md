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
- Accounts with email and password (Argon2), email verification and password reset with a 6-digit code sent by email,
  database sessions, optional two-factor authentication by emailed code.
- Profiles, avatars, friends with online status, blocking, private chat with invitations and read receipts.
- Single-elimination tournaments for 4 players (two semi-finals and a final, starts when the 4th player joins, turn timeout).
- Statistics, match history, leaderboard, levels and badges.
- Custom boards (size, win length, theme) and light/dark appearance.
- Privacy Policy and Terms of Service pages, linked in the footer.

## Instructions

**Prerequisites:** Docker with the Compose plugin (nothing else is needed to run the project).

```bash
# 1. create the local env file (it is ignored by Git, so no secret is ever committed)
cp .env.example .env
# 2. fill in every empty value of .env (see Configuration below):
#      HTTPS_PORT (e.g. 8443), DB_USER, DB_PASSWORD and DB_NAME of your choice
#    optional: SMTP_USER and SMTP_PASSWORD (a Gmail address and an app password) to really send the emails
# 3. one command builds and starts everything (database, backend, frontend, HTTPS proxy)
docker compose up --build -d
```

Open **https://localhost:8443** (the port is `HTTPS_PORT` in `.env`). The certificate is self-signed and created
automatically at the first start, so the browser shows a warning: click *Advanced*, then *Proceed to localhost*.
Database tables are created automatically at startup (migrations run when the backend starts).

**Creating an account:** sign-up emails a 6-digit code, and the account can log in only after that code is typed on
the next page. Without `SMTP_USER` no email is sent: the code is written in the backend log instead.

```bash
docker compose logs backend | grep "Code for"
```

Useful addresses: the app at `/` and the legal pages at `/privacy` and `/terms`.
More commands, the configuration table and every API route are in [Technical documentation](#technical-documentation)
below. The frontend has its own README in [frontend/README.md](frontend/README.md).

## Team Information

| Login | Role(s) | Responsibilities |
| ----- | ------- | ---------------- |
| **atawbi** | Technical Lead, Developer, Project Manager | Chose the architecture and stack (NestJS, TypeORM, PostgreSQL, Docker, HTTPS proxy). Built the backend core: authentication and sessions, email verification and password reset (with their frontend pages), 2FA, the game engine, matches, real-time (Socket.IO), the AI opponent, the tournament bracket and chat. Organised the work and reviewed merges. |
| **rnehme** | Frontend Developer, Product Owner | Built the whole frontend: pages, game board, design system, three languages with RTL, accessibility, legal pages. Defined what the product must do and validated finished features. |
| **fel-ghaz** | Backend Developer, Product Owner | Built the backend social side: player search and presence, profiles and match history, display name, avatars, friends and blocks, and tournament registration. Wrote the OpenAPI contract (`backend/docs/openapi.yaml`). Defined what the product must do and validated finished features. |

## Project Management

- **Organisation:** the work was split by area: backend core (atawbi), social backend (fel-ghaz) and frontend
  (rnehme). The backend API was designed and documented first (`backend/docs/openapi.yaml`, OpenAPI), so the frontend
  could be built against a stable contract. Each area was developed on its own branch and merged into `main`.
- **Meetings:** short daily check-ins on WhatsApp, plus an on-campus meeting each week to plan the next steps and
  review the merged work.
- **Tools:** Git and GitHub (branches and merges), `backend/docs/openapi.yaml` and `frontend/docs/api-contract.md` as
  the shared API contract.
- **Communication:** Gmail, WhatsApp and on-campus meetings.

## Technical Stack

| Part | Technology |
| ---- | ---------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, i18next, Socket.IO client |
| Backend | NestJS (Node 22), TypeScript, TypeORM, Socket.IO, Argon2, class-validator, Nodemailer (Gmail SMTP) |
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

PostgreSQL, 14 tables (all primary keys are UUIDs unless a composite key is shown). `⟶` means a foreign key.
To look at the real tables, see [Connect to the database](#everyday-commands).

```
users (id, email UNIQUE, display_name UNIQUE, password_hash, avatar_url, locale, is_bot,
       last_seen_at, email_verified_at, email_verify_hash, email_verify_expires_at, email_verify_attempts,
       password_reset_hash, password_reset_expires_at, password_reset_attempts, created_at, updated_at)
 ├─ sessions            (id, user_id ⟶ users, token_hash UNIQUE, pending_two_factor, two_factor_hash, two_factor_attempts, expires_at)
 ├─ two_factor          (user_id ⟶ users [PK], enabled, code_hash, code_expires_at, code_attempts)
 ├─ friendships         (user_low_id ⟶ users, user_high_id ⟶ users [PK pair], requester_id, status, accepted_at)
 ├─ blocks              (blocker_id ⟶ users, blocked_id ⟶ users [PK pair])
 ├─ messages            (id, user_low_id, user_high_id, sender_id ⟶ users, kind text|invite|system, body,
 │                       match_id ⟶ matches, tournament_id ⟶ tournaments, event)
 └─ conversation_reads  (user_id, peer_id ⟶ users [PK pair], read_at)

matches (id, status, end_reason, cols, rows, win_length, theme, invited_user_id ⟶ users,
         created_at, started_at, ended_at)
 ├─ match_players (match_id ⟶ matches, seat [PK pair], user_id ⟶ users, result)
 └─ match_moves   (match_id ⟶ matches, ply [PK pair], seat, col, played_at)

tournaments (id, name, status, size (always 4), cols, rows, win_length, theme,
             created_by_id ⟶ users, winner_id ⟶ users, created_at, started_at, ended_at)
 ├─ tournament_players  (tournament_id ⟶ tournaments, user_id ⟶ users [PK pair], joined_at)
 └─ tournament_pairings (id, tournament_id ⟶ tournaments, round, position, player1_id, player2_id,
                         winner_id ⟶ users, match_id ⟶ matches, bye (unused, always false))
```

Design notes: the board is never stored, it is rebuilt from `match_moves`; pairs (friendships, messages) store the
smaller user id first so one row represents both directions; CHECK constraints enforce board limits and what each
message kind may contain; wins, losses and draws are computed from finished matches, never stored; the emailed
codes are stored only as a SHA-256 hash, like the session tokens.

## Features List

| Feature | Description | Who |
| ------- | ----------- | --- |
| Signup, login, logout | Email and password (Argon2), database session in an httpOnly cookie, rate limited | atawbi |
| Email verification and forgot password | 6-digit code sent by email (Gmail), 15 minutes, locked after 5 wrong tries; a reset ends every login | atawbi |
| Two-factor authentication | 6-digit code sent by email at each login (15 minutes, locked after 5 wrong tries) | atawbi |
| Game engine and matches | Connect Four rules on any board size, server-side validation, concurrency-safe transactions | atawbi |
| Real-time | Socket.IO: live moves, presence, reconnection with a 30 s grace period, forfeit after a disconnection | atawbi |
| Computer opponent | 3 levels, minimax with alpha-beta, deliberate mistakes, runs in a worker thread | atawbi |
| Tournament registration | Create, list, cancel, join and leave; the tournament row is locked so two players cannot take the last place | fel-ghaz |
| Tournament bracket | Starts when the 4th player joins, two semi-finals and a final, automatic matches, replayed draws, turn timeout | atawbi |
| Private chat | Messages, match invitations, system notices, typing indicator, read receipts, history | atawbi |
| Player search and presence | Search, filters, sorting, pagination, online status | fel-ghaz (presence over sockets: atawbi) |
| API contract | OpenAPI description of every route (`backend/docs/openapi.yaml`), shown with Swagger UI at `/api/docs` in development | fel-ghaz, atawbi |
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
| 9 | User management: 2FA | Minor | 1 | atawbi, rnehme | Emailed 6-digit code (single use, expires, limited tries) |
| 10 | User management: game statistics and match history | Minor | 1 | fel-ghaz, rnehme | Wins/losses/draws, win rate, history with opponents and dates, leaderboard |
| 11 | Gaming: tournament system | Minor | 1 | atawbi, fel-ghaz, rnehme | Registration (fel-ghaz), bracket, matchups tracked, automatic match creation (atawbi) |
| 12 | Gaming: game customization | Minor | 1 | atawbi, rnehme | Board size (5-10 x 5-9), win length (3-5), themes; defaults available; the AI uses them |
| 13 | Accessibility and i18n: multiple languages | Minor | 1 | rnehme | i18next, English / French / Arabic, language switcher, all texts translatable |
| 14 | Accessibility and i18n: RTL support | Minor | 1 | rnehme | Arabic with mirrored layout (logical Tailwind classes), switch without reload |
| 15 | Gaming: advanced chat features | Minor | 1 | atawbi, rnehme | Block users, invite to a match from chat, tournament notices, profile access, persistent history, typing indicator and read receipts |
| 16 | Web: custom design system | Minor | 1 | rnehme | 21 reusable components (`frontend/src/components/ui`), colour tokens with light/dark, typography and icons |

**Total: 7 Major x 2 = 14, 9 Minor x 1 = 9, giving 23 points** against the 14 required. The bonus counts at most 5
points beyond 14, so the modules above the first 14 points are the safety margin if one is not validated.

**Justification.** The project is a game, so the Gaming modules are the core of the product; real-time, remote play
and the interaction modules (chat, friends, profiles) make it a social game; the AI opponent lets a single player
play at any time; 2FA, languages and RTL improve security and reach; the design system keeps the interface
consistent. Every module builds on the web game (module 6), which is implemented first.

## Individual Contributions

**atawbi** — The backend skeleton (NestJS, database connection, environment checks, the `{ data }` / `{ error }`
format and the validation pipe), authentication and sessions, email verification and password reset by emailed code
(backend and frontend pages), 2FA by emailed code, the pure Connect Four engine with its tests, matches (create,
join, move, resign) with row-locking transactions, the Socket.IO real-time layer and presence over sockets,
disconnection forfeit, the AI opponent (worker thread), the tournament bracket (start, automatic matches, turn
timeout), chat, Docker Compose, the HTTPS proxy, automatic migrations, rate limiting, and the documentation of these
routes in the API contract. *Challenges:* concurrent actions (two players taking the same
seat or racing a move) were solved with transactions that lock the match row; blocking the event loop with the AI
search was solved by running it in a worker thread; HTTPS everywhere on rootless Docker was solved with a proxy on
port 8443.

**rnehme** — The complete frontend: design system and colour tokens, all pages, the game board, the same-screen game,
the three languages and RTL, accessibility, the legal pages and the frontend documentation. *Challenges:* a layout
that mirrors correctly in Arabic, and keeping the browser console free of errors and warnings.

**fel-ghaz** — Tournament registration (create, list, cancel, join, leave, and the `tournaments` and
`tournament_players` tables), the OpenAPI contract (`backend/docs/openapi.yaml`) and its Swagger UI page at
`/api/docs`, player search and online presence (`last_seen_at`, refreshed by the session guard), public profiles and
match history with statistics counted from finished matches, display-name change, avatar upload with validation of
the real file type, friends and blocks (one row per pair, safe when both players ask at the same moment). Before
submission: only the players of a match may follow it live, the database port is reachable from this computer only,
and the unused `oauth_accounts` table and dead code were removed. *Challenges:* making friend requests idempotent
and race-safe, validating uploaded images without trusting the declared type, and closing a gap where any logged-in
user could follow a running match over the socket while the REST route refused them.

## Resources

- NestJS: https://docs.nestjs.com — TypeORM: https://typeorm.io — PostgreSQL: https://www.postgresql.org/docs/
- Socket.IO: https://socket.io/docs/v4/ — React: https://react.dev — Tailwind CSS: https://tailwindcss.com/docs
- i18next: https://www.i18next.com — TanStack Query: https://tanstack.com/query/latest
- Docker Compose: https://docs.docker.com/compose/ — nginx: https://nginx.org/en/docs/ — Nodemailer: https://nodemailer.com
- Argon2 (RFC 9106), OWASP session management and password storage cheat sheets
- Minimax and alpha-beta pruning: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning
- WCAG 2.1: https://www.w3.org/TR/WCAG21/

**How AI was used.** We used an AI assistant (Claude Code) as a helper, never as a replacement for understanding.
It was used to: explain concepts (sessions, transactions and locks, minimax), draft and review parts of the
backend code and the documentation, suggest test cases, and review code for bugs. Every generated piece was read,
tested and corrected by the team member responsible, and each member can explain their own part.

---

# Technical documentation

Details for people working on the project: running and configuring the stack, migrations, and every API route and
mechanism.

## Run the project (details)

Requirements: Docker with the Compose plugin.

```bash
# 1. create your local env file and fill in every empty value (SMTP_USER / SMTP_PASSWORD only if the
#    emails must really be sent)
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

The backend refuses to start if a required variable is missing, and says which one.

The backend runs in dev mode: the `backend/` folder is mounted into the
container, so saving a file reloads the server.

| Service  | URL / port                                          |
| -------- | --------------------------------------------------- |
| backend  | https://localhost:8443/api (`HTTPS_PORT`)           |
| database | not reachable from the host (internal network only) |

The only way in from outside is the **proxy** container (nginx): it decrypts
HTTPS (TLS 1.2 and 1.3 only) and forwards to the backend over plain HTTP inside
the Docker network. The backend's own port 3000 is not published, so there is
no plain-HTTP door. WebSockets (`wss://`) go through the same proxy. Port
8443 is used instead of 443 because rootless Docker cannot bind ports below
1024. Inside Docker the backend reaches the database at `db:5432`. The database,
backend and frontend sit on an `internal` Docker network (no gateway, no
published port); only the proxy also joins the `edge` network that carries the
HTTPS port. The backend joins `edge` too, only for outbound SMTP (Gmail).

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

The database is on an internal Docker network and publishes no port, so connect through the container
(it already knows the user and database):

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'   # interactive shell, \q to leave
# a single query, without entering the shell:
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"'
```

No password is asked: `psql` runs inside the container, where the local connection is trusted.

Inside `psql`, `\dt` lists the
tables, `\x` switches to one-column-per-line output (easier to read for wide rows), and a query ends with `;`.

### Configuration

All settings are in `.env` (copied from `.env.example`, never committed):

| Variable                 | Default    | Meaning                                                 |
| ------------------------ | ---------- | ------------------------------------------------------- |
| `HTTPS_PORT`             | none       | **required**, host port of the HTTPS entry point (e.g. `8443`) |
| `DB_USER`                | none       | **required**, database user                             |
| `DB_PASSWORD`            | none       | **required**, database password                         |
| `DB_NAME`                | none       | **required**, database name                             |
| `SESSION_TTL_DAYS`       | `7`        | how long a login lasts, optional                        |
| `TOURNAMENT_TURN_TIMEOUT_SECONDS` | `180` | how long a tournament player may take to move before losing, optional |
| `DISCONNECT_GRACE_SECONDS` | `30`     | how long a player may be disconnected from a running match before losing, optional |
| `AVATAR_DIR`             | `./uploads/avatars` | where profile pictures are stored; Docker sets it to a volume |
| `SMTP_USER`              | empty      | Gmail address that sends the codes, optional; empty: the code is only written in the backend log |
| `SMTP_PASSWORD`          | empty      | a Gmail **app password** (Google account > Security > 2-Step Verification > App passwords), not the normal password |

If a port is already used on your machine, change it in `.env`.
`SESSION_TTL_DAYS` counts from the moment of login: using the app does not
extend it, so after that many days the user logs in again.

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
| `POST /api/auth/signup`  | create an unverified account and email a 6-digit code; does NOT log in |
| `POST /api/auth/verify-email` | `{ email, code }`: verify the email, the account can log in |
| `POST /api/auth/resend-verification` | `{ email }`: send a new code (always answers 200) |
| `POST /api/auth/login`   | log in with email and password (see 2FA below); refused until the email is verified |
| `POST /api/auth/forgot-password` | `{ email }`: email a reset code (always answers 200) |
| `POST /api/auth/reset-password`  | `{ email, code, password }`: set a new password and end every login |
| `POST /api/auth/logout`  | end the session on the server and clear the cookie |
| `GET  /api/auth/me`      | the logged-in user, or `data: null` if not logged in (status 200, never 401) |
| `POST /api/auth/2fa/code`    | email a 6-digit code: first step of turning 2FA on, and the proof needed to turn it off (logged in) |
| `POST /api/auth/2fa/enable`  | turn 2FA on with the emailed code (logged in) |
| `POST /api/auth/2fa/disable` | turn 2FA off, needs the emailed code (logged in) |
| `POST /api/auth/2fa/verify`  | finish a 2FA login with the emailed 6-digit code |
| `GET  /api/auth/2fa/status`  | is 2FA on for the logged-in user |
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
| `POST /api/tournaments`            | create one: `{ "name", "settings"? }` (always 4 places) |
| `GET  /api/tournaments/:id`        | one tournament with its registered players          |
| `DELETE /api/tournaments/:id`      | cancel it (creator only, while registering)         |
| `POST /api/tournaments/:id/join`   | take a place (the 4th player starts the tournament) |
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

**Email verification and forgot password.** Signup creates the account
unverified and emails a 6-digit code; `login` answers `EMAIL_NOT_VERIFIED` (and
sends a new code) until `verify-email` gets the right one. A code works once,
lasts 15 minutes and dies after 5 wrong tries; only its SHA-256 hash is stored.
An unverified account does not hold its email or display name: signing up again
with either replaces it. `forgot-password` sends the same kind of code to a
verified account, and `reset-password` sets the new password and ends every
session of that user. `resend-verification` and `forgot-password` always answer
200, so they cannot reveal which emails are registered. The emails go through
Gmail SMTP (`SMTP_USER`, `SMTP_PASSWORD`); without them the code is only written
in the backend log. If the sign-up email cannot be sent, the account is removed
and signup answers `EMAIL_SEND_FAILED`. Error codes: `EMAIL_TAKEN`,
`DISPLAY_NAME_TAKEN`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`,
`INVALID_VERIFICATION_CODE`, `INVALID_RESET_CODE`, `EMAIL_SEND_FAILED`.

**Login uses database sessions.** Login (or the 2FA step after it) sets one
httpOnly cookie, `session`, holding a random token (valid `SESSION_TTL_DAYS`, 7
by default). The `sessions` table stores only the SHA-256 hash of that token, so a leaked
database cannot be used to hijack a login. Logout deletes the row, so it takes
effect immediately. A frontend only has to send requests with
`credentials: "include"` and call `GET /api/auth/me` to know who is logged in:
there is no token refresh to handle.

**Two-factor authentication** uses a 6-digit code sent by email. When a user
has 2FA enabled, `login` does not log them in: it answers
`{ "user": null, "twoFactorRequired": true }`. The `session` cookie it sets is
only a *pending* session that lasts 5 minutes and is refused by every route
except `/api/auth/2fa/verify`; the user must call that route with the 6-digit
code we emailed, which replaces the cookie with a full session.
The code is created with the pending session, only its hash is stored (on the
session row), and it dies with the session after 5 wrong tries or when the session
ends, so it cannot be used twice.

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

**Tournaments.** A single-elimination tournament with exactly 4 places, created
with a name and an optional board (the same settings as a match). The creator
takes the first place; others join and leave while it is `registering`.
Cancelling deletes it. Every change runs in a transaction that locks the
tournament row, so two players cannot take the last place together. Error
codes: `TOURNAMENT_NOT_FOUND`, `TOURNAMENT_NOT_OPEN`, `TOURNAMENT_FULL`,
`ALREADY_JOINED`, `NOT_JOINED`, `CREATOR_CANNOT_LEAVE`, `NOT_CREATOR`.

**Tournament bracket.** Taking the 4th and last place starts the tournament at
once; there is no other way to start it, so a bracket never has an empty place.
The 4 players are shuffled into two semi-finals, and the final waits for their
winners. The bracket is the `tournament_pairings` table, and
`GET /tournaments/:id` returns it as `rounds` (round 0 is the semi-finals,
round 1 the final). As soon as both players of a pairing are known the server
creates their match (both seated, already `in_progress`, seats at random, the
tournament's board). The winner of semi-final `i` takes place `i` of the
final; a **draw is replayed** with a new match
for the same pairing; the final's winner ends the tournament (`finished`).
Winners advance when a match ends by a win, a resignation or a disconnection,
and every change sends `tournament:update`. In a tournament match the player
whose turn it is **loses if no move is made for
`TOURNAMENT_TURN_TIMEOUT_SECONDS`** (180 by default; the clock restarts after
each move; ordinary matches have no clock). A sweep every 15 seconds checks
the database, so a restart cannot lose a clock. That loss is recorded as
`endReason: "disconnect"`.

**Presence.** A player is online if they were seen during the last minute,
which is stored in `users.last_seen_at`. Two things keep it fresh: the session
guard on every request (at most one write every 30 seconds per user) and the
live connection (see below). The wins, losses and draws of the search are
counted from the finished matches on every request, never stored.

**Live updates (Socket.IO).** The app opens a WebSocket on `/socket.io` (same
origin, through the proxy). The server refuses the connection unless the
`session` cookie belongs to a real login, and every 20 seconds it closes the
sockets whose login ended (logout, expiry). Every tab of a user is in the room
`user:<id>`. Events (names in `backend/src/modules/realtime/realtime.constants.ts`):
`match:update` (the whole match, to every socket that sent `match:watch` for it,
as the match page does; like `GET /api/matches/:id`, only its players may watch a
match, or anyone while it waits for a second player), `presence` (`{ userId, online }`, to everyone), `friends:update`
(both players of a request or block), the three `chat:*` events and `tournament:update` (`{ id }`, to
everyone). They are hints: the app also polls, so a missed event only delays an
update. A user counts as online while they have a socket open (or made a
request in the last minute). When their last tab closes they are offline at
once, in the `presence` event and in the REST `online` value. The frontend
opens its socket after login.

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

Every route of the API design (`backend/docs/openapi.yaml`) is built. In
development the backend serves that file with Swagger UI at
https://localhost:8443/api/docs, to read the routes and try them from the browser.

**Rate limits** (per IP, per minute, counted separately for each route): 100 by
default; login 10; signup 5; 2FA setup 10; 2FA verify, enable and disable 5; verify-email and reset-password 10; resend-verification and
forgot-password 3; creating a match or a tournament 20; renaming and uploading
a picture 10; sending a chat message 30. Beyond that the API answers `429` with the
code `RATE_LIMITED`. The counters are kept in memory and reset when the
backend restarts.

## Backend without Docker

```bash
cd backend
npm install --legacy-peer-deps    # the flag is needed, plain `npm install` crashes
npm test
```

Running `npm run start:dev` on your machine also needs the variables from
`.env` in your shell and a reachable PostgreSQL. The compose database publishes no
port, so add a `ports` entry to the `db` service temporarily (and set `DB_HOST`/`DB_PORT` to match).

## Frontend

Built and served by the `frontend` container of `docker compose up` (nginx, behind the HTTPS proxy). To work on it
with hot reload see [frontend/README.md](frontend/README.md) (`npm ci && npm run dev`, then http://localhost:5173).
