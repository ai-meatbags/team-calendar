# Task Retro

Task: `TEAMCAL-50`
Updated: `2026-03-21`

## Lesson Summary
- Embedded Postgres действительно упрощает data layer, но переносит сложность в lifecycle orchestration; regression gate должен включать не только unit tests, но и реальные `migrate/build` прогоны.

## Proposal Type
- `follow-up-task`

## Repeatability
- `high`

## Confidence
- `medium`

## Recommended Destination
- `tasks/_inbox/retro-inbox.md` как follow-up на hardening `scripts/with-default-postgres.ts` для конкурентного локального запуска нескольких команд.

## Async Review State
- `pending`
