# Task Retro

Task: `TEAMCAL-54`
Updated: `2026-04-10`

## Lesson Summary
- Для security-sensitive schema cuts нельзя принимать `drizzle-kit generate` как готовую migration truth: на существующей таблице он легко генерирует `ADD COLUMN ... NOT NULL` без backfill semantics, что ломает cutover и маскирует реальную миграционную работу.

## Proposal Type
- `project-patterns`

## Repeatability
- `high`

## Confidence
- `high`

## Recommended Destination
- `tasks/_inbox/retro-inbox.md` как кандидат на правило: все generated migrations с новыми non-null security columns на существующих таблицах требуют ручной проверки/backfill plan до merge.

## Async Review State
- `pending`
