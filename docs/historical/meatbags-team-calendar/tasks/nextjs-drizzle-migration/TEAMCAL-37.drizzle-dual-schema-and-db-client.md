# TEAMCAL-37 — Drizzle DB layer: dual schema and client selector

Статус: done

## Описание
Реализовать Drizzle инфраструктуру: SQLite default + Postgres optional, dual schema, migration configs и parity checks.

## Applied rules
- AP-010
- AP-011
- AP-012
- AP-015
- AP-017

## Scope
- `src/infrastructure/db/client.ts` с dialect selector.
- `schema-common`, `schema-sqlite`, `schema-pg`.
- `drizzle.config.sqlite.ts`, `drizzle.config.pg.ts`.
- NPM scripts для generate/migrate/check parity.

## Критерии готовности
- `DATABASE_URL=file:*` выбирает sqlite-клиент.
- `DATABASE_URL=postgres*` выбирает pg-клиент.
- Схемы SQLite/PG имеют одинаковый контракт таблиц/полей/ограничений.

## Тест кейсы
1. Unit test для `createDbClient` selector.
2. Schema parity test на table/column/constraint manifest.
3. Smoke: миграции генерируются для обоих dialect.

## Зависимости
- [TEAMCAL-36](tasks/nextjs-drizzle-migration/TEAMCAL-36.foundation-contracts-and-policy.md)

## Лог
- 2026-02-28 23:21 — [todo] Created from Linear TEAMCAL-37.
- 2026-03-01 01:26 — [in_progress] Старт выполнения: проверяю dual-schema инфраструктуру Drizzle, selector клиента и parity/smoke тесты под SQLite/Postgres.
- 2026-03-01 01:33 — [in_progress] Реализован явный selector dialect в `createDbClient` (`resolveDbDialect`), добавлен тестовый reset cache и unit-тесты для выбора dialect/валидации `DATABASE_URL`.
- 2026-03-01 01:36 — [review] Усилен parity-check: добавлен `schema-parity` с реальной сверкой SQLite/PG по таблицам, колонкам, primary/unique constraints и соответствию `SCHEMA_MANIFEST`; проверки пройдены (`npm run test:unit:db`, `npm run db:check:parity`, `npm run db:gen:sqlite`, `npm run db:gen:pg`), миграции сгенерированы для обоих dialect.
- 2026-03-01 01:38 — [retro] retro_done=true; rule_decision=update; reason="Manifest-only parity-check не ловит расхождения фактических Drizzle схем, поэтому правило dual-schema усилено требованием сверки реальных table metadata."; rule_type=code; rule_id=PP-018
- 2026-03-01 01:39 — [done] Ретро завершено: правило PP-018 обновлено, изменения и retro-сводка синхронизированы в Linear, задача закрыта.
