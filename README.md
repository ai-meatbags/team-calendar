# Team Calendar

## Статус проекта

На 2026-06-09 проект не развивается как активный продукт.

Причина: свежий ресеч показал высокий риск каннибализации со стороны Google Workspace и Google Calendar. Базовые сценарии командной записи, подбора времени, страниц бронирования и доступа ИИ-агентов к календарю уже закрываются или быстро закрываются Google.

Основные риски:

- Google Calendar Appointment Schedule уже дает страницу бронирования, окна доступности, буферы, лимиты броней, формы и Google Meet: [`docs/research/2026-06-09-google-workspace-risk.md`](docs/research/2026-06-09-google-workspace-risk.md), [Google Calendar appointment schedules](https://support.google.com/calendar/answer/10729749).
- Google Calendar умеет проверять доступность дополнительных участников и календарей для командной записи: [Google Calendar co-host availability](https://support.google.com/calendar/answer/16287054).
- Gemini в Gmail уже помогает подбирать время встречи по письму и календарю: [Help me schedule with Gemini](https://support.google.com/calendar/answer/16865189).
- Google Calendar MCP-сервер в предварительном режиме для разработчиков уже содержит инструменты `suggest_time` и `create_event`: [Configure Calendar MCP server](https://developers.google.com/workspace/calendar/api/guides/configure-mcp-server).
- Google Workspace Studio развивает автоматизации внутри Workspace: [Google Workspace Studio](https://workspace.google.com/studio/).
- Даже сегмент без Google Workspace частично закрывается через personal booking pages, Google Workspace Individual и Google One Premium: [`docs/research/2026-06-09-google-workspace-risk.md`](docs/research/2026-06-09-google-workspace-risk.md).

Сохраненный ресеч:

- [`docs/research/2026-06-09-team-calendar-pivot-research.md`](docs/research/2026-06-09-team-calendar-pivot-research.md) — варианты пивота и пользовательская ценность.
- [`docs/research/2026-06-09-google-workspace-risk.md`](docs/research/2026-06-09-google-workspace-risk.md) — оценка риска со стороны Google Workspace и Google Calendar.

Если проект когда-нибудь возобновлять, самый защищенный путь находится вокруг сохраненной заявки на встречу как бизнес-события: идемпотентность, подписанные вебхуки, журнал доставки, повторная доставка, n8n/Telegram/CRM и самостоятельный запуск.

## Stack
- Next.js App Router + Auth.js
- Drizzle ORM on a single Postgres schema
- Embedded Postgres by default for zero-config local/self-hosted runs
- External Postgres via `DATABASE_URL` override

## Quickstart
1. Copy `.env.example` to `.env`
2. Fill Google OAuth credentials, `NEXTAUTH_SECRET` and `TOKEN_ENC_KEY`
3. Install dependencies: `npm install`
4. Start the app:
   - `npm run dev`

If `DATABASE_URL` is not set, the npm runtime scripts start embedded Postgres automatically, apply migrations during app startup, and use a local persistent data dir in `data/postgres`.

Open `http://localhost:3000`.

If the default embedded port is busy on your machine, override it in `.env`:

```env
EMBEDDED_POSTGRES_PORT=54330
```

## External Postgres override
If you already have Postgres, set:

```env
DATABASE_URL=postgres://user:password@host:5432/teamcal
```

In that mode the embedded bootstrap is skipped and the app uses the external database directly.

## Docker Compose app deployment
There are only two compose files:
- `compose.embedded.yaml`: the app container starts embedded Postgres itself and persists it in a Docker volume
- `compose.external-postgres.yaml`: the app container expects an explicit external `DATABASE_URL`

Embedded Postgres deployment:

```bash
docker compose -f compose.embedded.yaml up -d --build
```

External Postgres deployment:

```bash
docker compose -f compose.external-postgres.yaml up -d --build
```

Notes:
- embedded mode stores database files in the named volume `team-calendar-embedded-data`
- external mode does not create a database container and fails fast if `DATABASE_URL` is missing
- the app applies runtime migrations during startup; compose does not run a separate migration command
- compose files use the same embedded Postgres and port defaults as `.env.example`; deployment env still must define `NEXTAUTH_URL`, `NEXTAUTH_SECRET` and `TOKEN_ENC_KEY`
- `APP_BASE_URL` is optional and only needed when same-origin checks must allow multiple public origins
- container-only paths are fixed inside the compose files; deployment env should only provide runtime values such as ports, URLs, secrets and OAuth credentials
- team-scoped booking webhook delivery is controlled by `BOOKING_WEBHOOK_DELIVERY_ENABLED`; legacy global booking webhook envs are no longer used
- both deploy files require `NEXTAUTH_SECRET` and `TOKEN_ENC_KEY`; external mode also requires `DATABASE_URL`

## Database commands
- `npm run db:gen`
- `npm run db:migrate`
- `npm run db:status`

## Local setup and release checks
- Local bootstrap runbook: [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md)
- Architecture notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Release verification: [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)

## License
Team Calendar is licensed under the GNU Affero General Public License v3.0 or later (`AGPL-3.0-or-later`).
See [`LICENSE`](LICENSE).

## Current source of truth
- Full runtime cutover: [`tasks/nextjs-cutover/nextjs-cutover.specs.md`](tasks/nextjs-cutover/nextjs-cutover.specs.md)
- Embedded Postgres migration feature: [`tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`](tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md)
