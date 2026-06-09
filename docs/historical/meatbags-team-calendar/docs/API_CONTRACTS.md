# API Contracts (Next migration)

## Public contract changes
- `GET /api/teams` -> `teams[].id` removed.
- `GET /api/teams/:shareId` -> `team.id` and `members[].id` removed.
- `GET /api/teams/:shareId/settings` -> `team.id` removed.

## Auth
- `GET /api/auth/google` -> shim redirect to Auth.js sign-in.
- `GET /api/auth/logout` -> shim redirect to Auth.js sign-out.

## Core endpoints
- `GET /api/me` -> `{ id, email, name, picture }` (auth required).
- `GET /api/me/settings` -> `{ calendarSelectionDefault }` (auth + same-origin).
- `PATCH /api/me/calendar` -> `{ calendarSelectionDefault }` (auth + same-origin).
- `GET /api/teams` -> `{ teams: [{ name, shareId }] }` (auth required).
- `POST /api/teams` -> `{ name, shareId }` (auth + same-origin).
- `GET /api/teams/:shareId` -> `{ team, members, isMember, isOwner, canJoin }`.
- `PATCH /api/teams/:shareId` -> `{ updated: true }` (owner + same-origin).
- `DELETE /api/teams/:shareId` -> `{ deleted: true }` (owner + same-origin).
- `GET /api/teams/:shareId/settings` -> `{ team, canEditName, canEditPrivacy, canDelete, privacy, calendarSelection, calendarSelectionSource }`.
- `POST /api/teams/:shareId/join` -> `{ joined: true }` (auth + same-origin).
- `GET /api/teams/:shareId/availability` -> availability payload (rate-limited).
- `POST /api/booking` -> `{ ok: true }` (same-origin + rate-limited).

## Error contract highlights
- Missing auth -> `401 { error: "Not authenticated" }`
- Same-origin failure -> `403 { error: "Invalid origin." }`
- Private join -> `403 { error: "Team is private." }`
- Invalid member filter -> `400 { error: "Invalid member filter." }`
- Rate limit overflow:
  - availability -> `429 { error: "Too many availability requests. Try again later." }`
  - booking -> `429 { error: "Too many booking requests. Try again later." }`
