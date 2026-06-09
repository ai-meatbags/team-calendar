# TEAMCAL-71 — Team webhook settings UI cleanup

Статус: done

## Описание
Привести текущую team-level секцию вебхуков к нормальному settings UX: убрать шумный onboarding copy, сделать list-first layout, показать `POST` через UI, а не длинный текст, поставить toggle в начало строки и дать обычный skeleton на загрузке.

## Applied rules
- AP-018
- AP-019
- AP-020
- AP-021
- AP-024
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
- `implementation/rep.config.json`.
- `tasks/_policies/arch-patterns.md`: `AP-018`, `AP-019`, `AP-020`, `AP-021`, `AP-024`, `AP-051`, `AP-052`, `AP-054`, `AP-064`, `AP-068`, `AP-069`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`, `PP-021`, `PP-023`.
- `tasks/team-events-webhook/team-events-webhook.feature.md`.
- `implementation/app/_components/team-page/team-settings-integrations-card.tsx`.
- `implementation/app/_components/team-page/team-settings-webhooks.ts`.
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`.
- `implementation/app/_components/team-page/team-webhook-onboarding-card.tsx`.
- `implementation/app/_components/team-page/team-webhook-provisioning-card.tsx`.
- `implementation/app/_components/team-page/team-webhook-subscription-card.tsx`.
- `implementation/app/_components/team-page/team-page.test.tsx`.

## Как применять правила
- `AP-018` и `AP-019`: UI cleanup делается маленькими sibling-компонентами с понятной бизнес-ролью; нельзя снова тащить новый flow в большой host file.
- `AP-020` и `AP-021`: логика create/toggle/rotate остаётся в существующем state/use-case слое; presentation слой не тащит business logic внутрь JSX.
- `AP-024`: provisioning и error states не должны светить лишние секреты или шумный operational text.
- `AP-051`, `AP-052` и `PP-021`: settings card остаётся composition root, а список, add row, skeleton и provisioning card живут отдельными bounded slices.
- `AP-054`, `AP-064`, `AP-068`, `AP-069`: UI должен быть понятен без длинных инструкций, иметь устойчивые loading/empty/error/destructive states и использовать shadcn-based primitives.
- `PP-023`: после изменения settings surface и route-adjacent loading flow обязателен честный `npm run build`.

## Контекстные файлы
- `implementation/app/_components/team-page/team-settings-integrations-card.tsx`
- `implementation/app/_components/team-page/team-settings-webhooks.ts`
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`
- `implementation/app/_components/team-page/team-webhook-onboarding-card.tsx`
- `implementation/app/_components/team-page/team-webhook-provisioning-card.tsx`
- `implementation/app/_components/team-page/team-webhook-subscription-card.tsx`
- `implementation/app/_components/team-page/team-webhook-settings-contract.ts`
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/_components/team-page/team-page-acceptance.test.ts`
- `implementation/components/ui/*`

## Зона ответственности
- Владеет только team-level webhook settings UX.
- Не меняет ownership model интеграций.
- Не тащит `/profile` и personal integrations.
- Не меняет delivery contract кроме UI affordances around current flow.

## Scope
- Убрать лишний onboarding text.
- Сделать list-first presentation для webhook-ов.
- Показать required method `POST` через UI element.
- Перенести toggle в начало каждой строки.
- Добавить skeleton вместо позднего появления секции.
- Привести card composition к общему стилю team settings.

## Implementation flow
1. Зафиксировать текущий data flow и оставить business logic в `team-settings-webhooks.ts`.
2. Добавить недостающие shadcn primitives для skeleton/switch, если они реально нужны.
3. Разрезать webhook UI на маленькие presentation-компоненты: add row, list, list item, skeleton, provisioning card.
4. Убрать пошаговую prose и заменить её на самодостаточные UI affordances: method badge, compact helper labels, clear action placement.
5. Обновить tests под новый visual contract и прогнать build gate.

## Критерии готовности
- Секция вебхуков не выбивается стилями из остальных team settings cards.
- Loading state виден сразу как skeleton, а не позднее появление блока.
- Toggle находится в начале каждой webhook row.
- Required HTTP method считывается глазами без длинной инструкции.
- Add flow остаётся понятным без пошагового текста.

## DoD
- UI собран из маленьких компонентов с понятной бизнес-целью.
- Секция интеграций имеет skeleton на загрузке.
- List-first layout и leading toggle реализованы.
- Tests и `npm run build` проходят.

## Тест кейсы
1. Loading state рендерит skeleton для integrations section.
2. Empty state не содержит длинного onboarding prose, но оставляет понятный add affordance.
3. Existing webhook row показывает leading toggle, target URL, method marker и actions.
4. Provisioning card остаётся one-time reveal, но визуально не спорит с остальными settings blocks.

## Лог
- 2026-04-11 19:45 — [in_progress] Task created after product decision to defer personal-account webhook migration and clean up the current team-level settings UX instead.
- 2026-04-11 19:58 — [testing] Team-level webhook settings UI rebuilt into compact list-first composition with loading skeleton, leading toggle and reduced onboarding copy.
- 2026-04-11 20:06 — [need_retro] UI tests, webhook route suite and production build passed; runtime contract unchanged.
- 2026-04-11 20:08 — [done] Task closed after retro; current team-level webhook settings UX is the only active scope, personal integrations remain deferred.
