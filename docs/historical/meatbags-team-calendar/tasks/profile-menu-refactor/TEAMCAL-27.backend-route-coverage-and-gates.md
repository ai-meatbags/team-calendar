# TEAMCAL-27 — Backend route coverage and quality gates

Статус: done

## Описание
Добавить route-level тесты для новых модульных роутеров и зафиксировать команды quality gates.

## Scope
- Добавить route-тесты для:
  - `auth`
  - `me`
  - `teams`
  - `availability`
  - `booking`
  - `web`
- Зафиксировать команды проверки route coverage.
- Подготовить release gate checklist для backend-части.

## Критерии готовности
- Тесты покрывают ключевые happy/invalid/regression сценарии.
- Route coverage можно измерить отдельной командой.
- Есть явный gate `statements >= 90%` для route-модулей.

## Тест кейсы
1. Happy path: базовые успешные ответы для каждого нового роутера.
2. Invalid input: ключевые ошибки (`400/401/403/404/422/502`) возвращаются корректно.
3. Regression: тексты/коды ошибок старых endpoint не изменены.

## Зависимости
- [TEAMCAL-26](tasks/profile-menu-refactor/TEAMCAL-26.backend-route-modules-foundation.md)
- [Specs](tasks/profile-menu-refactor/specs.md)

## Лог
- 2026-02-12 23:16 — [todo] Создана задача по route coverage и quality gates.
- 2026-02-12 23:59 — [in_progress] Добавлены route-level тесты для `auth/me/teams/availability/booking/web`.
- 2026-02-12 23:59 — [review] Зафиксированы route-тесты и команды gate-проверок для покрытия.
- 2026-02-12 23:59 — [done] Добавлены route-тесты: `server/src/auth/routes/auth.routes.test.js`, `server/src/me/routes/me.routes.test.js`, `server/src/teams/routes/teams.routes.test.js`, `server/src/availability/routes/availability.routes.test.js`, `server/src/booking/routes/booking.routes.test.js`, `server/src/web/routes/web.routes.test.js`.
- 2026-02-12 23:59 — [done] В `package.json` добавлены команды: `test:routes` и `test:coverage:routes` с include только для route-модулей.
- 2026-02-12 23:59 — [done] Coverage gate пройден: `Statements 94.74%` (1046/1104), `Functions 85.71%`, `Branches 79.13%`, `Lines 94.74%`; целевой порог `statements >= 90%` выполнен.
