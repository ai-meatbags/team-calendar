# TEAMCAL-57 — Team settings onboarding UX for webhooks

Статус: done

## Описание
Собрать onboarding-first UX для раздела `Интеграции и вебхуки`, который объясняет один blessed integration flow и использует shadcn composition вместо ad-hoc интерфейса.

## Applied rules
- AP-018
- AP-020
- AP-021
- AP-024
- AP-051
- AP-052
- AP-054
- AP-064
- AP-068
- AP-069
- PP-017
- PP-018
- TEW-TR-01
- TEW-TR-06
- TEW-TR-07

## Перед реализацией прочитать
- `implementation/rep.config.json` и зафиксировать split: UI-код меняется в `implementation/`, а planning/task source of truth остаётся в wrapper repo.
- `tasks/_policies/arch-patterns.md`: `AP-018`, `AP-020`, `AP-021`, `AP-024`, `AP-051`, `AP-052`, `AP-054`, `AP-064`, `AP-068`, `AP-069`.
- `tasks/_policies/project-patterns.md`: `PP-017`, `PP-018`, `PP-019`.
- `docs/team-events-webhook-jwt-prd.md`.
- `tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md`.
- `tasks/team-events-webhook/team-events-webhook.specs.md`.

## Как применять правила
- `AP-018`: экран должен объяснять один blessed path без лишних security forks и без перегруженной формы.
- `AP-020` и `AP-021`: UI не принимает на себя business/security decisions; экран только собирает input, показывает provisioning result и вызывает подготовленные route/use-case contracts.
- `AP-024` и `PP-019`: в UI state, toast-ах и error surfaces не показывать секреты, raw auth headers или бессодержательные swallowed errors.
- `AP-051` и `AP-052`: держать webhook onboarding как отдельную feature boundary; разделить server state subscriptions, transient UI state и form state create/rotate dialogs.
- `AP-054`: явно покрыть loading, empty, error, access-denied, created, rotated и destructive confirm states.
- `AP-064` и `AP-068`: собирать экран на shadcn-compatible base layer и существующих design tokens, без ad-hoc component zoo и hardcoded visual values.
- `AP-069` и `PP-017`: все интерактивные элементы должны иметь понятные labels/focus states, а однофразные UI тексты и toast-сообщения писать без финальной точки.
- `PP-018`: UI changes делать только в Next.js App Router surface `implementation/app/*`, не возвращая legacy pages/components flow.

## Контекстные файлы
- `implementation/app/_components/team-page/team-page-client.tsx`
- `implementation/app/_components/team-page/team-page-hooks.ts`
- `implementation/app/_components/team-page/team-page-state.ts`
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/_components/team-page/team-page-acceptance.test.ts`
- `implementation/src/application/usecases/team-webhooks.ts`
- [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md)
- [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md)
- [Feature spec](tasks/team-events-webhook/team-events-webhook.specs.md)

## Зона ответственности
- Владеет только клиентским путём, component composition и UI copy.
- Не владеет schema/domain/security invariants.
- Не владеет docs page content и runtime JWT generation.

## Scope
- Пересобрать информационную архитектуру секции `Интеграции и вебхуки`.
- Описать и реализовать shadcn component map для create/reveal/rotate/delete UX.
- Добавить onboarding copy для `JWT Bearer`, `HS256`, `shared secret`, `audience`.
- Добавить docs entry point `Как проверить JWT`.
- Если в проекте ещё нет shadcn foundation, ввести минимальный набор нужных компонентов без UI-зоопарка.

## Implementation flow
1. Прочитать `implementation/rep.config.json`, затем применить указанные выше AP/PP из wrapper policy set до начала изменений в `implementation/`.
2. Зафиксировать empty/loading/loaded/error states секции.
3. Разложить blessed path на screen states: empty state, create dialog, created subscription, rotate/delete confirms.
4. Выбрать и ввести минимальный shadcn набор для этих состояний.
5. Подключить UI к create/list/disable/delete/rotate response contract из `TEAMCAL-55`.
6. Добавить docs entry point, который ведёт в content из `TEAMCAL-56`.
7. Покрыть acceptance tests сценариями owner onboarding и destructive actions.

## Критерии готовности
- Owner понимает путь `URL -> secret/audience -> docs -> first delivery`.
- UI не предлагает выбор auth mode.
- Loading/empty/error/destructive states оформлены через shadcn-compatible composition.
- Secret reveal UX не держит plaintext secret постоянно на экране.

## DoD
- Клиентский путь можно пройти от empty state до configured subscription без продуктовых ambiguities.
- Компоненты и copy не дублируют runtime/security decisions из backend задач.
- Docs entry point встроен в UI, но сама docs semantics не захардкожена вторым источником истины.
- Задача не лезет в delivery runtime и rollout logic.

## Тест кейсы
1. Empty state объясняет blessed path и CTA на создание webhook.
2. Create dialog валидирует URL и не перегружает форму лишними security options.
3. Subscription card показывает status, audience и безопасные действия.
4. Delete/rotate flows имеют явные confirm states.

## Зависимости
- [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md)

## Лог
- 2026-04-10 13:15 — [todo] Задача создана после пересборки client journey и UX под blessed path.
- 2026-04-10 17:05 — [in_progress] Поднят implementation-контекст: текущий webhook UX живёт в custom settings modal без onboarding shell и без shadcn foundation; следующий шаг — согласовать design direction для empty/create/configured/destructive states и затем заводить минимальный component layer в `implementation/`.
- 2026-04-10 18:12 — [done] Webhook UX вынесен в отдельный feature slice с маленькими business components: onboarding card, provisioning card, subscription card и минимальный shadcn-like base layer (`components/ui/*`, `components.json`). Route/UI tests подтверждают blessed path: empty state, one-time provisioning, rotate action и destructive confirm.
