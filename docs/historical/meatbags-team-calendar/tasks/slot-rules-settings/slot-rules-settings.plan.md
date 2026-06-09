# Implementation Plan — Slot Rules Settings

Дата: 2026-04-11  
Feature key: `slot-rules-settings`

## Цель плана
Перевести rules показа слотов и минимального окна бронирования из хардкода в канонический персональный settings contract с отдельными таблицами для personal defaults и team personal overrides, а итоговые правила команды считать как агрегат по участникам.

## Проверка синхронизации с PRD и specs
- PRD требует персональную модель: defaults в профиле, personal override в команде, read-only team aggregate, dynamic public aggregate.
- Specs фиксируют отдельные таблицы, full-record override, whole-reset semantics и aggregation contract.
- Этот plan не содержит team-wide editable settings и не возвращает owner-centric fallback.
- Feature DoD ниже проверяет те же outcomes: editable personal defaults, editable personal team override, reset, team aggregate, dynamic public summary и runtime cutover.

## Принципы
- Один bounded context slot rules, отделённый от `users`.
- No team-wide editable slot settings.
- Full-record personal override per team membership.
- Reset = delete override row.
- Team settings aggregate и public page aggregate имеют разную аудиторию, но не спорят по semantics.

## Архитектурные правила в scope

### Применяемые `AP-*`
- `AP-012` — Fail-fast и явные контракты ошибок
- `AP-013` — целостность пользовательских данных без скрытых фолбэков
- `AP-018` — ясность и одна ответственность
- `AP-019` — лимиты размера и смысловое дробление
- `AP-020` — Clean Architecture границы и composition root
- `AP-021` — тонкие entry points
- `AP-022` — typed errors и явная обработка исключений
- `AP-023` — async discipline / no floating promises
- `AP-026` — API-контракты и DTO границы
- `AP-032` — Command/Query Separation
- `AP-033` — атомарность команд на уровне БД
- `AP-039` — trusted auth boundary
- `AP-040` — авторизация на каждом защищённом use-case
- `AP-041` — object-level access и tenant isolation
- `AP-051` — frontend feature boundaries
- `AP-052` — разделение client/server/form state
- `AP-054` — устойчивые UI-состояния, доступность и деградация интерфейса

### Применяемые `PP-*`
- `PP-018` — Next.js App Router + Drizzle + pg-only runtime
- `PP-019` — запрет пустых catch-блоков
- `PP-021` — oversized host files do not absorb new feature UI
- `PP-022` — stale source-of-truth artifacts must be retired after architectural pivot
- `PP-023` — App Router changes require honest build and route gate
- `PP-025` — feature plan must fix rule mapping and task authoring contract before implementation
- `PP-026` — local+linear mirror only after clean write scopes are stable

## Как применять правила в этой фиче
- `AP-012`, `AP-022`: invalid slot-rule payloads, missing defaults rows и forbidden team access должны падать явно через typed/domain errors; silent fallback на хардкод запрещён.
- `AP-013`: отсутствие `user_slot_rule_settings` после migration/registration — это integrity incident, а не повод тихо подставить `14/10-20/12` в runtime.
- `AP-018`, `AP-019`, `AP-051`: slot-rules режутся на маленькие лаконичные business files; один file не должен одновременно владеть schema, effective resolver, route wiring и UI state.
- `AP-020`: defaults, overrides, effective member settings и aggregate calculation живут в domain/application, а route/UI only consume DTOs.
- `AP-021`, `AP-026`, `AP-032`: query-path (`GET /api/me/settings`, `GET /api/teams/:shareId/settings`, availability read model) и command-path (`PATCH/DELETE`) должны быть разведены по ответственности; route handlers не тащат вычисление aggregation внутрь handler-а.
- `AP-023`: async route/use-case flows должны быть await-safe; no floating promises в save/reset/update paths.
- `AP-033`: команды create/update/delete override должны быть атомарными на уровне одной записи и не оставлять partial state.
- `AP-039`, `AP-040`, `AP-041`: personal defaults редактирует только аутентифицированный current user; team override/reset доступны только текущему member соответствующей team; доступ к чужим override запрещён.
- `AP-052`, `AP-054`: `/profile`, team settings и public summary обязаны честно отражать loading/error/reset state, а client form state не должен подменять server truth скрытыми fallback-магиями.
- `PP-021`: новые sections и hooks режутся на sibling slices, а не встраиваются гигантской логикой в `profile-page-client.tsx`, `team-page-client.tsx` и `team-page-hooks.ts`.
- `PP-022`: старые owner-centric/task artifacts больше не должны выглядеть как активный implementation path.
- `PP-023`: route/runtime changes считаются незавершёнными без `npm run build`.
- `PP-026`: remote mirror и follow-up issues не плодим, пока write scopes по `TEAMCAL-75/76/77` не стабилизированы локально.

## Карта правил по slice-ам
- Slice 1 / `TEAMCAL-75`: `AP-012`, `AP-013`, `AP-018`, `AP-019`, `AP-020`, `AP-021`, `AP-022`, `AP-023`, `AP-026`, `AP-032`, `AP-033`, `AP-039`, `AP-040`, `AP-041`, `PP-018`, `PP-019`, `PP-022`, `PP-023`, `PP-025`
- Slice 2 / `TEAMCAL-76`: `AP-012`, `AP-018`, `AP-019`, `AP-021`, `AP-022`, `AP-023`, `AP-026`, `AP-039`, `AP-040`, `AP-041`, `AP-051`, `AP-052`, `AP-054`, `PP-018`, `PP-019`, `PP-021`, `PP-023`, `PP-025`
- Slice 3 / `TEAMCAL-77`: `AP-012`, `AP-013`, `AP-018`, `AP-019`, `AP-020`, `AP-021`, `AP-022`, `AP-023`, `AP-026`, `AP-032`, `AP-039`, `AP-040`, `AP-041`, `AP-051`, `AP-052`, `AP-054`, `PP-018`, `PP-019`, `PP-021`, `PP-023`, `PP-025`

## Task authoring contract
- Каждая implementation-задача по этой feature обязана содержать секции:
  - `Applied rules`
  - `Перед реализацией прочитать`
  - `Как применять правила`
- В `Перед реализацией прочитать` обязательно перечислять:
  - `implementation/rep.config.json`
  - `tasks/_policies/dev-plan.md`
  - `tasks/_policies/arch-patterns.md`
  - `tasks/_policies/project-patterns.md`
  - `tasks/slot-rules-settings/slot-rules-settings.feature.md`
  - `tasks/slot-rules-settings/slot-rules-settings.prd.md`
  - `tasks/slot-rules-settings/slot-rules-settings.specs.md`
  - `tasks/slot-rules-settings/slot-rules-settings.plan.md`
- В `Как применять правила` задача должна объяснять, как её write scope сохраняет personal model и не возвращает team-wide config.

## Feature DoD / release gate
- Пользователь редактирует defaults в `/profile`.
- В team settings пользователь редактирует только свои настройки для этой команды.
- Кнопка `Сбросить до настроек пользователя` удаляет командный override целиком.
- В team settings есть read-only aggregate по всем участникам команды.
- В team settings явно показан owner команды как team metadata, но не как source of truth для slot rules.
- На public team page summary правил динамически меняется вместе с member filter и runtime member set.
- Availability API и UI summary используют один и тот же aggregate contract.
- Локальные hardcoded fallback values больше не остаются source of truth.
- Изменения проходят route/UI tests и `npm run build`.

## Decomposition
- `TEAMCAL-75` — canonical slot-rules schema, defaults backfill and aggregation contract
- `TEAMCAL-76` — profile defaults and personal team override settings surfaces
- `TEAMCAL-77` — availability runtime cutover and dynamic public summary

## Dependency order
- Сначала зафиксировать schema, defaults lifecycle и aggregation contract в `TEAMCAL-75`.
- Затем подключить `/profile` и team settings surfaces к этому контракту в `TEAMCAL-76`.
- После этого перевести availability runtime и public summary на dynamic aggregate в `TEAMCAL-77`.

## Ownership boundaries
- `TEAMCAL-75`: tables, migration, defaults backfill, domain validation, aggregation helpers, DTO contracts.
- `TEAMCAL-76`: profile settings UI/API, team personal override UI/API, reset action, read-only team aggregate section.
- `TEAMCAL-77`: availability route cutover, public team summary cleanup, member-filter-synced runtime aggregate and regression gate.

## File reservations
- `TEAMCAL-75`:
  - `implementation/src/infrastructure/db/schema.ts`
  - `implementation/src/infrastructure/db/schema-pg/index.ts`
  - `implementation/src/infrastructure/db/schema-common.ts`
  - `implementation/drizzle/*`
  - `implementation/src/domain/slot-rules/*`
  - `implementation/src/application/usecases/*`
- `TEAMCAL-76`:
  - `implementation/app/api/me/settings/*`
  - `implementation/app/api/teams/[shareId]/settings/*`
  - `implementation/app/api/teams/[shareId]/team-handler.ts`
  - new reset route
  - `implementation/app/_components/profile-*`
  - `implementation/app/_components/team-page/*`
- `TEAMCAL-77`:
  - `implementation/app/api/teams/[shareId]/availability/get-handler.ts`
  - `implementation/app/_components/team-page/team-page-hooks.ts`
  - `implementation/app/_components/team-page/team-page-slots-section.tsx`
  - related route/UI tests

## Integration task
- `TEAMCAL-77`

## Required implementation task list
- `TEAMCAL-75`
- `TEAMCAL-76`
- `TEAMCAL-77`

## Чёткие шаги программирования решения
1. Добавить таблицы `user_slot_rule_settings` и `team_member_slot_rule_overrides`, обновить schema manifests и migration files.
2. Написать backfill migration для существующих пользователей со значениями `14/10/20/12`.
3. Обновить user registration path, чтобы defaults row создавался автоматически.
4. Вынести системные defaults, validators и aggregation helpers в новый bounded slice `slot-rules`.
5. Реализовать effective member settings resolver и aggregate calculator.
6. Расширить `GET/PATCH /api/me/settings` для personal defaults.
7. Расширить team settings contracts: мои effective team settings, read-only team aggregate, create/update override и whole-reset.
8. Явно вернуть owner metadata в team settings contract и отрендерить её как read-only context, не смешивая с slot-rules ownership.
9. Вынести profile/team settings UI в отдельные sibling components и hooks с маленькими бизнес-ролями.
10. Перевести availability handler и public slot summary на dynamic aggregate по runtime member set.
11. Добавить route/use-case/UI regression tests и прогнать build gate.

## Testing strategy
- Route/use-case tests на defaults lifecycle, override lifecycle, reset semantics и aggregation contract.
- Next UI tests на `/profile`, team settings и public summary/member-filter sync.
- `npm run test`
- `npm run test:unit:next-routes`
- `npm run test:unit:next-ui`
- `npm run build`

## Риски внедрения
- Самый опасный product bug: public summary не будет меняться вместе с member filter.
- Самый опасный contract bug: team settings aggregate и public runtime aggregate начнут считаться по разным правилам.
- Самый опасный data bug: registration/backfill оставят пользователей без defaults rows.
- Самый опасный UI bug: в team settings снова появится видимость team-wide editable config.

## Что сознательно не делаем сейчас
- timezone settings
- slot duration settings
- partial field reset
- active/inactive participants
- warning UX для `start >= end`
