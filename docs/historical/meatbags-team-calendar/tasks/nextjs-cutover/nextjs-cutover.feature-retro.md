# Ретро фичи `nextjs-cutover`

Дата: 2026-03-07
Фича: полный переезд `team-calendar` на `Next.js` без legacy runtime
Участники ретро: лид продактом, техлид, лид QA

## Краткий итог

Фича доведена до рабочего cutover-состояния: пользовательские маршруты `/`, `/profile`, `/t/:shareId` и API-контур переведены на `Next.js`, legacy runtime удалён, основной запуск стандартизирован через `dev/build/start/test`.

По ходу фичи несколько раз возвращались из review и закрывали реальные узкие места, а не косметику: parity API, popup-auth, route-level guard для `/profile`, перенос assets/styles из legacy, выравнивание acceptance по team page, фиксация runtime versions и разделение automated/manual release gate.

## Что поправили по ходу фичи

### 1. Foundation и source of truth
- Зафиксировали единый source of truth для полного cutover.
- Собрали полную parity-matrix: legacy pages/routes/API -> Next surface.
- Расширили release gate с backend/db до UX, auth, runtime и legacy-removal checks.

### 2. Backend parity и архитектура
- Добавили обязательный `PATCH /api/me`.
- Довели до parity `GET /api/me/settings`, `PATCH /api/me/calendar`, `GET /api/teams/:shareId/settings`, `PATCH /api/teams/:shareId`.
- Перевели критичные `app/api/*` на thin-handler/use-case паттерн.
- Добавили единый error mapping и закрыли часть архитектурных P1-нарушений.
- После review исправили lookup текущего пользователя на `session.user.id`.
- После review добили popup-auth bridge, logout/delete coverage и включили новые route tests в штатный gate.

### 3. Shell, home и profile
- Перенесли `/`, `/profile`, topbar, user menu, create-team flow и auth shell на App Router.
- Вынесли styles и assets из legacy runtime путей в Next runtime.
- После review усилили acceptance coverage по auth/menu/profile/create-team.

### 4. Team page
- Перенесли `/t/:shareId` на App Router вместе с filters/share/booking/settings/delete flow.
- Сохранили owner/member/guest states и URL-driven filter behavior.
- После review убрали дублирование team helpers через shared path.
- После review уточнили source of truth по `join`, чтобы спека соответствовала фактическому legacy UX.
- Добавили сценарные acceptance tests для team page.

### 5. Финальный cutover
- Удалили `app.js`, `server/`, `frontend/`, `vite`-контур и legacy runtime dependencies.
- Привели `package.json` к стандартным основным скриптам `dev/build/start/test`.
- Обновили README, release checklist и project rules под `Next-only runtime`.
- После review добавили server-side redirect guard для `/profile`.
- После review зафиксировали tested runtime versions явно, чтобы cutover не тащил скрытый semver bump.
- После review развели automated gate и manual browser smoke в release docs.

## Ретро лидом продактом

### Что сработало
- Команда удержала главный продуктовый принцип: legacy UX считался бизнес-верным, а задача была именно в переносе на новый стек без переизобретения сценариев.
- Feature была декомпозирована так, что бизнес-сценарии не потерялись между backend, shell, team page и final cutover.
- По ходу работы acceptance criteria стали заметно точнее и ближе к реальному интерфейсу, а не к абстрактной “миграции на Next”.

### Узкие места
- Спека до сих пор выглядит как промежуточный артефакт: у неё остался статус `draft`, хотя фактически фича уже завершена.
- Часть acceptance пришлось уточнять только после review, особенно вокруг `join`-поведения и route-level semantics для `/profile`.
- Ручной browser smoke остаётся обязательной частью релизного решения, но пока не оформлен как отдельный финальный артефакт прохождения.

### Что улучшить
- Закрывать feature-spec в финальный статус после завершения cutover, чтобы она не выглядела как незавершённая.
- Для следующих крупных миграций заранее делить acceptance на:
  - продуктовый контракт;
  - технический контракт;
  - ручной release smoke.
- Хранить итог ручной продуктовой приёмки как отдельный markdown-артефакт рядом со spec и checklist.

## Ретро техлидом

### Что сработало
- Cutover доведён до реального runtime-результата, а не остановился на “Next уже частично есть”.
- Критичный API parity закрыт до удаления legacy.
- Во время фичи удалось не только перенести surface, но и сделать полезное архитектурное ужесточение: thin handlers, use-cases, общий error mapping, shared helpers.
- Команда не проигнорировала review-замечания и закрыла опасные вещи до `done`: `session.user.id`, popup-auth bridge, server-side guard на `/profile`, pinned versions.

### Узкие места
- Архитектурный cleanup сделан не до конца: в auth infrastructure всё ещё есть остаточные `any`, которые хуже типизируют boundary.
- Feature шла с несколькими review-возвратами на поздних этапах. Это полезно для качества, но показывает, что initial acceptance/test gate не всё ловил заранее.
- В течение фичи несколько раз всплывал инфраструктурный риск `ENOSPC`; технически он не блокировал код, но мешал уверенно считать build gate стабильным локально.

### Что улучшить
- Добить типизацию auth boundary и убрать остаточные `any` в `src/infrastructure/auth/*`.
- Для больших миграций заранее выделять отдельный технический checklist:
  - shared helpers без дублирования;
  - route-level auth semantics;
  - version pinning policy на финальном cutover.
- Добавить небольшой post-cutover hardening backlog вместо попытки закрыть весь технический долг в одной feature.

## Ретро лидом QA

### Что сработало
- QA review реально влиял на результат, а не дублировал already-green тесты.
- По ходу фичи acceptance coverage стала глубже:
  - route tests встроены в штатный gate;
  - shell acceptance усилен;
  - team page получила отдельный сценарный suite.
- Release checklist стал честнее: теперь automated gate и manual browser smoke явно разделены.

### Узкие места
- Несколько важных расхождений были найдены только на review:
  - popup-auth parity;
  - `/profile` как route-level guard, а не только client redirect;
  - слабое доказательство acceptance по shell/team page;
  - отсутствие фиксации manual browser smoke как отдельного результата.
- Automated tests хорошо прикрывают контракты и часть UI-состояний, но не заменяют браузерную проверку popup/login/logout/settings/delete flows.

### Что улучшить
- Оформить обязательный release artifact для ручного browser smoke:
  - кто проверял;
  - когда;
  - по каким шагам;
  - какие результаты.
- Постепенно перевести browser-only сценарии в e2e слой:
  - popup auth;
  - logout;
  - profile save;
  - team settings/delete;
  - booking flow.
- На следующих migration-фичах заранее проверять, что все новые acceptance suites включены именно в штатный release gate, а не живут отдельно.

## Что можно улучшить после фичи

### High priority follow-up
- Финализировать статус feature-spec и убрать признаки промежуточного состояния.
- Провести и задокументировать полный manual browser smoke по release checklist.
- Добить остаточную типизацию auth boundary.

### Medium priority follow-up
- Добавить e2e smoke для browser-only сценариев.
- Упростить сопровождение acceptance через единый release artifact.
- Пересмотреть, где ещё остались feature-specific helper/state tests вместо более приближённых пользовательских сценариев.

### Low priority follow-up
- Подчистить docs вокруг уже завершённой миграции, чтобы не осталось двусмысленности про “переходный этап”.
- Пересобрать короткий post-cutover changelog для команды, чтобы было проще объяснять, что именно изменилось в runtime и release path.

## Итог

С точки зрения лидов это хорошая миграционная фича: цель достигнута, продуктовый surface сохранён, legacy runtime удалён, критичные review-замечания не замели под ковёр.

Главное, что стоит улучшить дальше, это не сам cutover, а дисциплина его финализации:
- доводить spec до финального статуса;
- хранить явный артефакт ручной продуктовой приёмки;
- быстрее закрывать browser-only и boundary-type риски до финального review.
