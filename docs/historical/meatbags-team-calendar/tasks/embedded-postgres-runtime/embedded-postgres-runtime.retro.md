# Feature Retro

Feature: `embedded-postgres-runtime`
Updated: `2026-03-21`

## What Shipped
- Проект переведён на `pg-only` data layer без `sqlite` runtime/test branches.
- Embedded Postgres стал default path для zero-config self-hosted, а внешний Postgres остался supported через `DATABASE_URL`.
- Drizzle migrations, route fixtures, auth/db runtime и release docs сведены к одному Postgres-контуру.

## What Did Not Ship
- Миграция данных из legacy `sqlite` intentionally не делалась.
- Hardening конкурентного запуска нескольких embedded-wrapper команд не включён в текущий scope.
- Шумный teardown временных Postgres БД не был отдельно отполирован.

## Follow-ups
- Рассмотреть follow-up на shared `PGDATA`/lock handling в `scripts/with-default-postgres.ts`.
- Рассмотреть follow-up на quieter cleanup в `app/api/test-support/pg-route-fixture.ts`.

## Main Risks And Lessons
- Упрощение data layer произошло только потому, что `sqlite` удалён отовсюду, а не оставлен вторым режимом "на всякий случай".
- Финальный `db:migrate` и `next build` нашли дефекты, которые не были видны из одних unit tests.

## Proposed Improvements
- Явно закрепить в process rules обязательную пометку superseded у historical specs после архитектурных поворотов.
- Явно закрепить build-gate и запрет на test-only exports из `app/**/route.ts`.

## Async Review State
- `pending`
