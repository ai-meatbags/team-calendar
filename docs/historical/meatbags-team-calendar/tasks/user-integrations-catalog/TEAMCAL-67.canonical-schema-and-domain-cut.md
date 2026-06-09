# TEAMCAL-67 — Canonical schema and domain cut for user integrations and team bindings

Статус: in_progress

## Описание
Заменить provisional team-only webhook model на каноническую persistence/domain model: user-owned integration definitions + team webhook bindings, с прямой миграцией всех текущих webhook-данных.

## Applied rules
- AP-018
- AP-019
- AP-010
- AP-020
- AP-021
- AP-026
- AP-032
- AP-039
- AP-040
- AP-041
- AP-042
- AP-043
- AP-049
- AP-050
- AP-061
- AP-067
- PP-018
- PP-019
- PP-024

## Перед реализацией прочитать
- Codex skills: `brainstorming`, `postgres`, `build-web-apps:supabase-postgres-best-practices`.
- `implementation/rep.config.json` и зафиксировать split repo reality.
- `tasks/_policies/arch-patterns.md`: `AP-018`, `AP-019`, `AP-010`, `AP-020`, `AP-021`, `AP-026`, `AP-032`, `AP-039`, `AP-040`, `AP-041`, `AP-042`, `AP-043`, `AP-049`, `AP-050`, `AP-061`, `AP-067`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`, `PP-024`.
- `docs/user-integrations-catalog-prd.md`.
- `tasks/user-integrations-catalog/user-integrations-catalog.feature.md`.
- `implementation/src/infrastructure/db/schema.ts`.
- `implementation/src/infrastructure/db/schema-pg/index.ts`.
- `implementation/src/domain/team-webhooks.ts`.
- `implementation/src/application/usecases/team-webhooks.ts`.

## Как применять правила
- `AP-018` и `AP-019`: schema/domain cut нельзя собирать в новый giant-module; `user integrations`, `team bindings` и migration helpers должны жить в маленьких файлах с одной бизнес-ролью.
- `AP-010`, `AP-020` и `AP-032`: persistence и domain должны явно разделить `user integration definition` и `team webhook binding`; use-case слой не должен оставаться владельцем неявной старой team-only модели.
- `AP-021`: текущие route handlers не должны получить business-логику миграции; schema/domain cut делается ниже entry points.
- `AP-026`: новый schema contract должен быть достаточен для profile catalog и team bindings, без дальнейших скрытых reinterpretations в UI.
- `AP-039`, `AP-040` и `AP-041`: новая модель должна сохранить user ownership и team isolation как отдельные границы данных.
- `AP-042`, `AP-043` и `PP-024`: security-sensitive migration по secret/audience полям должна быть явной и ручной, а не просто generated SQL без cutover semantics.
- `AP-049` и `AP-050`: lifecycle states и статусы в новой схеме должны быть контрактом, а не свободным текстом.
- `AP-061`: миграция должна быть детерминированной, с явным порядком backfill и retire старой схемы; нельзя оставлять полурабочий промежуточный контракт.
- `PP-018` и `PP-019`: все изменения остаются в Next/Drizzle runtime и без пустых catch-блоков.

## Контекстные файлы
- `implementation/src/infrastructure/db/schema.ts`
- `implementation/src/infrastructure/db/schema-pg/index.ts`
- `implementation/src/infrastructure/db/schema-common.ts`
- `implementation/src/domain/team-webhooks.ts`
- `implementation/src/application/usecases/team-webhooks.ts`
- `implementation/drizzle/*`
- `implementation/app/api/teams/[shareId]/integrations/webhooks/route.test.ts`
- `implementation/app/api/booking/route.test.ts`
- `docs/user-integrations-catalog-prd.md`

## Зона ответственности
- Владеет schema/domain redesign и миграцией данных.
- Не владеет profile UI/API.
- Не владеет team settings composition.
- Должна подготовить безопасный canonical contract для `TEAMCAL-68` и `TEAMCAL-69`.

## Scope
- Добавить canonical таблицы для user-owned integrations и team bindings.
- Переложить все текущие webhook rows в новую модель прямой миграцией.
- Убрать old schema assumptions из domain/use-case слоя.
- Сохранить JWT-only delivery contract как binding-level semantics.

## Implementation flow
1. Зафиксировать целевые сущности и ownership boundary: `user integration definition` и `team webhook binding`, включая secret/audience semantics только там, где они реально нужны.
2. Спроектировать canonical schema и migration contract так, чтобы все текущие webhook rows напрямую переехали в новую структуру без dual-write и legacy-read path.
3. Разнести domain/persistence helpers по маленьким модулям с одной бизнес-ролью: enum/status helpers отдельно от query/command mapping и отдельно от migration-specific glue.
4. Переписать application-layer query/command contracts на canonical persistence model, убрав старый table contract как source of truth.
5. Обновить schema tests и route-adjacent tests, чтобы зафиксировать новый persistence contract для последующих `TEAMCAL-68` и `TEAMCAL-69`.
6. Остановиться на compile-safe wiring; не забирать в задачу `/profile` UI или team settings composition.

## Критерии готовности
- Новая схема отражает canonical ownership model.
- Все текущие webhook-данные мигрируются в новую структуру.
- Старый team-only table contract перестаёт быть основным источником истины.
- `TEAMCAL-68` и `TEAMCAL-69` могут опираться на новый persistence/domain contract без дополнительного schema redesign.

## DoD
- Есть migration и schema snapshot под canonical model.
- Старый `team-only` table contract либо удалён, либо явно переведён в retired state и больше не читается application-layer кодом как основной источник истины.
- Domain/use-case слой не привязан к provisional team-only ownership assumptions.
- Route/runtime tests, зависящие от persistence contract, обновлены и проходят.
- Задача не добавляет временный dual-write или legacy fallback path.

## Тест кейсы
1. Existing webhook rows мигрируют в user integration definitions + team bindings.
2. Secret/audience semantics сохраняются на уровне team binding.
3. Duplicate target logic и ownership boundaries работают на новой схеме.
4. Booking/runtime tests компилируются и подтверждают новый persistence contract.

## Зависимости
- [TEAMCAL-66](tasks/user-integrations-catalog/TEAMCAL-66.user-integrations-catalog-prd-and-scope.md)

## Лог
- 2026-04-10 19:18 — [todo] Task created as first implementation slice after PRD freeze.
- 2026-04-10 19:20 — [in_progress] Started canonical schema/domain cut: current `team_webhook_subscriptions` contract reviewed in schema/use-case layer; next step is to define replacement tables and direct migration semantics.
