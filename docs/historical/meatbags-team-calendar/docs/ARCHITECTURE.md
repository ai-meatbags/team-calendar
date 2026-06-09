# Architecture

## Layers
- `src/domain/*`: pure business rules and validation
- `src/application/*`: use-cases orchestrating domain and infra ports
- `src/ports/*`: interfaces (`DbClientProvider`, token ports, etc.)
- `src/infrastructure/*`: Drizzle DB, Auth adapter, crypto, rate limiting, logging
- `src/interface/http/*`: request guards and HTTP mapping helpers
- `app/api/*`: thin Next route handlers

## Database strategy
- Canonical data layer: Postgres only
- Default runtime path: embedded Postgres started by npm runtime wrappers when `DATABASE_URL` is absent
- Override path: external Postgres via `DATABASE_URL`
- Canonical schema module: `src/infrastructure/db/schema.ts`
- Canonical migration config: `drizzle.config.ts`
- Canonical migrations dir: `drizzle/migrations`

## Composition
- `createAppContext()` builds env, db client, token vault, logger and runtime helpers
- `createDbClient()` is pg-only and expects a Postgres URL
- Embedded Postgres startup is handled at process boundary by `scripts/with-default-postgres.ts`; it is intentionally kept out of domain/use-case code

## Security boundaries
- Backend is authoritative for authz/privacy decisions
- Same-origin checks protect state-changing routes
- Token decrypt/encrypt is confined to infrastructure
- Embedded Postgres defaults to `127.0.0.1` and is bypassed entirely when `DATABASE_URL` is provided

## Rollout and verification
- Primary regression gate: `npm run test`
- Build gate: `npm run build`
- Runtime smoke and release checks live in `docs/RELEASE_CHECKLIST.md`
