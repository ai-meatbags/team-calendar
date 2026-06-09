# Task Testing

Task: `TEAMCAL-71`
Updated: `2026-04-11`

## Context
- Change summary: Clean up current team-level webhook settings UX without changing ownership model.
- Feature dossier: `tasks/team-events-webhook/team-events-webhook.feature.md`

## Risk Tier
- Tier: `medium`
- Reviewer required: `yes`

## Planned Checks
- `node --import tsx --test app/_components/team-page/team-page.test.tsx app/_components/team-page/team-page-acceptance.test.ts`
- `node --import tsx scripts/with-default-postgres.ts sh -lc "node --import tsx ./app/api/teams/\[shareId\]/integrations/webhooks/route.test.ts"`
- `npm run build`

## Commands Run
- `node --import tsx --test app/_components/team-page/team-page.test.tsx app/_components/team-page/team-page-acceptance.test.ts`
- `DATABASE_URL='postgres://postgres:postgres@127.0.0.1:54330/teamcal' node --import tsx ./app/api/teams/\[shareId\]/integrations/webhooks/route.test.ts`
- `DATABASE_URL='postgres://postgres:postgres@127.0.0.1:54330/teamcal' npm run build`

## Results
- UI/state acceptance suite passed (`37/37`).
- Team webhook route contract suite passed (`8/8`).
- Production build passed on Next.js App Router surface.

## Failures
- Первый запуск build и route gate параллельно через embedded Postgres упёрся в уже занятый `postmaster.pid`; проверки были повторены последовательно через явный `DATABASE_URL` на уже поднятый локальный Postgres.

## Residual Risks
- Визуальная проверка выполнялась через component/UI tests и build gate, без отдельного ручного браузерного walkthrough на реальном экране.

## Self Review
- New UI kept business logic in `team-settings-webhooks.ts` and only rewired presentation/state exposure.
- Webhook section now renders stable loading, empty, list and provisioning states without verbose prose.
- New shadcn primitives are limited to `Skeleton` and `Switch`; host settings page remains a composition root.

## Reviewer Review
- Не выполнялся отдельным reviewer pass в рамках этого solo change set.

## Exit Decision
- `need_retro`
