# Profile Menu + Global Route Refactor — Feature Specs

Статус: done

## Контекст и цель
Нужно реализовать пользовательское меню в правом верхнем углу и страницу профиля с редактированием имени,
при этом провести безопасный глобальный рефакторинг backend-роутов:
`server/server.js` должен содержать только bootstrap и подключения роутеров.

## Goals
1. Единое меню пользователя с пунктами и иконками:
- `Профиль`
- `Все команды`
- `Создать команду`
- `Выйти`
2. Под пунктом `Все команды` выводить веткой список существующих команд пользователя.
3. Предзагружать список команд лениво после загрузки страницы, чтобы при открытии меню не показывать технический loading-текст.
4. Поведение меню:
- desktop: раскрытие по hover
- mobile: раскрытие по click
5. Страница `/profile` с изменением `users.name` для текущего владельца сессии.
6. Глобальный вынос route-handlers из `server/server.js` в модульные роутеры.
7. Усилить route-level покрытие и ввести coverage gate для роутов.

## Non-goals
1. Редактирование email/аватара/других полей профиля.
2. Изменение бизнес-логики существующих API-контрактов (кроме добавления `PATCH /api/me`).
3. Миграции данных.

## Fixed Decisions
1. Backend-роуты выносятся в модули:
- `server/src/auth/*`
- `server/src/me/*`
- `server/src/teams/*`
- `server/src/availability/*`
- `server/src/booking/*`
- `server/src/web/*`
2. `server/server.js` не содержит `app.get/post/patch/delete` route-handlers.
3. Новый API: `PATCH /api/me` (`requireAuth` + `requireSameOrigin`).
4. Изменение имени доступно только текущему пользователю по `req.session.userId`.
5. Качество/gate:
- route coverage `statements >= 90%`
- обязательный smoke `npm run test:integration` перед release.

## API Contract Changes
### PATCH `/api/me`
Request:
```json
{ "name": "Иван" }
```
Response 200:
```json
{
  "id": "u-1",
  "email": "user@example.com",
  "name": "Иван",
  "picture": "https://..."
}
```
Errors:
- `400` — `Missing user name.`
- `401` — `Not authenticated`
- `403` — `Invalid origin.`
- `500` — `Failed to update user.`

## User Scenarios
1. Авторизованный пользователь на desktop наводит курсор на аватар и видит dropdown-меню.
2. Авторизованный пользователь на mobile нажимает на аватар и открывает dropdown-меню.
3. Пользователь переходит в `Профиль`, меняет имя, сохраняет, видит обновление в header.
4. Пользователь открывает `Все команды` и видит под пунктом веткой названия своих команд.
5. Пользователь открывает конкретную команду из ветки и переходит на `/t/:shareId`.
6. Пользователь выбирает `Создать команду` и попадает в create-mode (`/?create=1`).
7. Пользователь выходит через `Выйти`.

## Acceptance Criteria
1. В меню есть пункты: `Профиль`, `Все команды`, `Создать команду`, `Выйти`.
2. У каждого пункта есть иконка.
3. Под `Все команды` отображается ветка с названиями доступных команд и переходом в `/t/:shareId`.
4. При открытии меню не показывается текст `Загрузка...`; список команд предзагружается лениво после старта страницы.
5. Меню работает как `hover` на desktop и как `click` на mobile.
6. `/profile` позволяет изменить имя и сохраняет его в БД.
7. Имя обновляется для текущей сессии в UI после успешного сохранения.
8. `server/server.js` содержит только bootstrap + `app.use(...)` подключение роутеров.

## Parallelization Matrix
| task | depends_on | parallel_with | shared_files_risk |
|---|---|---|---|
| [TEAMCAL-26](tasks/profile-menu-refactor/TEAMCAL-26.backend-route-modules-foundation.md) | нет | [TEAMCAL-27](tasks/profile-menu-refactor/TEAMCAL-27.backend-route-coverage-and-gates.md) | medium (`server/server.js`) |
| [TEAMCAL-27](tasks/profile-menu-refactor/TEAMCAL-27.backend-route-coverage-and-gates.md) | [TEAMCAL-26](tasks/profile-menu-refactor/TEAMCAL-26.backend-route-modules-foundation.md) | [TEAMCAL-28](tasks/profile-menu-refactor/TEAMCAL-28.frontend-user-menu-and-profile-page.md) | low |
| [TEAMCAL-28](tasks/profile-menu-refactor/TEAMCAL-28.frontend-user-menu-and-profile-page.md) | [TEAMCAL-26](tasks/profile-menu-refactor/TEAMCAL-26.backend-route-modules-foundation.md) | [TEAMCAL-27](tasks/profile-menu-refactor/TEAMCAL-27.backend-route-coverage-and-gates.md) | medium (`frontend/src/components/Header.jsx`, `frontend/src/styles/styles.css`) |
| [TEAMCAL-29](tasks/profile-menu-refactor/TEAMCAL-29.integration-and-release-gate.md) | [TEAMCAL-27](tasks/profile-menu-refactor/TEAMCAL-27.backend-route-coverage-and-gates.md), [TEAMCAL-28](tasks/profile-menu-refactor/TEAMCAL-28.frontend-user-menu-and-profile-page.md) | нет | medium |

## Технические ограничения реализации
1. Сохранить тексты ошибок существующих endpoint-ов без изменений.
2. Security решения остаются backend-authoritative.
3. Внешние ответы ограничивать allowlist-полями.
4. Frontend остаётся на React + Vite без смены стека.

## Risks
1. Регрессия контрактов при переносе роутов из `server/server.js`.
2. Неполное route-покрытие может пропустить edge-cases.
3. Integration smoke требует валидных env (`NOCODB_*`).

## Release Gate
Фича считается готовой к релизу только если:
1. [TEAMCAL-26](tasks/profile-menu-refactor/TEAMCAL-26.backend-route-modules-foundation.md) в `done`.
2. [TEAMCAL-27](tasks/profile-menu-refactor/TEAMCAL-27.backend-route-coverage-and-gates.md) в `done`.
3. [TEAMCAL-28](tasks/profile-menu-refactor/TEAMCAL-28.frontend-user-menu-and-profile-page.md) в `done`.
4. [TEAMCAL-29](tasks/profile-menu-refactor/TEAMCAL-29.integration-and-release-gate.md) в `done`.
5. Выполнены `npm run test:unit`, route-coverage gate и `npm run test:integration`.

## Release Gate Result
1. TEAMCAL-26 — `done`.
2. TEAMCAL-27 — `done`.
3. TEAMCAL-28 — `done`.
4. TEAMCAL-29 — `done`.
5. Проверки пройдены:
- `npm run test:unit` — green.
- `npm run test:coverage:routes` — green (`Statements 94.74%`).
- `npm run test:integration` — green.
