# Feature Dossier

Feature: `auth-entry-clarity`
Updated: `2026-04-10`

## Context
- Problem: текущий auth-entry UX говорит только про `Войти через Google`, хотя фактически один и тот же OAuth flow и логинит returning user, и автоматически создаёт нового пользователя. Дополнительно normal flow в [implementation/src/infrastructure/auth/auth-options.ts](implementation/src/infrastructure/auth/auth-options.ts) принудительно передаёт `prompt: 'consent'`, из-за чего returning user снова проходит экран подтверждения Google чаще, чем требуется.
- Goal: сделать один честный entry point `Продолжить с Google`, убрать лишний forced-consent из обычного логина и сохранить один OAuth flow без отдельного signup route.
- Desired user/business outcome: новый пользователь не боится кнопки `Войти`, понимает, что аккаунт создастся автоматически, а returning user проходит auth с меньшим трением и без ощущения повторной регистрации.
- Priority: high
- Primary stakeholder or decision owner: Vanya
- Target date (if relevant): ближайший auth/UI polish релиз
- Success metric or acceptance signal for the business outcome: returning user в типовом повторном входе не видит лишний consent screen; новый пользователь заходит через тот же CTA и попадает в first-run сценарий без дополнительного выбора `логин или регистрация`.
- Open questions:
  - нужен ли отдельный welcome-copy для первого входа поверх уже существующего auto-open create-team flow;
  - нужен ли neutral post-logout status на guest surface после hard auth loss или достаточно бесшумного возврата к гостевому состоянию.
- Risks:
  - часть старых пользователей может уже существовать без корректного `refreshToken`, и после снятия forced-consent это станет заметнее;
  - если добавить отдельный `signup` branch в auth-entry, продукт получит лишнюю сложность без новой пользовательской ценности;
  - если hidden recovery mode будет устроен неявно или хрупко, ошибки календарного доступа снова начнут выглядеть как случайные сбои.
- Edge cases:
  - пользователь авторизуется впервые, но приходит не на `/`, а на team page с `next`;
  - Google всё равно может показать account chooser, даже если consent не форсируется;
  - у returning user аккаунт есть, но календарные креды отсутствуют или были отозваны;
  - popup completion должен остаться устойчивым к потере opener по PP-020.
- Stack or architecture uncertainty: в MVP не видно необходимости в отдельном persisted `signup/login intent`; current product уже умеет отличать first-run по отсутствию команд (`teamsCount === 0`), поэтому явный onboarding-state может оказаться лишним.
- Recommended next stage: implement

## Spec
- Fixed decisions:
  - primary CTA для неавторизованного пользователя меняется с `Войти через Google` на `Продолжить с Google`;
  - рядом с CTA или в hero copy явно говорится: `Войдём в существующий аккаунт или создадим новый автоматически`;
  - normal auth flow остаётся единым: отдельные кнопки или routes для `Вход` и `Регистрация` не добавляются;
  - normal Google auth flow больше не должен форсировать `prompt=consent`;
  - forced-consent допускается только в hidden recovery mode, а не в каждом логине;
  - MVP не добавляет отдельную onboarding-модель, флаг `is_registered` или новый user profile state только ради различения login/signup;
  - first-run UX продолжает опираться на уже существующее поведение home page: если у пользователя нет команд, он попадает в create-team flow;
  - текущий popup auth bridge (`postMessage` + `BroadcastChannel` + `localStorage`) сохраняется без редизайна.
- Contracts:
  - `GET /auth/google` и `GET /api/auth/google` остаются единым entry point для normal flow;
  - normal flow не передаёт Google provider параметр `prompt=consent`;
  - hidden recovery mode должен использовать тот же auth entry и включаться по server-side recovery signal, без второго пользовательского CTA;
  - отсутствие `refreshToken` или невозможность синхронизации с Google трактуется как credential-recovery сценарий, а не как повод снова всегда принудительно проводить через consent весь продукт.
- Acceptance criteria:
  - существуют три source-of-truth артефакта фичи:
    - `tasks/auth-entry-clarity/auth-entry-clarity.prd.md`
    - `tasks/auth-entry-clarity/auth-entry-clarity.specs.md`
    - `tasks/auth-entry-clarity/auth-entry-clarity.plan.md`
  - в topbar и guest entry copy больше нет формулировки, которая предполагает только вход существующего пользователя;
  - обычный returning user проходит login через тот же CTA и не получает повторный consent по умолчанию;
  - новый пользователь проходит через тот же CTA, автоматически создаётся в Auth.js adapter и попадает в usable first-run state без отдельного выбора `логин/регистрация`;
  - normal login не делает второго похода в Google ради определения типа пользователя;
  - hidden recovery mode включается только при реальной необходимости в повторном согласии и не требует отдельной кнопки в интерфейсе.
- Non-goals:
  - две разные primary-кнопки `Войти` и `Регистрация`;
  - сбор дополнительных регистрационных данных до первого полезного действия;
  - отдельный многошаговый onboarding;
  - redesign popup completion UX;
  - изменение Google scopes в рамках этой фичи.
- Migration or rollout constraints:
  - изменение должно сохранять current popup flow и safe `next` redirect contract;
  - rollout нельзя строить на повторном consent для всех пользователей;
  - если после снятия forced-consent обнаружатся пользователи без refresh token, recovery path должен быть явным и локальным, а не через возврат global default к `prompt=consent`.
- Feature-level risks:
  - если перепутать product intent и transport detail, команда может переусложнить задачу новым signup-state без реальной пользы;
  - если hidden recovery path будет неявным или неполным, поддержка начнёт объяснять вручную, почему календари не подтягиваются;
  - если не покрыть auth route тестами, можно незаметно сломать popup callback contract.

## Architecture rules in scope
- Relevant `AP-*`: `AP-012`, `AP-021`, `AP-022`, `AP-023`, `AP-026`, `AP-032`, `AP-039`, `AP-040`, `AP-054`
- Relevant `PP-*`: `PP-017`, `PP-018`, `PP-019`, `PP-020`
- Approved deviations to register or reference:
  - отдельный persisted флаг onboarding/user-stage в MVP не добавляется, потому что текущий продукт уже различает usable first-run по `teamsCount === 0`;
  - temporary compat-поведение `prompt=consent for everyone` должно быть снято, а не сохранено как baseline.

## Plan
- Decomposition:
  - auth contract cleanup: убрать forced-consent из normal flow и добавить hidden recovery mode;
  - auth failure handling: объединить typed Google failure taxonomy, account recovery state и current-user logout orchestration в один executable slice;
  - team safety: отделить foreign-account/team failures от current-user recovery semantics;
  - auth entry UX: обновить CTA и supporting copy на guest surfaces;
  - regression/tests: вынести callback reset и feature-level regression gate в отдельный integration tail.
- Dependency order (human-readable planning view):
  - `TEAMCAL-59` стартует первым и фиксирует auth-entry contract;
  - `TEAMCAL-60` идёт следом и закрывает taxonomy + current-user recovery lifecycle;
  - `TEAMCAL-61` использует classifier из `TEAMCAL-60`, но не пересекается с me/settings ownership;
  - `TEAMCAL-62` опирается на стабильный recovery contract и обновляет только guest surface;
  - `TEAMCAL-63` закрывает callback reset и общий regression gate.
- Preference for the minimum dependency graph needed for safe execution:
  - не вводить новый domain model для signup/login, пока не доказана отдельная продуктовая ценность;
  - опереться на уже существующие механизмы: Auth.js user creation, encrypted account linking и first-run через empty team list.
- Ownership boundaries:
  - auth contract: `implementation/src/infrastructure/auth/*`, `implementation/app/api/auth/*`, `implementation/app/auth/*`;
  - guest UX/copy: `implementation/app/_components/header.tsx`, `implementation/app/_components/home-page-client.tsx`, связанные acceptance tests;
  - recovery UX: `/profile` и/или settings surfaces, где реально проявляется отсутствие Google credentials.
- File reservations:
  - auth contract: `implementation/src/infrastructure/auth/auth-options.ts`, `implementation/app/api/auth/google/handler.ts`, `implementation/app/api/auth/route.test.ts`
  - guest UX: `implementation/app/_components/header.tsx`, `implementation/app/_components/home-page-client.tsx`, `implementation/app/_components/shell-ui.test.tsx`
  - recovery lifecycle: `implementation/app/api/me/settings/*`, `implementation/app/api/me/calendar/*`, `implementation/app/api/teams/[shareId]/availability/get-handler.ts`, соответствующие use-case/tests
- Integration task:
  - `TEAMCAL-63`
- Required implementation task list:
  - `TEAMCAL-59`
  - `TEAMCAL-60`
  - `TEAMCAL-61`
  - `TEAMCAL-62`
  - `TEAMCAL-63`
- Testing strategy:
  - unit/contract tests for `/api/auth/google` normal flow vs hidden recovery mode;
  - UI acceptance checks for updated guest CTA/copy;
  - regression around popup success and auth-state refresh;
  - targeted checks for missing refresh token path so recovery остаётся явным.

## Decisions
- `2026-04-10` — принято решение не делить auth-entry на `Вход` и `Регистрация`, потому что в продукте есть один OAuth provider и отдельный выбор до callback не несёт пользы пользователю.
- `2026-04-10` — primary CTA меняется на `Продолжить с Google`, чтобы не отпугивать новых пользователей формулировкой `Войти`.
- `2026-04-10` — forced-consent в обычном login flow признан продуктово вредным: repeated consent должен жить только в hidden recovery mode.
- `2026-04-10` — решение уточнено: для пользователя не существует отдельного reconnect CTA; hidden recovery mode живёт внутри той же кнопки `Продолжить с Google`.
- `2026-04-10` — MVP не вводит новый persisted onboarding flag, так как first-run уже детектируется через отсутствие команд.

## Tracking
- Feature anchor issue:
  - `TEAMCAL-64` — https://linear.app/meatbags/issue/TEAMCAL-64/feature-anchor-auth-entry-clarity
- Required task set:
  - `TEAMCAL-58`
  - `TEAMCAL-59`
  - `TEAMCAL-60`
  - `TEAMCAL-61`
  - `TEAMCAL-62`
  - `TEAMCAL-63`
- Child task keys:
  - `TEAMCAL-58`
  - `TEAMCAL-59`
  - `TEAMCAL-60`
  - `TEAMCAL-61`
  - `TEAMCAL-62`
  - `TEAMCAL-63`
- Shared packet version: `v3`
- Current owner: `Codex`

## Log
- `2026-04-10 14:25 — Context created from current auth flow audit and product clarification.`
- `2026-04-10 14:55 — PRD, SDD spec and implementation plan added as feature source-of-truth artifacts.`
- `2026-04-10 15:20 — Architecture rule mapping, feature DoD and task authoring contract synced; TEAMCAL-58 created as first task for implementation gate.`
- `2026-04-10 15:45 — Feature decomposed into implementation task set TEAMCAL-59..64 with explicit dependencies, read/apply rule contract and integration tail in TEAMCAL-64.`
- `2026-04-10 16:25 — Task packet reduced to TEAMCAL-59..63; taxonomy и current-user orchestration merged, integration tail moved into TEAMCAL-63, лишний TEAMCAL-64 removed.`
- `2026-04-10 18:08 — Linear mirror synced: TEAMCAL-58..63 created as child issues, feature anchor registered as TEAMCAL-64.`
- `2026-04-10 19:08 — Implementation tasks closed (TEAMCAL-59..63), feature retro recorded.`
