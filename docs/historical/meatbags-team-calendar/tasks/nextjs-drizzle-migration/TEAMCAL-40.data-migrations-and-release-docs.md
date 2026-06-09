# TEAMCAL-40 — Data migrations + release docs and gates

Статус: done

## Описание
Реализовать migration scripts и release-документацию для перехода `NocoDB -> SQLite` и `SQLite -> Postgres`.

## Applied rules
- AP-012
- AP-014
- AP-015
- AP-017

## Scope
- `scripts/migrate-nocodb-to-sqlite.ts` (dry-run default, --apply).
- `scripts/migrate-sqlite-to-postgres.ts` (batch copy + upsert).
- Обновление `README`, `SECURITY`, `ARCHITECTURE`.
- Финальный release checklist + verification runbook.

## Критерии готовности
- Оба скрипта идемпотентны и дают execution report.
- Документация покрывает локальный SQLite и optional Postgres/Supabase.
- Release gate критерии и проверки оформлены.

## Тест кейсы
1. Migration dry-run выдаёт `scanned/updated/skipped/errors`.
2. Repeat apply run не дублирует данные.
3. Sample verification по `shareId/memberPublicId` проходит.

## Зависимости
- [TEAMCAL-39](tasks/nextjs-drizzle-migration/TEAMCAL-39.next-api-migration-and-ratelimit.md)

## Лог
- 2026-02-28 23:21 — [todo] Created from Linear TEAMCAL-40.
- 2026-03-01 03:08 — [in_progress] Начата реализация migration/runbook части: обновлены скрипты `migrate-nocodb-to-sqlite` и `migrate-sqlite-to-postgres` под отчёты и idempotent upsert-flow.
- 2026-03-01 03:14 — [in_progress] Обновлена документация `README`, `docs/SECURITY`, `docs/ARCHITECTURE`; добавлен `docs/RELEASE_CHECKLIST.md` с release gate и verification runbook.
- 2026-03-01 03:16 — [review] Проверки `db:check:parity`, `test:unit:auth`, `test:unit:db`, `test:unit:next-routes` прошли успешно; задача готова к ревью.

- 2026-03-01 03:40 — [retro] retro_done=true; rule_decision=none; reason="По итогам задачи дополнительные project-rules не требуются."; rule_type=n/a; rule_id=n/a
- 2026-03-01 03:41 — [done] Ретро завершено; задача закрыта в локальном трекере.
