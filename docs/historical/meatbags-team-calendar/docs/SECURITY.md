# Security

## OAuth scopes
The Google OAuth integration uses the minimal required scopes:
- `calendar.calendarlist.readonly`
- `calendar.freebusy`
- `openid email profile`

## Token handling
- `refresh_token` is encrypted via AES-256-GCM before persistence
- Encryption key source: `TOKEN_ENC_KEY` (32 bytes, base64 or 64-hex)
- Plaintext refresh tokens must never be logged or returned in API payloads

## Data minimization
- Public team payloads do not expose internal ids or member emails
- Logs must avoid PII/token leakage

## Request hardening
- Same-origin checks protect state-changing routes
- Rate limiting is enforced for availability and booking endpoints

## Embedded Postgres boundary
- Embedded Postgres is a local runtime convenience, not a separate trust domain
- Default embedded runtime binds to `127.0.0.1`
- External Postgres via `DATABASE_URL` must be treated as the production path when infra already manages DB lifecycle
- Container/root environments should avoid implicit host mutation unless `EMBEDDED_POSTGRES_CREATE_USER=true` is an explicit and accepted choice

## Release gate policy
- Run `npm run test` and `npm run build` before release
- Validate API contracts and auth/security tests before switching traffic
- Keep a Postgres backup or recovery window ready for production rollout
