# TEAMCAL-75 — Canonical slot-rules schema, defaults lifecycle and aggregation contract

Статус: done

## Описание
Собрать канонический backend-contract для slot rules: отдельные таблицы для personal defaults и team personal overrides, backfill/defaults lifecycle, validation и aggregation helpers, чтобы profile/team UI и availability runtime опирались на один source of truth.

## Applied rules
- AP-012
- AP-013
- AP-018
- AP-019
- AP-020
- AP-021
- AP-022
- AP-023
- AP-026
- AP-032
- AP-033
- AP-039
- AP-040
- AP-041
- PP-018
- PP-019
- PP-022
- PP-023
- PP-025

## Перед реализацией прочитать
- `implementation/rep.config.json`
- `tasks/_policies/dev-plan.md`
- `tasks/_policies/arch-patterns.md`
- `tasks/_policies/project-patterns.md`
- `tasks/slot-rules-settings/slot-rules-settings.feature.md`
- `tasks/slot-rules-settings/slot-rules-settings.prd.md`
- `tasks/slot-rules-settings/slot-rules-settings.specs.md`
- `tasks/slot-rules-settings/slot-rules-settings.plan.md`
- `implementation/src/infrastructure/db/schema.ts`
- `implementation/src/infrastructure/db/schema-pg/index.ts`
- `implementation/src/infrastructure/db/schema-common.ts`
- `implementation/src/application/usecases/get-current-user.ts`
- `implementation/src/application/usecases/team-page.ts`
- `implementation/app/api/me/settings/get-handler.ts`
- `implementation/app/api/teams/[shareId]/settings/get-handler.ts`
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts`

## Как применять правила
- `AP-012`, `AP-022`: invalid payloads, missing defaults rows и broken team membership state должны завершаться явной typed/domain error, а не no-op или hidden fallback.
- `AP-013`: отсутствие default rows после backfill/registration считается data-integrity bug; нельзя тихо возвращать system constants вместо строки пользователя.
- `AP-018`, `AP-019`: schema helpers, validators, effective resolver и aggregate calculator режутся на маленькие лаконичные business files с одной ответственностью.
- `AP-020`: defaults lifecycle, effective member settings и aggregate calculation должны жить в domain/application, а не в routes и не в React state.
- `AP-021`, `AP-026`, `AP-032`: эта задача обязана вернуть маленькие query/command DTO/use-case entry points для profile settings, team settings и availability runtime без дублирования business logic.
- `AP-023`: async DB/update paths закрываются без floating promises.
- `AP-033`: backfill, create defaults row и override lifecycle должны быть атомарными на уровне одной команды/одной записи.
- `AP-039`, `AP-040`, `AP-041`: canonical resolver обязан уважать current user и team membership boundary; доступ к чужим personal settings через shareId невозможен.
- `PP-018`: schema/runtime остаются внутри current Next.js + Drizzle + pg-only контура.
- `PP-019`: parse/validation/migration code не использует пустые catch-блоки и не маскирует data errors.
- `PP-022`: task packet и code comments не должны возвращать owner-centric/stale source of truth.
- `PP-023`: route contract changes не считаются законченными без build gate.
- `PP-025`: write scope ограничен canonical contract; UI composition сюда не затягивается.

## Контекстные файлы
- `tasks/slot-rules-settings/slot-rules-settings.feature.md`
- `tasks/slot-rules-settings/slot-rules-settings.prd.md`
- `tasks/slot-rules-settings/slot-rules-settings.specs.md`
- `tasks/slot-rules-settings/slot-rules-settings.plan.md`
- `implementation/src/infrastructure/db/schema.ts`
- `implementation/src/infrastructure/db/schema-pg/index.ts`
- `implementation/src/infrastructure/db/schema-common.ts`
- `implementation/drizzle/*`
- `implementation/src/application/usecases/get-current-user.ts`
- `implementation/src/application/usecases/team-page.ts`
- `implementation/app/api/me/settings/*`
- `implementation/app/api/teams/[shareId]/settings/*`
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts`

## Зона ответственности
- Владеет таблицами, миграциями и defaults lifecycle.
- Владеет validation, effective member resolver и aggregation contract.
- Владеет DTO contracts для profile/team settings и availability runtime.
- Не владеет profile/team UI composition.
- Не владеет финальным public summary wiring на клиенте.

## Scope
- Добавить таблицы `user_slot_rule_settings` и `team_member_slot_rule_overrides`.
- Реализовать backfill существующих пользователей и defaults creation для новых.
- Вынести системные defaults и validation для slot rules.
- Реализовать:
  - effective member settings in team
  - team aggregate by all members
  - runtime aggregate by selected member set
- Подготовить use-case/API DTO contracts для profile settings, team settings и availability runtime.

## Implementation flow
1. Добавить новые таблицы в Drizzle schema и schema manifest.
2. Создать migration:
   - schema create
   - backfill `user_slot_rule_settings` для существующих пользователей значениями `14/10/20/12`
3. Найти и обновить user creation path так, чтобы defaults row создавался автоматически.
4. Создать bounded slice `implementation/src/domain/slot-rules/*` с validators, constants и pure aggregation helpers.
5. Реализовать application-level contracts для:
   - `get/update user defaults`
   - `get/create/update/delete team member override`
   - `resolve effective team member settings`
   - `compute aggregate for member set`
6. Подготовить route-level DTO contracts:
   - `/api/me/settings`
   - `/api/teams/:shareId/settings`
   - availability runtime consumer contract
7. Добавить tests на defaults lifecycle, override lifecycle, reset semantics и aggregation, затем прогнать build gate.

## Критерии готовности
- Есть отдельные таблицы для defaults и overrides.
- У всех существующих пользователей после миграции есть defaults row.
- У новых пользователей defaults row создаётся автоматически.
- Есть pure helpers для `days=max`, `start=max`, `end=min`, `notice=max`.
- Settings/runtime contracts готовы к подключению UI без повторного business logic copy-paste.

## DoD
- Drizzle schema, manifest и migration artifacts обновлены.
- Defaults backfill и registration lifecycle покрыты тестами или надёжно проверены route/use-case checks.
- Domain/application contract покрыт тестами.
- Current-user/team settings routes могут отдать согласованный slot-rules DTO contract.
- Availability runtime может потреблять canonical aggregate contract.
- `npm run test`
- `npm run test:unit:next-routes`
- `npm run build`

## Тест кейсы
1. Existing users receive backfilled defaults rows.
2. New user lifecycle creates defaults row automatically.
3. Team member without override uses personal defaults.
4. Team member with override uses full override record.
5. Reset deletes override row and falls back to defaults.
6. Aggregate helpers compute:
   - `days = max`
   - `start = max`
   - `end = min`
   - `notice = max`
7. Invalid ranges (`end <= start`, `days > 30`) receive `400`.

## Зависимости
- [Feature dossier](tasks/slot-rules-settings/slot-rules-settings.feature.md)
- [PRD](tasks/slot-rules-settings/slot-rules-settings.prd.md)
- [Specs](tasks/slot-rules-settings/slot-rules-settings.specs.md)
- [Implementation plan](tasks/slot-rules-settings/slot-rules-settings.plan.md)

## Лог
- 2026-04-11 15:07 — [todo] Задача создана как canonical backend slice для slot rules без owner-centric inheritance и без UI-level fallback.
- 2026-04-11 16:45 — [done] Реализованы отдельные таблицы `user_slot_rule_settings` и `team_member_slot_rule_overrides`, migration `implementation/drizzle/migrations/0006_slot_rule_settings.sql`, backfill existing users, domain/application contract для defaults/overrides/aggregate, обновлены route consumers для `/api/me/settings`, `/api/teams/[shareId]/settings` и availability runtime. Дополнительно добавлен startup execution migrations через `implementation/src/infrastructure/db/apply-runtime-migrations.ts` и `implementation/scripts/with-default-postgres.ts`, чтобы embedded Postgres не падал на отсутствии новой схемы. Проверка: `npm run test`, `npm run test:unit:db`, `npm run build`.
