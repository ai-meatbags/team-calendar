# TEAMCAL-26 — Backend route modules foundation

Статус: done

## Описание
Вынести все route-handlers из `server/server.js` в модульные роутеры и подключать их через `app.use(...)`.
Добавить `PATCH /api/me` в модуль `me`.

## Scope
- Создать роутеры:
  - `server/src/auth/*`
  - `server/src/me/*`
  - `server/src/teams/*`
  - `server/src/availability/*`
  - `server/src/booking/*`
  - `server/src/web/*`
- Подключить роутеры в `server/server.js` одной строкой через `app.use(...)`.
- Удалить все route-handlers `app.get/post/patch/delete` из `server/server.js`.
- Реализовать `PATCH /api/me` с обновлением только `users.name` текущего пользователя.

## Критерии готовности
- В `server/server.js` отсутствуют route-handler объявления.
- Все существующие endpoint-пути сохранены.
- `PATCH /api/me` доступен и работает по контракту.

## Тест кейсы
1. Happy path: `PATCH /api/me` меняет имя текущего пользователя.
2. Invalid input: пустое имя возвращает `400`.
3. Regression: старые route-path продолжают обслуживаться после выноса в модули.

## Зависимости
- [Specs](tasks/profile-menu-refactor/specs.md)

## Лог
- 2026-02-12 23:15 — [todo] Создана задача foundation для глобального выноса роутов.
- 2026-02-12 23:40 — [in_progress] Начат перенос route-handlers в модульные роутеры `auth/me/teams/availability/booking/web`.
- 2026-02-12 23:58 — [review] Роуты вынесены, `server/server.js` переведен на `app.use(...)`, добавлен `PATCH /api/me` в модуль `me`.
- 2026-02-12 23:59 — [done] Созданы модульные роутеры и входные точки: `server/src/auth/*`, `server/src/me/*`, `server/src/teams/*`, `server/src/availability/*`, `server/src/booking/*`, `server/src/web/*`.
- 2026-02-12 23:59 — [done] `server/server.js` оставлен как bootstrap + middleware + `app.use(createXRouter(...))`; прямых `app.get/post/patch/delete` route-handlers в файле нет.
- 2026-02-12 23:59 — [done] Реализован `PATCH /api/me` в `server/src/me/routes/me.routes.js` с `requireAuth` + `requireSameOrigin`, обновлением только `users.name` текущего пользователя и контрактными кодами ошибок `400/401/403/500`.
