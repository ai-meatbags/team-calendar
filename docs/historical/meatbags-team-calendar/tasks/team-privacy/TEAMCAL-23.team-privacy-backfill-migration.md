# TEAMCAL-23 — Migration: backfill `teams.privacy` (idempotent script + runbook)

Статус: done

## Описание
Вынести migration в отдельную задачу по стандарту из `tasks/_policies/dev-plan.md`: заполнить `teams.privacy` для исторических записей, где поле отсутствует/пустое, без побочных эффектов.

Источник требований: [Specs](tasks/team-privacy/team-privacy.specs.md).

## Scope
- Скрипт миграции: `scripts/migrations/backfill-team-privacy.js`.
- Dry-run по умолчанию (без записи в БД).
- Явный режим записи только через `--apply`.
- Идемпотентность: повторный запуск не перетирает уже корректные значения.
- Обновлять только записи с пустым/NULL `privacy`, ставить `public`.
- Отчет выполнения: `scanned / updated / skipped / errors`.
- Fail-fast при отсутствии обязательных env (`NOCODB_BASE_URL`, `NOCODB_BASE_ID`, `NOCODB_API_TOKEN`).
- Runbook запуска и валидации результата в `README.md` или в этой задаче.

## Критерии готовности
- Скрипт существует и запускается локально в dry-run режиме.
- Dry-run не меняет данные и печатает прогноз обновлений.
- `--apply` обновляет только пустые значения `privacy`.
- Повторный `--apply` не делает лишних обновлений.
- При ошибках записи процесс завершается ненулевым кодом и отражает ошибки в отчете.

## Тест кейсы
1. Happy path: запуск `--apply` на данных с NULL/пустым `privacy` выставляет `public` только этим записям.
2. Invalid input: запуск без обязательных env завершает процесс с понятной ошибкой.
3. Regression: повторный `--apply` после успешного прогона дает `updated=0` для уже заполненных записей.

## Зависимости
- [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md)

## Лог
- 2026-02-12 12:57 — [todo] Задача создана как отдельная migration-ветка по стандарту dry-run/apply.
- 2026-02-12 20:44 — [done] По решению пользователя миграция скриптом не выполняется: поле `teams.privacy` уже заполнено вручную в БД, отдельный backfill-скрипт в рамках фичи не требуется.
