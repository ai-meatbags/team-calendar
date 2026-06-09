# TEAMCAL-52 — Integration regression and self-hosted DB docs

Статус: done

## Описание
Закрыть интеграционный и операционный хвост перехода: обновить self-hosted инструкции, зафиксировать zero-config embedded Postgres flow, описать override на внешний Postgres и пройти regression gate для pg-only runtime.

## Applied rules
- AP-012
- AP-018
- AP-024
- AP-027
- AP-028
- PP-018
- PP-019

## Scope
- `.env.example`
- `README.md`
- `docs/*`
- Финальные regression notes и release-facing task artifacts

## Критерии готовности
- Self-hosted документация описывает embedded Postgres default и внешний `DATABASE_URL` override.
- Документация не обещает sqlite support.
- Зафиксирован regression/smoke набор, достаточный для первого pg-only rollout.
- Feature dossier и integration task отражают фактический итоговый operational path.

## Тест кейсы
1. Документационная self-review: zero-config path и external override path непротиворечивы.
2. Integration smoke checklist для runtime startup, auth/db access и ключевых API маршрутов.
3. Проверка, что release-facing артефакты больше не содержат sqlite assumptions.

## Зависимости
- [TEAMCAL-50](tasks/embedded-postgres-runtime/TEAMCAL-50.embedded-postgres-bootstrap-and-pg-only-client.md)
- [TEAMCAL-51](tasks/embedded-postgres-runtime/TEAMCAL-51.pg-only-test-fixtures-and-script-cleanup.md)

## Лог
- 2026-03-21 00:35 — [todo] Created from feature dossier `embedded-postgres-runtime`.
- 2026-03-21 01:04 — [in_progress] README, local setup, release checklist, security docs и env example обновлены под embedded/external Postgres operational path.
- 2026-03-21 01:04 — [testing] Integration gate пройден: `npm run db:migrate`, `npm run test` и `npm run build` подтверждают zero-config path и docs/runtime parity.
- 2026-03-21 01:04 — [need_retro] Зафиксирован урок про обязательный `next build` gate для App Router route exports.
- 2026-03-21 01:04 — [done] Release-facing docs и финальный regression gate закрыты для `pg-only` self-hosted runtime.
