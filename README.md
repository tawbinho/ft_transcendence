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
# then set JWT_SECRET in .env to a long random value:
#   openssl rand -hex 32

# 2. build and start the database and the backend
docker compose up --build -d

# 3. create the database tables (first time, and after pulling new migrations)
docker compose exec backend npm run migration:run

# 4. check it works
curl localhost:3000/api    # {"data":"Hello World!"}
```

The backend refuses to start if a required variable is missing or if
`JWT_SECRET` is shorter than 32 characters, and says which one.

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
| `JWT_ACCESS_TTL_SECONDS` | `900`      | access token lifetime (15 minutes), optional            |
| `JWT_REFRESH_TTL_DAYS`   | `7`        | refresh token lifetime, optional                        |

If a port is already used on your machine, change it in `.env`.
The two `JWT_*_TTL` variables are optional and are not passed to the container
by `docker-compose.yml` yet; add them there to change the defaults.

## Database migrations

The schema changes only through migrations (`synchronize` is off). Run these
inside the backend container:

```bash
docker compose exec backend npm run migration:run       # apply pending migrations
docker compose exec backend npm run migration:revert    # undo the last one
# after changing an entity, generate a new migration:
docker compose exec backend npm run migration:generate -- src/database/migrations/Name
```

Review a generated migration before running it, and never edit one that has
already run.

## API

All routes are under `/api` and answer `{ "data": ... }` on success or
`{ "error": { "code": "...", "message": "..." } }` on failure. Try them in
Swagger at http://localhost:3000/api/docs.

| Route                    | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `POST /api/auth/signup`  | create an account and log in                       |
| `POST /api/auth/login`   | log in with email and password                     |
| `POST /api/auth/refresh` | new tokens from the refresh cookie                 |
| `POST /api/auth/logout`  | revoke the refresh token and clear the cookies     |
| `GET  /api/auth/me`      | the logged-in user (401 if not logged in)          |

Login uses two httpOnly cookies: a short access token (JWT, 15 minutes) and a
refresh token (7 days, stored hashed in the database, single use, rotated on
every refresh).

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
