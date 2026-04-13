# Team Calendar

## Stack
- Next.js App Router + Auth.js
- Drizzle ORM on a single Postgres schema
- Embedded Postgres by default for zero-config local/self-hosted runs
- External Postgres via `DATABASE_URL` override

## Quickstart
1. Copy `.env.example` to `.env`
2. Fill Google OAuth credentials, `NEXTAUTH_SECRET` and `TOKEN_ENC_KEY`
3. Install dependencies: `npm install`
4. Generate and apply migrations:
   - `npm run db:gen`
   - `npm run db:migrate`
5. Start the app:
   - `npm run dev`

If `DATABASE_URL` is not set, the npm runtime scripts start embedded Postgres automatically and use a local persistent data dir in `data/postgres`.

Open `http://localhost:3000`.

If the default embedded port is busy on your machine, override it in `.env`:

```env
EMBEDDED_POSTGRES_PORT=54330
```

## External Postgres override
If you already have Postgres, set:

```env
DATABASE_URL=postgres://user:password@host:5432/teamcal
```

In that mode the embedded bootstrap is skipped and the app uses the external database directly.

## Docker Compose app deployment
There are only two compose files:
- `compose.embedded.yaml`: the app container starts embedded Postgres itself and persists it in a Docker volume
- `compose.external-postgres.yaml`: the app container expects an explicit external `DATABASE_URL`

Embedded Postgres deployment:

```bash
docker compose -f compose.embedded.yaml up -d --build
```

External Postgres deployment:

```bash
docker compose -f compose.external-postgres.yaml up -d --build
```

Notes:
- embedded mode stores database files in the named volume `team-calendar-embedded-data`
- external mode does not create a database container and fails fast if `DATABASE_URL` is missing
- compose files use the same embedded Postgres and port defaults as `.env.example`; deployment env still must define `NEXTAUTH_URL`, `NEXTAUTH_SECRET` and `TOKEN_ENC_KEY`
- `APP_BASE_URL` is optional and only needed when same-origin checks must allow multiple public origins
- container-only paths are fixed inside the compose files; deployment env should only provide runtime values such as ports, URLs, secrets and OAuth credentials
- team-scoped booking webhook delivery is controlled by `BOOKING_WEBHOOK_DELIVERY_ENABLED`; legacy global booking webhook envs are no longer used
- both deploy files require `NEXTAUTH_SECRET` and `TOKEN_ENC_KEY`; external mode also requires `DATABASE_URL`

## Database commands
- `npm run db:gen`
- `npm run db:migrate`
- `npm run db:status`

## Local setup and release checks
- Local bootstrap runbook: [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md)
- Architecture notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Release verification: [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)

## Current source of truth
- Full runtime cutover: [`tasks/nextjs-cutover/nextjs-cutover.specs.md`](tasks/nextjs-cutover/nextjs-cutover.specs.md)
- Embedded Postgres migration feature: [`tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`](tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md)
