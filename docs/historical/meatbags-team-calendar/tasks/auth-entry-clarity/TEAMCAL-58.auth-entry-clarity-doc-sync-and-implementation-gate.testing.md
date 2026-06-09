# Task Testing

Task: `TEAMCAL-58`
Updated: `2026-04-10`

## Context
- Change summary: PRD, feature dossier, SDD-спека и implementation plan для `auth-entry-clarity` синхронизированы по hidden recovery mode, one-button UX, архитектурным правилам и task authoring contract для будущих implementation-задач.
- Feature dossier: `tasks/auth-entry-clarity/auth-entry-clarity.feature.md`

## Risk Tier
- Tier: `low`
- Reviewer required: `no`

## Planned Checks
- Проверить, что implementation plan содержит явный architecture mapping, task contract и feature DoD.
- Проверить, что feature dossier и spec используют тот же набор `AP-*` / `PP-*`.
- Проверить, что новая задача содержит `Applied rules`, `Перед реализацией прочитать`, `Как применять правила` и ссылки на все feature-документы.

## Commands Run
- `rg -n "Архитектурные правила в scope|Карта правил по слайсам|Task authoring contract|Feature DoD / release gate" tasks/auth-entry-clarity/auth-entry-clarity.plan.md`
- `sed -n '1,260p' tasks/auth-entry-clarity/TEAMCAL-58.auth-entry-clarity-doc-sync-and-implementation-gate.md`
- `sed -n '1,160p' tasks/auth-entry-clarity/auth-entry-clarity.state.json`
- `sed -n '1,120p' tasks/auth-entry-clarity/auth-entry-clarity.prd.md`
- `sed -n '1,260p' tasks/auth-entry-clarity/auth-entry-clarity.specs.md`
- `sed -n '1,220p' tasks/auth-entry-clarity/auth-entry-clarity.feature.md`

## Results
- Implementation plan содержит архитектурный mapping по slice-ам, task authoring contract и единый feature DoD / release gate.
- Feature dossier и SDD-спека выровнены по одному набору релевантных `AP-*` / `PP-*`.
- `TEAMCAL-58` содержит явный read/apply contract и ссылается на все feature source-of-truth документы.
- Feature state переведён в стадию `tasks` и ссылается на `TEAMCAL-58` как на первую локальную задачу фичи.

## Failures
- Не обнаружены.

## Residual Risks
- Feature пока не декомпозирована на кодовые `TEAMCAL-*` задачи, поэтому release-ready implementation path ещё не разложен по отдельным write scopes.
- Feature state сейчас содержит только `TEAMCAL-58`; при переходе к реализации required task set нужно будет расширить без потери архитектурного mapping.

## Self Review
- Проверил, что plan не просто перечисляет `AP-*` / `PP-*`, а объясняет их применение к auth/recovery сценарию и заставляет будущие задачи повторять этот contract.

## Reviewer Review
- Не требовался для `low` risk tier.

## Exit Decision
- `need_retro`
