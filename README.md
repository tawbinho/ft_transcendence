# ft_transcendence

Connect Four web app.

| Part     | Stack                         | Status                                      |
| -------- | ----------------------------- | ------------------------------------------- |
| backend  | NestJS, TypeORM, MVC          | auth done (signup, login, JWT), in Docker   |
| database | PostgreSQL 17                 | running in Docker                           |
| frontend | React, Vite                   | skeleton, not in Docker yet (see below)     |

## Run the project

Requirements: Docker with the Compose plugin.

```bash
# 1. create your local env file
cp .env.example .env
# then set JWT_SECRET and TWO_FACTOR_KEY in .env, each to a different value
# generated with:
#   openssl rand -hex 32

# 2. build and start the database and the backend
docker compose up --build -d

# 3. check it works (the database tables are created automatically at startup)
curl localhost:3000/api    # {"data":"Hello World!"}
```

The backend refuses to start if a required variable is missing, if
`JWT_SECRET` is shorter than 32 characters, or if `TWO_FACTOR_KEY` is not
64 hex characters, and says which one.

The backend runs in dev mode: the `backend/` folder is mounted into the
container, so saving a file reloads the server.

| Service  | URL / port                                  |
| -------- | ------------------------------------------- |
| backend  | http://localhost:3000/api (`BACKEND_PORT`)  |
| API docs | http://localhost:3000/api/docs (Swagger)    |
| database | `localhost:5433` (`DB_PORT`), from the host |

Inside Docker the backend reaches the database at `db:5432`.

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
| `BACKEND_PORT`           | `3000`     | host port of the backend                                |
| `DB_PORT`                | `5433`     | host port of PostgreSQL                                 |
| `DB_USER`                | `connect4` | database user                                           |
| `DB_PASSWORD`            | `connect4` | database password                                       |
| `DB_NAME`                | `connect4` | database name                                           |
| `JWT_SECRET`             | none       | **required**, at least 32 chars, signs the login tokens |
| `TWO_FACTOR_KEY`         | none       | **required**, 64 hex chars, encrypts the 2FA secrets    |
| `JWT_ACCESS_TTL_SECONDS` | `900`      | access token lifetime (15 minutes), optional            |
| `JWT_REFRESH_TTL_DAYS`   | `7`        | refresh token lifetime, optional                        |

If a port is already used on your machine, change it in `.env`.
Do not change `TWO_FACTOR_KEY` once users have enabled 2FA: their stored
secrets can no longer be decrypted.
The two `JWT_*_TTL` variables are optional and are not passed to the container
by `docker-compose.yml` yet; add them there to change the defaults.

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
already run.

## API

All routes are under `/api` and answer `{ "data": ... }` on success or
`{ "error": { "code": "...", "message": "..." } }` on failure. Try them in
Swagger at http://localhost:3000/api/docs, which shows the exact shapes,
including the `data` / `error` wrapper. The browser must send requests with
`credentials: "include"` so the cookies travel.

| Route                    | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `POST /api/auth/signup`  | create an account and log in                       |
| `POST /api/auth/login`   | log in with email and password (see 2FA below)     |
| `POST /api/auth/refresh` | new tokens from the refresh cookie                 |
| `POST /api/auth/logout`  | revoke the refresh token and clear the cookies     |
| `GET  /api/auth/me`      | the logged-in user, or `data: null` if not logged in (status 200, never 401) |
| `POST /api/auth/2fa/setup`   | start 2FA setup, returns a QR code (logged in) |
| `POST /api/auth/2fa/enable`  | turn 2FA on with a code from the app (logged in) |
| `POST /api/auth/2fa/disable` | turn 2FA off, needs a valid code (logged in)   |
| `POST /api/auth/2fa/verify`  | finish a 2FA login with the 6-digit code       |

Login uses two httpOnly cookies: a short access token (JWT, 15 minutes) and a
refresh token (7 days, stored hashed in the database, single use, rotated on
every refresh).

Because the access token lasts only 15 minutes, a frontend should call
`POST /api/auth/refresh` when `GET /api/auth/me` answers `data: null` and the
user may still hold a refresh cookie, and retry once.

**Two-factor authentication** uses an authenticator app (TOTP). When a user
has 2FA enabled, `login` does not log them in: it answers
`{ "user": null, "twoFactorRequired": true }` and sets a 5-minute `pending_2fa`
cookie, and the user must then call `/api/auth/2fa/verify` with the 6-digit
code. A code cannot be used twice. The TOTP secret is stored encrypted
(AES-256-GCM) with `TWO_FACTOR_KEY`.

**Rate limits** (per IP, per minute): 100 requests overall; login 10; signup 5;
2FA verify, enable and disable 5. Beyond that the API answers `429` with the
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

Not in Docker yet. It imports the workspace packages `@cf/shared`,
`@cf/engine` and `@cf/ai`, which do not exist in the repo yet, so it cannot
build.
