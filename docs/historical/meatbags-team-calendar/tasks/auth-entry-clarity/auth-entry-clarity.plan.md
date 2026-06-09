# Implementation Plan — Auth Entry Clarity

Дата: 2026-04-10
Feature key: `auth-entry-clarity`

## Цель плана
Разнести работу на минимальные безопасные слайсы так, чтобы:
- сначала убрать продуктово вредный global forced-consent;
- затем добавить hidden recovery mode без новой кнопки;
- затем закрыть регрессии и ambiguous error handling.

## Принципы
- Один visible CTA для пользователя.
- Recovery-mode скрыт внутри той же кнопки.
- Logout допускается только после hard auth loss текущего пользователя.
- Team/aggregate flows не имеют права завершать session viewer-а по чужой broken Google-связке.
- Изменения идут от контрактов и state machine к UI, а не наоборот.

## Архитектурные правила в scope

### Применяемые `AP-*`
- `AP-012` — fail-fast и явные контракты ошибок
- `AP-021` — тонкие entry points
- `AP-022` — typed errors и явная обработка исключений
- `AP-023` — async дисциплина и no floating promises
- `AP-026` — API-контракты и DTO границы
- `AP-032` — command/query separation
- `AP-039` — auth boundary и доверенная идентичность
- `AP-040` — авторизация на каждом защищенном use-case
- `AP-054` — устойчивые UI-состояния, доступность и деградация интерфейса

### Применяемые `PP-*`
- `PP-017` — UI single-sentence punctuation
- `PP-018` — Next.js App Router + Drizzle + pg-only runtime
- `PP-019` — запрет пустых catch-блоков
- `PP-020` — popup auth completion must not depend on opener-only state

## Как применять правила в этой фиче
- `AP-012` и `AP-022`: ввести ограниченный каталог Google auth failure codes и не продолжать выполнение как будто операция успешна после hard auth loss.
- `AP-021` и `AP-032`: route handlers только валидируют вход, читают recovery signal, вызывают command/query use-case и маппят ответ; бизнес-логика state machine не живёт в route layer.
- `AP-023`: recovery-cookie write, session invalidation и callback cleanup оформлять только как явный awaited flow или задокументированный best-effort с диагностикой.
- `AP-026`: normal guest state, forced-logout hint, hidden recovery mode и current-user error states должны иметь явный DTO/transport contract вместо протекания raw Google/API ошибок наружу.
- `AP-039` и `AP-040`: hard auth loss определяется только на доверенной серверной границе и только для use-case, где идентичность проверена и actor действительно совпадает с broken Google account.
- `AP-054` и `PP-017`: landing/guest states должны различать обычный гостевой экран, neutral recovery hint и временный сбой без технических слов и с корректной однофразной пунктуацией.
- `PP-018`: все изменения остаются в `implementation/app/*`, `implementation/src/*`, `implementation/drizzle/*`; legacy runtime не возвращается.
- `PP-019`: пустые `catch` запрещены; любая ожидаемая деградация логируется или маппится в typed/app error.
- `PP-020`: hidden recovery mode не должен ломать текущий popup completion contract и не может опираться только на `window.opener`.

## Карта правил по слайсам
- Slice 1 / `TEAMCAL-59`: `AP-021`, `AP-023`, `AP-026`, `AP-039`, `PP-018`, `PP-020`
- Slice 2 / `TEAMCAL-60`: `AP-012`, `AP-022`, `AP-023`, `AP-026`, `AP-032`, `AP-039`, `AP-040`, `PP-018`, `PP-019`
- Slice 3 / `TEAMCAL-61`: `AP-012`, `AP-026`, `AP-032`, `AP-039`, `AP-040`, `AP-054`, `PP-018`, `PP-019`
- Slice 4 / `TEAMCAL-62`: `AP-026`, `AP-039`, `AP-054`, `PP-017`, `PP-018`, `PP-020`
- Slice 5 / `TEAMCAL-63`: `AP-021`, `AP-023`, `AP-026`, `AP-039`, `AP-040`, `AP-054`, `PP-018`, `PP-019`, `PP-020`

## Task authoring contract
- Каждая новая implementation-задача по этой фиче обязана содержать секции:
  - `Applied rules`
  - `Перед реализацией прочитать`
  - `Как применять правила`
- В `Перед реализацией прочитать` обязательно перечислять:
  - `implementation/rep.config.json`
  - `tasks/_policies/arch-patterns.md` с точными `AP-*`
  - `tasks/_policies/project-patterns.md` с точными `PP-*`
  - `tasks/auth-entry-clarity/auth-entry-clarity.feature.md`
  - `tasks/auth-entry-clarity/auth-entry-clarity.prd.md`
  - `tasks/auth-entry-clarity/auth-entry-clarity.specs.md`
  - `tasks/auth-entry-clarity/auth-entry-clarity.plan.md`
- В `Как применять правила` задача должна не просто перечислять `AP-*`/`PP-*`, а объяснять их применение к своему write scope.

## Feature DoD / release gate
- PRD, SDD spec и implementation plan не спорят по смыслу о normal mode, hidden recovery mode и one-button UX.
- В feature dossier и task artifacts зафиксирован одинаковый набор `AP-*` / `PP-*`.
- Normal login не форсирует consent по умолчанию.
- Hard auth loss current-user context переводит account в `reauth_required`, инвалидирует current session и создаёт short-lived recovery signal.
- Transient Google failure не завершает session.
- Foreign-account/team-member failure не завершает session viewer-а.
- Successful recovery callback очищает recovery signal и возвращает account в `active`.
- Popup completion contract остаётся совместим с `PP-020`.
- Guest/recovery UI состояния различимы и не содержат технических auth-терминов.
- Обязательные проверки из раздела `Проверки` проходят.

## Slice 1 — Auth contract cleanup

### Цель
Убрать global forced-consent из normal login flow и ввести инфраструктурную возможность recovery-mode.

### Зона правок
- `implementation/src/infrastructure/auth/auth-options.ts`
- `implementation/app/api/auth/google/handler.ts`
- `implementation/app/api/auth/google/route.ts`
- `implementation/app/api/auth/route.test.ts`

### Что сделать
- Удалить global `prompt: 'consent'` из normal Google provider config.
- Разрешить auth route включать recovery params только по hidden server signal.
- Сохранить current popup + `next` redirect semantics.
- Подготовить точки расширения для очистки recovery-state после successful callback.

### Критерий готовности
- Normal login больше не форсирует consent по умолчанию.
- Route умеет различать normal mode и recovery mode.
- Auth route tests покрывают оба режима.

## Slice 2 — Error taxonomy and current-user recovery orchestration

### Цель
Сделать machine-readable различение `hard auth loss` и `transient failure` и сразу замкнуть его на current-user recovery lifecycle, чтобы taxonomy и logout semantics не жили в разных полузадачах.

### Зона правок
- `implementation/src/infrastructure/google/freebusy.ts`
- `implementation/src/infrastructure/google/calendar-list.ts`
- `implementation/src/application/errors.ts`
- `implementation/src/application/usecases/get-current-user.ts`
- `implementation/app/api/me/*`
- `implementation/app/api/me/settings/*`
- `implementation/app/api/me/calendar/*`
- `implementation/src/infrastructure/db/schema.ts`
- `implementation/drizzle/*`

### Что сделать
- Добавить typed/domain-aware Google auth error classifier.
- Выделить отдельные codes для:
  - missing refresh token
  - revoked/invalid refresh token
  - insufficient permissions/scope
  - transient Google failure
- Добавить в `accounts` account-level поля recovery state.
- Подготовить migration и backward-compatible чтение account rows.
- В current-user flows на hard auth loss:
  - помечать account как `reauth_required`
  - создавать short-lived recovery cookie
  - инвалидировать текущую session
- На transient failures session не трогать и отдавать нейтральный app-level contract.

### Критерий готовности
- Infra умеет возвращать machine-readable auth failure.
- Schema хранит `active | reauth_required`.
- Current-user settings/profile flows умеют переключать следующий вход в recovery-mode.
- Session удаляется только на hard auth loss.
- Transient failures больше не маскируются под hard auth loss.

## Slice 3 — Foreign-account protection in team flows

### Цель
Не дать aggregate/team сценариям случайно разлогинить viewer-а по чужим проблемам с Google.

### Зона правок
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts`
- `implementation/src/application/usecases/team-page.ts`
- team-related error mapping/tests

### Что сделать
- Явно отделить current-user recovery semantics от foreign-account/team-member failures.
- В availability/team flows возвращать доменную ошибку команды/участника без session invalidation viewer-а.
- При необходимости санитизировать copy для guest/member contexts.

### Критерий готовности
- Broken account другого участника не завершает viewer session.
- Team flows возвращают корректную доменную ошибку без техничных деталей.

## Slice 4 — UI copy and neutral recovery messaging

### Цель
Сделать продуктовую часть честной и непротиворечивой для пользователя.

### Зона правок
- `implementation/app/_components/header.tsx`
- `implementation/app/_components/home-page-client.tsx`
- `implementation/app/_components/shell-ui.test.tsx`
- optional guest status wiring if introduced

### Что сделать
- Поменять CTA на `Продолжить с Google`.
- Добавить supporting copy про auto-create semantics.
- Если после forced logout нужен статус, показать neutral copy без слов `token`, `reauth`, `refresh`.

### Критерий готовности
- В интерфейсе одна кнопка и одна понятная mental model.
- Нет пользовательских строк с техническими auth-терминами.

## Slice 5 — Recovery reset on successful callback

### Цель
После успешного recovery вернуть аккаунт в normal state и убрать recovery artifacts.

### Зона правок
- `implementation/src/infrastructure/auth/auth-options.ts`
- maybe auth adapter/account update helper
- auth callback tests

### Что сделать
- На successful callback:
  - очищать recovery cookie
  - переводить account `reauth_required -> active`
  - очищать `authStatusReason`, обновлять timestamps
- Проверить, что обычный first-run/new-user path не ломается.

### Критерий готовности
- Recovery завершённый логин возвращает пользователя в стабильный normal state.

## Проверки

### Обязательные
- `npm run test:unit:auth`
- `npm run test:unit:next-routes`
- `npm run test:unit:next-ui`

### Точечные сценарии
- normal login route без forced consent
- recovery login route с hidden signal
- successful new user first-run path
- hard auth loss current user -> session invalidated -> next click recovery-mode
- transient Google failure without logout
- broken foreign account on team availability without viewer logout

## Риски внедрения
- Самый опасный баг: перепутать transient failure и hard auth loss.
- Второй по риску баг: потерять recovery signal между forced logout и следующим guest login.
- Третий по риску баг: случайно сломать popup completion или safe `next` redirect contract.

## Порядок выполнения
1. Slice 1
2. Slice 2
3. Slice 3
4. Slice 4
5. Slice 5
6. Полный regression gate

## Что сознательно не делаем сейчас
- Дополнительную дробность сверх пакета `TEAMCAL-59..63`, пока не появится новый stop-factor по ownership или риску.
- Дополнительный onboarding для новых пользователей.
- Recovery по отдельной кнопке или с отдельным термином в UI.
