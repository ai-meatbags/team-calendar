# TEAMCAL-20 — Foundation: privacy contract + safe member serialization

Статус: done

## Описание
Создать базовый контракт фичи из [Specs](tasks/team-privacy/team-privacy.specs.md), на котором смогут параллельно работать backend/frontend/migration ветки:
- формализовать `teams.privacy` как `public|private`;
- добавить выдачу `privacy/canJoin/canEditPrivacy` в нужные endpoint-ы;
- ввести единый sanitize-слой, который исключает `members[].email` из клиентских payload-ов.

## Scope
- Backend-модель команды: нормализация и чтение `privacy` как enum (`public|private`).
- `GET /api/teams/:shareId`: добавить `team.privacy`, `canJoin`; убрать `members[].email`.
- `GET /api/teams/:shareId/settings`: добавить `privacy`, `canEditPrivacy`; убрать email членов команды.
- Общий helper сериализации участников для endpoint-ов страницы команды (allowlist полей).
- Базовые unit/integration тесты контракта ответов.

## Критерии готовности
- Все публичные ответы страницы команды используют единый sanitize-слой без `member.email`.
- `privacy` возвращается строго как `public|private`.
- `canJoin` и `canEditPrivacy` возвращаются детерминированно по auth/role.
- Контракт endpoint-ов совпадает с [Specs](tasks/team-privacy/team-privacy.specs.md) без открытых ambiguities.
- Тесты backend покрывают happy/invalid/regression ветки контракта.

## Тест кейсы
1. Happy path: `GET /api/teams/:shareId` для public-команды возвращает `team.privacy=public`, `canJoin=true` и `members[]` без `email`.
2. Invalid input: `privacy` в хранилище вне enum нормализуется/отклоняется предсказуемо (без падения endpoint-а).
3. Regression: `GET /api/teams/:shareId/settings` не ломает текущий settings flow и не возвращает email членов команды.

## Зависимости
- нет

## Лог
- 2026-02-12 12:57 — [todo] Задача создана как foundation для feature [Specs](tasks/team-privacy/team-privacy.specs.md).
- 2026-02-12 20:32 — [in_progress] Старт реализации. Applied rules: AP-010, AP-011, AP-012, AP-016, AP-017, PP-015, PP-016. Начинаю с backend helper слоя privacy/sanitization и интеграции в team endpoints.
- 2026-02-12 20:43 — [review] Добавлен модуль `server/src/team-privacy` (normalize/isValid privacy, canJoin matrix, safe member serializer), интегрирован в `/api/teams/:shareId`, `/api/teams/:shareId/settings`, `/api/teams/:shareId/availability`; удален `members[].email` из публичных team payload-ов.
- 2026-02-12 20:57 — [done] Foundation принят: privacy-contract и sanitize-слой стабилизированы, используются как базовый стандарт во всех endpoint-ах страницы команды.
