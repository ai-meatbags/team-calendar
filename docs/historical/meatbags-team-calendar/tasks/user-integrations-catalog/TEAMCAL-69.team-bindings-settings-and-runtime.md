# TEAMCAL-69 — Team bindings settings and webhook runtime rewrite

Статус: todo

## Описание
Пересобрать team settings и webhook runtime вокруг team bindings: команда видит доступные user-owned integrations, включает их для себя, а booking runtime читает team bindings вместо provisional team-only subscriptions.

## Applied rules
- AP-018
- AP-019
- AP-024
- AP-020
- AP-021
- AP-026
- AP-032
- AP-035
- AP-039
- AP-040
- AP-041
- AP-042
- AP-043
- AP-044
- AP-051
- AP-052
- AP-054
- PP-018
- PP-019
- PP-021
- PP-023

## Перед реализацией прочитать
- Codex skills: `brainstorming`, `build-web-apps:shadcn`, `build-web-apps:react-best-practices`.
- `docs/user-integrations-catalog-prd.md`.
- `tasks/user-integrations-catalog/user-integrations-catalog.feature.md`.
- `tasks/user-integrations-catalog/TEAMCAL-67.canonical-schema-and-domain-cut.md`.
- `implementation/app/_components/team-page/*`.
- `implementation/app/api/teams/[shareId]/integrations/webhooks/*`.
- `implementation/app/api/booking/route.ts`.
- `implementation/src/application/usecases/team-webhooks.ts`.
- `implementation/src/infrastructure/notifications/team-webhook-delivery.ts`.
- `implementation/src/infrastructure/notifications/team-webhook-jwt.ts`.

## Как применять правила
- `AP-018` и `AP-019`: новый team enablement flow режется на маленькие компоненты и sibling modules по бизнес-цели; нельзя снова наращивать `team-page-client.tsx` и `team-page-hooks.ts` как host-файлы.
- `AP-020`, `AP-021` и `AP-032`: team routes/UI должны опираться на canonical binding use-cases, а booking route оставаться тонким wiring layer.
- `AP-024`: runtime/status logging не должен светить secrets, plaintext JWT или чувствительные delivery details.
- `AP-035`: enable/disable/runtime semantics не должны ломать идемпотентность внешних delivery attempts.
- `AP-039`, `AP-040` и `AP-041`: team bindings доступны только owner-операциям и остаются team-scoped.
- `AP-042`, `AP-043` и `AP-044`: provisioning/delivery contract остаётся JWT-only и не размывается через shared endpoint reuse.
- `AP-051`, `AP-052`, `AP-054` и `PP-021`: team settings UX строится отдельными business components и не врастает обратно в host-file.
- `PP-023`: route changes обязаны пройти честный App Router gate, включая build.

## Контекстные файлы
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`
- `implementation/app/_components/team-page/team-webhook-settings-contract.ts`
- `implementation/app/_components/team-page/team-webhook-onboarding-card.tsx`
- `implementation/app/_components/team-page/team-webhook-provisioning-card.tsx`
- `implementation/app/_components/team-page/team-webhook-subscription-card.tsx`
- `implementation/app/_components/team-page/team-page-hooks.ts`
- `implementation/app/_components/team-page/team-page-state.ts`
- `implementation/app/api/teams/[shareId]/integrations/webhooks/*`
- `implementation/app/api/booking/route.ts`
- `implementation/app/api/booking/route.test.ts`
- `implementation/src/application/usecases/team-webhooks.ts`
- `implementation/src/infrastructure/notifications/team-webhook-delivery.ts`
- `implementation/src/infrastructure/notifications/team-webhook-jwt.ts`

## Зона ответственности
- Владеет team binding management surface и runtime rewrite.
- Не владеет `/profile` catalog surface.
- Не владеет team API token subsystem beyond keeping boundary intact.

## Scope
- Показать в team settings available user-owned integrations.
- Включать/отключать integration для текущей команды.
- Перевести runtime delivery на team bindings.
- Сохранить JWT-only delivery contract.

## Implementation flow
1. Поднять canonical binding contract из `TEAMCAL-67` и зафиксировать team-scoped read/write model: available integrations текущего owner-а, enabled bindings команды и provisioning state на binding уровне.
2. Переписать team routes на list/enable/disable/binding lifecycle, не затрагивая `/profile` CRUD surface.
3. Разрезать team settings UI на маленькие business components: available catalog, enabled binding list, provisioning state и destructive actions.
4. Перевести booking runtime на binding-based fan-out с сохранением JWT contract и без смешения user-owned endpoint definition с team credential semantics.
5. Обновить route/runtime/UI tests, затем прогнать честный build gate.

## Критерии готовности
- Team settings больше не создают provisional team-owned endpoint definitions.
- Команда включает user-owned integration для себя.
- Runtime читает canonical team bindings.
- JWT delivery contract не меняется.

## DoD
- Team routes/UI/runtimes используют canonical binding model.
- Booking runtime tests и team settings tests проходят.
- Host files не разрастаются новой ветвистой логикой; новый flow собран из sibling modules.
- `npm run build` проходит после route changes.

## Тест кейсы
1. Team owner видит доступные integrations текущего пользователя.
2. Team owner включает и отключает integration для команды.
3. Booking runtime доставляет события по enabled bindings.
4. JWT headers/claims остаются прежними после rewrite.

## Зависимости
- [TEAMCAL-67](tasks/user-integrations-catalog/TEAMCAL-67.canonical-schema-and-domain-cut.md)
