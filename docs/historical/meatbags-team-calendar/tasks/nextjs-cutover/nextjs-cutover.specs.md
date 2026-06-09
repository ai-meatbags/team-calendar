# Feature Specs — Next.js Full Cutover

Статус: draft
Feature key: `nextjs-cutover`
Дата: 2026-03-07

## Контекст и цель
Текущий репозиторий находится в промежуточном состоянии: `Next.js App Router + Auth.js + Drizzle` уже используются для части backend/runtime, но пользовательский surface и production/runtime cutover ещё не завершены. Основные страницы `app/(pages)` остаются заглушками, legacy `frontend/` и `server/` продолжают быть рабочими контурами, а `package.json` всё ещё содержит legacy runtime scripts.

Цель этой фичи: завершить полный переезд на `Next.js` без сохранения legacy runtime, сохранив бизнес-правила, UX-контракты и security-поведение текущего продукта.

## Source of truth and legacy inventory
### Source of truth
- Source of truth для оставшегося полного cutover:
  - `tasks/nextjs-cutover/nextjs-cutover.specs.md`
  - `tasks/nextjs-cutover/TEAMCAL-43...TEAMCAL-47`
  - `docs/RELEASE_CHECKLIST.md`
- Предыдущая спека `nextjs-drizzle-migration` считается завершённой фазой backend/db migration и не описывает оставшийся runtime cutover.

### Legacy runtime inventory to remove
- runtime files:
  - `app.js`
  - `server/`
  - `frontend/`
  - `dist/`
- legacy scripts:
  - `dev:legacy`
  - `dev:once`
  - `dev:client`
  - `build:legacy`
  - `build:client`
  - `preview:client`
  - `start:next`
- legacy runtime dependencies to remove after parity:
  - `express`
  - `express-rate-limit`
  - `express-session`
  - `react-router-dom`
  - `vite`
  - `@vitejs/plugin-react`
  - `nodemon`
  - `livereload`
  - `connect-livereload`

## Non-goals
- Редизайн интерфейса или изменение визуального языка продукта.
- Изменение продуктовых сценариев booking/availability/privacy.
- Изменение бизнес-правил выбора календарей сверх достижения parity с legacy.
- Автоматизация инфраструктурного rollout beyond локально задокументированного release gate.
- Историческое изменение storage-архитектуры этой фичей не покрывается; актуальный source of truth по data layer теперь вынесен в `tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`.

## Fixed Decisions
1. Полный cutover считается завершённым только после удаления runtime-зависимости от `Express`, `Vite` и `react-router-dom`.
2. Пользовательские сценарии должны сохранить parity 1:1 с текущим legacy-поведением, если иное явно не зафиксировано отдельным продуктовым решением.
3. Popup-auth flow сохраняется как обязательный сценарий: login из UI должен поддерживать popup, `postMessage` в opener и закрытие popup после успешной авторизации.
4. Legacy-поведение считается корректным с точки зрения бизнес-ценности; задача фичи не в переосмыслении UX, а в переносе действующего продукта на новый стек.
5. `package.json` после cutover использует стандартные основные команды:
   - `dev`
   - `build`
   - `start`
   - `test`
6. Специализированные команды разрешены только как дополнительные (`test:*`, `db:*`, `migrate:*`) и не должны дублировать legacy runtime.
7. Все пользовательские страницы `/`, `/profile`, `/t/:shareId` должны обслуживаться только через `app/*`.
8. Все API-контракты должны обслуживаться только через `app/api/*`; legacy Express routes удаляются после подтверждённой parity.
9. Архитектурный baseline обязателен для нового контура:
   - route handlers тонкие;
   - orchestration вынесена в `src/application/*`;
   - business/domain слой не импортирует infra;
   - HTTP error mapping централизован.
10. `PATCH /api/me` является обязательным контрактом cutover, потому что текущий профильный сценарий опирается на него.
11. `GET /api/me/settings`, `PATCH /api/me/calendar`, `GET /api/teams/:shareId/settings`, `PATCH /api/teams/:shareId` должны сохранить parity с текущей merge/sync логикой выбора календарей.
12. Legacy артефакты удаляются только после прохождения расширенного regression gate, включающего UI, auth и runtime cutover.

## API/контрактные изменения
- Контрактная цель по публичным API: не вводить новых продуктовых изменений без отдельного решения.
- Обязательные parity-контракты:
  - `GET /api/me`
  - `PATCH /api/me`
  - `GET /api/me/settings`
  - `PATCH /api/me/calendar`
  - `GET /api/teams`
  - `POST /api/teams`
  - `GET /api/teams/:shareId`
  - `PATCH /api/teams/:shareId`
  - `DELETE /api/teams/:shareId`
  - `POST /api/teams/:shareId/join`
  - `GET /api/teams/:shareId/settings`
  - `GET /api/teams/:shareId/availability`
  - `POST /api/booking`
- Сохранить текущие error/business invariants:
  - `private join -> 403`
  - `invalid member filter -> 400`
  - `duration only 30|60`
  - `availability: 14d horizon, 12h lead time, 10-20 MSK`
  - `booking all/single + always { ok: true } for best-effort delivery`
  - `same-origin` enforcement на защищённых мутациях
  - отсутствие внутренних `team.id`, `members.id` и leakage email/PII в публичных payload
- Runtime/ops contract changes:
  - `start` больше не должен запускать `node app.js`
  - legacy scripts `dev:legacy`, `build:legacy`, `dev:client`, `preview:client`, `start:next` должны быть удалены либо заменены на нейтральные специализированные команды нового контура

## Legacy parity matrix
| legacy surface | current source | target Next surface | verification |
| --- | --- | --- | --- |
| Landing + auth entry | `frontend/src/pages/HomePage.jsx`, `frontend/src/components/Header.jsx`, `frontend/src/hooks/useAuth.js` | `app/(pages)/page.tsx` + client shell/providers in `app/*` | UI smoke: guest landing, login popup, auth refresh |
| User menu | `frontend/src/components/Header.jsx` | shared App Router shell/components | UI smoke: menu open/close, team links, logout |
| Teams list + create team | `frontend/src/pages/HomePage.jsx` | `app/(pages)/page.tsx` | UI smoke: list mode, `?create=1`, create + redirect |
| Profile page | `frontend/src/pages/ProfilePage.jsx` | `app/(pages)/profile/page.tsx` + `PATCH /api/me` | UI smoke + contract test |
| Team page shell | `frontend/src/pages/TeamPage.jsx`, `frontend/src/components/team/*` | `app/(pages)/t/[shareId]/page.tsx` + team client components | UI smoke: guest/member/owner |
| Duration/member URL filters | `frontend/src/modules/team-page/team-page-duration-filter.hook.js`, `frontend/src/modules/team-page/team-page-member-filter.hook.js` | App Router search params implementation | UI smoke + query normalization checks |
| Availability view | `frontend/src/modules/team-page/team-page-availability.hook.js`, `frontend/src/components/team/SlotsView.jsx` | team page client layer + `app/api/teams/[shareId]/availability` | contract tests + UI smoke |
| Booking modal | `frontend/src/modules/team-page/team-page-booking.hook.js`, `frontend/src/components/team/TeamBookingModal.jsx` | team page client layer + `app/api/booking` | UI smoke: guest/member booking |
| Team settings modal | `frontend/src/modules/team-page/team-page-settings.hook.js`, `frontend/src/components/team/TeamSettingsModal.jsx` | team page client layer + Next settings routes | UI smoke + contract tests |
| Google auth popup callback | `server/src/auth/routes/auth.routes.js` | `app/auth/*`, `app/api/auth/*`, Auth.js integration | browser smoke: popup success + close |
| Runtime start/build | `package.json`, `app.js`, `server/`, `frontend/` | `next dev`, `next build`, `next start` | CLI checks + file/dependency inventory |

## User scenarios
1. Неавторизованный пользователь открывает `/`, видит landing и может войти через Google popup без full-page fallback деградации.
2. После логина пользователь возвращается в opener-контекст, UI обновляет состояние auth без ручного reload.
3. Авторизованный пользователь открывает `/`, видит список команд, может создать новую команду и перейти в неё.
4. Пользователь открывает `/profile`, меняет отображаемое имя и получает сохранение через `PATCH /api/me`.
5. Пользователь открывает `/t/:shareId`, видит участников, availability, фильтры duration/member и может открыть booking flow.
6. Публичный гость открывает `/t/:shareId`, получает availability и может отправить booking request без утечки внутренних полей.
7. Участник команды открывает team settings, видит merged calendar selection, меняет его и получает parity c legacy selection behavior.
8. Owner команды меняет имя/privacy команды и при необходимости удаляет команду.
9. Logout работает из нового UI без обращения к legacy runtime.
10. Локальный запуск проекта и production start выполняются только через Next runtime.

## Acceptance criteria
- Все ключевые пользовательские сценарии работают на `Next.js` без обращения к `frontend/` или `server/`.
- `app/(pages)` реализуют рабочие версии `/`, `/profile`, `/t/:shareId`; заглушки отсутствуют.
- `PATCH /api/me` реализован и покрыт тестами.
- Calendar settings/user settings/team settings parity подтверждена тестами и smoke-проверкой.
- Popup-auth сценарий подтверждён как working contract.
- `package.json` использует стандартные `dev`, `build`, `start`, `test`; production `start` поднимает только `next start`.
- Legacy runtime-код и зависимости удалены:
  - `app.js`
  - `server/`
  - `frontend/`
  - `dist/`
  - legacy runtime dependencies/scripts
- Regression gate проходит:
  - build
  - unit/contract tests
  - auth smoke
  - route parity
  - UI smoke checklist
- Архитектурный аудит нового контура не содержит P1 нарушений относительно AP/PP baseline этой фичи.

## UX acceptance criteria (parity with current interface)
### 1. App shell and auth entry
- На всех страницах есть верхний bar с brand-ссылкой `Team Calendar`, ведущей на `/`.
- Для неавторизованного пользователя topbar показывает кнопку `Войти через Google`.
- Login запускается popup-сценарием; при успешной авторизации opener обновляет auth-state без ручного reload.
- Logout доступен из user menu и возвращает пользователя в неавторизованное состояние без обращения к legacy runtime.

### 2. Home page (`/`)
- Неавторизованный пользователь видит landing:
  - eyebrow `Google Calendar · Free/Busy`
  - основной hero про выбор времени
  - hero screenshot
  - два trust-card блока про privacy/free-busy
- Авторизованный пользователь видит список своих команд.
- Если команд нет, экран автоматически переводится в режим создания команды.
- Если открыт `/?create=1`, экран сразу показывает форму создания команды.
- В режиме списка команд каждая команда отображается как карточка-ссылка на `/t/:shareId`.
- В режиме создания команды есть поле `Имя команды`, кнопка `Создать`, кнопка `Назад`.
- После успешного создания команды пользователь автоматически переходит на страницу новой команды.

### 3. User menu
- Для авторизованного пользователя topbar показывает avatar/user trigger.
- User menu содержит:
  - переход в `Профиль`
  - переход в `Все команды`
  - список команд пользователя
  - переход `Создать команду`
  - действие `Выйти`
- Поведение меню parity:
  - закрывается по клику вне меню
  - закрывается по `Escape`
  - закрывается после выбора пункта

### 4. Profile page (`/profile`)
- Неавторизованный пользователь не может использовать профильный сценарий и возвращается на `/`.
- Авторизованный пользователь видит форму профиля с полем `Имя` и кнопкой `Сохранить`.
- При успешном сохранении имя обновляется в UI и в user menu без обращения к legacy runtime.
- Ошибка сохранения показывается пользователю тем же UX-способом, что и в legacy.

### 5. Team page shell (`/t/:shareId`)
- При неизвестном `shareId` показывается current not-found/empty behavior для team page.
- На странице отображаются:
  - название команды
  - список участников
  - слот-экран `Выбери слот`
  - правила показа слотов (`окно`, рабочие часы, минимальная бронь)
- Для неавторизованного пользователя member-only action `Присоединиться` не отображается, как в текущем legacy UX.
- Для авторизованного пользователя, который ещё не состоит в команде, кнопка `Присоединиться` доступна только если это допускает текущий business state; клик выполняет join без обращения к legacy runtime.
- Для авторизованного участника доступны:
  - `Share`
  - кнопка gear `Настройки команды`
- Для не-участника или гостя действия member-only не отображаются.

### 6. Team page filters and URL state
- Переключатель duration сохраняет значение в query param `duration`.
- Поддерживаются режимы `30` и `60`; некорректное значение URL нормализуется к допустимому.
- Member filter сохраняет выбранного участника в query param `member`.
- Некорректный `member` в URL автоматически очищается из query string после загрузки допустимого списка участников.
- Share action копирует текущий URL с учётом выбранных `duration/member`.

### 7. Availability view
- При загрузке слотов показывается текущий loading behavior/skeleton.
- При успешной загрузке слоты группируются по дням, как в текущем интерфейсе.
- При отсутствии слотов показывается `Свободных слотов не найдено`.
- При ошибке загрузки показывается dismissible alert/status без краха страницы.
- Refresh availability после сохранения настроек или смены фильтров сохраняет существующий UX-сценарий.

### 8. Booking modal
- Клик по слоту открывает booking modal.
- Модалка показывает:
  - участников встречи
  - дату
  - время
- Для неавторизованного пользователя есть обязательное поле `Почта`.
- Для авторизованного пользователя поле `Почта` скрыто, используется email из auth state.
- Поле `Комментарий` доступно в обоих режимах.
- После успешной отправки показывается success-state текстом `Встреча запрошена, команда скоро создаст встречу в календаре.`
- Ошибки отправки и невалидный state слота/участников воспроизводят текущий UX через toast/status.

### 9. Team settings modal
- Модалка открывается по gear action и закрывается:
  - по overlay click
  - по close button
- Во время открытия модалки scroll страницы блокируется.
- В модалке доступны:
  - редактирование имени команды
  - privacy toggle `Все могут` / `Никто не может`
  - календарный выбор для расчёта слотов
  - кнопка `Сохранить`
- Права parity:
  - owner может менять имя и privacy
  - участник может управлять своими calendar settings
  - delete доступен только owner
- Если изменений нет, пользователь получает `Нет изменений`.
- После успешного сохранения модалка закрывается, показывается `Настройки сохранены`, team page обновляет имя/слоты.
- В danger zone owner видит предупреждение и кнопку `Удалить команду`.
- Удаление команды требует confirm-dialog и после подтверждения возвращает пользователя на `/`.

### 10. Runtime cutover UX
- После cutover пользователь не попадает в legacy SPA ни по одному поддерживаемому маршруту.
- Все описанные выше сценарии работают при запуске только через `next dev`/`next start`.
- Документация quickstart описывает только новый основной путь запуска.

## Риски
- Popup-auth parity на Auth.js может потребовать явного bridge/callback flow.
- Calendar selection parity может разойтись из-за упрощённой текущей реализации Next handlers.
- Вынесение orchestration из route handlers в use-case слой может затронуть сразу несколько контрактов.
- Удаление legacy runtime без полного regression gate может скрыто сломать профиль, меню команд или settings flows.
- Рефакторинг package/runtime scripts может затронуть локальные привычки запуска и существующие инструкции в docs.

## Технические ограничения реализации
- AP-010: домен и application не импортируют concrete DB/Auth/HTTP adapters.
- AP-012: fail-fast валидация на route/use-case границе.
- AP-016: security-проверки только на backend.
- AP-017: allowlist-экспорт, без утечки внутренних id, email, токенов и технических полей.
- AP-018: ясность важнее умности; 1 файл = 1 основная ответственность.
- AP-019: hard limit файлов соблюдается; oversized handlers дробятся до merge.
- AP-020: composition root связывает infra зависимости; use-case слой работает через порты/контракты.
- AP-021: entry points тонкие; без прямого DB/API orchestration в route handlers.
- AP-022: typed errors и единый HTTP response mapping обязательны.
- AP-027: env/config валидируются fail-fast.
- AP-028: тесты детерминированы; time/TZ/random контролируются.
- AP-029: `any` и нестрогие boundary-касты устраняются или минимизируются с явным обоснованием.
- AP-030: порядок реализации для каждой ветки: контракт -> тесты -> core/use-case -> adapters -> entry points -> logs/security/limits.
- AP-031: после cutover CI должен проверять lint/tests/boundaries/max-lines.
- PP-018: весь новый runtime и UI живёт в `app/*` и `src/*`; legacy контур не расширяется.
- PP-019: пустые catch запрещены.
- PP-016: availability fallback to primary сохраняется только в допустимом контуре.

## Parallelization matrix
| task | depends_on | parallel_with | shared_files_risk |
| --- | --- | --- | --- |
| `foundation-cutover-spec-and-parity-matrix` | нет | нет | `tasks/*`, `docs/*`, `package.json` |
| `backend-parity-and-architecture-hardening` | `foundation-cutover-spec-and-parity-matrix` | `auth-shell-home-profile-migration` | `app/api/*`, `src/application/*`, `src/interface/*`, `src/infrastructure/*` |
| `auth-shell-home-profile-migration` | `foundation-cutover-spec-and-parity-matrix` | `backend-parity-and-architecture-hardening` | `app/layout.tsx`, `app/(pages)/page.tsx`, `app/(pages)/profile/page.tsx`, shared client providers/components |
| `team-page-and-settings-migration` | `foundation-cutover-spec-and-parity-matrix`, `backend-parity-and-architecture-hardening` | нет | `app/(pages)/t/[shareId]/page.tsx`, team UI components, settings/booking flows, search param state |
| `runtime-cutover-legacy-removal-release-gate` | `backend-parity-and-architecture-hardening`, `auth-shell-home-profile-migration`, `team-page-and-settings-migration` | нет | `package.json`, `README.md`, `docs/*`, file tree cleanup |

## Feature-level Definition of Done
- Feature release gate:
  - `foundation-cutover-spec-and-parity-matrix` = done
  - `backend-parity-and-architecture-hardening` = done
  - `auth-shell-home-profile-migration` = done
  - `team-page-and-settings-migration` = done
  - `runtime-cutover-legacy-removal-release-gate` = done
- Обязательные проверки перед релизом:
  - `npm run build`
  - `npm run test`
  - специализированные contract tests для auth/settings/availability/booking
  - smoke checklist по `/`, `/profile`, `/t/:shareId`, login popup, create team, edit profile, user menu, filters in URL, team settings, booking, delete team, logout
- Legacy runtime files и зависимости физически удалены из рабочего дерева.
- `README` и release docs описывают только новый runtime как основной путь.
- Если требуется migration apply, он выполняется до rollout по действующему runbook, но сам cutover не зависит от сохранения legacy runtime.
