# TEAMCAL-76 — Profile defaults and team personal settings surfaces

Статус: done

## Описание
Подключить канонический slot-rules contract к пользовательским surface-ам: `/profile` для personal defaults и team settings для personal team override плюс read-only aggregate по всей команде.

## Applied rules
- AP-012
- AP-018
- AP-019
- AP-021
- AP-022
- AP-023
- AP-026
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
- `implementation/app/(pages)/profile/page.tsx`
- `implementation/app/_components/profile-page-client.tsx`
- `implementation/app/api/me/settings/*`
- `implementation/app/_components/team-page/*`
- `implementation/app/api/teams/[shareId]/settings/*`
- `implementation/app/api/teams/[shareId]/team-handler.ts`

## Как применять правила
- `AP-012`, `AP-022`: invalid form payloads, reset errors и forbidden team access должны проявляться явно в route/UI state, а не прятаться в generic toast without state parity.
- `AP-018`, `AP-019`, `AP-051`: profile/team settings режутся на маленькие лаконичные business files; host files остаются composition root, а не владельцами всей формы.
- `AP-021`, `AP-026`: profile/team routes и client components должны потреблять готовые DTO из `TEAMCAL-75`, не пересчитывая effective settings и aggregate на клиенте.
- `AP-023`: save/reset flows не оставляют floating promises и закрывают pending state честно.
- `AP-039`, `AP-040`, `AP-041`: UI/API не дают редактировать чужие overrides; reset/save работают только для current member своей команды.
- `AP-052`, `AP-054`: `/profile` и team settings обязаны честно показывать loading, saving, reset, error и no-override states без скрытых fallback-магий и без смешения server truth с локальным form state.
- `PP-021`: новые settings sections, form state и aggregate view выносятся в маленькие sibling modules; нельзя врастить их обратно в `profile-page-client.tsx`, `team-page-client.tsx` или `team-page-hooks.ts`.
- `PP-018` и `PP-019`: весь UI/API wiring остаётся в App Router surface и без пустых catch-блоков.
- `PP-023`: route changes и new reset action закрываются только после build gate.
- `PP-025`: write scope этой задачи ограничен settings surfaces; availability runtime cutover остаётся в `TEAMCAL-77`.

## Контекстные файлы
- `tasks/slot-rules-settings/slot-rules-settings.feature.md`
- `tasks/slot-rules-settings/slot-rules-settings.prd.md`
- `tasks/slot-rules-settings/slot-rules-settings.specs.md`
- `tasks/slot-rules-settings/slot-rules-settings.plan.md`
- `tasks/slot-rules-settings/TEAMCAL-75.canonical-slot-rules-schema-and-resolver.md`
- `implementation/app/(pages)/profile/page.tsx`
- `implementation/app/_components/profile-page-client.tsx`
- `implementation/app/api/me/settings/*`
- `implementation/app/_components/team-page/team-page-client.tsx`
- `implementation/app/_components/team-page/team-page-hooks.ts`
- `implementation/app/_components/team-page/team-page-state.ts`
- `implementation/app/api/teams/[shareId]/settings/*`
- `implementation/app/api/teams/[shareId]/team-handler.ts`

## Зона ответственности
- Владеет profile defaults UI/API surface.
- Владеет team personal override UI/API surface.
- Владеет reset action и read-only team aggregate section.
- Не владеет schema/migration/defaults lifecycle.
- Не владеет public availability runtime cutover.

## Scope
- Добавить в `/profile` секцию `Мои правила по умолчанию`.
- Подключить `GET/PATCH /api/me/settings` для personal defaults.
- Добавить в team settings секцию `Мои настройки в этой команде`.
- Дать пользователю сохранить для себя полный override.
- Реализовать `Сбросить до настроек пользователя`.
- Добавить read-only секцию `Итог для команды` по всем участникам команды.
- Явно показать owner команды как team metadata, не как источник slot rules.

## Implementation flow
1. Подтвердить, что `TEAMCAL-75` отдал готовые DTO/use-case contracts для personal defaults, personal team override, reset и team aggregate.
2. Расширить `/api/me/settings` на чтение и сохранение personal defaults без смешения с profile-name и calendar selection flow.
3. Вынести profile slot-rules UI в отдельный bounded slice рядом с `profile-page-client.tsx`, оставив host file composition root.
4. Расширить team settings route/contracts на:
   - мои effective team settings
   - create/update full override
   - reset override
   - read-only team aggregate
5. Вынести team settings UI в отдельные sibling sections: editable personal settings, reset CTA, read-only team aggregate.
6. Добавить route/UI tests и прогнать build gate.

## Критерии готовности
- Пользователь может изменить свои defaults в `/profile`.
- Пользователь может сохранить отдельные настройки для себя в конкретной команде.
- Reset удаляет командный override целиком и возвращает чтение из personal defaults.
- Team settings показывают read-only aggregate по всем участникам команды.
- Team settings явно показывают owner команды.
- UI нигде не создаёт иллюзию team-wide editable slot settings.

## DoD
- `/profile` получает bounded slot-rules settings section.
- Team settings получают bounded sections для personal override и team aggregate.
- Route contracts не дублируют aggregation logic на клиенте.
- Есть tests на save/reset/profile/team states.
- `npm run test:unit:next-routes`
- `npm run test:unit:next-ui`
- `npm run build`

## Тест кейсы
1. `/profile` рендерит текущие personal defaults и сохраняет полный payload.
2. Team settings показывают мои effective team settings и `hasOverride`.
3. Save в team settings создаёт/обновляет только мой override.
4. Reset удаляет мой override и возвращает значения из personal defaults.
5. Team settings показывают read-only aggregate по всем участникам команды.
6. Team settings явно показывают owner команды read-only.
7. UI не содержит editable team-wide slot settings controls.

## Зависимости
- [Feature dossier](tasks/slot-rules-settings/slot-rules-settings.feature.md)
- [PRD](tasks/slot-rules-settings/slot-rules-settings.prd.md)
- [Specs](tasks/slot-rules-settings/slot-rules-settings.specs.md)
- [Implementation plan](tasks/slot-rules-settings/slot-rules-settings.plan.md)
- [TEAMCAL-75](tasks/slot-rules-settings/TEAMCAL-75.canonical-slot-rules-schema-and-resolver.md)

## Лог
- 2026-04-11 15:37 — [todo] Задача создана как settings-surface slice для `/profile` и team settings поверх канонического slot-rules contract.
- 2026-04-11 16:58 — [done] Подключены profile defaults и team personal override surfaces: `/api/me/settings` читает и сохраняет personal defaults, `/api/teams/[shareId]/settings` и `/api/teams/[shareId]/settings/slot-rules` отдают мои team settings, owner metadata и read-only aggregate по всей команде. Team settings вынесены на отдельную страницу `/t/[shareId]/settings`, модальный слой убран из booking host. Код разрезан на маленькие business files (`team-settings-form-section`, `team-settings-slot-rules`, `team-settings-webhooks`, `team-settings-page-hooks`, `profile-settings-card`). После UI feedback профиль пересобран в один card в языке team page: больше нет двух разъехавшихся panels, slot-rule inputs стали компактными и не тянутся на всю ширину. Проверка: `npm run test:unit:next-ui`, `npm run build`.
