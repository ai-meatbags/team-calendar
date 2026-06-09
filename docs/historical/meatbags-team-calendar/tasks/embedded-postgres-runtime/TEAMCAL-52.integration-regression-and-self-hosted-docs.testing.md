# Task Testing

Task: `TEAMCAL-52`
Updated: `2026-03-21`

## Context
- Change summary: self-hosted/docs/release surface обновлён под embedded Postgres default и external `DATABASE_URL` override; integration regression gate закрыт.
- Feature dossier: `tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`

## Risk Tier
- Tier: `medium`
- Reviewer required: `yes`

## Planned Checks
- Проверить zero-config migration/runtime/build path.
- Проверить, что docs и env examples не обещают sqlite support.

## Commands Run
- `npm run db:migrate`
- `npm run test`
- `npm run build`

## Results
- Zero-config path проходит локально через embedded Postgres.
- Release-facing docs и `.env.example` описывают только embedded/external Postgres режимы.
- Финальный build gate подтвердил совместимость App Router route surface с текущим Next.js runtime.

## Failures
- Финальный build gate нашёл лишний export в route entrypoint; дефект исправлен до закрытия задачи.

## Residual Risks
- Zero-config режим требует writable `EMBEDDED_POSTGRES_DATA_DIR`; в ephemeral/container окружениях по-прежнему разумнее явно задавать внешний `DATABASE_URL`.

## Self Review
- Проверил, что README, local setup, release checklist и security docs говорят об одном operational path.

## Reviewer Review
- Отдельный reviewer не привлекался в рамках этого single-agent прохода.

## Exit Decision
- `need_retro`
