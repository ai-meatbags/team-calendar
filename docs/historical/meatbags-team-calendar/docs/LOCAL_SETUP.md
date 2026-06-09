# Local Setup From Scratch

This runbook assumes a clean workspace, a fresh `.env`, and no external Postgres requirement.

## 1. Install dependencies

```bash
npm install
```

## 2. Prepare `.env`

Start from the example:

```bash
cp .env.example .env
```

Minimum required values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random secret>
TOKEN_ENC_KEY=<32-byte base64 or 64-char hex key>
GOOGLE_CLIENT_ID=<google oauth client id>
GOOGLE_CLIENT_SECRET=<google oauth client secret>
```

You do not need `DATABASE_URL` for the default local path. If it is omitted, embedded Postgres is started automatically by the npm runtime scripts.

Optional external override:

```env
DATABASE_URL=postgres://user:password@host:5432/teamcal
```

Example secret generation:

```bash
openssl rand -base64 32
```

## 3. Configure Google OAuth

Local redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

If you also use production, add the production callback separately:

```text
https://calendar.meatbags.ru/api/auth/callback/google
```

Rules:
- host must match `NEXTAUTH_URL`
- `localhost` and `127.0.0.1` are different origins
- callback path must be `/api/auth/callback/google`

## 4. Generate and apply migrations

```bash
npm run db:gen
npm run db:migrate
```

## 5. Start the app

```bash
npm run dev
```

This command starts embedded Postgres automatically when `DATABASE_URL` is absent.

Open:

```text
http://localhost:3000
```

## 6. Minimum smoke check

1. Open `/`
2. Click `Войти через Google`
3. Complete the Google popup flow
4. Confirm `/api/me` returns `200` for the signed-in browser session
5. Open `/profile` and confirm the page is available without redirect

## 7. Troubleshooting

`MissingSecret`
- `NEXTAUTH_SECRET` is missing or empty

`redirect_uri_mismatch`
- Google OAuth client does not contain `http://localhost:3000/api/auth/callback/google`
- `NEXTAUTH_URL` does not match the origin you actually opened in the browser

`ECONNREFUSED 127.0.0.1:54329`
- embedded Postgres was not started for the current process
- use project npm scripts (`npm run dev`, `npm run test`, `npm run build`) instead of raw `next` commands unless you provide `DATABASE_URL`

`embedded-postgres` root-user error
- Postgres binaries cannot run as root by default
- run the app as a non-root user or set `EMBEDDED_POSTGRES_CREATE_USER=true` in container-only environments where host mutation is acceptable
