# Release Checklist — Next.js Runtime + pg-only Data Layer

## 0) Source of truth
- Full runtime cutover: `tasks/nextjs-cutover/nextjs-cutover.specs.md`
- pg-only embedded Postgres feature: `tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`
- This checklist is the release gate for the current runtime and database model

## 1) Preconditions
- [ ] Relevant feature tasks are `done`
- [ ] `.env` has valid OAuth credentials, `TOKEN_ENC_KEY`, and `NEXTAUTH_SECRET`
- [ ] If using external Postgres in production, `DATABASE_URL` is valid
- [ ] If using embedded Postgres for self-hosted rollout, the persistent data dir strategy is understood and documented

## 2) Automated build and regression gate
Run before release:
- `npm run build`
- `npm run test`

Expected: all green. This gate covers unit/contract suites, but does not replace browser-only checks from section 4.

## 3) API and contract smoke
1. Profile:
   - `GET /api/me`
   - `PATCH /api/me`
2. Settings:
   - `GET /api/me/settings`
   - `PATCH /api/me/calendar`
   - `GET /api/teams/{shareId}/settings`
   - `PATCH /api/teams/{shareId}`
3. Team and booking:
   - `GET /api/teams/{shareId}/availability?duration=30`
   - `GET /api/teams/{shareId}/availability?duration=60`
   - `POST /api/booking` returns `{ "ok": true }` for valid payload
4. Privacy/sanitization:
   - public API payloads must not include internal ids or member emails
5. Rate-limit behavior:
   - overflow on booking/availability returns `429`

## 4) Manual browser UX smoke checklist
1. `/` guest landing is rendered, login button visible
2. Login popup succeeds, opener refreshes auth state, popup closes
3. `/` authenticated mode shows teams list and create-team flow
4. `/profile` saves display name and reflects it in UI/menu
5. `/t/{shareId}` works for guest/member/owner states
6. Duration/member filters are reflected in URL and survive reload
7. Share action copies current URL with active filters
8. Booking modal works for guest and authenticated user
9. Team settings modal works for participant/owner rights model
10. Delete team confirm returns owner to `/`
11. Logout returns UI to guest state

## 5) Runtime and DB checks
- [ ] `npm start` runs only `next start` behind the default Postgres wrapper
- [ ] supported routes are served by App Router / Next runtime only
- [ ] no required runtime paths depend on SQLite or dual-schema legacy artifacts
- [ ] self-hosted default path works without `DATABASE_URL`
- [ ] external Postgres override path works with explicit `DATABASE_URL`

## 6) Rollback plan
- If API/UX/runtime verification fails:
  1. Stop release
  2. Revert to last known good branch/build
  3. Restore the Postgres snapshot/backup if database apply steps were part of the rollout
  4. Document the failing route/flow and blocker before retry

## 7) Post-release notes
- Store release notes and smoke evidence in release artifacts
- Document accepted warnings/errors in change log
- Record time label in Linear closeout (`<30m` / `30m-1h` / `1-2h` / `2-4h` / `4h+`)
