# Task Testing

Task: `TEAMCAL-50`
Updated: `2026-03-21`

## Context
- Change summary: runtime/data layer свёрнут в один Postgres-контур; добавлен embedded Postgres bootstrap по умолчанию и override через `DATABASE_URL`.
- Feature dossier: `tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`

## Risk Tier
- Tier: `high`
- Reviewer required: `yes`

## Planned Checks
- Проверить миграции на чистой embedded Postgres базе.
- Проверить unit/contract контур после удаления sqlite-веток.
- Проверить production build после смены runtime contract.

## Commands Run
- `npm run db:migrate`
- `npm run test`
- `npm run build`

## Results
- `db:migrate` проходит на embedded Postgres после исправления приведения `expires` в migration.
- `test` проходит на pg-only runtime и pg-backed fixtures.
- `build` проходит после выноса `createAuthGoogleHandler` из `route.ts` в sibling handler module, чтобы route exports соответствовали ограничениям Next.js.

## Failures
- Изначально `db:migrate` падал на `ALTER COLUMN "expires" SET DATA TYPE timestamp` без `USING`; migration исправлена.
- Изначально `build` падал из-за лишнего export в `app/api/auth/google/route.ts`; helper вынесен в `app/api/auth/google/handler.ts`.

## Residual Risks
- Параллельный запуск нескольких wrapper-команд, делящих один `PGDATA`, всё ещё может конфликтовать по lock-файлу; базовый single-command path работает стабильно.

## Self Review
- Проверил, что `src/infrastructure/db/*`, `src/ports/db.ts` и auth adapter больше не зависят от sqlite/dialect selector.

## Reviewer Review
- Отдельный reviewer не привлекался в рамках этого single-agent прохода; риск зафиксирован, но regression gate пройден локально.

## Exit Decision
- `need_retro`
