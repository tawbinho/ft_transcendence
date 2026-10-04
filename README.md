# ft_transcendence

Connect Four web app.

| Part     | Stack                     | Status                                   |
| -------- | ------------------------- | ---------------------------------------- |
| backend  | NestJS, TypeORM (DDD)     | starter, running in Docker               |
| database | PostgreSQL 17             | running in Docker                        |
| frontend | React, Vite               | skeleton, not in Docker yet (see below)  |

## Run the project

Requirements: Docker with the Compose plugin.

```bash
# 1. create your local env file
cp .env.example .env

# 2. build and start the database and the backend
docker compose up --build -d

# 3. check it works
curl localhost:3000        # Hello World!
```

The backend runs in dev mode: the `backend/` folder is mounted into the
container, so saving a file reloads the server.

| Service  | URL / port                                 |
| -------- | ------------------------------------------ |
| backend  | http://localhost:3000 (`BACKEND_PORT`)     |
| database | `localhost:5433` (`DB_PORT`), from the host |

Inside Docker the backend reaches the database at `db:5432`.

### Everyday commands

```bash
docker compose up -d              # start
docker compose logs -f backend    # follow backend logs
docker compose ps                 # status
docker compose down               # stop
docker compose down -v            # stop and delete the database data
docker compose up --build -d      # rebuild after changing package.json or the Dockerfile
```

Connect to the database from the host:

```bash
psql -h localhost -p 5433 -U connect4 connect4    # password: connect4
```

### Configuration

All settings are in `.env` (copied from `.env.example`, never committed):

| Variable        | Default    | Meaning                          |
| --------------- | ---------- | -------------------------------- |
| `BACKEND_PORT`  | `3000`     | host port of the backend         |
| `DB_PORT`       | `5433`     | host port of PostgreSQL          |
| `DB_USER`       | `connect4` | database user                    |
| `DB_PASSWORD`   | `connect4` | database password                |
| `DB_NAME`       | `connect4` | database name                    |

If a port is already used on your machine, change it in `.env`.

## Backend without Docker

```bash
cd backend
npm install --legacy-peer-deps    # the flag is needed, plain `npm install` crashes
npm run start:dev
npm test
```

## Frontend

Not in Docker yet. It imports the workspace packages `@cf/shared`,
`@cf/engine` and `@cf/ai`, which do not exist in the repo yet, so it cannot
build.
