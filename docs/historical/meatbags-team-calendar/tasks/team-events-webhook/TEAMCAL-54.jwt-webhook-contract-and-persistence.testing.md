# Task Testing

Task: `TEAMCAL-54`
Updated: `2026-04-10`

## Context
- Change summary: JWT-only persistence contract добавлен в domain/schema/use-case слой; create path теперь пишет `jwt_secret_encrypted`, `jwt_audience`, `secret_last_rotated_at`, а legacy rows получают явный `cutover_required` placeholder через migration backfill.
- Feature dossier: `tasks/team-events-webhook/team-events-webhook.feature.md`

## Risk Tier
- Tier: `high`
- Reviewer required: `yes`

## Planned Checks
- Проверить domain contract для fixed JWT constants, audience derivation и `last_error` redaction.
- Проверить owner webhook route contracts после добавления обязательных security columns.
- Проверить booking delivery regression после обновления test fixtures/schema contract.
- Проверить migration generation и вручную убедиться, что SQL не ломает существующие строки.

## Commands Run
- `npm run db:gen`
- `node --import tsx --test src/domain/team-webhooks.test.ts`
- `node --import tsx scripts/with-default-postgres.ts node --import tsx ./app/api/teams/\[shareId\]/integrations/webhooks/route.test.ts`
- `node --import tsx scripts/with-default-postgres.ts sh -lc "node --import tsx --test 'app/api/booking/route.test.ts'"`

## Results
- Domain contract фиксирует `teamcal`, `HS256`, TTL `120` и policy для `last_error` redaction.
- Schema и pg test fixture требуют `jwt_secret_encrypted` и `jwt_audience`, что убирает старый “безопасность потом” persistence gap.
- Owner create path реально пишет encrypted secret, stable audience и `secret_last_rotated_at`.
- Generated migration `0004` вручную усилена: вместо ломающего `ADD COLUMN ... NOT NULL` added columns backfill-ятся и legacy rows маркируются как `cutover_required`.
- Booking regression и owner webhook route tests проходят на обновлённом contract.

## Failures
- `drizzle-kit generate` сначала создал небезопасный migration SQL с `ADD COLUMN ... NOT NULL` без backfill для существующих строк; SQL исправлен вручную до безопасного cutover path.
- Первая версия redaction regex дважды маскировала `authorization: bearer ...`; policy скорректирована и покрыта domain test.

## Residual Risks
- Legacy subscriptions после `0004` не считаются fully provisioned для JWT delivery: они хранят placeholder `__teamcal_jwt_secret_cutover_required__` и потребуют create/rotate/cutover flow в следующих задачах.
- Отдельный reviewer в рамках этого single-agent прохода не привлекался, хотя risk tier формально `high`.

## Self Review
- Проверил, что contract cut не возвращает `auth_mode`-ветвление и не тащит security decisions в route/UI слой.
- Проверил, что migration path теперь честно маркирует legacy rows как требующие cutover, а не симулирует готовый production secret.

## Reviewer Review
- Отдельный reviewer не привлекался в рамках этого single-agent прохода.

## Exit Decision
- `need_retro`
