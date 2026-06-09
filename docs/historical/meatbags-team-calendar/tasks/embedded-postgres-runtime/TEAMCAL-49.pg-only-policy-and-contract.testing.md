# Task Testing

Task: `TEAMCAL-49`
Updated: `2026-03-21`

## Context
- Change summary: `PP-018` переведён на `pg-only` runtime с embedded Postgres default; исторические spec references помечены как superseded там, где они конфликтовали с новым курсом.
- Feature dossier: `tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`

## Risk Tier
- Tier: `low`
- Reviewer required: `no`

## Planned Checks
- Self-review согласованности между dossier, `tasks/_policies/project-patterns.md` и историческими db/runtime specs.

## Commands Run
- `rg -n "embedded-postgres-runtime|SQLite default|Postgres optional|pg-only" tasks/_policies/project-patterns.md tasks/nextjs-drizzle-migration/nextjs-drizzle-migration.specs.md tasks/nextjs-cutover/nextjs-cutover.specs.md tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`

## Results
- Новый contract зафиксирован в policy до runtime-изменений.
- Исторические sqlite-default решения не остались скрытым source of truth для текущего data layer.

## Failures
- Не обнаружены.

## Residual Risks
- В historical task artifacts старой migration-фазы остаются упоминания dual-schema/sqlite как часть завершённой истории проекта; они не должны использоваться как текущий source of truth.

## Self Review
- Проверил, что feature dossier, task decomposition и project policy говорят об одном и том же `pg-only` режиме.

## Reviewer Review
- Не требовался для `low` risk tier.

## Exit Decision
- `need_retro`
