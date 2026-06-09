# Feature Specs — Team Webhooks (JWT Bearer Blessed Path)

Статус: draft  
Feature key: `team-events-webhook`  
Дата: 2026-04-11

## Контекст
Сейчас продукт уже умеет:
- отправлять email-уведомления в booking flow;
- хранить team-level webhook subscriptions;
- показывать owner-у раздел `Интеграции и вебхуки`.

Но security и DX для webhook integration зафиксированы плохо:
- в старом плане смешаны owner UI, agent setup, outbound signing и JWKS;
- нет одного blessed integration flow для n8n и обычных backend-ов;
- открытые задачи ведут к вариативной security-модели вместо одного рабочего контракта.

## Цели
- Сохранить email-first и best-effort booking flow как baseline.
- Зафиксировать один blessed path для outbound webhook delivery: `JWT Bearer` + `HS256` + per-subscription shared secret.
- Явно разделить outbound webhook security и inbound API authentication.
- Собрать n8n-first onboarding path, который также понятен обычному backend и агенту.
- Обновить task set так, чтобы дальнейшая реализация шла по одному контракту без fallback auth modes.

## Non-Goals
- `header_secret` fallback или compat mode.
- `basic_auth` для webhook delivery.
- `JWKS`, `RS256`, `ES256`.
- payload-level HMAC body signature.
- auth-mode matrix на уровне webhook subscription.
- guaranteed delivery, retry queue, outbox в рамках текущего MVP.
- новые event types сверх `booking.requested`.
- agent auto-setup как часть текущего required implementation path.

## Fixed Decisions
1. Blessed path для webhook delivery: только `Authorization: Bearer <jwt>`.
2. JWT algorithm фиксирован: только `HS256`.
3. На каждую webhook subscription хранится один shared secret.
4. Teamcal выпускает короткоживущий JWT на каждую delivery attempt.
5. Рекомендуемый TTL токена: `120 секунд`.
6. Обязательные claims: `iss`, `aud`, `sub`, `jti`, `iat`, `exp`.
7. `iss` фиксирован как `teamcal`.
8. `sub` фиксирован как `team:<team_id>`.
9. `jti` всегда равен `delivery_id`.
10. Опциональный claim `evt` допускается для event type и должен совпадать с delivery metadata.
11. Каждый webhook request всегда содержит `X-Teamcal-Event`, `X-Teamcal-Event-Id`, `X-Teamcal-Delivery-Id`, `X-Teamcal-Timestamp`.
12. Inbound API access к Teamcal строится только на `Authorization: Bearer <api_token>`.
13. API token и webhook shared secret — разные сущности и не могут переиспользоваться друг вместо друга.
14. UI не предлагает выбор auth mode; webhook auth model отображается как fixed contract.
15. `POST /api/booking` сохраняет best-effort семантику и не падает в `5xx` только из-за email/webhook delivery ошибок.
16. Team-level subscriptions остаются продуктовым source of truth; глобальный env webhook не является blessed integration model.

## Технические ограничения реализации
- `TEW-TR-01`: реализация остаётся в `implementation/app/*` и `implementation/src/*` по правилам `PP-018`, без возврата legacy runtime.
- `TEW-TR-02`: route handlers для webhook settings и provisioning остаются thin adapters; orchestration живёт в `src/application/usecases/*`.
- `TEW-TR-03`: входной контракт `POST /api/booking` не меняется.
- `TEW-TR-04`: webhook security contract не должен становиться configurable matrix через `auth_mode` или аналогичное поле.
- `TEW-TR-05`: секреты хранятся только в encrypted form и не логируются в plaintext.
- `TEW-TR-06`: UI для onboarding и management проектируется через shadcn composition, а не через ad-hoc markup.
- `TEW-TR-07`: `last_error` хранится и показывается в санитизированной форме без утечки downstream secrets, raw auth headers и internal stack traces.

## Product Surface

### Primary persona
- Team owner / ops integrator, который хочет подключить n8n, CRM или internal automation endpoint.

### Secondary persona
- Агент или технический интегратор, которому дают `URL + shared secret + audience + docs`.

### Blessed client journey
1. Owner открывает страницу команды и идёт в настройки.
2. В секции `Интеграции и вебхуки` видит короткое описание fixed auth contract: `JWT Bearer`, `HS256`, `shared secret`.
3. Нажимает `Добавить webhook`.
4. В списке появляется draft row, визуально близкая к обычной строке webhook-а.
5. Teamcal сразу показывает one-time secret внутри draft row; owner копирует secret, затем вставляет `Webhook URL`.
6. Нажимает `Добавить`, после чего draft привязывается к URL и сохраняется как обычная subscription.
7. После сохранения plaintext secret исчезает и больше не показывается.
8. После rotate plaintext secret показывается только внутри строки соответствующего webhook-а.
9. Если интеграция не работает, owner видит `last delivery`, `last error`, `active/disabled` и может отключить, удалить или повернуть secret.

### UX goals
- Один путь подключения без выбора auth strategy.
- Security copy пишет про интеграцию и проверку запроса, а не про абстрактную криптографию.
- n8n-first flow должен быть естественным: URL, secret, audience, JWT verify, dedupe.
- Владелец команды должен понимать, что API token и webhook secret — это разные вещи.

### shadcn component map
- `Card` — контейнер секции и subscription card.
- `Alert` — blessed-path explanation, warning про best effort, rollout note.
- inline draft row — add webhook и pre-bind provisioning.
- row-scoped inline secret block — one-time provisioning result после prepare/rotate.
- `Input` — URL input внутри draft row.
- `Switch` — active/disabled.
- `Badge` — `JWT Bearer`, delivery status, active state.
- `Button` — add/copy/test/rotate/delete.
- `Separator` — разделение onboarding и operational controls.
- `Skeleton` — loading state списка.
- `Tooltip` — copy affordances для URL и секрета.

## Phases

### Phase 1 — Booking email baseline
- Email notifications уже остаются baseline частью feature.
- Webhook delivery в booking flow остаётся best effort.
- Эта фаза не меняется и не должна быть повторно открыта без новой причины.

### Phase 2 — Team webhook subscriptions with JWT Bearer
- Team settings содержит team-level webhook subscriptions.
- Для каждой subscription fixed auth contract: `JWT Bearer`, `HS256`, per-subscription shared secret.
- Runtime отправляет `booking.requested` во все active subscriptions.
- UI показывает `last_delivery_status`, `last_delivery_at`, `last_error`, active state.
- Документация даёт один blessed verification flow для n8n и обычного backend-а.

### Phase 3 — API-based provisioning
- Teamcal API использует только bearer API tokens.
- Через API можно создавать, читать, отключать, удалять и rotate webhook subscriptions.
- Это отдельная security surface и отдельная продуктовая задача; она не меняет outbound JWT delivery model.

### Phase 4 — Post-MVP hardening
- Secret rotation UX/runbook.
- Delivery history или retry/outbox только при подтверждённой продуктовой необходимости.
- Дополнительные event types только после стабилизации текущего blessed path.
- Возврат к `JWKS`, `RS256`, `ES256` или fallback modes запрещён без отдельного архитектурного решения.

## Phase 2 Contracts

### DB contract (`team_webhook_subscriptions`)
Required fields:
- `id` (PK)
- `team_id_raw` (not null)
- `event_type` (not null, default `booking.requested`)
- `target_url` (not null)
- `status` (not null, default `active`) (`active|disabled`)
- `created_by_user_id_raw` (not null)
- `updated_by_user_id_raw` (nullable)
- `created_at` (not null)
- `updated_at` (not null)
- `last_delivery_status` (not null, default `never`) (`never|success|failed`)
- `last_delivery_at` (nullable)
- `last_error` (nullable)
- `jwt_secret_encrypted` (not null)
- `jwt_audience` (not null)
- `secret_last_rotated_at` (nullable)

Constants, not per-row config:
- JWT alg = `HS256`
- JWT issuer = `teamcal`

Forbidden fields:
- `auth_mode`
- `header_secret`
- `basic_auth_username`
- `basic_auth_password`
- `jwks_url`
- `jwt_public_key`
- `jwt_key_id`
- `body_signature_secret`

Constraints:
- unique constraint: `(team_id_raw, event_type, target_url)`
- `jwt_audience` должен быть не пустым и стабильным для subscription
- `target_url` должен проходить SSRF-safe allow/deny validation

### Webhook delivery contract
HTTP request:
- method: `POST`
- auth header: `Authorization: Bearer <jwt>`
- required headers:
  - `X-Teamcal-Event`
  - `X-Teamcal-Event-Id`
  - `X-Teamcal-Delivery-Id`
  - `X-Teamcal-Timestamp`

JWT contract:
- algorithm: `HS256`
- secret: per-subscription shared secret
- TTL: `120 seconds`

Required claims:
- `iss = teamcal`
- `aud = <subscription.jwt_audience>`
- `sub = team:<team_id>`
- `jti = <delivery_id>`
- `iat`
- `exp`

Optional claim:
- `evt = <event_type>`

Receiver verification rules:
- проверить JWT через shared secret
- проверить `iss`, `aud`, `sub`, `jti`, `iat`, `exp`
- проверить, что `jti` совпадает с `X-Teamcal-Delivery-Id`
- если claim `evt` присутствует, он должен совпадать с `X-Teamcal-Event`

Replay and idempotency:
- replay protection строится на коротком TTL + одноразовом `jti`
- receiver должен хранить использованные `delivery_id` как минимум на TTL-окно
- бизнес-dedupe рекомендуется по `event_id`
- сетевой/replay dedupe рекомендуется по `delivery_id`

### API auth contract
- Teamcal API использует только `Authorization: Bearer <api_token>`
- API token используется для доступа клиента к Teamcal API
- API token не равен webhook secret
- webhook secret не принимается как API credential
- provisioning API не меняет outbound delivery auth model и не вводит дополнительных webhook auth modes

### Runtime delivery model
- `POST /api/booking` после успешной бизнес-операции инициирует best-effort email + webhook side effects
- webhook delivery читает все active subscriptions команды для `booking.requested`
- fan-out выполняется так, чтобы сбой одного endpoint-а не блокировал остальные
- по каждой subscription обновляются только:
  - `last_delivery_status`
  - `last_delivery_at`
  - `last_error`
- delivery status должен отражать именно последнюю попытку, а не квази-историю
- env kill switch может отключить outbound delivery runtime, но не должен ломать management UI/API

## DX and Docs
Blessed integration flow в docs и UI:
1. Создай webhook endpoint.
2. Укажи webhook URL в Teamcal.
3. Скопируй shared secret в draft row и привяжи его к webhook URL.
4. Настрой JWT Bearer verification с `HS256`.
5. Принимай события и проверяй required headers.
6. Используй `event_id` и `delivery_id` для dedupe.

Required docs output:
- короткая owner-facing help внутри UI
- developer docs page с JWT verification contract
- n8n-first example flow
- backend example without JWKS and without alternate auth modes

## Acceptance Criteria
- В team settings есть понятная onboarding-first секция `Вебхуки`.
- Owner может add, disable, delete и rotate webhook subscription.
- Add flow идёт через draft provisioning row, а не через post-create global alert.
- UI не предлагает выбор auth mode и явно показывает fixed contract `JWT Bearer / HS256`.
- Для каждой subscription доступны delivery status и sanitized last error.
- Каждый outbound webhook request содержит JWT Bearer и required delivery headers.
- JWT claims соответствуют contract и генерируются с TTL `120 секунд`.
- Booking flow остаётся best effort и не ломается из-за webhook delivery failures.
- Docs page описывает один blessed verification flow для n8n и обычного backend-а.
- API auth contract явно отделён от webhook auth contract.

## Implementation Path

### Slice A — Contract freeze and persistence
- Обновить доменные контракты `team-webhooks` под JWT-only модель.
- Добавить поля `jwt_secret_encrypted`, `jwt_audience`, `secret_last_rotated_at` в schema и migration.
- Удалить любые намёки на configurable webhook auth modes.
- Нормализовать `last_error` policy и redaction rules.

### Slice B — Owner management and provisioning surface
- Обновить query/command use-case-ы subscriptions.
- Добавить prepare-before-save flow, который генерирует shared secret и audience до сохранения URL.
- Добавить reveal/rotate secret semantics на application boundary.
- Сформировать provisioning contract отдельно от future API token surface.

### Slice C — Outbound delivery runtime
- Генерировать per-delivery JWT Bearer на `HS256`.
- Добавить required delivery headers.
- Привязать `jti` к `delivery_id`.
- Обновлять delivery status без retry/outbox.
- Убедиться, что failure path остаётся best effort и санитизированно логируется.

### Slice D — UX and docs
- Пересобрать settings UI вокруг onboarding path, а не вокруг списка URL.
- Использовать shadcn-compatible composition для inline row, skeleton, badges, buttons и copy affordances.
- Добавить docs entry point `Как проверить JWT`.
- Подготовить n8n-first example и plain backend example.

### Slice E — Regression and rollout
- Route tests: owner/non-owner, validation, provisioning semantics.
- Delivery tests: JWT claims, headers, fan-out, best effort.
- UI tests: add/disable/delete/rotate flow, onboarding copy, status rendering.
- Rollout notes: cutover, secret handling, support policy.

## Parallelization Matrix
| task | depends_on | parallel_with | shared_files_risk |
| --- | --- | --- | --- |
| [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md) | [TEAMCAL-33](tasks/team-events-webhook/TEAMCAL-33.team-webhook-subscriptions.md) | нет | `src/domain/team-webhooks.ts`, `src/infrastructure/db/schema.ts`, migrations |
| [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md) | [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md) | [TEAMCAL-57](tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md) | `src/application/usecases/team-webhooks.ts`, `app/api/teams/[shareId]/integrations/webhooks/*` |
| [TEAMCAL-56](tasks/team-events-webhook/TEAMCAL-56.jwt-delivery-runtime-docs-and-rollout.md) | [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md), [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md), [TEAMCAL-57](tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md) | нет | delivery runtime, docs, regression gate |
| [TEAMCAL-57](tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md) | [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md) | [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md) | `app/_components/team-page/*`, shadcn UI layer |

## Risks
- Старые subscriptions без shared secret contract потребуют cutover, а не fallback.
- TTL слишком короткий создаст ложные отказы у интеграторов с нестабильными часами; TTL слишком длинный ослабит replay protection.
- Если reveal/rotate secret flow сделать небрежно, UI станет источником утечки секрета.
- Если shadcn foundation не заведена в проект, UX task должен включать минимальный bootstrap нужных компонентов, а не разрастание кастомного UI.

## Feature-level Definition of Done
- Historical baseline complete:
  - [TEAMCAL-31](tasks/team-events-webhook/TEAMCAL-31.notifications-feature-framing.md) = `done`
  - [TEAMCAL-32](tasks/team-events-webhook/TEAMCAL-32.booking-email-notifications.md) = `done`
  - [TEAMCAL-33](tasks/team-events-webhook/TEAMCAL-33.team-webhook-subscriptions.md) = `done`
- Current required implementation gate:
  - [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md) = `done`
  - [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md) = `done`
  - [TEAMCAL-56](tasks/team-events-webhook/TEAMCAL-56.jwt-delivery-runtime-docs-and-rollout.md) = `done`
  - [TEAMCAL-57](tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md) = `done`
- Explicitly superseded:
  - [TEAMCAL-34](tasks/team-events-webhook/TEAMCAL-34.agent-setup-token-and-jwks.md)
  - [TEAMCAL-35](tasks/team-events-webhook/TEAMCAL-35.integration-regression-rollout.md)

## Декомпозиция
- [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md) — JWT-only contract freeze, schema and redaction rules.
- [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md) — owner API and secret provisioning semantics.
- [TEAMCAL-56](tasks/team-events-webhook/TEAMCAL-56.jwt-delivery-runtime-docs-and-rollout.md) — outbound JWT delivery, docs, regression and rollout gate.
- [TEAMCAL-57](tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md) — onboarding-first settings UX with shadcn composition.
