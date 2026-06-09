# Feature Specs — Team Privacy + Email Leak Prevention

Статус: draft
Feature key: `TEAMCAL-TPRIV`
Дата: 2026-02-12

## Контекст
Текущая карточка приватности и join-поток не гарантируют строгий owner-контроль и не закрывают все каналы утечки email членов команды в клиентские payload-ы/логи.

Фича должна ввести явную модель приватности `public|private` и жестко закрыть email членов команды на публичной странице команды и связанных endpoint-ах.

## Цели
- Ввести единый контракт приватности `privacy=public|private` для команды.
- Разрешить изменение приватности только owner-у команды (backend enforce).
- Запретить join для `private` и на UI, и на API.
- Удалить email членов команды из клиентских ответов endpoint-ов страницы команды и из серверных логов этого user-flow.

## Non-Goals
- Изменение ролей/прав внутри команды, кроме owner-check для privacy.
- Изменение доступности страницы `/t/:shareId` по share-link.
- Внедрение внешних DLP/PII-систем.

## Fixed Decisions
1. Тип приватности хранится как `privacy` со значениями `public | private`.
2. Исторические записи команд с `NULL/пусто` трактуются как `public` после backfill.
3. Изменять `privacy` может только owner (UI и backend).
4. Не-owner видит переключатель в настройках, но только read-only.
5. Для `private` join скрыт в UI и `POST /api/teams/:shareId/join` возвращает `403`.
6. Незалогиненный пользователь никогда не видит кнопку `Присоединиться`.
7. Share-link `/t/:shareId` остается доступным для просмотра.
8. Email членов команды не возвращаются клиенту ни через один endpoint страницы команды.
9. Email членов команды не пишутся в серверные логи flow страницы команды.
10. Migration/backfill делается отдельной задачей и обязательна перед release.

## API Contract Changes
### GET `/api/teams/:shareId`
- Добавить `team.privacy` (`public|private`).
- Добавить `canJoin` (boolean).
- Удалить `members[].email` из ответа.

### GET `/api/teams/:shareId/settings`
- Добавить `privacy` (`public|private`).
- Добавить `canEditPrivacy` (boolean).
- Не возвращать email членов команды.

### PATCH `/api/teams/:shareId`
- Поддержать optional-поле `privacy`.
- Допустимые значения: `public`, `private`.
- Если `privacy` меняется не owner-ом, вернуть `403`.

### POST `/api/teams/:shareId/join`
- Если `privacy=private`, вернуть `403 { "error": "Team is private." }`.
- Для `privacy=public` поведение без изменений.

### GET `/api/teams/:shareId/availability`
- Удалить email членов команды из публичных структур ответа (включая `slots[].members[]`).

## User Scenarios
### US-1: Owner переключает приватность
1. Owner открывает настройки команды.
2. Меняет `public -> private`.
3. После сохранения команда недоступна для join.

### US-2: Не-owner открывает настройки
1. Участник (не owner) открывает настройки.
2. Видит текущее значение приватности в read-only контроле.
3. Попытка PATCH на backend возвращает `403`.

### US-3: Гость/не-участник на private-команде
1. Пользователь открывает `/t/:shareId`.
2. Кнопка `Присоединиться` отсутствует.
3. Прямой `POST /join` возвращает `403`.

### US-4: Публичные payload-ы без email
1. Клиент загружает team detail/settings/availability.
2. Во всех ответах отсутствуют email членов команды.
3. Логи backend по этому flow также не содержат email членов команды.

## Acceptance Criteria
- Приватность команды хранится и читается как `public|private`.
- Исторические команды корректно переходят на `privacy=public` через migration.
- Только owner может менять `privacy`; не-owner получает `403`.
- Для `private` join недоступен и в UI, и на API.
- Незалогиненный пользователь не видит кнопку join.
- Share-link просмотр страницы команды работает как раньше.
- Endpoint-ы `GET /api/teams/:shareId`, `GET /api/teams/:shareId/settings`, `GET /api/teams/:shareId/availability`, `GET /api/teams` не содержат email членов команды.
- Серверные логи по этому flow не содержат email членов команды.
- Регрессионные тесты на privacy и anti-email leakage проходят.

## Parallelization matrix
| task | depends_on | parallel_with | shared_files_risk |
| --- | --- | --- | --- |
| [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md) | нет | нет | `server/server.js`, сериализация team payload |
| [TEAMCAL-21](tasks/team-privacy/TEAMCAL-21.owner-only-privacy-update-private-join-guard.md) | [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md) | [TEAMCAL-22](tasks/team-privacy/TEAMCAL-22.frontend-privacy-toggle-join-visibility-anti-email.md), [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md) | join/settings routes, auth checks |
| [TEAMCAL-22](tasks/team-privacy/TEAMCAL-22.frontend-privacy-toggle-join-visibility-anti-email.md) | [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md) | [TEAMCAL-21](tasks/team-privacy/TEAMCAL-21.owner-only-privacy-update-private-join-guard.md), [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md) | `frontend/src/App.jsx`, settings/join UI |
| [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md) | [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md) | [TEAMCAL-21](tasks/team-privacy/TEAMCAL-21.owner-only-privacy-update-private-join-guard.md), [TEAMCAL-22](tasks/team-privacy/TEAMCAL-22.frontend-privacy-toggle-join-visibility-anti-email.md) | NocoDB migration script + defaults |
| [TEAMCAL-24](tasks/team-privacy/TEAMCAL-24.integration-regression-security-checklist.md) | [TEAMCAL-21](tasks/team-privacy/TEAMCAL-21.owner-only-privacy-update-private-join-guard.md), [TEAMCAL-22](tasks/team-privacy/TEAMCAL-22.frontend-privacy-toggle-join-visibility-anti-email.md), [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md) | нет | интеграционные тесты и security report |

## Риски
- Часть email может остаться в старых сериализаторах/вторичных endpoint-ах.
- Конфликт между UI-условиями показа join и backend-guard при пограничных auth-состояниях.
- Некорректный migration rollout без dry-run может перезаписать данные.

## Feature-level Definition of Done
- Release gate:
  - [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md) = `done`
  - [TEAMCAL-21](tasks/team-privacy/TEAMCAL-21.owner-only-privacy-update-private-join-guard.md) = `done`
  - [TEAMCAL-22](tasks/team-privacy/TEAMCAL-22.frontend-privacy-toggle-join-visibility-anti-email.md) = `done`
  - [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md) = `done` (mandatory before rollout)
  - [TEAMCAL-24](tasks/team-privacy/TEAMCAL-24.integration-regression-security-checklist.md) = `done`
- Migration mandatory: rollout запрещен до отчета выполнения migration (`scanned/updated/skipped/errors`) из [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md).
- Minimal regression suite:
  - backend tests: privacy owner-check, join-guard, response sanitization;
  - frontend tests: join visibility matrix + read-only privacy toggle;
  - smoke integration: private/public поведение и отсутствие email в payload.

## Декомпозиция
- [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md) — Foundation: privacy contract + payload sanitization baseline.
- [TEAMCAL-21](tasks/team-privacy/TEAMCAL-21.owner-only-privacy-update-private-join-guard.md) — Backend enforcement: owner-only PATCH + join guard + log sanitization.
- [TEAMCAL-22](tasks/team-privacy/TEAMCAL-22.frontend-privacy-toggle-join-visibility-anti-email.md) — Frontend: privacy toggle UX + join visibility + anti-email UI cleanup.
- [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md) — Migration: backfill `teams.privacy` (idempotent, dry-run default).
- [TEAMCAL-24](tasks/team-privacy/TEAMCAL-24.integration-regression-security-checklist.md) — Integration: regression pack + security checklist/report.
