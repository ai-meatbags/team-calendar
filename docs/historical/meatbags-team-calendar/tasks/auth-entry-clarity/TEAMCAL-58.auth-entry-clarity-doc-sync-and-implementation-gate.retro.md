# Task Retro

Task: `TEAMCAL-58`
Updated: `2026-04-10`

## Lesson Summary
- Если feature доходит до PRD/spec/plan стадии без явного mapping `AP-*` / `PP-*` и без task authoring contract, последующая декомпозиция почти неизбежно начинает дрейфовать: задачи перечисляют правила формально или забывают их совсем.
- Если task packet для `local+linear` зеркала декомпозирован слишком мелко до стабилизации ownership boundaries, потом приходится переименовывать и схлопывать задачи уже после синка с Linear. Это лишняя координационная стоимость без продуктовой ценности.

## Proposal Type
- `project-patterns`

## Repeatability
- `high`

## Confidence
- `high`

## Recommended Destination
- `tasks/_inbox/retro-inbox.md` как кандидат на правило: для feature в стадии `plan` implementation plan обязан содержать architecture-rule mapping по slice-ам, feature DoD и task authoring contract с секциями `Applied rules`, `Перед реализацией прочитать`, `Как применять правила`.
- `tasks/_inbox/retro-inbox.md` как кандидат на правило: перед первым sync в Linear feature packet должен быть стабилизирован по clean write scopes; если две задачи делят один application boundary или одну интеграционную ответственность, их нужно схлопнуть локально до mirror-создания.

## Async Review State
- `pending`
