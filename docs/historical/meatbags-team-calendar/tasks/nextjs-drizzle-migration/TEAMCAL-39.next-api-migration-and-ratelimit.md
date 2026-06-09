# TEAMCAL-39 — Next API migration + DB-backed rate limits

Статус: done

## Описание
Перенести API на Next route handlers с тонкими хендлерами, use-cases и DB-backed rate limiter на критичных endpoint-ах.

## Applied rules
- AP-010
- AP-011
- AP-012
- AP-016
- AP-017
- PP-016
- PP-018
- PP-019

## Scope
- `app/api/me`, `app/api/teams/*`, `app/api/booking`, `app/api/teams/[shareId]/availability`.
- Immediate-break публичного payload (без внутренних id).
- Rate limit таблица + логика 429 для availability/booking.

## Критерии готовности
- Контракты и бизнес-правила сохранены 1:1.
- Публичные payload не содержат внутренних id и email leakage.
- Rate limit стабильно ограничивает запросы по порогу.

## Тест кейсы
1. Contract tests по privacy/member filter/duration/availability window/lead time.
2. Booking tests (all/single, dedup, best-effort response).
3. Rate limit test: overflow -> 429.

## Зависимости
- [TEAMCAL-37](tasks/nextjs-drizzle-migration/TEAMCAL-37.drizzle-dual-schema-and-db-client.md)
- [TEAMCAL-38](tasks/nextjs-drizzle-migration/TEAMCAL-38.authjs-encrypted-adapter.md)

## Лог
- 2026-02-28 23:21 — [todo] Created from Linear TEAMCAL-39.
- 2026-03-01 01:52 — [in_progress] Старт выполнения: сверяю Next route handlers с legacy-контрактами и добавляю недостающие тесты для rate limit (429) и booking/availability инвариантов.
- 2026-03-01 01:59 — [in_progress] Роуты `app/api/booking` и `app/api/teams/[shareId]/availability` переведены на тестируемые фабрики handler-ов с DI зависимостей без изменения внешнего API-контракта.
- 2026-03-01 02:02 — [review] Добавлены Next route unit tests: booking (`all/single`, dedup, best-effort, 429) и availability (member filter 400, duration 60/30, lead-time/horizon invariants, 429). Проверки пройдены: `npm run test:unit:auth`, `npm run test:unit:db`, `npm run test:unit:next-routes`.
- 2026-03-01 02:04 — [review] Вынесена общая SQLite route-fixture в `app/api/test-support/sqlite-route-fixture.ts` для соблюдения AP-019 (лимит размера файлов); повторный прогон тестов успешен.
- 2026-03-01 02:06 — [retro] retro_done=true; rule_decision=none; reason="Текущие AP/PP правила покрывают найденные риски задачи, новое project-правило не требуется."; rule_type=n/a; rule_id=n/a
- 2026-03-01 02:07 — [done] Ретро синхронизировано в Linear, issue TEAMCAL-39 переведена в Done; задача закрыта.
