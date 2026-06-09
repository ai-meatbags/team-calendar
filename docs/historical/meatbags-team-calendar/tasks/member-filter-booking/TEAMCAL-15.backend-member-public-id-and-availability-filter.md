# TEAMCAL-15 — Backend `member_public_id` контракт + availability фильтр `member`

Статус: done

## Описание
Подготовить backend-контракт, на котором строится вся фича:
- добавить в membership стабильный публичный идентификатор `member_public_id`;
- вернуть в team detail `memberPublicId` для каждого участника;
- расширить availability endpoint фильтром `member=<member_public_id>`;
- валидация невалидного `member` + предсказуемый fallback на клиенте.

Эта задача является базой для параллельных веток frontend и booking backend.

## Scope
- `team_members`: добавить/использовать поле `member_public_id` (immutable).
- Создание `member_public_id` при создании команды и `POST /join`.
- `GET /api/teams/:shareId`: добавить `memberPublicId` в `members[]`.
- `GET /api/teams/:shareId/availability`: поддержка query `member`.
- Валидация `member` относительно текущей команды.
- Обновление/добавление тестов backend для нового контракта.

## Критерии готовности
- У нового membership при create/join всегда появляется `member_public_id`.
- Team detail возвращает каждому участнику `memberPublicId`.
- Availability принимает `member=<member_public_id>`.
- Без `member`: пересечение по всей команде.
- С `member`: слоты только выбранного участника.
- Невалидный `member` возвращает `400` с понятной ошибкой.
- Тесты backend покрывают обе ветки.

## Тест кейсы
1. Создание команды создает membership с `member_public_id`.
2. `POST /join` создает membership с `member_public_id`.
3. `GET /api/teams/:shareId` возвращает `members[].memberPublicId`.
4. `GET /availability` без `member` возвращает командные слоты.
5. `GET /availability?member=<valid member_public_id>` возвращает персональные слоты.
6. `GET /availability?member=<invalid>` возвращает `400`.
7. Regression: существующая загрузка страницы команды не ломается.

## Зависимости
- TEAMCAL-12

## Лог
- 2026-02-12 12:21 — [todo] Задача заведена в рамках фичи `member-filter-booking`.
- 2026-02-12 12:26 — [todo] Контракт обновлен: `member_public_id` как базовый идентификатор + query `member` для availability.
- 2026-02-12 12:31 — [todo] Добавлены обязательные требования к миграции: отдельный idempotent-скрипт в `scripts/migrations/` с dry-run/apply и runbook.
- 2026-02-12 12:32 — [todo] Миграция вынесена в отдельную задачу `TEAMCAL-19`; в этой задаче оставлен только контракт/API + генерация id для новых membership.
- 2026-02-12 21:04 — [in_progress] Старт реализации по подтверждению пользователя: backend контракт `member_public_id` + фильтр availability `member` без legacy-поддержки.
- 2026-02-12 21:16 — [review] Добавлен backend-модуль `member-filter-booking` (генерация/валидация `member_public_id`, availability-filter), обновлены create/join/team-detail/availability контракты, добавлены unit-тесты модуля; `npm run test:unit`, `npm run build:client`.
- 2026-02-12 23:25 — [done] Задача закрыта после финальной приёмки фичи `member-filter-booking`; backend-контракт и фильтр `member` приняты без доп. правок.
