# Feature Specs — Unified Google Auth Entry With Hidden Recovery Mode

Статус: draft  
Feature key: `auth-entry-clarity`  
Дата: 2026-04-10

## Контекст
Сейчас auth-entry в продукте устроен так:
- topbar показывает `Войти через Google` в `implementation/app/_components/header.tsx`;
- normal login идёт через единый popup flow (`implementation/app/_components/use-auth.ts`, `implementation/app/api/auth/google/handler.ts`, `implementation/app/auth/popup-complete/route.ts`);
- Auth.js автоматически создаёт нового пользователя на первом OAuth callback;
- home page уже различает first-run через отсутствие команд (`teamsCount === 0`) и переводит пользователя в create-team mode;
- Google provider в `implementation/src/infrastructure/auth/auth-options.ts` принудительно передаёт `prompt: 'consent'`, из-за чего returning user снова видит consent чаще, чем нужно.

Одновременно продукт хочет сохранить один CTA и одну mental model:
- пользователь не должен выбирать между `логином` и `регистрацией`;
- пользователь не должен понимать, что такое `refresh token`, `reauth`, `Google credentials`;
- если связь с Google реально потеряна, сервис сам должен перевести следующий вход в recovery-mode и провести пользователя через нужные шаги.

## Цели
- Сохранить один visible CTA: `Продолжить с Google`.
- Убрать лишний Google consent из normal login flow.
- Автоматически переводить следующий вход в recovery-mode только после подтверждённого hard auth loss.
- Не показывать пользователю отдельный термин или кнопку `Переподключить Google`.
- Сохранить текущий first-run path без отдельной регистрации и без нового onboarding-state.

## Non-Goals
- Две разные primary-кнопки `Войти` и `Регистрация`.
- Новый signup flow или отдельный route для регистрации.
- Logout на любую Google ошибку без классификации причины.
- Recovery по ошибкам aggregate team availability, где текущий viewer не равен владельцу сломанной Google-связки.
- Редизайн popup completion bridge.
- Новые Google scopes или изменение текущего бизнес-сценария календарей.

## Architecture rules in scope

### Relevant `AP-*`
- `AP-012` — fail-fast и явные контракты ошибок
- `AP-021` — тонкие entry points
- `AP-022` — typed errors и явная обработка исключений
- `AP-023` — async дисциплина и no floating promises
- `AP-026` — API-контракты и DTO границы
- `AP-032` — command/query separation
- `AP-039` — auth boundary и доверенная идентичность
- `AP-040` — авторизация на каждом защищенном use-case
- `AP-054` — устойчивые UI-состояния, доступность и деградация интерфейса

### Relevant `PP-*`
- `PP-017` — UI single-sentence punctuation
- `PP-018` — Next.js App Router + Drizzle + pg-only runtime
- `PP-019` — запрет пустых catch-блоков
- `PP-020` — popup auth completion must not depend on opener-only state

### Как применять
- `AP-012`, `AP-022`, `PP-019`: Google auth failures должны быть machine-readable и не маскироваться общим `Calendar sync failed`; empty `catch` запрещены.
- `AP-021`, `AP-032`: route handlers только парсят вход, читают recovery signal, валидируют origin/session и делегируют в command/query use-cases.
- `AP-026`: hidden recovery mode, logout reaction и guest statuses должны иметь явный transport contract, не завязанный на форму DB row.
- `AP-039`, `AP-040`: hard auth loss и session invalidation определяются только на серверной доверенной границе и только для current-user use-case.
- `AP-023`: forced logout side effects, recovery cookie и async auth callbacks должны быть явно awaited или оформлены как осознанный best-effort.
- `AP-054`, `PP-017`, `PP-020`: UI должен различать normal guest state, post-logout recovery hint и временные ошибки без техничных терминов и без зависимости popup completion только от opener.

## Fixed Decisions
1. Primary CTA для гостя меняется на `Продолжить с Google`.
2. Supporting copy объясняет: `Войдём в существующий аккаунт или создадим новый автоматически`.
3. Normal auth flow остаётся единым и не делится на `login` и `signup` branches в UI.
4. `prompt: 'consent'` убирается из global default normal flow.
5. Recovery-mode существует только под капотом и переиспользует тот же CTA.
6. Recovery-mode включается только после hard auth loss, определённого сервером по machine-readable Google auth failure.
7. При hard auth loss локальная сессия текущего пользователя инвалидируется.
8. Для следующего гостевого входа после forced logout сохраняется короткоживущий recovery-сигнал, чтобы одна и та же кнопка могла перейти в recovery-mode.
9. Признак hard auth loss хранится на Google account boundary, а не на всём user profile.
10. First-run UX продолжает определяться через отсутствие команд, без нового persisted onboarding-state.

## Технические ограничения реализации
Эта секция описывает только feature-level ограничения и не заменяет общие архитектурные правила.

1. Новая логика реализуется в `implementation/app/*` и `implementation/src/*` по правилам `PP-018`.
2. Route handlers остаются thin adapters; state machine и error-classification живут в application/infrastructure слоях.
3. Product-level recovery нельзя строить на глобальном `prompt=consent` для всех пользователей.
4. Признак recovery нельзя вычислять по чат-контексту, localStorage-only или клиентским эвристикам; source of truth должен быть server-side.
5. Logout допустим только после hard auth loss текущего пользователя, а не после transient Google failure.
6. Aggregate availability flow не имеет права инвалидировать сессию текущего viewer-а по чужому broken account.
7. UI и API сообщения не должны содержать технические термины вроде `refresh token`, `invalid_grant`, `reauth_required`.

## Product Surface

### Guest entry
- Topbar CTA: `Продолжить с Google`
- Guest supporting copy:
  - `Войдём в существующий аккаунт или создадим новый автоматически`
  - при logout после hard auth loss допускается нейтральный статус: `Нужно снова подтвердить доступ к Google Calendar`

### Returning user
- Нажимает тот же CTA.
- В normal mode попадает в стандартный Google login/account chooser без forced consent.
- После callback возвращается в popup flow и получает обычный product context.

### New user
- Нажимает тот же CTA.
- Auth.js создаёт пользователя при первом callback.
- После входа продукт продолжает текущую first-run логику через пустой список команд и create-team mode.

### Recovery user
- Пользователь не знает про токен или переподключение.
- После hard auth loss система завершает локальную сессию.
- Следующий клик по той же кнопке идёт в recovery-mode под капотом.
- В Google пользователь проходит нужный consent flow.
- После успешного callback recovery state очищается, и пользователь снова попадает в рабочий контекст.

## Error Taxonomy

### Class A — Hard auth loss
Система должна перевести пользователя в recovery-mode, если:
- отсутствует `refreshToken` там, где он обязателен для текущего пользователя;
- Google OAuth refresh завершается auth-specific ошибкой (`invalid_grant`, revoked token, invalid refresh token, missing required consent/scopes);
- Google API однозначно сигнализирует, что доступ больше невалиден и не восстановится ретраем.

Product reaction:
- пометить account как `reauth_required`;
- инвалидировать текущую локальную сессию;
- сохранить short-lived recovery signal для следующего гостевого входа;
- вернуть человеку нейтральное сообщение без технических деталей.

### Class B — Transient external failure
Система не должна завершать сессию, если:
- Google вернул timeout;
- 5xx Google или сеть недоступна;
- временный rate limit;
- ошибка связана с конкретным календарём или выборкой, но не доказывает потерю OAuth-доступа.

Product reaction:
- не трогать локальную сессию;
- вернуть обычную user-facing ошибку про временную недоступность календарей.

### Class C — Foreign account failure
Система не должна завершать сессию viewer-а, если:
- broken Google access относится к другому member account;
- запрос выполняет гость;
- ошибка произошла в aggregate availability или team flow без доказательства, что сломан auth именно текущего пользователя.

Product reaction:
- не трогать сессию текущего viewer-а;
- возвращать доменную ошибку team/team-member context.

## Domain Model Changes

### Existing source of truth
- `users` хранит identity/profile.
- `accounts` хранит OAuth-связку с Google и refresh token.

### New account-level fields
В `implementation/src/infrastructure/db/schema.ts` для `accounts` добавить:
- `authStatus` (`active | reauth_required`) — not null, default `active`
- `authStatusUpdatedAt` — nullable ISO timestamp
- `authStatusReason` — nullable sanitized code

Принцип:
- флаг хранится на account boundary;
- `users` не получает глобальный флаг “пользователь сломан”.

## Auth State Machine

### States
- `active`
- `reauth_required`

### Transitions
- `active -> reauth_required`
  - hard auth loss в current-user context
- `reauth_required -> active`
  - successful Google callback with refreshed valid account linkage

### Session coupling
- При переходе в `reauth_required` текущая local session удаляется.
- Дополнительно создаётся short-lived recovery signal, который переживает logout.

## Recovery Signal Contract

### Purpose
После logout система должна помнить, что следующий guest click по `Продолжить с Google` должен идти через recovery-mode.

### Suggested implementation
- short-lived, httpOnly, same-site cookie, например `teamcal_google_reauth=1`
- TTL: короткий, например `10-15 минут`
- signal выставляется только при hard auth loss
- signal очищается:
  - после успешного recovery callback;
  - по истечении TTL;
  - при явном завершении recovery attempt

### Why cookie, not only DB flag
- После logout `/auth/google` больше не знает, кто пользователь.
- DB flag сам по себе не даёт анонимному guest-entry понять, что нужен recovery-mode.
- Cookie позволяет сохранить одну и ту же кнопку, но переключить её внутренний режим.

## Route and API Contract

### Normal entry
- `GET /auth/google`
- `GET /api/auth/google`
- без `prompt=consent`

### Hidden recovery-mode
- тот же entry point
- route handler читает recovery cookie
- если signal присутствует, normal flow переключается в Google request с recovery parameters

### Allowed recovery parameters
- `prompt=consent`
- при необходимости `access_type=offline` сохраняется

### Forbidden behavior
- отдельная постоянная кнопка `Переподключить Google`
- forced-consent для всех login requests
- повторная регистрация как отдельный UX

## Auth Callback Semantics

После успешного OAuth callback:
- если account был в `reauth_required`, он переводится обратно в `active`;
- recovery cookie очищается;
- текущий popup completion contract сохраняется;
- returning/new user дальше идут по существующему product routing:
  - есть команды -> teams list
  - нет команд -> create-team mode

## Current Code Impact

### Auth config
- `implementation/src/infrastructure/auth/auth-options.ts`
  - убрать global `prompt: 'consent'`
  - добавить controlled way передавать recovery params
  - использовать Auth.js callbacks/events для очистки account state после successful recovery

### Auth route
- `implementation/app/api/auth/google/handler.ts`
  - читать recovery signal
  - различать normal mode и hidden recovery mode
  - сохранять current safe `next` semantics

### Google infra
- `implementation/src/infrastructure/google/freebusy.ts`
- `implementation/src/infrastructure/google/calendar-list.ts`
  - перестать кидать безликие `Error`
  - нормализовать Google auth failure в machine-readable ошибки

### Application/use-case layer
- `implementation/src/application/usecases/get-current-user.ts`
- `implementation/src/application/usecases/team-page.ts`
- related settings/availability handlers
  - различать `hard auth loss` и `transient failure`
  - переводить account в `reauth_required` только в current-user flows

### Session/logout handling
- current logout flow reused, but triggered server-side on hard auth loss
- logout must be targeted to current user session only

### UI copy
- `implementation/app/_components/header.tsx`
- `implementation/app/_components/home-page-client.tsx`
  - обновить CTA и supporting copy
  - optionally show neutral status after forced logout due to hard auth loss

## Scenario Matrix

### US-1: Returning user normal login
1. Пользователь видит `Продолжить с Google`.
2. Нажимает кнопку.
3. `/auth/google` идёт в normal mode.
4. Google не требует лишний consent по умолчанию.
5. Пользователь возвращается в обычный рабочий контекст.

### US-2: New user first login
1. Пользователь нажимает ту же кнопку.
2. Auth.js создаёт нового пользователя.
3. После входа home page видит `teamsCount === 0`.
4. Пользователь попадает в create-team flow.

### US-3: Hard auth loss on current user settings flow
1. Авторизованный пользователь открывает профиль/настройки.
2. Серверный Google call получает auth-specific hard failure.
3. Account помечается как `reauth_required`.
4. Local session инвалидируется.
5. Гостевой экран показывает ту же кнопку `Продолжить с Google`.
6. Следующий клик автоматически идёт в recovery-mode.
7. После успешного callback account возвращается в `active`.

### US-4: Transient Google failure
1. Google API временно недоступен.
2. Система возвращает user-facing ошибку временной недоступности.
3. Session не инвалидируется.
4. Следующий логин по-прежнему идёт в normal mode.

### US-5: Broken Google access of another team member
1. Viewer открывает командную availability страницу.
2. У другого участника нет валидного refresh token.
3. Viewer session не инвалидируется.
4. Возвращается доменная ошибка team context.

## Acceptance Criteria
- В интерфейсе для гостя используется `Продолжить с Google`.
- Supporting copy объясняет auto-create semantics без слова `регистрация`.
- Normal auth flow не форсирует consent для каждого входа.
- Hard auth loss переводит только затронутый Google account в `reauth_required`.
- При hard auth loss завершается local session текущего пользователя и создаётся hidden recovery signal.
- Следующий guest click по той же кнопке автоматически идёт в recovery-mode.
- Успешный recovery callback очищает account recovery state и recovery signal.
- Transient Google failures не завершают session.
- Aggregate/team foreign-account failures не завершают session viewer-а.
- Popup completion и safe `next` redirect contract остаются рабочими.

## Testing Strategy

### Unit / contract
- auth route:
  - normal mode без recovery cookie
  - recovery-mode при наличии recovery cookie
  - safe `next` contract сохраняется
- account state transitions:
  - `active -> reauth_required`
  - `reauth_required -> active`
- Google error classifier:
  - hard auth loss
  - transient failure
  - foreign-account / non-current-user case

### Integration
- successful normal login
- successful recovery login after forced logout
- current-user settings flow triggers hard auth loss handling
- team availability does not force logout viewer on чужом broken account

### UI
- CTA text and supporting copy updated
- guest entry after forced logout remains one-button
- no user-facing technical wording about tokens or reauth

## Risks
- Если классификация Google ошибок будет слишком общей, система начнёт разлогинивать пользователей на transient failures.
- Если recovery signal не переживёт logout, hidden recovery mode сломается и продукт вернётся к ручным workaround-ам.
- Если переводить в `reauth_required` только по факту отсутствия `refreshToken`, можно пропустить revoked-token кейсы.
- Если помечать весь `user`, а не `account`, логика станет хрупкой для будущих provider/extensions.

## Open Questions
- Нужен ли neutral status message на landing после forced logout или можно ограничиться бесшумным возвратом к гостевому состоянию.
- Нужен ли отдельный sanitized reason catalog в БД (`refresh_missing`, `oauth_revoked`, `scope_lost`) или достаточно одного `reauth_required` без причины на первом шаге.
