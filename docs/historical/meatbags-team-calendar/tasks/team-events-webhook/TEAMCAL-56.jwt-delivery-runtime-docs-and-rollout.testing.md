# Task Testing

Task: `TEAMCAL-56`
Updated: `2026-04-10`

## Context
- Change summary: outbound team webhook delivery теперь подписывается per-delivery JWT Bearer через `HS256`, transport добавляет `X-Teamcal-*` headers, payload получает `eventId` и `deliveryId`, а в рантайме появилась docs page `/docs/team-webhooks` с одним blessed verification flow для n8n и обычного backend-а.
- Feature dossier: `tasks/team-events-webhook/team-events-webhook.feature.md`

## Risk Tier
- Tier: `high`
- Reviewer required: `yes`

## Planned Checks
- Проверить JWT helper на claims, `HS256` signature и required headers.
- Проверить booking route regression: best effort, fan-out, kill switch и cutover_required subscriptions.
- Проверить owner webhook route suite после runtime/docs wiring.
- Проверить, что UI/docs entry point и docs content включены в repo-native `test:unit` gate.

## Commands Run
- `npm run test:unit:runtime`
- `npm run test:unit:next-ui`
- `node --import tsx scripts/with-default-postgres.ts sh -lc "node --import tsx --test 'app/api/booking/route.test.ts'"`
- `node --import tsx scripts/with-default-postgres.ts sh -lc "node --import tsx ./app/api/teams/\[shareId\]/integrations/webhooks/route.test.ts"`
- `npm run test:unit`

## Results
- JWT helper подтверждает fixed claims contract: `iss=teamcal`, `aud`, `sub`, `jti`, `iat`, `exp`, `evt`.
- Delivery transport всегда отправляет `Authorization`, `X-Teamcal-Event`, `X-Teamcal-Event-Id`, `X-Teamcal-Delivery-Id`, `X-Teamcal-Timestamp`.
- `sendTeamBookingWebhooks` теперь:
  - генерирует единый `eventId` на fan-out
  - генерирует отдельный `deliveryId` на попытку
  - не отправляет outbound request для legacy cutover subscriptions без валидного секрета
  - помечает такие subscriptions как `failed` с понятной причиной cutover
- Settings UI больше не использует placeholder toast для guide entry point; ссылка ведёт на реальный route `/docs/team-webhooks`.
- Docs page и JWT runtime tests включены в стандартный `npm run test:unit` gate, а не живут только как manual checks.

## Failures
- Параллельный запуск двух embedded Postgres suites один раз упёрся в известный harness race (`postmaster.pid is empty` / shared port `54330`); повторный последовательный запуск прошёл успешно и не указывал на баг в фиче.

## Residual Risks
- `team-page-hooks.ts` и `team-page-client.tsx` всё ещё несут legacy size debt, хотя сама webhook feature уже вынесена в sibling slice.
- Docs page сейчас покрывает blessed path и rollout note, но не даёт language-specific ready-made snippets кроме одного backend pseudo-code примера.
- Отдельный reviewer в рамках этого single-agent прохода не привлекался, хотя risk tier формально `high`.

## Self Review
- Проверил, что signing и transport contract не размазаны по booking route: route только wire-ит runtime deps.
- Проверил, что legacy cutover path не silently skip-ается, а оставляет owner-у диагностируемый `last_error`.
- Проверил, что docs route не дублирует альтернативные auth modes и не конфликтует с frozen spec.

## Reviewer Review
- Отдельный reviewer не привлекался в рамках этого single-agent прохода.

## Exit Decision
- `need_retro`
