# Feature Dossier

Feature: `user-integrations-catalog`
Updated: `2026-04-10`

## Context
- Problem: текущая модель интеграций целиком team-scoped и для pre-release продукта уже выглядит как промежуточная, а не целевая. Пользователь, работающий с несколькими командами, вынужден дублировать одинаковые webhook endpoint-ы, а `/profile` вообще не владеет integrations surface.
- Goal: заменить provisional team-only model на каноническую модель `user integration definition -> team webhook binding -> team API token`.
- Desired user/business outcome: пользователь один раз создаёт reusable webhook integration в общих настройках, затем включает её для нужных команд; API tokens остаются только командными.
- Priority: high
- Primary stakeholder or decision owner: Vanya
- Target date (if relevant): следующий product cut по интеграциям после закрытия `team-events-webhook`
- Success metric or acceptance signal for the business outcome: путь `profile integrations -> create once -> team settings -> enable for team` является основным продуктовым потоком; team-only webhook creation path больше не считается каноническим.
- Open questions:
  - что видит второй owner команды, если integration enabled первым owner;
  - нужно ли упрощать provisioning contract team binding относительно текущего team webhook flow;
  - нужен ли список команд на profile page или достаточно usage count.
- Risks:
  - можно случайно смешать `user integration definition`, `team webhook binding` и `team API token` в одну сущность;
  - можно перепутать shared endpoint с shared tenant access;
  - `/profile` сейчас слишком тонкий и без bounded slice может быстро превратиться в oversized host file.
- Edge cases:
  - один пользователь подключает один endpoint к нескольким командам;
  - в одной команде несколько owners с разными user catalogs;
  - user integration удаляется, пока она включена для нескольких команд;
  - team API token выпускается и ротируется независимо от user webhook catalog.
- Stack or architecture uncertainty: нужно заменить текущую provisional ownership model без cargo-cult compatibility layer и при этом не смешать profile surface, team binding surface и team API token surface.
- Recommended next stage: `tasks`

## Spec
- Fixed decisions:
  - user settings получают user-owned integrations catalog;
  - team settings включают user-owned integrations для текущей команды;
  - team-only webhook creation path перестаёт быть канонической моделью;
  - API tokens остаются только в team scope и действуют только для одной команды;
  - reusable endpoint definition не означает shared team credential;
  - все текущие webhook-данные подлежат прямой миграции в новую модель.
- Contracts:
  - `user integration definition` хранит reusable endpoint metadata пользователя;
  - `team webhook binding` включает user integration для конкретной команды и владеет team-level operational state;
  - `team API token` не появляется в user settings и не переиспользуется между командами.
- Acceptance criteria:
  - существует понятный PRD для user-owned catalog и team enablement model;
  - зафиксировано разделение user scope vs team scope;
  - continuation разрешает прямой redesign c полной миграцией текущих данных.
- Non-goals:
  - global API token на пользователя;
  - shared API token across teams;
  - возврат к multi-mode webhook auth;
  - сохранение provisional team-only model как обязательного compatibility слоя.
- Migration or rollout constraints:
  - product-level backward compatibility не требуется;
  - новый implementation path напрямую заменяет текущую provisional model;
  - все существующие webhook-данные мигрируются в новую схему как часть redesign.
- Feature-level risks:
  - если команда увидит только integrations текущего owner-а без объяснения ownership, UX станет неоднозначным;
  - если связать reuse endpoint-а и reuse access credential, team boundary ослабнет;
  - если profile page absorb-нет новый integrations flow без bounded slices, быстро нарушится PP-021.

## Architecture rules in scope
- Relevant `AP-*`: `AP-018`, `AP-019`, `AP-010`, `AP-020`, `AP-021`, `AP-024`, `AP-026`, `AP-032`, `AP-035`, `AP-039`, `AP-040`, `AP-041`, `AP-042`, `AP-043`, `AP-049`, `AP-050`, `AP-051`, `AP-052`, `AP-054`, `AP-061`, `AP-064`, `AP-068`, `AP-069`
- Relevant `PP-*`: `PP-018`, `PP-019`, `PP-021`, `PP-022`, `PP-023`, `PP-024`, `PP-025`, `PP-026`
- Approved deviations to register or reference:
  - pre-release state explicitly allows replacing the current provisional team-only product model instead of preserving it as a compatibility layer.

## Plan
- Decomposition:
  - `TEAMCAL-66` — PRD and ownership-model freeze for user integrations catalog.
  - `TEAMCAL-67` — canonical schema/domain cut and full migration of current webhook data.
  - `TEAMCAL-68` — profile integrations catalog API and UI surface.
  - `TEAMCAL-69` — team binding settings UX and webhook runtime rewrite.
  - `TEAMCAL-70` — team API token boundary and integrations settings split.
- Dependency order (human-readable planning view):
  - close `team-events-webhook` -> freeze canonical ownership model -> `TEAMCAL-67` -> (`TEAMCAL-68` + `TEAMCAL-69`) -> `TEAMCAL-70`.
- Preference for the minimum dependency graph needed for safe execution:
  - сначала сделать schema/domain cut и миграцию текущих данных;
  - затем profile catalog и team binding/runtime можно делать параллельно только при сохранении раздельных write scopes: `/profile` surface у `TEAMCAL-68`, team settings и booking runtime у `TEAMCAL-69`;
  - token boundary split закрывать после стабилизации нового team integrations surface.
- Ownership boundaries:
  - `TEAMCAL-67`: schema, migration, domain contracts, canonical persistence model;
  - `TEAMCAL-68`: `/profile` API/UI и user-owned integrations catalog;
  - `TEAMCAL-69`: team settings enablement UX, binding lifecycle и booking runtime rewrite;
  - `TEAMCAL-70`: team-only API token boundary и финальная информационная архитектура team integrations settings; если token subsystem к этому моменту не существует, задача ограничивается boundary/IA и не изобретает новый backend.
- File reservations:
  - `TEAMCAL-67`: `implementation/src/domain/team-webhooks.ts`, `implementation/src/infrastructure/db/schema*.ts`, `implementation/drizzle/*`, `implementation/src/application/usecases/team-webhooks.ts`
  - `TEAMCAL-68`: `implementation/app/(pages)/profile/*`, `implementation/app/_components/profile-*`, `implementation/app/api/me/settings/*`, new profile integrations modules
  - `TEAMCAL-69`: `implementation/app/_components/team-page/*`, `implementation/app/api/teams/[shareId]/integrations/webhooks/*`, runtime delivery wiring in booking flow
  - `TEAMCAL-70`: team integrations settings composition and any new team API token surface files
- Integration task:
  - `TEAMCAL-69`
- Required implementation task list:
  - `TEAMCAL-66`
  - `TEAMCAL-67`
  - `TEAMCAL-68`
  - `TEAMCAL-69`
  - `TEAMCAL-70`
- Testing strategy:
  - migration/schema tests for canonical model and full data migration;
  - profile route/UI tests for user integrations catalog;
  - team route/UI/runtime tests for enablement and delivery;
  - final build/route gate for App Router surfaces.

## Decisions
- `2026-04-10` — continuation moved out of `team-events-webhook` into separate feature because ownership model changes from team-owned subscriptions to user-owned catalog + team enablement.
- `2026-04-10` — API tokens remain only in team scope and do not migrate to user settings.
- `2026-04-10` — pre-release state means the provisional team-only model may be replaced directly; compatibility-first rollout is not required.
- `2026-04-10` — все текущие webhook-данные подлежат прямой миграции, а не coexistence с legacy моделью.

## Tracking
- Feature anchor issue: `TEAMCAL-65` — `https://linear.app/meatbags/issue/TEAMCAL-65/feature-anchor-polzovatelskie-integracii-i-podklyuchenie-komand`
- Required task set:
  - `TEAMCAL-66`
  - `TEAMCAL-67`
  - `TEAMCAL-68`
  - `TEAMCAL-69`
  - `TEAMCAL-70`
- Child task keys:
  - `TEAMCAL-66`
  - `TEAMCAL-67`
  - `TEAMCAL-68`
  - `TEAMCAL-69`
  - `TEAMCAL-70`
- Shared packet version: `v2`
- Current owner: `Codex`

## Log
- `2026-04-10 18:55 — Context created after closing team-events-webhook and deciding to move continuation into a separate user-owned integrations feature.`
- `2026-04-10 18:55 — Planning scope fixed around user integrations catalog, team enablement and team-only API tokens.`
- `2026-04-10 19:05 — Continuation rewritten as canonical redesign: no product-level backward compatibility requirement for provisional team-only integrations.`
- `2026-04-10 19:18 — Implementation packet generated: schema/domain cut first, then parallel profile catalog and team binding/runtime, then team API token boundary split.`
