# Feature Dossier

Feature: `embedded-postgres-runtime`
Updated: `2026-03-21`

## Context
- Problem: текущий data layer поддерживает `sqlite` и `pg` одновременно, из-за чего схема, миграции, тестовые фикстуры и runtime bootstrap дублируются.
- Goal: перевести проект на единый `pg-only` data layer с embedded Postgres по умолчанию для zero-config self-hosted сценария.
- Desired user/business outcome: self-hosted шаблон поднимается без ручной установки внешней БД, а команда разработки поддерживает одну схему, один набор миграций и один тестовый контур.
- Priority: high
- Primary stakeholder or decision owner: Vanya
- Target date (if relevant): ближайший релиз до первого production rollout
- Success metric or acceptance signal for the business outcome: в проекте больше нет `sqlite` runtime/test paths; приложение стартует без `DATABASE_URL` на embedded Postgres и переключается на внешний Postgres только через `DATABASE_URL`.
- Open questions:
  - какой embedded Postgres bootstrap выбран как дефолтная реализация для этого проекта;
  - какой каталог данных и lifecycle считаются стандартом для self-hosted режима;
  - как оформляется startup failure для embedded режима, чтобы пользователь понимал, как переключиться на внешний Postgres.
- Risks:
  - embedded Postgres добавляет lifecycle management процесса и data dir ownership;
  - неудачный bootstrap может ухудшить DX сильнее, чем текущий sqlite fallback;
  - вынос `sqlite` затрагивает shared `src/infrastructure/db/*`, tests, scripts и docs.
- Edge cases:
  - `DATABASE_URL` задан, но недоступен;
  - embedded data dir уже существует, но повреждён или несовместим по версии;
  - CI/preview окружения без persistent FS должны явно работать через внешний Postgres.
- Stack or architecture uncertainty: выбор конкретной embedded Postgres реализации и границы её ответственности относительно Next runtime.
- Recommended next stage: finish

## Spec
- Fixed decisions:
  - `sqlite` удаляется из runtime, схем, миграций, тестов, scripts и env defaults;
  - проект становится `pg-only` на уровне Drizzle/Auth.js/data layer;
  - embedded Postgres становится дефолтным локальным/self-hosted backend, если `DATABASE_URL` не задан;
  - внешний Postgres остаётся supported path через `DATABASE_URL`;
  - миграция данных из `sqlite` не нужна, потому что production на `sqlite` ещё не существует.
- Contracts:
  - приложение запускается без `DATABASE_URL` и поднимает рабочий Postgres backend через встроенный bootstrap;
  - при заданном `DATABASE_URL` embedded bootstrap не стартует и приложение использует внешний Postgres;
  - `src/infrastructure/db/*` предоставляет один pg-only контракт без dialect selector и dual schema;
  - Drizzle migrations, tests и operational docs используют только Postgres-контур.
- Acceptance criteria:
  - в runtime и test support больше нет `better-sqlite3`, `schema-sqlite`, `drizzle.config.sqlite.ts`, parity-check и sqlite-specific branches;
  - `createDbClient` и связанный bootstrap работают только с Postgres-контуром;
  - self-hosted запуск без `DATABASE_URL` документирован и проходит smoke path;
  - внешний `DATABASE_URL` остаётся рабочим без дополнительных кодовых флагов;
  - unit/contract checks обновлены под pg-only контур.
- Non-goals:
  - миграция существующих sqlite данных;
  - поддержка нескольких SQL dialect одновременно;
  - возврат к sqlite fallback для локальной разработки.
- Migration or rollout constraints:
  - переход допускается как breaking change для pre-prod стадии;
  - rollout документация должна явно сказать, что поддерживаются только embedded/external Postgres режимы.
- Feature-level risks:
  - выбранная embedded Postgres реализация может усложнить packaging или CI;
  - тесты могут стать медленнее или нестабильнее, если fixture lifecycle будет собран небрежно;
  - policy/docs могут разъехаться с фактическим runtime, если first task не обновит source of truth.

## Architecture rules in scope
- Relevant `AP-*`: `AP-010`, `AP-012`, `AP-018`, `AP-020`, `AP-021`, `AP-024`, `AP-027`, `AP-028`, `AP-033`
- Relevant `PP-*`: `PP-018`, `PP-019`
- Approved deviations to register or reference:
  - требуется обновить `PP-018`, потому что текущее правило и историческая migration spec фиксируют устаревшее решение `SQLite default + Postgres optional`;
  - дополнительных baseline deviations сверх обновления `PP-018` пока не требуется.

## Plan
- Decomposition:
  - `TEAMCAL-49` — обновить process/policy source of truth под `pg-only` и зафиксировать новый runtime contract;
  - `TEAMCAL-50` — реализовать embedded Postgres bootstrap и свернуть DB client/schema на единый pg-only path;
  - `TEAMCAL-51` — удалить sqlite test/scripts surface и перевести fixture/test matrix на Postgres;
  - `TEAMCAL-52` — закрыть integration/docs/release gate для self-hosted и external Postgres override.
- Dependency order (human-readable planning view):
  - `TEAMCAL-49` -> `TEAMCAL-50` -> `TEAMCAL-51` -> `TEAMCAL-52`
- Preference for the minimum dependency graph needed for safe execution:
  - держать выполнение в основном последовательным, потому что `src/infrastructure/db/*`, `package.json` и db scripts являются shared ownership зонами;
  - разрешать параллельность только после стабилизации bootstrap contract и file reservations.
- Ownership boundaries:
  - `TEAMCAL-49`: source-of-truth artifacts и policy update;
  - `TEAMCAL-50`: runtime bootstrap, db infrastructure и env resolution;
  - `TEAMCAL-51`: tests, scripts, migrations cleanup;
  - `TEAMCAL-52`: integration verification, docs и release messaging.
- File reservations:
  - `TEAMCAL-49`: `tasks/embedded-postgres-runtime/*`, `tasks/_policies/project-patterns.md`
  - `TEAMCAL-50`: `src/infrastructure/db/*`, `src/ports/db.ts`, `package.json`, `drizzle.config.*`, env bootstrap modules
  - `TEAMCAL-51`: `app/api/test-support/*`, `app/api/**/*.test.ts`, `src/infrastructure/**/*.test.ts`, `scripts/*`, `drizzle/*`, `package.json`
  - `TEAMCAL-52`: `.env.example`, `README.md`, `docs/*`, final task/testing artifacts
- Integration task: `TEAMCAL-52`
- Required implementation task list:
  - `TEAMCAL-49`
  - `TEAMCAL-50`
  - `TEAMCAL-51`
  - `TEAMCAL-52`
- Testing strategy:
  - task-level unit coverage for bootstrap resolution and pg-only client behavior;
  - pg-backed route fixtures for API contracts;
  - smoke verification of zero-config embedded start and `DATABASE_URL` override path;
  - release/docs check that self-hosted instructions match actual runtime bootstrap.

## Decisions
- `2026-03-21` — принято решение перейти на `pg-only` data layer, убрать `sqlite` полностью и считать embedded Postgres дефолтным self-hosted режимом с override через `DATABASE_URL`.
- `2026-03-21` — принято решение не поддерживать миграцию данных из `sqlite`, так как production на `sqlite` ещё не существует.

## Tracking
- Feature anchor issue: `TEAMCAL-48` — `https://linear.app/meatbags/issue/TEAMCAL-48/pg-only-data-layer-embedded-postgres-po-umolchaniyu`
- Required task set:
  - `TEAMCAL-49`
  - `TEAMCAL-50`
  - `TEAMCAL-51`
  - `TEAMCAL-52`
- Child task keys:
  - `TEAMCAL-49`
  - `TEAMCAL-50`
  - `TEAMCAL-51`
  - `TEAMCAL-52`
- Shared packet version: `v1`
- Current owner: `Codex`

## Log
- `2026-03-21 00:35 — Context created.`
- `2026-03-21 00:35 — Feature path confirmed: pg-only runtime with embedded Postgres default and external Postgres override via DATABASE_URL.`
- `2026-03-21 00:42 — Local+Linear sync created: feature anchor TEAMCAL-48 and child tasks TEAMCAL-49..TEAMCAL-52.`
- `2026-03-21 00:49 — TEAMCAL-49 started: project policy and historical spec references are being updated before runtime changes.`
- `2026-03-21 01:02 — TEAMCAL-50 started: pg-only client/runtime defaults and process wrapper for embedded Postgres are being introduced.`
- `2026-03-21 01:04 — TEAMCAL-49 completed: policy and historical source-of-truth artifacts now point to pg-only runtime.`
- `2026-03-21 01:04 — TEAMCAL-50 completed: embedded Postgres default and single pg-only DB runtime shipped.`
- `2026-03-21 01:04 — TEAMCAL-51 completed: Postgres fixtures/scripts replaced sqlite-specific test and migration surface.`
- `2026-03-21 01:04 — TEAMCAL-52 completed: docs, regression gate and release-facing operational path aligned with embedded/external Postgres.`
- `2026-03-21 01:04 — Feature finished locally with feature retro and retro inbox follow-ups recorded.`
