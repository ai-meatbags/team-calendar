# TEAMCAL-51 — PG-only test fixtures and script cleanup

Статус: done

## Описание
Удалить sqlite-specific test/scripts surface и перевести тестовый контур, db scripts и вспомогательные миграционные артефакты на единый Postgres путь.

## Applied rules
- AP-012
- AP-018
- AP-024
- AP-028
- PP-018
- PP-019

## Scope
- `app/api/test-support/*`
- `app/api/**/*.test.ts`
- `src/infrastructure/**/*.test.ts`
- `scripts/*`
- `drizzle/*`
- `package.json`

## Критерии готовности
- В проекте нет sqlite fixture helpers и sqlite-specific test assumptions.
- DB/test scripts в `package.json` и `scripts/*` используют только Postgres-контур.
- Удалены parity checks и миграционные скрипты, завязанные на dual schema или sqlite source.
- Обновлённый test contour остаётся детерминированным и воспроизводимым.

## Тест кейсы
1. Unit/contract tests используют Postgres fixture lifecycle вместо `better-sqlite3`.
2. Проверка npm scripts на отсутствие sqlite targets.
3. Smoke на запуск db/test scripts в pg-only режиме.

## Зависимости
- [TEAMCAL-50](tasks/embedded-postgres-runtime/TEAMCAL-50.embedded-postgres-bootstrap-and-pg-only-client.md)

## Лог
- 2026-03-21 00:35 — [todo] Created from feature dossier `embedded-postgres-runtime`.
- 2026-03-21 01:04 — [in_progress] Route fixtures, db scripts и migration artifacts переведены на единый Postgres-контур; sqlite helper surface удаляется.
- 2026-03-21 01:04 — [testing] `npm run test:unit:next-routes`, `npm run test` и grep-проверка подтвердили отсутствие живых sqlite runtime/test paths.
- 2026-03-21 01:04 — [need_retro] Зафиксирован follow-up на quieter teardown для временных Postgres БД в тестах.
- 2026-03-21 01:04 — [done] Test fixtures и scripts очищены от sqlite/parity surface и работают через Postgres.
