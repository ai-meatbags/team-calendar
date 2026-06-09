# Task Testing

Task: `TEAMCAL-55`
Updated: `2026-04-10`

## Context
- Change summary: owner webhook management surface теперь возвращает stable provisioning contract: read path даёт `audience`, `secretStatus`, `requiresProvisioning`, `secretLastRotatedAt`; create и rotate возвращают one-time provisioning result с plaintext secret; explicit reveal endpoint не добавлялся.
- Feature dossier: `tasks/team-events-webhook/team-events-webhook.feature.md`

## Risk Tier
- Tier: `high`
- Reviewer required: `yes`

## Planned Checks
- Проверить domain helpers для `secretStatus`.
- Проверить owner webhook route contracts на list/create/rotate/delete/toggle.
- Проверить booking regression после изменений в общем webhook use-case файле.
- Проверить, что team-page state/helpers не ломаются после расширения DTO.

## Commands Run
- `node --import tsx --test src/domain/team-webhooks.test.ts`
- `node --import tsx scripts/with-default-postgres.ts sh -lc "node --import tsx ./app/api/teams/\[shareId\]/integrations/webhooks/route.test.ts"`
- `node --import tsx scripts/with-default-postgres.ts sh -lc "node --import tsx --test 'app/api/booking/route.test.ts'"`
- `node --import tsx --test app/_components/team-page/team-page.test.tsx app/_components/team-page/team-page-acceptance.test.ts`

## Results
- Read model больше не ограничен basic CRUD: list response даёт `audience`, `secretStatus`, `requiresProvisioning`, `secretLastRotatedAt` без утечки plaintext secret.
- Create response возвращает one-time provisioning block с `sharedSecret`, `audience`, `secretVisibleOnce`.
- Rotate route добавлен как отдельный command path и сохраняет identity subscription, меняя только secret lifecycle.
- Legacy subscriptions с placeholder secret читаются как `cutover_required`, а после rotate переходят в `configured`.
- Booking regression и team-page helper tests проходят после расширения webhook DTO.

## Failures
- Первый прогон owner route suite один раз упёрся в noisy embedded Postgres startup (`postmaster.pid is empty` на дефолтном порту); повторный запуск через тот же wrapper-контур прошёл успешно.

## Residual Risks
- В UI ещё не реализован actual onboarding flow для one-time provisioning result; это остаётся scope `TEAMCAL-57`.
- Отдельный reviewer в рамках этого single-agent прохода не привлекался, хотя risk tier формально `high`.

## Self Review
- Проверил, что plaintext secret не попадает в read/list/toggle/delete contract и доступен только на create/rotate.
- Проверил, что `rotate` оформлен как отдельный command route, а не как скрытый branch внутри list/update path.
- Проверил, что feature/spec/PRD синхронизированы с решением “no explicit reveal endpoint after create/rotate”.

## Reviewer Review
- Отдельный reviewer не привлекался в рамках этого single-agent прохода.

## Exit Decision
- `need_retro`
