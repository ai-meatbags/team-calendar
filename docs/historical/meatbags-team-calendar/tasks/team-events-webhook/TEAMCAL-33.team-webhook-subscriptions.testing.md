# Task Testing

Task: `TEAMCAL-33`
Updated: `2026-04-06`

## Context
- Change summary: team-level webhook management shipped end-to-end через schema/migration, owner-only API, booking fan-out delivery, env kill switch и UI-раздел `Интеграции и вебхуки`.
- Feature dossier: `tasks/team-events-webhook/team-events-webhook.feature.md`

## Risk Tier
- Tier: `medium`
- Reviewer required: `yes`

## Planned Checks
- Проверить owner-only route contracts для списка, add, toggle и delete.
- Проверить booking fan-out delivery, ignore disabled webhook-ов и env kill switch.
- Проверить UI acceptance на add/toggle/delete и клиентский state contract.

## Commands Run
- `DATABASE_URL='postgres://postgres:postgres@127.0.0.1:54330/teamcal' npm run test:unit:next-routes`
- `npm run test:unit:next-ui`
- `DATABASE_URL='postgres://postgres:postgres@127.0.0.1:54330/teamcal' node --import tsx ./app/api/teams/\[shareId\]/integrations/webhooks/route.test.ts`

## Results
- Route contracts проходят для owner list/add/toggle/delete и non-owner read denial.
- Booking path подтверждает fan-out только по `active` webhook-ам, best-effort поведение и kill switch без поломки `200` на booking.
- UI acceptance покрывает trim/validation create submission и корректные API paths для add/toggle/delete.
- Основной `test:unit:next-routes` обновлён так, чтобы nested webhook route test реально входил в штатный regression gate проекта.

## Failures
- Изначально новый webhook route test не входил в `test:unit:next-routes`, потому что существующий список/паттерн не покрывал nested dynamic path; gate исправлен в `package.json`.
- Изначально один ассерт в route test сравнивал строковый `COUNT(*)` как число; тест исправлен через явное `Number(...)`.

## Residual Risks
- Delivery по-прежнему intentionally best-effort: без retry/outbox и без delivery history, что соответствует текущему scope `TEAMCAL-33`.
- Route regression gate всё ещё поддерживается явным списком файлов; при добавлении новых глубоко вложенных route tests этот список нельзя оставлять без обновления.

## Self Review
- Проверил, что новый webhook slice не обходит Next/pg-only границы, не тащит бизнес-логику в client-only слой и не полагается на product-state в env kill switch.

## Reviewer Review
- Отдельный reviewer не привлекался в рамках этого single-agent прохода.

## Exit Decision
- `need_retro`
