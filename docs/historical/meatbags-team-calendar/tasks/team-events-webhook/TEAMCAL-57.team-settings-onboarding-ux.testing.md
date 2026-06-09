# Task Testing

Task: `TEAMCAL-57`
Updated: `2026-04-10`

## Context
- Change summary: team settings webhook section пересобрана в onboarding-first flow. В `implementation/app/_components/team-page/*` появился отдельный webhook feature slice, а в `implementation/components/ui/*` — минимальный shadcn-like base layer (`Button`, `Input`, `Card`, `Badge`) вместо дальнейшего ad-hoc JSX внутри `team-page-client.tsx`.
- Feature dossier: `tasks/team-events-webhook/team-events-webhook.feature.md`

## Risk Tier
- Tier: `medium`
- Reviewer required: `no`

## Planned Checks
- Проверить, что UI helper contract покрывает create/toggle/delete/rotate endpoints.
- Проверить, что новый webhook section рендерит empty onboarding state.
- Проверить, что one-time provisioning panel и destructive confirm state отображаются отдельно от subscription list.
- Проверить, что owner route contract не сломался после UI-рефакторинга и расширения client surface.

## Commands Run
- `node --import tsx --test app/_components/team-page/team-page.test.tsx app/_components/team-page/team-page-acceptance.test.ts`
- `node --import tsx scripts/with-default-postgres.ts sh -lc "node --import tsx ./app/api/teams/\[shareId\]/integrations/webhooks/route.test.ts"`

## Results
- `team-page-client.tsx` перестал владеть webhook onboarding logic напрямую; вместо этого section собран из маленьких business components.
- Action-layer acceptance tests теперь покрывают `rotate` endpoint наряду с create/toggle/delete.
- Static UI tests подтверждают empty onboarding state и безопасный one-time provisioning panel.
- Owner route suite остаётся зелёной после UI-слоя и нового minimal `components/ui` foundation.

## Failures
- Первый UI прогон упал из-за отсутствия явного `React` import в новых TSX-файлах; после добавления импортов повторный прогон прошёл успешно.

## Residual Risks
- `Как проверить JWT` пока остаётся pending entry point с toast-сообщением, потому что runtime docs page ещё не реализована в `TEAMCAL-56`.
- `team-page-hooks.ts` и `team-page-client.tsx` как legacy host files всё ещё больше желаемого лимита; задача не ухудшила это, но долг остаётся.

## Self Review
- Проверил, что plaintext secret остаётся только в transient provisioning card и не смешан со списком subscriptions.
- Проверил, что UI не предлагает auth-mode zoo и ведёт owner по одному blessed path.
- Проверил, что новый component layer отражает AP-064/068 на минимально достаточном уровне и не требует полного registry rollout.

## Reviewer Review
- Отдельный reviewer не привлекался.

## Exit Decision
- `need_retro`
