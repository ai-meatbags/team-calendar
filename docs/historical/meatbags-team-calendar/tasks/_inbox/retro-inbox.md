# Retro Inbox

Updated: `2026-04-10`

## Pending
- `2026-04-10` — `TEAMCAL-58` — кандидат в `project-patterns`: при `local+linear` sync нельзя зеркалить feature packet в Linear до стабилизации clean write scopes; если задачи пересекаются по одному application boundary или integration tail, их нужно схлопнуть локально до создания remote issues.
- `2026-04-10` — `TEAMCAL-57` — кандидат в upstream/process guidance: source-of-truth для project-local skills/policies не означает запрет использовать внешние Codex skills как reference; нужно явно различать `authoritative` и `reference-only` guidance, чтобы агент не делал ложный запрет.
- `2026-04-10` — `TEAMCAL-54` — кандидат в `project-patterns`: generated migrations с новыми non-null security columns на существующих таблицах нельзя принимать без ручного backfill/cutover review; `drizzle-kit` по умолчанию не гарантирует безопасный SQL.
- `2026-04-10` — `TEAMCAL-58` — кандидат в `project-patterns`: для feature в стадии `plan` implementation plan обязан содержать architecture-rule mapping по slice-ам, единый feature DoD и task authoring contract с секциями `Applied rules`, `Перед реализацией прочитать`, `Как применять правила`.
- `2026-04-06` — `TEAMCAL-33` — кандидат в `project-patterns`: nested App Router route tests под dynamic segment paths нельзя оставлять вне `test:unit:next-routes`; основной gate должен включать их явно или через надёжный discovery path.
- `2026-03-21` — `TEAMCAL-49` — кандидат в `project-patterns`: при архитектурном повороте historical specs должны явно помечаться как `superseded`, чтобы старый contract не оставался скрытым source of truth.
- `2026-03-21` — `TEAMCAL-50` — follow-up task: усилить `scripts/with-default-postgres.ts` для конкурентного локального запуска нескольких команд, делящих один `PGDATA`/port.
- `2026-03-21` — `TEAMCAL-51` — follow-up task: сделать quieter teardown для `app/api/test-support/pg-route-fixture.ts`, чтобы expected admin-termination не зашумлял test output.
- `2026-03-21` — `TEAMCAL-52` — кандидат в `project-patterns`: для App Router обязателен `next build` gate, а test-only factories нельзя экспортировать из `app/**/route.ts`.

## Resolved
- `2026-04-10` — `TEAMCAL-57` — добавлен `PP-021`: для oversized host files новый UI scope должен выноситься в sibling feature slice; host file остаётся composition root, а не свалкой новой бизнес-логики
