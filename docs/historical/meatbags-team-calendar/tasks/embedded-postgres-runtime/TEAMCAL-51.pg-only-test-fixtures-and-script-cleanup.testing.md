# Task Testing

Task: `TEAMCAL-51`
Updated: `2026-03-21`

## Context
- Change summary: sqlite fixtures/scripts удалены; route tests и db scripts переведены на единый Postgres-контур.
- Feature dossier: `tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`

## Risk Tier
- Tier: `medium`
- Reviewer required: `yes`

## Planned Checks
- Проверить route contracts на новых Postgres fixtures.
- Проверить общие test/db scripts на отсутствие sqlite targets.

## Commands Run
- `npm run test:unit:next-routes`
- `npm run test`
- `rg -n "sqlite|better-sqlite3|schema-sqlite|drizzle.config.sqlite|schema-parity|migrate-sqlite" . -g '!archive' -g '!node_modules' -g '!data/postgres'`

## Results
- API route contracts проходят на `app/api/test-support/pg-route-fixture.ts`.
- `package.json` и `scripts/*` больше не направляют выполнение в sqlite/parity контур.
- В живом коде и release-facing docs не осталось sqlite runtime/test paths; оставшиеся упоминания находятся в historical task/spec artifacts и optional peer следах `package-lock.json`.

## Failures
- Не обнаружены.

## Residual Risks
- Teardown временных Postgres БД шумит ожидаемыми `terminating connection due to administrator command` логами, что снижает читаемость test output.

## Self Review
- Проверил, что sqlite fixture helper удалён, а route tests и auth smoke используют новый pg fixture lifecycle.

## Reviewer Review
- Отдельный reviewer не привлекался в рамках этого single-agent прохода.

## Exit Decision
- `need_retro`
