# Architecture Context Map - Phase 1 Private Teams And Membership Lifecycle

Дата: 2026-05-20  
Feature key: `phase-1-private-teams-membership-lifecycle`  
Product source of truth: `team-calendar-product-prd-production-rf-ready.md`, версия `2026-05-19`  
Process note: `project-tracker` и `task-tracker` считаются устаревшими для этой работы. Этот arch-loop artifact живёт отдельно от `tasks/*`.
Skills applied: `arch-rules-context`, `arch-rules-slice-planning`, `superpowers:using-superpowers`, `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:verification-before-completion`.

## Source Docs

- Product PRD: `team-calendar-product-prd-production-rf-ready.md`, sections 11, 12, 13, 15.
- Repo architecture: `docs/ARCHITECTURE.md`.
- API contracts: `docs/API_CONTRACTS.md`.
- Security baseline: `docs/SECURITY.md`.
- Local implementation rules: `AGENTS.md`, `tasks/_policies/arch-patterns.md`, `tasks/_policies/project-patterns.md`.
- Current runtime contour: `implementation/app/*`, `implementation/src/*`, `implementation/drizzle/*`.

## Stage

`prod`.

Reason: PRD target is first production-ready launch. Phase 1 changes authz, membership, invite secrets, email delivery state, consent capture and ownership control.

## Product Intent Locked From PRD

Owner creates a private team, invites members, invitees accept after sign-in, role boundaries are visible, members can leave or be removed, owner can transfer ownership, private onboarding works without public join, and owner control survives every lifecycle action.

Phase 1 also creates the minimum support surface needed for later P0 phases: active membership filtering for availability, invite acceptance consent evidence, membership audit events, and admin-visible invite delivery status.

## Critical AP Gates

- `AP-012` - fail-fast and explicit error contracts for invalid invites, expired tokens, role violations and ownership conflicts.
- `AP-013` - user data integrity for membership, invite email, consent evidence and ownership transfer.
- `AP-016` - trusted security boundary for invite tokens, role checks and team object access.
- `AP-020` - Clean Architecture boundaries: domain rules in `src/domain/team-membership/*`, use-cases in `src/application/usecases/*`, transport in route handlers.
- `AP-021` - thin Next route handlers: auth, same-origin, params, body parse, use-case call, response mapping.
- `AP-022` - typed errors for invalid token, expired token, revoked invite, email mismatch, duplicate invite, forbidden role action.
- `AP-023` - awaited async work; invite email is explicit best-effort with recorded delivery result.
- `AP-026` - stable DTO boundaries for invite, member, role and lifecycle endpoints.
- `AP-032` - command/query split: invite/member writes separate from settings/page read models.
- `AP-033` - atomic DB commands for accept invite, transfer owner, remove member and leave team.
- `AP-034` - explicit concurrency strategy for single-use invite acceptance and owner transfer.
- `AP-035` - idempotency for repeated accept, resend, revoke and destructive confirmation submissions.
- `AP-037` - audit log for invite accepted, role changed, member removed, member left and ownership transferred.
- `AP-039` - trusted identity from Auth.js session only.
- `AP-040` - authorization inside each protected use-case.
- `AP-041` - object-level team access and tenant isolation on every membership command.
- `AP-042` - invite token handling as secret material.
- `AP-043` - safe input handling for emails, role values, confirmation text and invite tokens.
- `AP-049` - explicit deletion/removal history through audit events.
- `AP-050` - role, invite status and event types as contract enums.
- `AP-061` - production-safe migration review for security-sensitive membership columns and invite tables.

## Baseline AP Gates

- `AP-010` - modular monolith with Ports and Adapters.
- `AP-014` - SOLID/Clean Code in membership modules.
- `AP-015` - DRY/KISS/YAGNI: Phase 1 owns private team lifecycle, with later booking/n8n/legal pages traced forward.
- `AP-017` - data minimization: invite/member API responses avoid internal IDs, raw emails on public pages and token leakage.
- `AP-018` - one responsibility per file.
- `AP-019` - keep new files small; split invite commands, member commands and read models.
- `AP-024` - privacy-safe logging for invite/email failures.
- `AP-028`, `AP-056`, `AP-057` - deterministic route, DB and UI tests.
- `AP-051`, `AP-052`, `AP-054` - bounded frontend slices, separated server/client/form state and stable UI states.

## Applicable PP Rules

- `PP-018` - Next.js App Router + Drizzle + pg-only runtime.
- `PP-019` - no empty catch blocks.
- `PP-021` - oversized UI hosts only receive composition wiring.
- `PP-023` - App Router route changes require route tests and `npm run build`.
- `PP-024` - generated security-sensitive migrations require manual cutover review.
- `PP-025` - feature plan fixes AP/PP mapping, DoD and task authoring contract.
- `PP-026` - remote mirror skipped here because trackers are obsolete for this work.

## Explicitly Out Of Phase 1

- Durable booking request lifecycle.
- Booking confirm/decline UI.
- n8n delivery runtime expansion beyond membership audit/event records.
- Full legal page package.
- Account deletion/export flow.
- Timezone model.
- Calendar write access.
- Payments and organizations.

## Architecture Decisions Fixed By This Plan

1. Private team creation becomes first-class: `POST /api/teams` accepts `privacy`, defaults to `private`, and validates `public|private`.
2. `team_members.role` becomes the role source for active members: `owner|admin|member`.
3. `teams.owner_id` remains the ownership pointer; the owner membership row mirrors `role = 'owner'`.
4. Removed/left members are hard-removed from `team_members`; durable history lives in `team_membership_events`.
5. Invite tokens are random high-entropy secrets stored as encrypted token plus hash. Accept lookup uses hash; owner/admin copy-link reads encrypted token through server-side authz.
6. Invite resend rotates token and expiry, records delivery state and makes the current link canonical.
7. Admins can invite `member` role and manage member-level pending invites. Owner can invite `admin|member` and manage every non-owner invite.
8. Owner-only actions: promote to admin, demote admin, transfer ownership, remove admin, delete team.
9. Admin remove scope: active `member` rows only.
10. Invite acceptance requires authenticated email match and records minimal consent evidence for invite acceptance.
11. Membership commands emit audit rows; future webhook delivery can consume the same event catalog.
12. Availability and team page read paths filter through active `team_members` rows and expose readiness without raw busy details.

## Known Current State

- `teams.privacy` exists and private join is blocked in `implementation/app/api/teams/[shareId]/join/route.ts`.
- `team_members` has no role field.
- Team owner is currently represented by `teams.owner_id`.
- `POST /api/teams` currently creates teams as public.
- Settings UI already has privacy toggles and owner-only edit flags.
- Webhooks exist for booking-oriented flows; membership audit/event persistence is missing.
- Email notification code exists for booking and can be patterned for invite delivery state.

# Phase 1 Private Teams And Membership Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make private teams production-usable through invite-based onboarding, explicit roles, safe membership lifecycle and owner-control protection.

**Architecture:** Keep business rules in a new `team-membership` domain/application slice. Routes stay thin, DB writes are transactional, and UI receives stable DTOs for invites, members, role capabilities and readiness.

**Tech Stack:** Next.js App Router, Auth.js, Drizzle ORM, Postgres-only runtime, Node `crypto`, Nodemailer, Node test runner.

---

## Slice Plan

### Slice 1: Membership Data Contract And Migration

- Boundary: Domain/Application + Infrastructure schema.
- AP gates: `AP-012`, `AP-013`, `AP-020`, `AP-022`, `AP-026`, `AP-033`, `AP-034`, `AP-037`, `AP-042`, `AP-050`, `AP-061`; `PP-018`, `PP-024`, `PP-025`.
- Red test first: route/db tests prove existing owner membership receives `role = 'owner'`, non-owner rows receive `role = 'member'`, and invite tables enforce pending duplicate constraints.
- Implementation:
  - Modify `implementation/src/infrastructure/db/schema-common.ts`.
  - Modify `implementation/src/infrastructure/db/schema.ts`.
  - Modify `implementation/src/infrastructure/db/schema-pg/index.ts`.
  - Add migration under `implementation/drizzle/migrations/*_team_membership_lifecycle.sql`.
  - Modify `implementation/app/api/test-support/pg-route-fixture.ts`.
  - Create `implementation/src/domain/team-membership/roles.ts`.
  - Create `implementation/src/domain/team-membership/invites.ts`.
  - Create `implementation/src/domain/team-membership/events.ts`.
- Schema contract:
  - Add `team_members.role text`.
  - Add `team_members.joined_via_invite_id text`.
  - Add `team_invites`: `id`, `team_id`, `email_normalized`, `role`, `token_hash`, `token_encrypted`, `status`, `expires_at`, `invited_by_user_id`, `accepted_by_user_id`, `accepted_at`, `revoked_at`, `last_sent_at`, `last_email_status`, `last_email_error`, `send_count`, `created_at`, `updated_at`.
  - Add partial unique index for pending duplicate prevention: `team_id + email_normalized where status = 'pending'`.
  - Add `team_membership_events`: `id`, `team_id`, `actor_user_id`, `target_user_id`, `target_email`, `invite_id`, `event_type`, `target_role`, `created_at`, `metadata_json`.
  - Add `user_consent_records`: `id`, `user_id`, `context`, `consent_type`, `document_version`, `granted_at`, `metadata_json`.
- Migration cutover:
  - Add nullable role.
  - Backfill all rows as `member`.
  - Backfill owner rows from `teams.owner_id` as `owner`.
  - Set `role` not null with default `member`.
  - Create invite/audit/consent tables after backfill.
- Verification:
  - `cd implementation && npm run test:unit:db`
  - `cd implementation && npm run test:unit:next-routes`
- Stop condition: existing teams after migration have zero owner membership rows, duplicate pending invites are possible, or migration contains unsafe non-null add without backfill.

### Slice 2: Private Team Creation And Role Capabilities

- Boundary: Interface entry point + Application command/query.
- AP gates: `AP-012`, `AP-020`, `AP-021`, `AP-022`, `AP-026`, `AP-032`, `AP-039`, `AP-040`, `AP-041`, `AP-050`; `PP-018`, `PP-023`.
- Red test first: `POST /api/teams` with `{ name, privacy: "private" }` creates private team and owner membership role; invalid privacy returns `400`.
- Implementation:
  - Modify `implementation/src/application/usecases/create-team.ts`.
  - Modify `implementation/app/api/teams/teams-handler.ts`.
  - Modify `implementation/app/api/teams/route.test.ts`.
  - Modify `implementation/app/_components/create-team-page-client.tsx`.
  - Modify `implementation/app/_components/create-team-view.tsx`.
  - Create `implementation/src/application/usecases/team-role-capabilities.ts`.
  - Modify `implementation/src/application/usecases/get-team-settings.ts`.
  - Modify `implementation/app/api/teams/[shareId]/settings/get-handler.ts`.
  - Modify `implementation/app/_components/team-page/team-settings-contract.ts`.
- Route contract:
  - `POST /api/teams` request: `{ name: string, privacy?: "private" | "public" }`.
  - Response remains `{ name, shareId }`.
  - Default privacy is `private`.
  - Owner membership row is created with `role = "owner"`.
- Settings read model:
  - Return `myRole`, `canInviteMembers`, `canInviteAdmins`, `canManageMembers`, `canTransferOwnership`, `canDelete`.
  - Existing `canEditName`, `canEditPrivacy`, `canDelete` remain compatible.
- Verification:
  - `cd implementation && npm run test:unit:next-routes`
  - `cd implementation && npm run test:unit:next-ui`
- Stop condition: private team creation requires a later settings edit, owner role is only inferable from `owner_id`, or public join becomes available for private teams.

### Slice 3: Invite Create/List/Copy/Resend/Revoke

- Boundary: Application commands + Infrastructure notification adapter + Interface routes.
- AP gates: `AP-012`, `AP-013`, `AP-021`, `AP-022`, `AP-023`, `AP-026`, `AP-032`, `AP-033`, `AP-035`, `AP-040`, `AP-041`, `AP-042`, `AP-043`, `AP-050`; `PP-018`, `PP-019`, `PP-023`.
- Red test first:
  - Owner can create admin/member invite.
  - Admin can create member invite.
  - Member receives `403`.
  - Duplicate pending invite returns existing pending status or a clear `409`.
  - SMTP failure records `last_email_status = "failed"` and leaves invite pending.
- Implementation:
  - Create `implementation/src/application/usecases/team-invites-shared.ts`.
  - Create `implementation/src/application/usecases/create-team-invite.ts`.
  - Create `implementation/src/application/usecases/list-team-invites.ts`.
  - Create `implementation/src/application/usecases/resend-team-invite.ts`.
  - Create `implementation/src/application/usecases/revoke-team-invite.ts`.
  - Create `implementation/src/application/usecases/get-team-invite-link.ts`.
  - Create `implementation/src/infrastructure/notifications/team-invite-delivery.ts`.
  - Create `implementation/app/api/teams/[shareId]/invites/route.ts`.
  - Create `implementation/app/api/teams/[shareId]/invites/[inviteId]/link/route.ts`.
  - Create `implementation/app/api/teams/[shareId]/invites/[inviteId]/resend/route.ts`.
  - Create `implementation/app/api/teams/[shareId]/invites/[inviteId]/route.ts`.
  - Create route tests in `implementation/app/api/teams/[shareId]/membership-route.test.ts`.
  - Modify `implementation/package.json` so the new nested route test is inside `test:unit:next-routes`.
- API contract:
  - `GET /api/teams/:shareId/invites` returns pending/effective-expired invites for owner/admin.
  - `POST /api/teams/:shareId/invites` creates invite with `{ email, role }`.
  - `POST /api/teams/:shareId/invites/:inviteId/link` returns current copyable link to owner/admin.
  - `POST /api/teams/:shareId/invites/:inviteId/resend` rotates token, extends expiry, sends email best-effort.
  - `DELETE /api/teams/:shareId/invites/:inviteId` revokes pending invite.
- Notification contract:
  - Missing SMTP config records `skipped`.
  - SMTP error records `failed` with sanitized error text.
  - Success records `sent`.
  - Invite row remains the durable state in every email outcome.
- Verification:
  - `cd implementation && npm run test:unit:next-routes`
- Stop condition: invite email delivery can erase invite state, token appears in logs, or admin can invite/promote owner-level access.

### Slice 4: Invite Acceptance And Consent Capture

- Boundary: Public accept page + authenticated command + consent persistence.
- AP gates: `AP-012`, `AP-013`, `AP-016`, `AP-020`, `AP-021`, `AP-022`, `AP-026`, `AP-033`, `AP-034`, `AP-035`, `AP-039`, `AP-041`, `AP-042`, `AP-043`; `PP-018`, `PP-020`, `PP-023`.
- Red test first:
  - Signed-out invitee sees team name and sign-in action.
  - Signed-in user with matching email accepts once.
  - Reuse fails with understandable copy.
  - Mismatched email is blocked.
  - Missing required consent is blocked.
- Implementation:
  - Create `implementation/src/application/usecases/get-team-invite-acceptance.ts`.
  - Create `implementation/src/application/usecases/accept-team-invite.ts`.
  - Create `implementation/app/(pages)/invite/[token]/page.tsx`.
  - Create `implementation/app/_components/invite-accept-page-client.tsx`.
  - Create `implementation/app/api/invites/[token]/route.ts`.
  - Create `implementation/app/api/invites/[token]/accept/route.ts`.
  - Modify `implementation/src/application/usecases/team-invites-shared.ts`.
  - Modify `implementation/app/api/teams/[shareId]/membership-route.test.ts`.
  - Add UI acceptance tests under `implementation/app/_components/invite-accept-page.test.tsx`.
  - Modify `implementation/package.json` so invite UI test is inside `test:unit:next-ui`.
- Accept transaction:
  - Hash token and find pending invite.
  - Reject revoked/accepted/expired/effective-expired invites.
  - Load authenticated user from session.
  - Compare normalized authenticated email to invite email.
  - Reject existing active member.
  - Insert `team_members` with invited role and `joined_via_invite_id`.
  - Mark invite accepted.
  - Insert consent records for terms, privacy and personal data processing in context `invite_acceptance`.
  - Insert `invite.accepted` membership event.
- UX contract:
  - Invite page shows team name and target email.
  - Calendar setup is the next action after acceptance.
  - Technical reasons stay in route error codes; user copy stays product-level.
- Verification:
  - `cd implementation && npm run test:unit:next-routes`
  - `cd implementation && npm run test:unit:next-ui`
- Stop condition: invite acceptance can create two memberships, email mismatch can pass, or consent evidence is absent.

### Slice 5: Member Management, Leave Flow And Owner Transfer

- Boundary: Application commands + settings UI.
- AP gates: `AP-012`, `AP-013`, `AP-020`, `AP-021`, `AP-022`, `AP-026`, `AP-032`, `AP-033`, `AP-034`, `AP-035`, `AP-037`, `AP-039`, `AP-040`, `AP-041`, `AP-049`, `AP-050`, `AP-054`; `PP-018`, `PP-021`, `PP-023`.
- Red test first:
  - Owner promotes member to admin and demotes admin.
  - Owner transfers ownership to an active member.
  - Owner cannot leave while owner.
  - Admin removes member and cannot remove owner/admin.
  - Removed member disappears from availability member set.
- Implementation:
  - Create `implementation/src/application/usecases/list-team-membership.ts`.
  - Create `implementation/src/application/usecases/update-team-member-role.ts`.
  - Create `implementation/src/application/usecases/remove-team-member.ts`.
  - Create `implementation/src/application/usecases/leave-team.ts`.
  - Create `implementation/src/application/usecases/transfer-team-ownership.ts`.
  - Create `implementation/app/api/teams/[shareId]/members/route.ts`.
  - Create `implementation/app/api/teams/[shareId]/members/[memberPublicId]/role/route.ts`.
  - Create `implementation/app/api/teams/[shareId]/members/[memberPublicId]/route.ts`.
  - Create `implementation/app/api/teams/[shareId]/leave/route.ts`.
  - Create `implementation/app/api/teams/[shareId]/ownership/route.ts`.
  - Create `implementation/app/_components/team-page/team-settings-members-card.tsx`.
  - Create `implementation/app/_components/team-page/team-settings-invites-card.tsx`.
  - Modify `implementation/app/_components/team-page/team-settings-page-client.tsx`.
  - Modify `implementation/app/_components/team-page/team-settings-page-hooks.ts`.
  - Modify `implementation/src/application/usecases/team-page-shared.ts`.
  - Modify `implementation/src/application/usecases/get-team-page.ts`.
  - Modify `implementation/app/api/teams/[shareId]/availability/get-handler.ts`.
- Lifecycle command semantics:
  - Promote/demote: owner only, target active member/admin, event `team.member.role_changed`.
  - Transfer owner: owner only, target active member/admin, one transaction updates `teams.owner_id`, old owner role to `admin`, new owner role to `owner`, event `team.owner.transferred`.
  - Remove: owner can remove admin/member; admin can remove member; target row deleted; related overrides deleted; event `team.member.removed`.
  - Leave: member/admin can leave; owner receives actionable error requiring transfer or delete; event `team.member.left`.
  - Repeated destructive submit returns stable idempotent result when state already reached terminal condition.
- UI contract:
  - Members card shows name, safe email for admins, role, readiness and allowed actions.
  - Pending invites card shows email, role, effective status, delivery status and actions.
  - Dangerous actions require confirmation.
  - Role boundaries use direct copy and avoid technical auth terms.
- Verification:
  - `cd implementation && npm run test:unit:next-routes`
  - `cd implementation && npm run test:unit:next-ui`
- Stop condition: owner can orphan team, removed member still affects availability, or UI exposes actions forbidden by server.

### Slice 6: Readiness, Audit Read Model And Release Gate

- Boundary: Query read models + release verification.
- AP gates: `AP-013`, `AP-017`, `AP-020`, `AP-022`, `AP-024`, `AP-026`, `AP-028`, `AP-037`, `AP-041`, `AP-054`, `AP-056`, `AP-057`; `PP-018`, `PP-023`.
- Red test first:
  - Owner/admin sees readiness status for every active member.
  - Owner/admin cannot read raw busy event details.
  - Audit list shows membership lifecycle events in order.
  - Demo 1 from section 15 can be walked through by route/UI tests.
- Implementation:
  - Create `implementation/src/application/usecases/list-team-membership-events.ts`.
  - Modify `implementation/src/application/usecases/get-team-settings.ts`.
  - Modify `implementation/app/api/teams/[shareId]/settings/get-handler.ts`.
  - Create `implementation/app/_components/team-page/team-settings-membership-history-card.tsx`.
  - Modify `implementation/app/_components/team-page/team-settings-page-client.tsx`.
  - Extend route/UI tests for readiness and audit.
- Readiness states:
  - `ready`: Google account active and calendar selection has at least one active calendar.
  - `not_connected`: Google account is absent or lacks refresh token.
  - `reauth_required`: account auth status is `reauth_required`.
  - `selection_missing`: Google account active and selection empty.
- Verification:
  - `cd implementation && npm run test`
  - `cd implementation && npm run build`
- Stop condition: readiness requires raw calendar event data, audit output leaks invite token, or full build fails.

## File Structure Plan

### Create

- `implementation/src/domain/team-membership/roles.ts` - role enum, permission helpers, target-role validation.
- `implementation/src/domain/team-membership/invites.ts` - invite status, expiry, email normalization, token hash helpers.
- `implementation/src/domain/team-membership/events.ts` - membership event type constants and audit payload helpers.
- `implementation/src/application/usecases/team-invites-shared.ts` - invite lookup, authz, token and DTO helpers.
- `implementation/src/application/usecases/create-team-invite.ts` - create pending invite and record email result.
- `implementation/src/application/usecases/list-team-invites.ts` - owner/admin invite read model.
- `implementation/src/application/usecases/resend-team-invite.ts` - token rotation, expiry refresh, email delivery result.
- `implementation/src/application/usecases/revoke-team-invite.ts` - owner/admin revoke command.
- `implementation/src/application/usecases/get-team-invite-link.ts` - authorized copy-link read.
- `implementation/src/application/usecases/get-team-invite-acceptance.ts` - public invite accept page read model.
- `implementation/src/application/usecases/accept-team-invite.ts` - transactional accept command.
- `implementation/src/application/usecases/list-team-membership.ts` - settings members read model.
- `implementation/src/application/usecases/update-team-member-role.ts` - promote/demote command.
- `implementation/src/application/usecases/remove-team-member.ts` - remove command.
- `implementation/src/application/usecases/leave-team.ts` - current member leave command.
- `implementation/src/application/usecases/transfer-team-ownership.ts` - transactional owner transfer.
- `implementation/src/application/usecases/list-team-membership-events.ts` - audit read model.
- `implementation/src/application/usecases/team-role-capabilities.ts` - role capability DTO helper.
- `implementation/src/infrastructure/notifications/team-invite-delivery.ts` - invite email adapter.
- `implementation/app/api/teams/[shareId]/invites/route.ts`.
- `implementation/app/api/teams/[shareId]/invites/[inviteId]/link/route.ts`.
- `implementation/app/api/teams/[shareId]/invites/[inviteId]/resend/route.ts`.
- `implementation/app/api/teams/[shareId]/invites/[inviteId]/route.ts`.
- `implementation/app/api/invites/[token]/route.ts`.
- `implementation/app/api/invites/[token]/accept/route.ts`.
- `implementation/app/api/teams/[shareId]/members/route.ts`.
- `implementation/app/api/teams/[shareId]/members/[memberPublicId]/role/route.ts`.
- `implementation/app/api/teams/[shareId]/members/[memberPublicId]/route.ts`.
- `implementation/app/api/teams/[shareId]/leave/route.ts`.
- `implementation/app/api/teams/[shareId]/ownership/route.ts`.
- `implementation/app/api/teams/[shareId]/membership-route.test.ts`.
- `implementation/app/(pages)/invite/[token]/page.tsx`.
- `implementation/app/_components/invite-accept-page-client.tsx`.
- `implementation/app/_components/invite-accept-page.test.tsx`.
- `implementation/app/_components/team-page/team-settings-members-card.tsx`.
- `implementation/app/_components/team-page/team-settings-invites-card.tsx`.
- `implementation/app/_components/team-page/team-settings-membership-history-card.tsx`.

### Modify

- `implementation/src/infrastructure/db/schema-common.ts`.
- `implementation/src/infrastructure/db/schema.ts`.
- `implementation/src/infrastructure/db/schema-pg/index.ts`.
- `implementation/drizzle/migrations/*`.
- `implementation/app/api/test-support/pg-route-fixture.ts`.
- `implementation/src/application/usecases/create-team.ts`.
- `implementation/src/application/usecases/get-team-page.ts`.
- `implementation/src/application/usecases/get-team-settings.ts`.
- `implementation/src/application/usecases/team-page-shared.ts`.
- `implementation/app/api/teams/teams-handler.ts`.
- `implementation/app/api/teams/route.test.ts`.
- `implementation/app/api/teams/[shareId]/settings/get-handler.ts`.
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts`.
- `implementation/app/_components/create-team-page-client.tsx`.
- `implementation/app/_components/create-team-view.tsx`.
- `implementation/app/_components/team-page/team-settings-contract.ts`.
- `implementation/app/_components/team-page/team-settings-page-client.tsx`.
- `implementation/app/_components/team-page/team-settings-page-hooks.ts`.
- `implementation/package.json`.

## Task Authoring Contract For Future Execution

Every implementation task derived from this plan must include:

- `Applied rules`: exact `AP-*` and `PP-*` for the task boundary.
- `Read before implementation`: this plan, PRD sections 11/12/13/15, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and the exact files in the write scope.
- `How to apply rules`: concrete explanation tied to route/domain/schema/UI scope.
- `Red test first`: exact test name and expected failing behavior.
- `Verification`: exact command and expected result.
- `Commit checkpoint`: one logical commit per slice or per stable sub-slice.

## Product Acceptance Criteria Preserved From PRD

### Section 11 Criteria

#### 11.1 Owner creates private team and invites members

- Private team onboarding works without making team public.
- Owner/admin can manage pending invites.
- Member role starts with safe default.
- System communicates invite status clearly.

Phase 1 owner: Slices 2 and 3.

#### 11.2 Invitee accepts invite

- Accept flow is clear.
- Reusing the invite fails with understandable copy.
- Calendar setup follows naturally after acceptance.

Phase 1 owner: Slice 4.

#### 11.3 Member configures calendar participation

- Member can hide avatar/name from public team page.
- Member can disconnect/reconnect Google.
- Owner/admin can see high-level member readiness without seeing private calendar data.

Phase 1 owner: Slice 6 for readiness. Public display privacy remains a P0 cross-phase criterion already preserved for later phase execution.

#### 11.4 External requester books a team slot

- Booking request is created only after required fields and consent.
- Slot conflict leads to refresh guidance.
- Email/webhook failure does not erase durable booking request.
- Requester sees timezone before confirming.

Phase 1 relation: active member filtering must support this later booking path. Booking lifecycle remains Phase 2.

#### 11.5 Team confirms or declines booking request

- Status changes are recorded.
- Unauthorized users cannot change request status.
- Confirm/decline actions are idempotent from user perspective.
- Webhook payload has enough product context for automation.

Phase 1 relation: role and membership authz helpers become shared foundation for later booking status actions.

#### 11.6 n8n receives booking event

- Webhook delivery is signed.
- Event type and payload version are explicit.
- Delivery status is visible.
- Docs include n8n verification guidance.

Phase 1 relation: membership audit event names align with the future event catalog.

#### 11.7 AI agent finds slots and requests booking

- API/events are readable for agent use.
- Booking creation has idempotency semantics.
- Agent receives structured errors and suggested next action.
- Product docs include safe agent flow.

Phase 1 relation: membership errors use structured codes and stable DTOs.

### Section 12 Criteria

#### FR-1. Team creation and privacy

- New owner understands what public/private means.
- Private team cannot be joined through public join action.
- Public team remains useful for open communities.
- Privacy change does not break existing members.

Phase 1 owner: Slice 2.

#### FR-2. Team invites

- Owner can invite a member into private team.
- Invitee can accept after login.
- Revoked/expired invite fails safely.
- Admin can manage invites if permission allows.
- Member cannot invite by default.

Phase 1 owner: Slices 3 and 4.

#### FR-3. Roles and member management

- Role boundaries are understandable in UI.
- Dangerous actions require confirmation.
- Owner cannot accidentally leave team ownerless.
- Member removal updates availability.

Phase 1 owner: Slice 5.

#### FR-4. Calendar connection and readiness

- A disconnected member is clearly marked.
- Availability handles missing calendar access gracefully.
- Member privacy is preserved.

Phase 1 owner: Slice 6 for admin readiness and active membership filtering.

#### FR-5. Availability experience

- Requester can choose slot confidently.
- Empty state feels helpful.
- Timezone confusion is reduced.
- Slot conflict is handled without losing user trust.

Phase 1 relation: member filtering excludes removed/left members. Full requester UX remains later P0 work.

#### FR-6. Booking request creation

- Booking request survives notification/webhook failure.
- Duplicate/retry scenarios do not create confusing duplicates.
- Requester understands that the request has been sent.

Phase 1 relation: no direct implementation in Phase 1. The plan preserves the criterion for Phase 2.

#### FR-7. Booking lifecycle

- Booking request state is clear.
- Status transitions are safe.
- Team can operate bookings without leaving the product.

Phase 1 relation: role permissions become reusable for later booking operations.

#### FR-8. Notifications

- Invite flow works with email.
- Booking flow sends clear messages.
- Failed email does not destroy product state.

Phase 1 owner: Slice 3 for invite email and delivery status. Booking email remains Phase 2.

#### FR-9. Webhooks and n8n integration

- n8n can receive and verify event.
- Owner can troubleshoot failed delivery.
- Webhook secret is visible only when provisioning/rotation requires it.

Phase 1 relation: membership event records use stable event names `invite.accepted` and `team.member.removed`; signed delivery remains later webhook runtime work.

#### FR-10. AI-ready product surface

- AI flow can search and create booking request in a controlled way.
- Product docs are enough for arch loop to design technical interface.
- Privacy boundary remains clear.

Phase 1 relation: structured membership errors and privacy-safe read models preserve this constraint.

#### FR-11. Privacy, consent and legal product layer

- Required forms include legal links.
- Public display of name/avatar follows member choice.
- Guest booking cannot proceed without required consent.
- User has a clear privacy/account page.

Phase 1 owner: invite acceptance consent evidence. Full legal pages and guest booking consent remain later P0 work.

#### FR-12. Account privacy and data subject rights

- User rights are actionable.
- Deletion/export request creates trackable support/admin action.
- Team owner responsibilities around webhook destinations are explained.

Phase 1 relation: leave-team action is implemented. Full account privacy/data subject flow remains later P0 work.

#### FR-13. Launch operations as product readiness

- Launch owner can answer: “what happens if Google access breaks, webhook fails, email fails, DB fails, invite expires, consent is withdrawn?”
- Product has a visible path for support and privacy requests.

Phase 1 owner: invite expiry, email failure, DB transaction failure and consent evidence behavior. Broader launch ops remain later P0 work.

### Section 13 Phase 1 Exit Criteria

- End-to-end private onboarding works.
- Role model works in UI.
- Member status is reflected in availability.
- Owner cannot lose control of team accidentally.

Phase 1 owner: Slices 2 through 6.

### Section 15 P0 Demos

#### Demo 1 - Private team onboarding

1. Owner creates private team.
2. Owner invites member.
3. Member receives invite.
4. Member signs in and accepts invite.
5. Member appears in team.
6. Member connects calendar.
7. Team availability includes member.

Pass condition: team remains private through the entire flow.

Phase 1 owner: Slices 2, 3, 4 and 6.

#### Demo 2 - Member privacy

1. Member disables public avatar/name.
2. External requester opens team page.
3. Member is displayed according to selected privacy mode.
4. Availability still works.

Pass condition: public display follows member choice.

Phase 1 relation: readiness and member DTOs must keep privacy-safe defaults. Public display controls remain later P0 work unless already implemented by another active slice.

#### Demo 3 - Booking request

1. Requester opens booking page.
2. Requester sees timezone.
3. Requester selects slot.
4. Requester provides email and consent.
5. System creates request.
6. Team receives request.
7. Requester sees confirmation.

Pass condition: booking request is durable and visible to team.

Phase 1 relation: active membership and role model must support this later flow.

#### Demo 4 - Booking lifecycle

1. Team opens booking request.
2. Team confirms.
3. Requester gets confirmation.
4. Webhook event is delivered.

Pass condition: status update is visible and event is delivered.

Phase 1 relation: role authz helpers must be reusable by booking lifecycle.

#### Demo 5 - n8n automation

1. Owner adds webhook.
2. Owner configures n8n.
3. Booking event is sent.
4. n8n verifies and processes event.
5. Delivery status is visible.

Pass condition: n8n can reliably receive signed event.

Phase 1 relation: membership event catalog stays compatible with future webhook expansion.

#### Demo 6 - Legal readiness

1. Signup shows required legal links.
2. Booking guest flow requires consent.
3. Public profile display consent is separate.
4. Privacy page allows request/export/delete path.
5. Legal pages are published.

Pass condition: required user-facing legal controls exist.

Phase 1 relation: invite acceptance records required consent evidence. Full legal readiness remains a separate P0 workstream.

## Test Plan

### Route Tests

- `POST /api/teams` privacy default and explicit privacy.
- Private `POST /api/teams/:shareId/join` remains blocked.
- Owner/admin/member invite permissions.
- Duplicate pending invite handling.
- Invite copy link authz.
- Resend token rotation and delivery status.
- Revoke pending invite.
- Accept invite success.
- Accept invite token invalid/expired/revoked/accepted.
- Accept invite email mismatch.
- Accept invite consent missing.
- Promote/demote.
- Transfer ownership.
- Remove member/admin permission matrix.
- Leave team owner guard.
- Availability excludes removed/left members.

Command:

```bash
cd implementation && npm run test:unit:next-routes
```

### UI Tests

- Create private team toggle/default.
- Pending invite list status/actions.
- Invite accept page signed-out/signed-in states.
- Member management card actions by role.
- Dangerous action confirmation.
- Readiness status display.

Command:

```bash
cd implementation && npm run test:unit:next-ui
```

### DB Tests

- Migration backfills owner/member roles.
- Pending duplicate invite index works.
- Membership event rows serialize known event types.
- Consent records persist invite acceptance evidence.

Command:

```bash
cd implementation && npm run test:unit:db
```

### Release Gate

```bash
cd implementation && npm run test
cd implementation && npm run build
```

## Risk Register

| Risk | Product impact | Containment |
|---|---|---|
| Invite token stored or logged unsafely | Private team access leak | Store encrypted token + hash, sanitize logs, test response DTOs |
| Owner transfer partial update | Team orphan or two owners | One transaction updates team and both membership rows |
| Admin privilege escalation | Unsafe delegation | Permission matrix in domain tests and route tests |
| Duplicate invite accept race | Duplicate membership | Transaction plus unique `team_id,user_id` membership index |
| Removed member still affects availability | Incorrect slots | Shared active-member read helper and availability regression test |
| SMTP failure hides invite state | Owner cannot debug onboarding | Persist invite first, record delivery status after send |
| Consent omitted from accept | Legal gap for team membership | Accept command requires consent payload and writes records |
| Nested route tests skipped by package script | False verification | Update `test:unit:next-routes` with new test file |

## Feature Definition Of Done

- Private is the default team creation mode and explicit public mode remains available.
- Private join remains blocked through public join action.
- Owner/admin can create, list, copy, resend and revoke invites within their permission boundaries.
- Invite acceptance is single-use, email-bound, consent-bound and transaction-safe.
- Owner/admin/member role boundaries are visible in settings UI.
- Owner can transfer ownership to an active member.
- Owner cannot leave a team ownerless.
- Members/admins can leave within permission rules.
- Owner/admin can remove members within permission rules.
- Removed/left members stop affecting availability.
- Owner/admin sees readiness status without raw busy event details.
- Membership lifecycle writes audit events.
- Invite email failure is visible without destroying invite state.
- Section 13 Phase 1 exit criteria pass.
- Section 15 Demo 1 is covered by route/UI tests and can be manually walked through.
- `cd implementation && npm run test` passes.
- `cd implementation && npm run build` passes.

## Execution Handoff

Plan execution should start with Slice 1. Use one worker per slice only after Slice 1 data contract is merged, because later slices depend on the same schema and role semantics.

Recommended execution mode: `superpowers:subagent-driven-development` for Slices 2-6 after Slice 1, with a single integration owner reviewing schema, DTOs and authz helpers.
