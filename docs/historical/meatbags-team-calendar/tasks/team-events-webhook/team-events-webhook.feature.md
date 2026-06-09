# Feature Dossier

Feature: `team-events-webhook`
Updated: `2026-04-11`

## Context
- Problem: в продукте уже есть email-first baseline и owner-visible список team webhook-ов, но security contract и onboarding path для интегратора не собраны в один blessed flow. Старые открытые задачи тащат решение в сторону `setup token + JWKS`, а не в сторону понятного MVP для n8n и обычного backend-а.
- Goal: пересобрать feature вокруг одного blessed path: owner подключает webhook через настройки команды, сначала получает one-time secret inside draft row, затем привязывает его к URL, а runtime доставляет `booking.requested` через short-lived `JWT Bearer` на `HS256`.
- Desired user/business outcome: владелец команды без разработчика подключает n8n, CRM или internal endpoint, понимает как проверить JWT и видит operational status интеграции в team settings.
- Priority: high
- Primary stakeholder or decision owner: Vanya
- Target date (if relevant): ближайший релиз после stabilizing JWT-only contract, onboarding UX и regression gate
- Success metric or acceptance signal for the business outcome: owner проходит путь `generate secret -> copy -> bind URL -> verification docs -> first valid delivery` без fallback auth modes; booking flow остаётся best effort; support не объясняет интеграторам несколько security-вариантов.
- Open questions:
- explicit reveal action после save не делать; plaintext secret показывается только внутри draft row до сохранения и внутри matching row после rotate;
  - нужен ли `label`/name у subscription для owner UX или MVP должен остаться URL-first;
  - нужна ли кнопка `Проверить доставку` в MVP или достаточно реального booking flow + docs.
- Risks:
  - старые subscriptions без shared secret contract потребуют честный cutover, а не compat mode;
  - плохой reveal/rotate UX превратит UI в источник утечки секрета;
  - отсутствие shadcn foundation в проекте может размыть UX task в хаотичный custom UI.
- Edge cases:
  - duplicate URL для одной команды и события;
  - downstream отвечает `2xx`, но receiver неверно валидирует JWT;
  - secret был повернут, а receiver остался на старом значении;
  - env kill switch отключён, но owner всё ещё должен видеть и управлять subscriptions.
- Stack or architecture uncertainty: нужно внедрить onboarding-first UX и JWT-only security contract, не раздувая `team-page-client.tsx` и не ломая текущие App Router / Drizzle boundaries.
- Recommended next stage: finish

## Spec
- Fixed decisions:
  - outbound webhook delivery использует только `Authorization: Bearer <jwt>`;
  - JWT algorithm фиксирован: `HS256`;
  - каждая subscription имеет собственный shared secret и `audience`;
  - Teamcal API auth и webhook auth разделены: API использует bearer API token, webhook delivery использует per-subscription JWT secret;
  - UI и docs показывают один blessed path без `JWKS`, `basic_auth`, `header_secret` или auth-mode выбора.
- Contracts:
  - `event_type` в текущем scope фиксирован как `booking.requested`;
  - `status` webhook-а: `active | disabled`;
  - `last_delivery_status`: `never | success | failed`;
  - subscription хранит `jwt_secret_encrypted`, `jwt_audience`, `secret_last_rotated_at`;
  - booking endpoint сохраняет best-effort семантику и не падает в `5xx` только из-за outbound delivery.
- Acceptance criteria:
- в team settings есть onboarding-first секция `Вебхуки`;
- owner может add, disable, delete и rotate subscription;
- add flow идёт через draft provisioning row, а не через post-create global alert;
- каждый outbound webhook request содержит required JWT claims и delivery headers;
  - docs page описывает blessed verification flow для n8n и обычного backend-а;
  - API auth contract явно отделён от webhook auth contract.
- Non-goals:
  - `JWKS`, `RS256`, `ES256`, `header_secret`, `basic_auth`, payload HMAC;
  - retry/outbox и delivery history;
  - новые event types сверх `booking.requested`;
  - agent auto-setup в текущем required path.
- Migration or rollout constraints:
  - rollout должен сохранять текущий best-effort contract для `POST /api/booking`;
  - cutover выполняется без compat auth modes;
  - новые schema/UI/API changes остаются в pg-only Next runtime.
- Feature-level risks:
  - если закодировать auth variability в schema сейчас, благословлённый путь снова размоется;
  - если onboarding help не встроить в UI, интегратор снова уйдёт в догадки и support burden;
  - если `last_error` не нормализовать, UI начнёт протекать внутренними деталями downstream.

## Architecture rules in scope
- Relevant `AP-*`: `AP-010`, `AP-020`, `AP-021`, `AP-024`, `AP-027`, `AP-032`, `AP-035`, `AP-040`, `AP-041`, `AP-042`, `AP-043`, `AP-044`, `AP-049`, `AP-050`, `AP-054`, `AP-058`, `AP-064`, `AP-067`, `AP-069`
- Relevant `PP-*`: `PP-018`, `PP-019`
- Approved deviations to register or reference:
  - persisted outbox/reliable delivery намеренно не входит в текущий scope, несмотря на `AP-047`; MVP остаётся best effort;
  - временный legacy fallback auth path запрещён: cutover должен быть явным, а не замаскированным.

## Plan
- Decomposition:
  - `TEAMCAL-54` — JWT-only contract freeze, schema, redaction rules;
  - `TEAMCAL-55` — owner management and provisioning surface;
  - `TEAMCAL-56` — JWT delivery runtime, docs, regression and rollout gate;
  - `TEAMCAL-57` — onboarding-first settings UX with shadcn composition.
- Dependency order (human-readable planning view):
  - historical baseline: `TEAMCAL-31 -> TEAMCAL-32 -> TEAMCAL-33`
  - current path: `TEAMCAL-54 -> (TEAMCAL-55 + TEAMCAL-57) -> TEAMCAL-56`
- Preference for the minimum dependency graph needed for safe execution:
  - сначала замораживается JWT-only contract и persistence model;
  - затем API/provisioning surface и UX можно делать параллельно с раздельными write scopes;
  - delivery runtime и rollout gate собираются последними, когда контракты и UI copy уже стабильны.
- Ownership boundaries:
- `TEAMCAL-54`: contracts, schema, security invariants;
- `TEAMCAL-55`: command/query surface и secret lifecycle semantics;
- `TEAMCAL-56`: delivery runtime, JWT generation, docs, regression, rollout;
- `TEAMCAL-57`: historical onboarding/user journey slice;
- `TEAMCAL-79`: draft provisioning row and row-scoped secret reveal UX.
- File reservations:
  - `TEAMCAL-54`: `implementation/src/domain/team-webhooks.ts`, `implementation/src/infrastructure/db/schema.ts`, `implementation/drizzle/*`, `implementation/src/infrastructure/notifications/team-webhook-delivery.ts`
  - `TEAMCAL-55`: `implementation/src/application/usecases/team-webhooks.ts`, `implementation/app/api/teams/[shareId]/integrations/webhooks/*`
  - `TEAMCAL-56`: delivery runtime, docs files, regression tests, release-facing task artifacts
  - `TEAMCAL-57`: `implementation/app/_components/team-page/*`, shadcn foundation files when introduced
- Integration task: `TEAMCAL-56`
- Required implementation task list:
  - historical baseline: `TEAMCAL-31`, `TEAMCAL-32`, `TEAMCAL-33`
  - current required set: `TEAMCAL-54`, `TEAMCAL-55`, `TEAMCAL-56`, `TEAMCAL-57`
- Testing strategy:
  - contract tests for owner/non-owner and provisioning semantics;
  - delivery tests for JWT claims, headers, fan-out and best effort;
  - UI acceptance tests for add/disable/delete/rotate/onboarding copy;
  - docs/rollout verification without secret leakage.

## Decisions
- `2026-02-13` — зафиксирована phased roadmap: email first, webhook/auth later.
- `2026-04-06` — принято решение заменить single team webhook URL на список webhook-ов команды с add/delete/toggle UX.
- `2026-04-06` — принято решение сохранить best-effort delivery в рамках `TEAMCAL-33` и не вносить reliable delivery/outbox в текущий scope.
- `2026-04-10` — feature пересобрана под blessed path: webhook delivery только через short-lived `JWT Bearer` на `HS256`, API auth только через bearer API token.
- `2026-04-10` — `TEAMCAL-34` и `TEAMCAL-35` признаны устаревшими по сути и должны быть закрыты как superseded после пересборки task set.

## Tracking
- Feature anchor issue: `TEAMCAL-53` — `https://linear.app/meatbags/issue/TEAMCAL-53/feature-anchor-integracii-i-vebhuki-komandy`
- Required task set:
  - `TEAMCAL-31`
  - `TEAMCAL-32`
  - `TEAMCAL-33`
  - `TEAMCAL-54`
  - `TEAMCAL-55`
  - `TEAMCAL-56`
  - `TEAMCAL-57`
  - `TEAMCAL-79`
- Child task keys:
  - `TEAMCAL-31`
  - `TEAMCAL-32`
  - `TEAMCAL-33`
  - `TEAMCAL-34` (`superseded`)
  - `TEAMCAL-35` (`superseded`)
  - `TEAMCAL-54`
  - `TEAMCAL-55`
  - `TEAMCAL-56`
  - `TEAMCAL-57`
- Follow-up feature anchor: `TEAMCAL-65` — `https://linear.app/meatbags/issue/TEAMCAL-65/feature-anchor-polzovatelskie-integracii-i-podklyuchenie-komand`
- Shared packet version: `v2`
- Current owner: `Codex`

## Log
- `2026-02-13 02:26 — Context created through phased notifications/webhooks decomposition.`
- `2026-02-13 02:35 — Phase 1 completed locally: booking email notifications and best-effort delivery shipped.`
- `2026-04-06 14:56 — TEAMCAL-33 completed locally after route/UI verification; main route regression gate updated to include nested webhook route test.`
- `2026-04-10 13:00 — Feature replanned using PRD + SDD pass around JWT-only blessed path and onboarding-first UX.`
- `2026-04-10 13:15 — Old open tasks marked for supersession; new implementation path decomposed into TEAMCAL-54..57.`
- `2026-04-10 18:55 — Feature finished locally after TEAMCAL-54..57 closeout; continuation moved into new feature `user-integrations-catalog` anchored by TEAMCAL-65.`
- `2026-04-11 19:45 — Post-ship follow-up `TEAMCAL-71` opened to clean up the current team-level webhook settings UX while personal-account integrations remain deferred.`
- `2026-04-11 20:08 — Post-ship follow-up `TEAMCAL-71` completed: webhook settings section rebuilt into compact list-first UX with stable loading skeleton and leading enable switch.`
- `2026-04-11 20:42 — Post-ship follow-up `TEAMCAL-78` completed: webhook settings were redesigned again into a single compact card with row layout, dialog-based creation, inline secret alert and no visible Audience field.`
- `2026-04-11 22:55 — Post-ship follow-up `TEAMCAL-79` completed: onboarding contract changed from post-create reveal to pre-bind draft provisioning row; secret now belongs to the concrete draft or rotated row instead of a global alert above the list.`
