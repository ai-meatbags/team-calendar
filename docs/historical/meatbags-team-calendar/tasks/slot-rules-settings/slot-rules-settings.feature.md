# Feature Dossier

Feature: `slot-rules-settings`
Updated: `2026-04-11`

## Context
- Problem: правила показа слотов и минимального окна бронирования захардкожены в availability/runtime и частично продублированы в UI, а пользователь не может управлять ими как персональными ограничениями.
- Goal: перевести slot rules в персональную модель с personal defaults, team-scoped personal overrides и агрегированным team/public summary.
- Desired user/business outcome: каждый участник управляет своими правилами, а команда видит итог пересечения этих правил без отдельного team-wide конфига.
- Priority: high
- Primary stakeholder or decision owner: Vanya
- Target date (if relevant): ближайший product cut по booking/settings surface
- Success metric or acceptance signal for the business outcome: `/profile`, team settings и public slot summary используют один канонический slot-rules contract без hardcoded fallback.
- Open questions:
  - нужен ли follow-up warning для collapsed work window;
  - нужно ли позже показывать вклад отдельных участников в team aggregate.
- Risks:
  - случайно вернуть team-wide editable settings;
  - развести team settings aggregate и public runtime aggregate;
  - смешать identity tables и slot-rules bounded context.
- Edge cases:
  - member filter на public page;
  - runtime member set меньше полного состава команды;
  - существующие пользователи без settings rows до миграции.
- Stack or architecture uncertainty: feature затрагивает schema, routes, use-cases, profile UI, team settings UI и availability runtime, поэтому это полноценный feature-path.
- Recommended next stage: `finish`

## Spec
- Fixed decisions:
  - settings персональные, не командные;
  - personal defaults живут в отдельной таблице;
  - team personal overrides живут в отдельной таблице;
  - override хранится как полный record;
  - reset удаляет override целиком;
  - team settings aggregate считается по всем участникам команды;
  - public page aggregate считается по runtime member set;
  - aggregation contract: `days=max`, `start=max`, `end=min`, `notice=max`.
- Contracts:
  - effective member settings in team = `team override row` or `user defaults row`;
  - public summary и availability slots используют один runtime member set;
  - editable team-wide slot settings не существует.
- Acceptance criteria:
  - у профиля есть editable personal defaults;
  - у team settings есть editable мои настройки и read-only итог команды;
  - runtime больше не зависит от hardcoded slot-rule constants как source of truth.
- Non-goals:
  - timezone settings;
  - slot duration settings;
  - partial field reset;
  - active/inactive members model.
- Migration or rollout constraints:
  - нужна миграция для backfill defaults;
  - user registration flow должен создавать defaults row.
- Feature-level risks:
  - inconsistent aggregates between config and runtime;
  - UI ambiguity if team settings and public page are not clearly separated by purpose.

## Architecture rules in scope
- Relevant `AP-*`: `AP-012`, `AP-013`, `AP-018`, `AP-019`, `AP-020`, `AP-021`, `AP-022`, `AP-023`, `AP-026`, `AP-032`, `AP-033`, `AP-039`, `AP-040`, `AP-041`, `AP-051`, `AP-052`, `AP-054`
- Relevant `PP-*`: `PP-018`, `PP-019`, `PP-021`, `PP-022`, `PP-023`, `PP-025`, `PP-026`
- Approved deviations to register or reference:
  - нет

## Plan
- Decomposition:
  - `TEAMCAL-75` — canonical slot-rules schema, defaults backfill and aggregation contract.
  - `TEAMCAL-76` — profile defaults and personal team override settings surfaces.
  - `TEAMCAL-77` — availability runtime cutover and dynamic public summary.
- Dependency order (human-readable planning view):
  - `TEAMCAL-75` -> `TEAMCAL-76` -> `TEAMCAL-77`
- Preference for the minimum dependency graph needed for safe execution:
  - нельзя делать settings surfaces до фиксации schema/aggregation contract.
- Ownership boundaries:
  - `TEAMCAL-75` владеет schema/domain/use-case contract;
  - `TEAMCAL-76` владеет profile/team settings UI/API wiring;
  - `TEAMCAL-77` владеет public runtime cutover и regression gate.
- File reservations:
  - `implementation/src/infrastructure/db/schema*.ts`
  - `implementation/drizzle/*`
  - `implementation/src/domain/slot-rules/*`
  - `implementation/src/application/usecases/*`
  - `implementation/app/api/me/settings/*`
  - `implementation/app/api/teams/[shareId]/*`
  - `implementation/app/_components/profile-*`
  - `implementation/app/_components/team-page/*`
- Integration task:
  - `TEAMCAL-77`
- Required implementation task list:
  - `TEAMCAL-75`
  - `TEAMCAL-76`
  - `TEAMCAL-77`
- Testing strategy:
  - route/use-case tests на defaults, overrides, reset и aggregation;
  - next-ui tests на profile/team/public surfaces;
  - честный build gate.

## Decisions
- `2026-04-11` — owner-centric fallback discarded; slot rules are personal and aggregated.
- `2026-04-11` — slot rules move into separate tables, not into `users`.
- `2026-04-11` — team overrides are full per-member records with whole-reset semantics.

## Tracking
- Feature anchor issue:
- Required task set:
  - `TEAMCAL-75`
  - `TEAMCAL-76`
  - `TEAMCAL-77`
- Child task keys:
  - `TEAMCAL-75`
  - `TEAMCAL-76`
  - `TEAMCAL-77`
- Shared packet version: `v2`
- Blessed runtime cut path: `TEAMCAL-75 -> TEAMCAL-76 -> TEAMCAL-77`
- Current owner: `Codex`

## Log
- `2026-04-11 14:55 — Initial packet created around hardcoded slot rules extraction.`
- `2026-04-11 15:12 — Owner-centric inheritance removed after clarifying product model.`
- `2026-04-11 15:25 — PRD/SDD/feature packet rebuilt around personal defaults, team personal overrides and aggregate-by-members contract.`
- `2026-04-11 15:37 — Added TEAMCAL-76 as the next implementation slice for profile defaults and team personal settings surfaces, with explicit references back to PRD/specs/plan and dependency on TEAMCAL-75.`
- `2026-04-11 16:20 — Implementation plan and task packet strengthened with explicit AP/PP mapping, dev-plan read gate and live TEAMCAL-77 integration task.`
- `2026-04-11 17:05 — Feature implemented end-to-end: schema + backfill + startup migrations, profile defaults and team personal override surfaces, dynamic availability/public summary cutover, separate team settings page, and final profile UI consolidation into one card matching team-page design.`
