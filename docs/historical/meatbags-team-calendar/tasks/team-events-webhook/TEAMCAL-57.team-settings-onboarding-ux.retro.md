# Task Retro

Task: `TEAMCAL-57`
Updated: `2026-04-10`

## Lesson Summary
- Если в mature UI-контур вносить новый onboarding flow прямо внутрь существующего host-файла, задача быстро начинает нарушать собственные AP-018 и AP-019. Правильный путь — сначала выделить маленькие business components и только потом дорабатывать copy и interaction states.
- Source-of-truth для project-local skills и правил нельзя путать с запретом использовать внешние Codex skills как reference. Ошибка была не техническая, а процессная: reference guidance допустим, пока он не переопределяет локальные политики и артефакты проекта.

## Proposal Type
- `mixed`

## Repeatability
- `high`

## Confidence
- `high`

## Recommended Destination
- `project-patterns + retro-inbox`

## Async Review State
- `pending`
