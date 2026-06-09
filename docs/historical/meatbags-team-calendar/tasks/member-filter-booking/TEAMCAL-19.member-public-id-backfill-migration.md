# TEAMCAL-19 — Миграция backfill `member_public_id` (idempotent script + runbook)

Статус: done

## Описание
Вынести backfill существующих membership в отдельную задачу:
- создать отдельный миграционный скрипт обычным кодом;
- сделать безопасный и повторяемый запуск;
- добавить runbook запуска и проверки.

## Scope
- Скрипт: `scripts/migrations/backfill-member-public-id.js`.
- Источник: таблица `team_members`.
- Заполнять только записи с пустым `member_public_id`.
- Обеспечить idempotency (повторный запуск без побочных эффектов).
- Добавить режимы:
  - dry-run по умолчанию;
  - apply с явным флагом `--apply`.
- Добавить отчет выполнения:
  - `scanned / updated / skipped / errors`.
- Fail-fast по отсутствию env:
  - `NOCODB_BASE_URL`
  - `NOCODB_BASE_ID`
  - `NOCODB_API_TOKEN`
- Добавить runbook в `README.md` или в задачу (команда запуска, порядок действий, валидация результата).

## Критерии готовности
- Скрипт расположен в `scripts/migrations/backfill-member-public-id.js`.
- Dry-run не пишет в БД и печатает корректный отчет.
- Apply обновляет только пустые `member_public_id`.
- Повторный apply ничего не перетирает.
- Ошибки записи завершают процесс ненулевым кодом.
- Runbook описывает безопасный порядок запуска в prod.

## Тест кейсы
1. Запуск без `--apply`:
   - данные в БД не меняются;
   - отчет содержит `scanned` и `wouldUpdate`.
2. Запуск с `--apply`:
   - пустые `member_public_id` заполняются.
3. Повторный запуск с `--apply`:
   - `updated = 0` для уже обработанных записей.
4. Запуск без env:
   - процесс завершается с ошибкой и понятным сообщением.
5. Запуск на смеси данных (частично заполнено/частично пусто):
   - обновляются только пустые записи.

## Зависимости
- TEAMCAL-15

## Лог
- 2026-02-12 12:32 — [todo] Задача заведена: backfill вынесен в отдельный миграционный скрипт и runbook.
- 2026-02-12 21:50 — [in_progress] Старт реализации backfill-скрипта `member_public_id` для существующих `team_members` (dry-run/apply, idempotent).
- 2026-02-12 21:51 — [review] Добавлен `scripts/migrations/backfill-member-public-id.js` (dry-run/apply, idempotent, summary `scanned/skipped/wouldUpdate/updated/errors`, fail-fast по env), runbook добавлен в `README.md`; проверки: `node --check`, запуск из `/tmp` подтверждает fail-fast по отсутствующим env.
- 2026-02-12 22:01 — [review] Выполнен `--apply` backfill с доступом к NocoDB: `scanned=4`, `updated=4`, `errors=0`.
- 2026-02-12 22:01 — [review] Повторный `--apply` подтвердил идемпотентность: `scanned=4`, `updated=0`, `skipped=4`, `errors=0`.
- 2026-02-12 23:25 — [done] Задача закрыта: миграция backfill выполнена и подтверждена идемпотентной, runbook добавлен.
