# TEAMCAL-54 — JWT-only webhook contract and persistence

Статус: done

## Описание
Зафиксировать blessed path для team webhook subscriptions на уровне доменного и DB-контракта: только `JWT Bearer` + `HS256` + per-subscription shared secret без `JWKS`, `basic_auth`, `header_secret` и `auth_mode`-матрицы.

## Applied rules
- AP-010
- AP-020
- AP-021
- AP-024
- AP-027
- AP-042
- AP-043
- AP-044
- AP-049
- AP-050
- AP-067
- PP-018
- PP-019
- TEW-TR-01
- TEW-TR-04
- TEW-TR-05
- TEW-TR-07

## Перед реализацией прочитать
- `implementation/rep.config.json` и зафиксировать, что кодовая реализация идёт в `implementation/`, а task artifact остаётся в wrapper repo.
- `tasks/_policies/arch-patterns.md`: `AP-010`, `AP-020`, `AP-021`, `AP-024`, `AP-027`, `AP-042`, `AP-043`, `AP-044`, `AP-049`, `AP-050`, `AP-067`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`.
- `tasks/team-events-webhook/team-events-webhook.feature.md`.
- `tasks/team-events-webhook/team-events-webhook.specs.md`.

## Как применять правила
- `AP-010` и `AP-020`: держать JWT contract, secret lifecycle и status invariants в domain/application contract; schema, delivery adapter и route handlers только потребляют этот контракт.
- `AP-021`: не втаскивать schema decisions в route layer; все новые поля и инварианты должны оформляться через use-case/domain boundary.
- `AP-024` и `PP-019`: `last_error`, migration diagnostics и delivery failures описывать так, чтобы секреты, bearer tokens и raw downstream payload не попадали в logs и persisted diagnostics; пустые `catch` запрещены.
- `AP-027` и `AP-042`: issuer, alg и TTL default остаются trusted runtime config/constants, а не row-level настройками; plaintext secret не хранится и не возвращается из read-модели.
- `AP-043` и `AP-044`: contract должен заранее запрещать небезопасные auth branches и не открывать путь для header-secret/basic-auth fallback.
- `AP-049` и `AP-050`: явно зафиксировать semantics для `status`, `last_delivery_status`, delete/disable lifecycle и migration поведения существующих subscriptions как контрактные enum/state rules.
- `PP-018`: любые schema/domain изменения проектировать только под Next.js + Drizzle + pg-only runtime внутри `implementation/src/*` и `implementation/drizzle/*`, без возврата legacy runtime или dual-schema.

## Контекстные файлы
- `implementation/src/domain/team-webhooks.ts`
- `implementation/src/infrastructure/db/schema.ts`
- `implementation/src/infrastructure/db/schema-pg/index.ts`
- `implementation/src/infrastructure/notifications/team-webhook-delivery.ts`
- `implementation/drizzle/*`
- [Feature dossier](tasks/team-events-webhook/team-events-webhook.feature.md)
- [Feature spec](tasks/team-events-webhook/team-events-webhook.specs.md)

## Зона ответственности
- Владеет только domain/persistence/security contract.
- Не меняет owner UX, onboarding copy, docs page и route-level interaction flows.
- Не проектирует provisioning UX; только фиксирует данные и инварианты, на которые опираются следующие задачи.

## Scope
- Обновить domain contracts для `team-webhooks` под JWT-only модель.
- Обновить schema/migration под `jwt_secret_encrypted`, `jwt_audience`, `secret_last_rotated_at`.
- Зафиксировать runtime constants для `iss=teamcal` и `alg=HS256` без хранения этих значений per row.
- Удалить любые намёки на configurable webhook auth modes.
- Определить redaction/normalization policy для `last_error`.

## Implementation flow
1. Прочитать `implementation/rep.config.json`, затем применить указанные выше AP/PP из wrapper policy set до начала изменений в `implementation/`.
2. Сверить текущую schema и domain model с blessed contract из feature spec.
3. Удалить или запретить вариативность auth model на уровне domain/schema.
4. Добавить обязательные security fields и migration для existing subscriptions.
5. Зафиксировать runtime constants (`iss`, `alg`, TTL default source), чтобы они не читались из DB row.
6. Описать и реализовать policy для `last_error`: что можно хранить, что подлежит redaction.
7. Проверить, что downstream use-cases и runtime layer могут использовать этот контракт без fallback веток.

## Критерии готовности
- В schema нет полей под альтернативные webhook auth modes.
- Есть per-subscription shared secret и audience contract.
- `team-webhooks` domain contract отражает только JWT-only модель.
- migration/cutover notes не предлагают compat mode.

## DoD
- В domain и schema нельзя выразить `basic_auth`, `header_secret`, `JWKS` или `auth_mode`.
- Для существующих записей определён безопасный migration path под новые security fields.
- `last_error` policy описана достаточно чётко, чтобы UI и runtime не спорили о формате данных.
- Следующая задача может использовать schema и domain contract без дополнительных продуктовых решений.

## Тест кейсы
1. Schema валидирует обязательные security fields.
2. Нельзя создать subscription без `jwt_audience` и encrypted secret.
3. Никакой код не опирается на `auth_mode`, `JWKS` или legacy auth fields.
4. `last_error` policy исключает утечку raw secrets и auth headers.

## Зависимости
- [TEAMCAL-33](tasks/team-events-webhook/TEAMCAL-33.team-webhook-subscriptions.md)

## Лог
- 2026-04-10 13:15 — [todo] Задача создана после пересборки feature под JWT-only blessed path.
- 2026-04-10 14:09 — [in_progress] Начата реализация contract cut в implementation/: domain/schema/migration/test fixtures.
- 2026-04-10 17:34 — [testing] Пройдены targeted checks по domain contract, booking regression и owner webhook routes; generated migration вручную усилена backfill/cutover semantics.
- 2026-04-10 17:36 — [done] Созданы testing/retro artifacts, lesson вынесен в retro inbox, задача закрыта как completed.
