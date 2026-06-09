# Task Testing

Task: `TEAMCAL-66`
Updated: `2026-04-10`

## Context
- Change summary: continuation after `team-events-webhook` is formalized as a separate feature `user-integrations-catalog`. Written artifacts: feature dossier, feature state, planning task packet and PRD in `docs/user-integrations-catalog-prd.md`.
- Feature dossier: `tasks/user-integrations-catalog/user-integrations-catalog.feature.md`

## Risk Tier
- Tier: `low`
- Reviewer required: `no`

## Planned Checks
- Проверить, что новый PRD не смешивает user scope и team scope.
- Проверить, что API tokens зафиксированы как team-only.
- Проверить, что continuation оформлена отдельной feature, а не допиской в `team-events-webhook`.
- Проверить, что pre-release state явно разрешает прямой redesign без product-level backward compatibility.

## Commands Run
- `rg -n "integrations/webhooks|team-webhook|audience|API token|profile" implementation/app implementation/src`
- `sed -n '1,260p' docs/team-events-webhook-jwt-prd.md`
- `sed -n '1,320p' implementation/app/_components/profile-page-client.tsx`

## Results
- Подтверждено, что shipped integrations path сейчас team-only.
- Подтверждено, что `/profile` пока не содержит integrations surface и поэтому continuation требует отдельного feature slice.
- PRD фиксирует product decision: reusable endpoint definition живёт в user scope, team enablement и API access остаются team-scoped.
- PRD также фиксирует, что provisional team-only model не требует compatibility preservation, потому что продукт ещё pre-release.

## Failures
- Автоматических runtime checks не запускалось: задача planning-only и меняет только docs/task artifacts.

## Residual Risks
- Остаётся open question по multi-owner teams: что именно видит второй owner в team settings.
- Остаётся открытым вопрос, reuse-ит ли новая team binding model текущий provisioning contract без изменений.

## Self Review
- Проверил, что PRD не тянет compatibility burden без реальной продуктовой необходимости.
- Проверил, что API tokens остаются только на командном уровне во всех артефактах.
- Проверил, что user-level catalog не описан как глобальный access credential.

## Reviewer Review
- Отдельный reviewer не привлекался.

## Exit Decision
- `need_retro`
