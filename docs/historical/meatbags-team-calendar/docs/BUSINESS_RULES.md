# Business Rules

## Invariants
- `team.id` is internal-only and never exposed in public payloads.
- `team.shareId` is public identifier in URLs and API.
- `team_member.memberPublicId` is public identifier for member filtering/booking.

## Privacy and join behavior
- `public` teams can be joined by authenticated non-members.
- `private` teams reject join with `403`.
- Public payloads must never include member emails.

## Availability behavior
- Horizon: 14 days.
- Lead time: 12 hours.
- Working window: 10:00-20:00 Europe/Moscow.
- Allowed duration: 30 or 60 minutes.
- `member` filter is validated by public-id pattern; invalid filter returns `400`.

## Booking behavior
- Supported modes: `all` and `single`.
- Requester email source:
  - authenticated -> session email
  - guest -> request body email
- Emails are deduplicated.
- Webhook/email notifications are best-effort.
- Booking endpoint returns `{ "ok": true }` for valid booking even if delivery side-effects fail.

## Security and anti-leak rules
- Same-origin enforcement on state-changing endpoints.
- Sensitive tokens are stored encrypted.
- Rate limit is mandatory for at least availability and booking endpoints.
