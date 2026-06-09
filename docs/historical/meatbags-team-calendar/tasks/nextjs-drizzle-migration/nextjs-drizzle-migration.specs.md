# Feature Specs — Next.js + Drizzle Migration

Статус: completed-phase
Feature key: `nextjs-drizzle-migration`
Дата: 2026-02-28

> Эта спека описывает завершённую фазу backend/db migration.
> Source of truth для оставшегося полного runtime cutover находится в
> `tasks/nextjs-cutover/nextjs-cutover.specs.md`.
>
> Историческое примечание: решения `SQLite default`, `Postgres optional` и
> `dual-schema` из этой фазы superseded фичей
> `tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`
> от `2026-03-21`. Для текущего проекта source of truth по data layer теперь
> `pg-only` с embedded Postgres default и external `DATABASE_URL` override.

## Контекст и цель
Текущий стек (`Express + Vite + NocoDB`) нужно мигрировать на `Next.js App Router + Auth.js + Drizzle` с дефолтным `SQLite file` и опциональным `Postgres/Supabase` без изменения бизнес-правил и с сохранением security-поведения.

## Non-goals
- Полная инфраструктурная автоматизация cutover.
- Миграция legacy express-session в Auth.js sessions.
- Сохранение внутреннего `team.id` в публичных API.

## Fixed Decisions
1. `DATABASE_URL=file:./data/app.db` by default, `postgres://` optional.
2. Две Drizzle-схемы обязательны: `schema-sqlite` и `schema-pg`.
3. Публичные payload сразу без внутренних `team.id/members.id`.
4. `A1`: refresh tokens из NocoDB не переносим, пользователи перелогиниваются.
5. Auth.js + DrizzleAdapter, сессии через БД.
6. `refresh_token` хранится только в encrypted виде (AES-256-GCM).
7. Rate limit обязателен минимум для availability/booking.

## API/контрактные изменения
- `GET /api/teams`: удалить `teams[].id`.
- `GET /api/teams/:shareId`: удалить `team.id` и `members[].id`.
- `GET /api/teams/:shareId/settings`: удалить `team.id`.
- Сохранить контракты ошибок и бизнес-правила:
  - private join -> 403
  - invalid member filter -> 400
  - duration только `30|60`
  - availability: 14d horizon, 12h lead time, 10-20 MSK
  - booking all/single + always `{ ok: true }` при best-effort delivery

## User scenarios
1. Owner логинится через Google в NextAuth, видит команды и настройки без утечки email в публичных ответах.
2. Публичный гость открывает `/t/:shareId`, получает корректную availability и может отправить booking.
3. При отказе webhook/email booking всё равно завершает API-ответом `{ ok: true }`.
4. Проект запускается локально на SQLite; сервисный деплой переключается на Postgres через `DATABASE_URL`.

## Acceptance criteria
- Контрактные тесты подтверждают инварианты 1:1.
- Auth.js работает через DrizzleAdapter, refresh token не хранится plaintext.
- `db:check:parity` проходит для SQLite/PG схем.
- Скрипт `NocoDB -> SQLite` idempotent, dry-run by default.
- Скрипт `SQLite -> Postgres` переносит данные по стабильным ключам.

## Риски
- Большой объём миграции (framework + auth + db) в одном релизном окне.
- Разъезд схем SQLite/PG при расширении таблиц.
- Потеря offline access при неверной обработке refresh token update-flow.

## Технические ограничения реализации
- AP-010: домен/use-case не импортируют конкретные DB/Auth SDK.
- AP-012: fail-fast валидация на HTTP/use-case границе.
- AP-016: security-проверки только на backend.
- AP-017: allowlist-экспорт, без выдачи чувствительных полей.
- Все новые runtime route handlers — только Node runtime (не Edge) из-за SQLite.

## Parallelization matrix
| task | depends_on | parallel_with | shared_files_risk |
| --- | --- | --- | --- |
| [TEAMCAL-36](tasks/nextjs-drizzle-migration/TEAMCAL-36.foundation-contracts-and-policy.md) | нет | нет | `tasks/*`, `docs/*`, `tasks/_policies/project-patterns.md` |
| [TEAMCAL-37](tasks/nextjs-drizzle-migration/TEAMCAL-37.drizzle-dual-schema-and-db-client.md) | [TEAMCAL-36](tasks/nextjs-drizzle-migration/TEAMCAL-36.foundation-contracts-and-policy.md) | [TEAMCAL-38](tasks/nextjs-drizzle-migration/TEAMCAL-38.authjs-encrypted-adapter.md) | `src/infrastructure/db/*`, `package.json` |
| [TEAMCAL-38](tasks/nextjs-drizzle-migration/TEAMCAL-38.authjs-encrypted-adapter.md) | [TEAMCAL-36](tasks/nextjs-drizzle-migration/TEAMCAL-36.foundation-contracts-and-policy.md) | [TEAMCAL-37](tasks/nextjs-drizzle-migration/TEAMCAL-37.drizzle-dual-schema-and-db-client.md) | `app/api/auth/*`, `src/infrastructure/auth/*` |
| [TEAMCAL-39](tasks/nextjs-drizzle-migration/TEAMCAL-39.next-api-migration-and-ratelimit.md) | [TEAMCAL-37](tasks/nextjs-drizzle-migration/TEAMCAL-37.drizzle-dual-schema-and-db-client.md), [TEAMCAL-38](tasks/nextjs-drizzle-migration/TEAMCAL-38.authjs-encrypted-adapter.md) | нет | `app/api/*`, `src/application/*`, `src/domain/*` |
| [TEAMCAL-40](tasks/nextjs-drizzle-migration/TEAMCAL-40.data-migrations-and-release-docs.md) | [TEAMCAL-39](tasks/nextjs-drizzle-migration/TEAMCAL-39.next-api-migration-and-ratelimit.md) | нет | `scripts/*`, `docs/*`, `README.md` |

## Feature-level Definition of Done
- Release gate:
  - [TEAMCAL-36](tasks/nextjs-drizzle-migration/TEAMCAL-36.foundation-contracts-and-policy.md) = done
  - [TEAMCAL-37](tasks/nextjs-drizzle-migration/TEAMCAL-37.drizzle-dual-schema-and-db-client.md) = done
  - [TEAMCAL-38](tasks/nextjs-drizzle-migration/TEAMCAL-38.authjs-encrypted-adapter.md) = done
  - [TEAMCAL-39](tasks/nextjs-drizzle-migration/TEAMCAL-39.next-api-migration-and-ratelimit.md) = done
  - [TEAMCAL-40](tasks/nextjs-drizzle-migration/TEAMCAL-40.data-migrations-and-release-docs.md) = done
- Миграции обязательны перед rollout: `NocoDB -> SQLite` (минимум dry-run + report).
