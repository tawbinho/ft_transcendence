# Backend

NestJS + TypeORM + PostgreSQL API and Socket.IO server of ft_transcendence (Connect Four).

It is built and started by `docker compose up --build -d` from the repository root; see the
[root README](../README.md) for how to run it, the configuration, the database schema and every API route.

```bash
npm install --legacy-peer-deps   # the flag is needed
npm test                         # unit tests (Vitest)
```

Structure: `src/modules/<name>` (auth, users, matches, tournaments, friends, chat, realtime), `src/common` (guards,
filters, interceptors), `src/database/migrations`. API contract: `docs/openapi.yaml`.
