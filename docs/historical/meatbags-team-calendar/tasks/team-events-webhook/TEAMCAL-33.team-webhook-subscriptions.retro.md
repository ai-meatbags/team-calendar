# Task Retro

Task: `TEAMCAL-33`
Updated: `2026-04-06`

## Lesson Summary
- Для App Router route tests под dynamic segment path нельзя полагаться на существующие shell-patterns вслепую: nested тест легко оказывается вне основного regression gate, и это обнаруживается слишком поздно, уже на close-out.

## Proposal Type
- `project-patterns`

## Repeatability
- `high`

## Confidence
- `high`

## Recommended Destination
- `tasks/_inbox/retro-inbox.md` как кандидат на правило: все nested App Router route tests должны быть явно включены в основной route test gate или собираться через надёжный discovery path.

## Async Review State
- `pending`
