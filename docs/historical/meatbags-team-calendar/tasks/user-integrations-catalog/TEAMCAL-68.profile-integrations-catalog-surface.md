# TEAMCAL-68 — Profile integrations catalog surface

Статус: todo

## Описание
Добавить user-owned integrations catalog в `/profile`: API и UI для list/create/update/delete reusable webhook integrations и отображения usage by teams.

## Applied rules
- AP-018
- AP-019
- AP-020
- AP-021
- AP-026
- AP-032
- AP-039
- AP-041
- AP-051
- AP-052
- AP-054
- AP-064
- AP-068
- AP-069
- PP-018
- PP-019
- PP-021
- PP-023

## Перед реализацией прочитать
- Codex skills: `brainstorming`, `build-web-apps:shadcn`, `build-web-apps:react-best-practices`.
- `docs/user-integrations-catalog-prd.md`.
- `tasks/user-integrations-catalog/user-integrations-catalog.feature.md`.
- `tasks/user-integrations-catalog/TEAMCAL-67.canonical-schema-and-domain-cut.md`.
- `implementation/app/(pages)/profile/page.tsx`.
- `implementation/app/_components/profile-page-client.tsx`.
- `implementation/app/_components/profile-state.ts`.
- `implementation/app/api/me/settings/*`.
- `implementation/src/application/usecases/team-webhooks.ts`.

## Как применять правила
- `AP-018` и `AP-019`: новый `/profile` flow режется на маленькие business-purpose компоненты и модули (`catalog section`, `integration form`, `integration card`, `usage summary`, `destructive confirm`), а не расширяет `profile-page-client.tsx`.
- `AP-020`, `AP-021` и `AP-032`: `/profile` routes и client components должны вызывать отдельные use-cases и не тащить DB/business logic в page layer.
- `AP-026`, `AP-039` и `AP-041`: profile APIs работают только с integrations текущего пользователя.
- `AP-051`, `AP-052` и `PP-021`: integrations UI выносится в отдельный profile feature slice, а не врастает в текущий host-файл.
- `AP-054`, `AP-064`, `AP-068`, `AP-069`: UI должен иметь понятные empty/loading/error/destructive states и использовать shadcn-based composition.
- `PP-023`: так как задача меняет App Router routes, route handlers и profile page wiring, честный `npm run build` обязателен до закрытия.
- `PP-018` и `PP-019`: всё остаётся в App Router surface и без пустых catch-блоков.

## Контекстные файлы
- `implementation/app/(pages)/profile/page.tsx`
- `implementation/app/_components/profile-page-client.tsx`
- `implementation/app/_components/profile-state.ts`
- `implementation/app/api/me/settings/get-handler.ts`
- `implementation/app/api/me/settings/route.ts`
- `implementation/src/application/usecases/team-webhooks.ts`
- `docs/user-integrations-catalog-prd.md`

## Зона ответственности
- Владеет только user-owned catalog surface.
- Не владеет team settings enablement.
- Не владеет runtime delivery rewrite.

## Scope
- Добавить `/profile` integrations section.
- Добавить current-user API для catalog CRUD.
- Показать usage by teams.
- Не смешивать user catalog с team API tokens.

## Implementation flow
1. Поднять canonical contracts из `TEAMCAL-67` и зафиксировать, какие current-user queries/commands реально нужны для catalog CRUD и usage-by-team read model.
2. Спроектировать current-user API contracts и route handlers только для `/profile`, не трогая team routes и runtime delivery.
3. Вынести integrations UI в отдельный profile slice с маленькими файлами по бизнес-цели, оставив `profile-page-client.tsx` composition root.
4. Собрать empty/create/configured/delete states на shadcn layer и явно показать usage by teams без team operational controls.
5. Покрыть route/UI tests и прогнать честный build gate.

## Критерии готовности
- Пользователь может создать integration один раз в `/profile`.
- `/profile` не превращается в новый oversized host file.
- Team-only API tokens не появляются в user settings.

## DoD
- Есть current-user routes и tests.
- Есть bounded UI slice в `/profile`.
- Usage by teams отображается без смешения с team operational state.
- `profile-page-client.tsx` не становится новым oversized host file.
- `npm run build` проходит после route/API changes.

## Тест кейсы
1. User видит только свои integrations.
2. User может создать/обновить/удалить integration.
3. `/profile` показывает usage by teams.
4. API tokens не рендерятся в user settings.

## Зависимости
- [TEAMCAL-67](tasks/user-integrations-catalog/TEAMCAL-67.canonical-schema-and-domain-cut.md)
