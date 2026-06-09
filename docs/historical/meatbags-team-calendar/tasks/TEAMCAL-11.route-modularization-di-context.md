# TEAMCAL-11 — Вынос роутов в модули и DI-контекст

Статус: Canceled

## Описание
Задача про завершение server-side модульной архитектуры и DI-контекста.

Частично уже сделано:
- route-handlers вынесены в модульные роутеры `auth/me/teams/availability/booking/web`;
- `server/server.js` подключает роутеры через `app.use(createXRouter(...))`.

Осталось завершить:
- убрать из `server/server.js` оставшуюся бизнес-логику/инфра-хелперы в сервисы/адаптеры;
- довести DI до явного composition-root;
- сохранить API-контракты без регрессий.

## Applied rules
- `AP-010` — модульный монолит + Ports & Adapters.
- `AP-011` — низкая связность и высокая когезия.
- `AP-012` — fail-fast и явные контракты ошибок.
- `AP-014` — SOLID/Clean Code на уровне модулей.
- `AP-015` — DRY/KISS/YAGNI.
- `AP-016` — backend как доверенная security-граница.
- `AP-017` — минимизация данных и allowlist-экспорт.
- `PP-016` — availability fallback to primary.

## Scope
1. Довести до конца composition-root:
- вынести сбор инфраструктурных зависимостей (`NocoDB request helpers`, encryption/auth helpers, Google adapters, env-derived config) из `server/server.js` в отдельные модули.
- оставить в `server/server.js` только bootstrap middleware + сбор deps + `app.use(...)` + `app.listen`.

2. Завершить вынос доменной логики из `server/server.js`:
- вынести `upsertUser` в `auth` service;
- вынести `resolveSelectionValue` и `getActiveCalendarIdsFromSelection` в `availability` service;
- вынести `fetchBusyIntervals` в `availability` adapter/service;
- убрать прямую доменную логику из composition-root.

3. Укрепить DI-контекст:
- каждый роутер получает только необходимые зависимости (узкий интерфейс);
- зависимости на внешние системы проходят через порты/адаптеры, не через импорты из `server/server.js`.

4. Зафиксировать контрактную совместимость:
- пути и коды/тексты ошибок текущих endpoint не меняются;
- поведение existing API сохраняется 1:1.

5. Тестовое усиление под остаток:
- добавить/обновить unit-тесты сервисов после выноса;
- прогнать route regression и integration smoke.

## План выполнения
1. `auth`:
- создать `server/src/auth/auth.service.js` с `upsertUser(...)`;
- пробросить сервис в `createAuthRouter(...)` через DI.

2. `availability`:
- создать `server/src/availability/availability-selection.service.js` для effective selection;
- создать `server/src/availability/freebusy.adapter.js` или сервис провайдера busy intervals;
- пробросить в `createAvailabilityRouter(...)`.

3. `infra/composition`:
- вынести NocoDB CRUD helpers и security/token helpers в отдельные инфраструктурные модули;
- сократить `server/server.js` до wiring.

4. `tests`:
- unit для новых сервисов/адаптеров;
- `npm run test:unit`, `npm run test:routes`, `npm run test:integration`.

## Критерии готовности
- В `server/server.js` отсутствуют доменные функции (`upsertUser`, selection/busy business logic) и инфраструктурные CRUD-реализации.
- `server/server.js` выполняет только bootstrap + composition-root + `app.use(...)` + `app.listen`.
- Роутеры используют явный DI-контекст с узкими зависимостями.
- API-контракты и тексты ошибок не изменены.
- Тесты зеленые: unit + route regression + integration smoke.

## Зависимости
- нет

## Тест кейсы
1. Happy path:
- успешный auth callback с upsert через сервис;
- успешный availability расчет через вынесенный provider/service.

2. Invalid input / fail-fast:
- отсутствие refresh token / invalid selection / provider error корректно мапятся в ожидаемые `4xx/5xx`.

3. Regression:
- существующие endpoint-контракты (status/error text/payload keys) не меняются;
- `server/server.js` структурно не содержит route-handlers и доменной бизнес-логики.

## Лог
- 2026-02-05 18:09 — [todo] Задача заведена.
- 2026-02-12 23:59 — [in_progress] Зафиксирован partial state: роутеры уже вынесены в модули и подключены через `app.use(...)`, но DI-контекст и вынос оставшейся бизнес-логики из `server/server.js` не завершены.
- 2026-02-12 23:59 — [in_progress] Сформирован детальный план остатка работ по текущим правилам (`AP-010..017`, `PP-016`) с явными deliverables, тест-кейсами и критериями `done`.
- 2026-03-01 01:27 — [Canceled] Синхронизация с Linear: issue `TEAMCAL-11` в статусе `Canceled` (updatedAt: 2026-02-28T22:04:00.729Z); локальный статус выровнен 1:1.
