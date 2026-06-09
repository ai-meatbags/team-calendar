# TEAMCAL-44 — Backend parity и архитектурное ужесточение Next API

Статус: done

## Описание
Довести Next API до parity с legacy backend и одновременно убрать критичные архитектурные нарушения в новом контуре: добавить недостающие контракты, вынести orchestration из route handlers и централизовать mapping ошибок.

## Applied rules
- AP-010
- AP-012
- AP-016
- AP-017
- AP-019
- AP-020
- AP-021
- AP-022
- AP-029
- AP-030
- PP-016
- PP-018
- PP-019

## Scope
- `PATCH /api/me`
- parity для `GET /api/me/settings`, `PATCH /api/me/calendar`, `GET /api/teams/:shareId/settings`, `PATCH /api/teams/:shareId`
- вынос orchestration/use-cases из `app/api/*`
- typed errors / единый HTTP mapping / минимизация `any`
- сохранение текущих booking/availability/team invariants без продуктовых изменений

## Критерии готовности
- Все обязательные parity API-контракты реализованы в Next
- Route handlers остаются тонкими, use-case слой не импортирует infra напрямую
- Критичные P1 architectural findings для Next API закрыты
- Текущие error/business contracts не разъезжаются с legacy behavior

## Тест кейсы
1. Contract tests для profile/settings/team settings parity.
2. Regression tests для availability/booking/team flows.
3. Проверка, что P1 нарушения AP-020/AP-021/AP-022/AP-029 закрыты в изменённом контуре.

## Зависимости
- [TEAMCAL-43](tasks/nextjs-cutover/TEAMCAL-43.foundation-cutover-parity-and-source-of-truth.md)

## Лог
- 2026-03-07 11:28 — [todo] Created from Linear TEAMCAL-44.
- 2026-03-07 12:01 — [in_progress] Старт выполнения: сверяю legacy-контракты profile/settings/team settings с текущими `app/api/*`, затем добавляю недостающий parity и выношу orchestration из route handlers.
- 2026-03-07 13:09 — [in_progress] Добавил `AppError`/HTTP mapping и вынес parity-логику calendar selection в `src/domain/*` и `src/application/usecases/*`, чтобы `me`, `teams`, `team settings` routes стали thin wiring-слоем.
- 2026-03-07 13:23 — [in_progress] Перевёл `app/api/me*`, `app/api/teams`, `app/api/teams/[shareId]`, `app/api/teams/[shareId]/settings` на handler factories и use-cases; восстановил `PATCH /api/me`, merged calendar settings, точные owner/privacy ошибки и contract parity по `calendarSelectionSource`.
- 2026-03-07 13:29 — [review] Добавил route contract tests для `me`, `teams`, `team settings`, прогнал regression для booking/availability и `npx tsc --noEmit --incremental false`. `next build` компилирует код, но финальный шаг type-cache в `.next` падает с `ENOSPC`, поэтому build-blocker сейчас инфраструктурный, не кодовый.
- 2026-03-07 13:38 — [need_changes] По review возвращаю задачу в работу: чиню lookup `/api/me` по `session.user.id`, добавляю popup-auth bridge + fallback polling, подключаю новые route tests в штатный test gate и добиваю QA-покрытие delete/logout.
- 2026-03-07 13:47 — [review] Закрыл review-findings: `GET /api/me` теперь использует `session.user.id`, новый auth-контур получил popup completion bridge и fallback polling в `useAuth`, `test:unit:next-routes` расширен новыми route tests, добавлено QA-покрытие на popup/logout/delete. Повторно прошли `npm run test:unit:next-routes` и `npx tsc --noEmit --incremental false`.
- 2026-03-07 12:31 — [retro] retro_done=true; rule_decision=none; reason="Изменения и выводы ограничены backend/auth parity для cutover и уже зафиксированы в коде, тестах и task/spec артефактах; нового project-wide правила не требуется."; rule_type=n/a; rule_id=n/a
- 2026-03-07 12:31 — [done] Задача закрыта: backend parity и review-fixes завершены, критичные API-контракты переведены на thin-handler/use-case паттерн, popup/logout/test gate добиты; открытым остаётся только инфраструктурный build blocker `ENOSPC`.
