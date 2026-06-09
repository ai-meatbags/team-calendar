# TEAMCAL-24 — Integration: regression suite + security checklist/report

Статус: done

## Описание
Финальная интеграционная задача фичи из [Specs](tasks/team-privacy/team-privacy.specs.md):
- собрать backend/frontend/migration изменения;
- закрыть security checklist;
- подготовить security report в логе задачи перед переводом в `review`.

## Scope
- Интеграционная проверка endpoint-ов:
  - `GET /api/teams/:shareId`
  - `GET /api/teams/:shareId/settings`
  - `PATCH /api/teams/:shareId`
  - `POST /api/teams/:shareId/join`
  - `GET /api/teams/:shareId/availability`
  - `GET /api/teams`
- Проверка отсутствия `members[].email` и email в логах flow.
- Проверка UI-матрицы `hasUser/isMember/canJoin`.
- Обновление регрессионных тестов (backend + frontend).
- Добавление в `Лог` security report:
  - проверенные endpoint-ы;
  - что убрано из payload/logs;
  - список тестов и результат;
  - остаточные риски.

## Критерии готовности
- Все проверки privacy/join/email leakage пройдены.
- Security checklist из [Specs](tasks/team-privacy/team-privacy.specs.md) полностью закрыт.
- Security report добавлен в лог задачи.
- Фича готова к release gate из [Specs](tasks/team-privacy/team-privacy.specs.md).

## Тест кейсы
1. Happy path: owner переводит команду в `private`, UI скрывает join, backend возвращает `403` на `POST /join`.
2. Invalid input: non-owner пытается PATCH `privacy`, получает `403`, значение не меняется.
3. Regression: для `public` команды join остается рабочим, а share-page по `/t/:shareId` продолжает открываться.
4. Regression: ни один проверенный endpoint не содержит email членов команды.
5. Regression: серверные логи по flow не содержат email членов команды.

## Зависимости
- [TEAMCAL-21](tasks/team-privacy/TEAMCAL-21.owner-only-privacy-update-private-join-guard.md)
- [TEAMCAL-22](tasks/team-privacy/TEAMCAL-22.frontend-privacy-toggle-join-visibility-anti-email.md)
- [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md)

## Лог
- 2026-02-12 12:57 — [todo] Задача создана как финальный интеграционный gate фичи.
- 2026-02-12 20:45 — [in_progress] Запущены регрессионные проверки и аудит контрактов/логов: backend privacy/join enforcement, frontend join visibility, anti-email leakage по endpoint-ам страницы команды.
- 2026-02-12 20:45 — [review] Security report:
  - Проверенные endpoint-ы:
    - `GET /api/teams/:shareId`
    - `GET /api/teams/:shareId/settings`
    - `PATCH /api/teams/:shareId`
    - `POST /api/teams/:shareId/join`
    - `GET /api/teams/:shareId/availability`
    - `GET /api/teams`
  - Что убрано из payload:
    - удалено `members[].email` из `GET /api/teams/:shareId`;
    - удалено `email` из member-структур слотов в `GET /api/teams/:shareId/availability`;
    - добавлены `team.privacy`, `canJoin`, `privacy`, `canEditPrivacy` по контракту.
  - Логи:
    - из availability/freebusy flow удален email из лог-контекста участников (используются `userId/teamId/counts`).
  - Тесты и результат:
    - `npm run test:unit` — PASS;
    - `npm run build:client` — PASS;
    - добавлены тесты: `server/src/team-privacy/team-privacy.service.test.js`, `server/src/settings/routes/get-team-settings.route.test.js`, `server/src/settings/routes/patch-team-settings.route.test.js`, `frontend/tests/unit/team-utils.test.js`.
  - Остаточные риски:
    - полный e2e/integration прогон против реальной NocoDB не выполнялся в рамках unit-пакета; требуется стандартная post-deploy smoke-проверка API в окружении.
- 2026-02-12 20:57 — [done] Интеграционный gate закрыт: privacy/join/email-leakage проверки пройдены, визуальная и API-проверка подтверждены пользователем.
