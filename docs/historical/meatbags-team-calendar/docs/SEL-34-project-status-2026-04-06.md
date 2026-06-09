# SEL-34 Project Status

Updated: `2026-04-06`

## What the project is
- Team Calendar is a scheduling product with a Next.js App Router runtime.
- The current implementation stack is Auth.js + Drizzle + a single Postgres schema.
- Embedded Postgres is the default self-hosted/local path; external Postgres is supported via `DATABASE_URL`.

## What stage it is in
- The project is past the migration stage and already has a working product/runtime baseline.
- The current concrete product track is team webhook integrations.
- `TEAMCAL-33` is already implemented in code under `implementation/`, not only described in task markdown.

## Evidence used for this conclusion
- Product and process artifacts:
  - `tasks/team-events-webhook/TEAMCAL-33.team-webhook-subscriptions.md`
  - `tasks/team-events-webhook/team-events-webhook.feature.md`
  - `tasks/team-events-webhook/TEAMCAL-33.team-webhook-subscriptions.state.json`
- Implementation evidence:
  - `implementation/app/api/teams/[shareId]/integrations/webhooks/*`
  - `implementation/app/api/booking/*`
  - `implementation/app/_components/team-page/*`
  - `implementation/src/application/usecases/team-webhooks.ts`
  - `implementation/src/domain/team-webhooks.ts`
  - `implementation/drizzle/migrations/0003_team_webhooks.sql`

## What the next task is
- The first execution slice for the team is `TEAMCAL-33` as the integrations MVP.
- `TEAMCAL-34` and `TEAMCAL-35` are not the first build slice; they are later hardening/release work unless a real blocker appears.
- The engineering follow-up was routed to Product Engineer in Paperclip issue `SEL-31`.
