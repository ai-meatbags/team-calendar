# TEAMCAL-4 — API для настроек команды

Статус: done

## Описание
Реализовать GET `/api/teams/:shareId/settings` и PATCH `/api/teams/:shareId`.

## Критерии готовности
- GET возвращает merged список для участника.
- PATCH сохраняет `team_members.calendar_selection`.
- Проверка владельца для изменения имени команды.

## Зависимости
- TEAMCAL-1
- TEAMCAL-2
- TEAMCAL-9

## Лог
- 2026-02-05 15:07 — [todo] Задача заведена.
- 2026-02-05 15:24 — [todo] Добавлены зависимости.
- 2026-02-05 18:56 — [in_progress] Старт работы над team settings API; новые роуты вынесены в модуль settings с отдельными route-файлами.
- 2026-02-05 19:02 — [review] Добавлен модуль settings с роутами GET /api/teams/:shareId/settings и PATCH /api/teams/:shareId, сервисом для selection и unit-тестами. server.js инициализирует модуль через зависимости. Unit-тесты пройдены.
- 2026-02-05 19:02 — [in_progress] Запрошена правка: registerGetTeamSettingsRoute должен возвращать router для чейнинга.
- 2026-02-05 19:03 — [review] Роут-регистраторы возвращают router для чейнинга. Unit-тесты пройдены.
- 2026-02-05 19:08 — [done] Пользователь подтвердил.
