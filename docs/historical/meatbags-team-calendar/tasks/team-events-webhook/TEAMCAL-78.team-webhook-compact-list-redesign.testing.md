# Task Testing

Task: `TEAMCAL-78`
Updated: `2026-04-11`

## Context
- Change summary: compact row-based redesign of team-level webhook settings using shadcn-style `Card`, `Dialog`, `AlertDialog`, `Tooltip`, `Alert`.
- Feature dossier: `tasks/team-events-webhook/team-events-webhook.feature.md`

## Risk Tier
- Tier: `medium`
- Reviewer required: `yes`

## Planned Checks
- `node --import tsx --test app/_components/team-page/team-page.test.tsx app/_components/team-page/team-page-acceptance.test.ts`
- `npm run build`

## Commands Run
- `node --import tsx --test app/_components/team-page/team-page.test.tsx app/_components/team-page/team-page-acceptance.test.ts`
- `DATABASE_URL='postgres://postgres:postgres@127.0.0.1:54330/teamcal' npm run build`

## Results
- UI/state acceptance suite passed (`37/37`).
- Production build passed.

## Failures
- Webhook route suite was not a reliable gate in this sandbox pass: localhost Postgres connection attempts failed with `connect EPERM 127.0.0.1:54330`, which is environment-specific and unrelated to the UI refactor.

## Residual Risks
- No separate manual browser walkthrough was run after the redesign.

## Self Review
- Overlay state is now local to row/dialog components instead of being mixed into the shared webhook hook.
- `Audience` and repeated secret/status blocks were removed from the visible UI.
- The section now matches a working integrations list better than the previous card-per-item composition.

## Reviewer Review
- Не выполнялся отдельным reviewer pass в рамках этого solo change set.

## Exit Decision
- `need_retro`
