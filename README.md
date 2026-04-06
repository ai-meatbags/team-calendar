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
- compose files no longer contain URL/path defaults; deployment env must define `PORT`, `APP_BASE_URL`, `NEXTAUTH_URL` and other required values explicitly
- compose deployment uses container-only vars such as `CONTAINER_APP_HOME` and `CONTAINER_EMBEDDED_POSTGRES_DATA_DIR`; this avoids mixing local host paths with in-container paths
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
