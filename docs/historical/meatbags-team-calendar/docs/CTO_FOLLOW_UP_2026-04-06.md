# CTO Follow-Up — Team Calendar

Updated: `2026-04-06`

## Executive summary
- Team Calendar is on a stable technical base: Next.js App Router, Auth.js, Drizzle, and a single Postgres schema with embedded Postgres as the default self-hosted path.
- The main architectural debt from the old runtime has already been retired; the current risk is not platform churn but fragmented delivery if new product work starts without an explicit release and ownership plan.
- The most concrete near-term product move is the integrations slice: team-level webhook management for `booking.requested`, already framed in `tasks/team-events-webhook/team-events-webhook.feature.md` and anchored in `TEAMCAL-53`.

## Current state

### What is already in place
- Next.js runtime cutover and release gate artifacts are in place.
- The data layer is now `pg-only`, with embedded Postgres for zero-config local or self-hosted runs and `DATABASE_URL` as an external override.
- Core booking, profile, privacy, and team settings flows already have documented task artifacts and regression gates.
- Team-level webhook management has been reframed as a real product slice instead of an env-only integration hack.

### What is still open
- Release discipline still depends on explicit smoke and rollout ownership, not just green tests.
- Open Team Calendar backlog is mixed: there are older UI tasks still sitting open, plus the new integrations roadmap.
- Without an explicit squad split, product-facing work can again compete with platform hardening and release work.

## Recommended engineering plan

### Phase 1: stabilize the release lane
Target: `2026-04-07` to `2026-04-18`

- Reconfirm the release gate in `docs/RELEASE_CHECKLIST.md` against the current runtime and deploy path.
- Close or re-triage stale open items that no longer match the current architecture, especially legacy-era UI tasks.
- Turn the current "someone should release this" state into an owned checklist with a named DRI per rollout.

Exit signal:
- there is one current release path;
- stale backlog is either cancelled, reframed, or explicitly scheduled;
- release ownership is not implicit.

### Phase 2: ship team integrations MVP
Target: `2026-04-14` to `2026-05-02`

- Execute `TEAMCAL-53` as the active feature anchor.
- Keep scope tight: add/delete/toggle team webhook endpoints, owner-only access, booking fan-out, UI status, and kill-switch behavior.
- Do not pull reliable delivery, signatures, JWKS, or setup-token flows into the MVP unless a concrete compliance blocker appears.

Exit signal:
- an owner can configure team webhooks without developer help;
- `booking.requested` reaches all active endpoints with best-effort semantics;
- release notes and regression evidence exist.

### Phase 3: security and delivery hardening
Target: after MVP adoption signal

- Reassess whether outbound signatures, setup token flow, JWKS, or delivery history are actually needed.
- Add them only if they are justified by a real partner integration or a security requirement, not because they are theoretically nice to have.

Exit signal:
- hardening scope is driven by real usage or compliance pressure, not speculative design.

## Squad proposal

### Recommended core squad
- `1` product engineer (full-stack): owns feature delivery from route contracts through UI.
- `1` platform engineer (part-time is enough): owns release gate, deploy path, DB/runtime safety, and production hardening.
- `1` decision owner on product side: owns scope calls, acceptance, and rollout timing.

### Why this shape
- Team Calendar no longer needs a large migration squad; that phase is mostly over.
- The main failure mode now is context switching between product delivery and platform care. A small squad with explicit role boundaries is enough.
- A dedicated QA role is optional if the product engineer and platform engineer jointly own automated gates and a short manual smoke checklist before release.

### Operating model
- Weekly planning around one active feature anchor at a time.
- No parallel product branches unless file ownership and release order are explicit.
- Every release candidate must have one person accountable for smoke, rollback, and closeout notes.

## Immediate next actions
- Treat `TEAMCAL-53` as the current product track.
- Decide whether stale open issues like `TEAMCAL-41`, `TEAMCAL-42`, `TEAMCAL-6`, and `TEAMCAL-7` are still live, need reframing, or should be cancelled.
- Assign one owner for release readiness and one owner for integrations MVP so the product lane and platform lane stop competing for the same attention.
