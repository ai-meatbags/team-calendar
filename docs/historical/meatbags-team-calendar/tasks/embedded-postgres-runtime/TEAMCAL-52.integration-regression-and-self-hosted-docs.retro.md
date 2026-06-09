# Task Retro

Task: `TEAMCAL-52`
Updated: `2026-03-21`

## Lesson Summary
- Полный `next build` обязателен в release gate для App Router: unit tests не ловят невалидные route exports и часть Next-specific type regressions.

## Proposal Type
- `project-patterns`

## Repeatability
- `high`

## Confidence
- `high`

## Recommended Destination
- `tasks/_inbox/retro-inbox.md` как кандидат на явное правило build-gate и ограничение export surface в `route.ts`.

## Async Review State
- `pending`
