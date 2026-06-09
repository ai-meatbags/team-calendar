# Task Testing

Task: `TEAMCAL-79`
Updated: `2026-04-11`

## Context
- Change summary: onboarding flow changed from post-create global secret reveal to row-scoped draft provisioning with prepare-before-save contract.
- Feature dossier: `tasks/team-events-webhook/team-events-webhook.feature.md`

## Planned Checks
- `node --import tsx --test app/_components/team-page/team-page.test.tsx app/_components/team-page/team-page-acceptance.test.ts`
- `node --import tsx ./app/api/teams/[shareId]/integrations/webhooks/route.test.ts`

## Commands Run
- `cd implementation && node --import tsx --test app/_components/team-page/team-page.test.tsx app/_components/team-page/team-page-acceptance.test.ts`
- `cd implementation && node --import tsx ./app/api/teams/[shareId]/integrations/webhooks/route.test.ts`
- `cd implementation && npx tsc --noEmit`

## Results
- UI/state acceptance suite passed (`38/38`).
- Route suite could not be used as a reliable gate in this environment because local Postgres auth failed before the handlers executed.
- `tsc --noEmit` still reports unrelated pre-existing failures in `src/infrastructure/runtime/port-resolution.test.ts`; no new webhook-flow type errors remained after local fixes.

## Residual Risks
- No browser walkthrough was run after the contract change.
- Route contract should be re-run once the local embedded Postgres lock/auth state is healthy again.

## Exit Decision
- `need_retro`
