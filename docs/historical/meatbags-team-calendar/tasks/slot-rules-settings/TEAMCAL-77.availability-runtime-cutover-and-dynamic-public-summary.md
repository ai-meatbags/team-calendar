# TEAMCAL-77 — Availability runtime cutover and dynamic public summary

Статус: done

## Описание
Перевести availability runtime и public slot summary с хардкоженных slot-rule constants на канонический aggregate contract, чтобы member filter и runtime member set управляли и слотами, и блоком `Правила показа` синхронно.

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
- AP-039
- AP-040
- AP-041
- AP-051
- AP-052
- AP-054
- PP-018
- PP-019
- PP-021
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
- `tasks/slot-rules-settings/TEAMCAL-75.canonical-slot-rules-schema-and-resolver.md`
- `tasks/slot-rules-settings/TEAMCAL-76.profile-defaults-and-team-personal-settings-surfaces.md`
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts`
- `implementation/app/api/teams/availability.route.test.ts`
- `implementation/app/_components/team-page/team-page-hooks.ts`
- `implementation/app/_components/team-page/team-page-client.tsx`
- `implementation/app/_components/team-page/team-page-slots-section.tsx`
- `implementation/app/_components/team-page/team-page-state.ts`
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/_components/team-page/team-page-acceptance.test.ts`

## Как применять правила
- `AP-012`, `AP-022`: invalid member filter, missing defaults rows и broken runtime aggregate должны падать явно; клиентский summary не имеет права тихо возвращаться к старому `14 / 10-20 / 12`.
- `AP-013`: если runtime member set не может быть рассчитан на канонических данных, это integrity/runtime incident, а не повод подставить legacy constants.
- `AP-018`, `AP-019`, `AP-051`: runtime aggregate, summary mapping и public page UI-state режутся на маленькие лаконичные business files; `team-page-hooks.ts` и `team-page-client.tsx` остаются host/composition слоями.
- `AP-020`, `AP-021`, `AP-026`, `AP-032`: availability route остаётся thin query entry point и потребляет готовый aggregate contract из application/domain слоя; command logic сюда не возвращается.
- `AP-023`: обновление availability/runtime summary не должно оставлять floating promises в hooks и refresh-paths.
- `AP-039`, `AP-040`, `AP-041`: public runtime использует только разрешённый data set команды и member filter; нельзя утянуть приватные настройки или чужие identifiers за пределы allowlist DTO.
- `AP-052`, `AP-054`: public summary должен честно показывать loading/error/data state и синхронно меняться вместе с member filter и availability results.
- `PP-021`: не встраивать новый aggregate/state machine обратно в oversized host files; вынести sibling helpers/hooks/components.
- `PP-023`: availability route boundary и App Router changes закрываются только после `npm run build`.
- `PP-025`: write scope этой задачи ограничен runtime cutover и public summary; schema/settings CRUD не возвращаются сюда.

## Контекстные файлы
- `tasks/slot-rules-settings/slot-rules-settings.feature.md`
- `tasks/slot-rules-settings/slot-rules-settings.prd.md`
- `tasks/slot-rules-settings/slot-rules-settings.specs.md`
- `tasks/slot-rules-settings/slot-rules-settings.plan.md`
- `tasks/slot-rules-settings/TEAMCAL-75.canonical-slot-rules-schema-and-resolver.md`
- `tasks/slot-rules-settings/TEAMCAL-76.profile-defaults-and-team-personal-settings-surfaces.md`
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts`
- `implementation/app/api/teams/availability.route.test.ts`
- `implementation/app/_components/team-page/team-page-hooks.ts`
- `implementation/app/_components/team-page/team-page-client.tsx`
- `implementation/app/_components/team-page/team-page-slots-section.tsx`
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/_components/team-page/team-page-acceptance.test.ts`

## Зона ответственности
- Владеет availability runtime cutover на canonical slot-rules aggregate.
- Владеет public `Правила показа` summary и sync с member filter.
- Владеет удалением client-side hardcoded fallback как source of truth.
- Не владеет schema/migration/defaults lifecycle.
- Не владеет profile/team settings CRUD surfaces.

## Scope
- Убрать hardcoded `DAYS`, `WORKDAY_START_HOUR`, `WORKDAY_END_HOUR`, `MIN_BOOKING_NOTICE_HOURS` из availability runtime как source of truth.
- Перевести runtime на effective member slot rules + aggregate по фактическому selected/runtime member set.
- Удалить legacy client fallback summary из team-page hooks.
- Обновить public summary так, чтобы он менялся вместе с member filter и тем же availability response.

## Implementation flow
1. Подтвердить, что `TEAMCAL-75` отдал канонический runtime aggregate contract, а `TEAMCAL-76` не держит client-only fallback semantics.
2. Перевести `GET /api/teams/:shareId/availability` на application/domain aggregate вместо локальных constants.
3. Зафиксировать allowlist response contract для public summary: `days`, `workdayStartHour`, `workdayEndHour`, `minNoticeHours`, `timeMin`, `timeMax`, `selectedMemberFilter`, `slots`.
4. Убрать из client hooks локальный fallback `14 / 10-20 / 12` и перейти на честный loading/error/data state.
5. Вынести summary formatting и runtime response mapping в sibling files малого размера, не раздувая host files.
6. Добавить route/UI regression tests на member-filter sync и прогнать build gate.

## Критерии готовности
- Availability runtime считает slot rules по тому же runtime member set, по которому считает слоты.
- Public summary меняется вместе с member filter и не живёт отдельно от availability response.
- Legacy hardcoded slot-rule constants больше не являются runtime source of truth.
- Ошибки runtime aggregate не маскируются тихим fallback на старые значения.

## DoD
- Availability route потребляет canonical aggregate contract.
- Public summary и availability response синхронизированы по одному runtime member set.
- Client hook не содержит legacy hardcoded summary fallback.
- Есть route/UI regression tests на member-filter sync и loading/error states.
- `npm run test:unit:next-routes`
- `npm run test:unit:next-ui`
- `npm run build`

## Тест кейсы
1. `GET /api/teams/:shareId/availability` возвращает aggregate по всем members, если member filter пустой.
2. `GET /api/teams/:shareId/availability?member=...` возвращает aggregate по выбранному member set.
3. Public summary меняет window/hours/minNotice вместе с member filter.
4. При route failure UI показывает error state без возврата к локальному `14 / 10-20 / 12`.
5. Route не возвращает slot-rule data вне allowlist contract.

## Зависимости
- [Feature dossier](tasks/slot-rules-settings/slot-rules-settings.feature.md)
- [PRD](tasks/slot-rules-settings/slot-rules-settings.prd.md)
- [Specs](tasks/slot-rules-settings/slot-rules-settings.specs.md)
- [Implementation plan](tasks/slot-rules-settings/slot-rules-settings.plan.md)
- [TEAMCAL-75](tasks/slot-rules-settings/TEAMCAL-75.canonical-slot-rules-schema-and-resolver.md)
- [TEAMCAL-76](tasks/slot-rules-settings/TEAMCAL-76.profile-defaults-and-team-personal-settings-surfaces.md)

## Лог
- 2026-04-11 16:20 — [todo] Integration task создан для runtime cutover и удаления hardcoded client/runtime slot-rule fallback.
- 2026-04-11 16:52 — [done] Availability runtime переведён на канонический aggregate contract: `GET /api/teams/[shareId]/availability` считает правила показа по тому же runtime member set, что и сами слоты. Public summary на team page теперь живёт в одном response contract с availability и синхронно меняется вместе с member filter; legacy fallback `14 / 10-20 / 12` удалён как source of truth. Одновременно разрезаны oversized host files вокруг team page (`team-page-client`, `team-page-hooks`) на маленькие sibling modules для availability, booking, header, actions и settings-page composition. Проверка: `npm run test`, `npm run test:unit:next-routes`, `npm run test:unit:next-ui`, `npm run build`.
