# TEAMCAL-79 — Team webhook draft provisioning row

Статус: done

## Описание
Пересобрать onboarding flow team-level webhook-ов из `create -> persist -> reveal` в `prepare -> copy secret -> bind URL -> persist`, чтобы secret всегда относился к конкретной строке и не появлялся отдельным глобальным блоком над списком.

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
- `docs/team-events-webhook-jwt-prd.md`.
- `tasks/team-events-webhook/team-events-webhook.feature.md`.
- `tasks/team-events-webhook/team-events-webhook.specs.md`.
- `implementation/src/application/usecases/add-team-webhook.ts`.
- `implementation/app/api/teams/[shareId]/integrations/webhooks/*`.
- `implementation/app/_components/team-page/team-settings-webhooks.ts`.
- `implementation/app/_components/team-page/team-webhook-row.tsx`.

## Как применять правила
- `AP-018` и `AP-019`: разрезать flow на маленькие files по бизнес-роли: draft prepare, draft row, row-scoped secret, existing row.
- `AP-020` и `AP-021`: новый provisioning contract вводится в application/usecase и thin route handlers, а не шьётся в JSX или ad-hoc client hacks.
- `AP-024`: plaintext secret остаётся one-time и не живёт в глобальном alert после сохранения.
- `AP-051`, `AP-052`, `PP-021`: host section остаётся composition root; onboarding row и existing rows остаются sibling bounded slices.
- `AP-054`: покрыть prepare, draft, save, rotate, empty, loading, disabled и error states.
- `PP-023`: после contract/UI changes прогнать честный test gate.

## Контекстные файлы
- `implementation/src/application/usecases/team-webhooks-shared.ts`
- `implementation/src/application/usecases/add-team-webhook.ts`
- `implementation/app/api/teams/[shareId]/integrations/webhooks/handlers.ts`
- `implementation/app/api/teams/[shareId]/integrations/webhooks/route.test.ts`
- `implementation/app/_components/team-page/team-settings-webhooks.ts`
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`
- `implementation/app/_components/team-page/team-webhook-row.tsx`
- `implementation/app/_components/team-page/team-page.test.tsx`

## Зона ответственности
- Меняет team-level onboarding contract и UI flow.
- Не меняет JWT delivery runtime semantics.
- Не возвращает `Audience` в visible UI.
- Не переносит integrations в личный аккаунт.

## Scope
- Добавить server-side prepare endpoint для draft provisioning.
- Добавить sealed provisioning token вместо draft persistence table.
- Поменять create API на create-from-draft contract.
- Перенести one-time secret из global alert в draft row / matching row after rotate.
- Удалить устаревший post-create global secret reveal path.

## DoD
- `Добавить вебхук` создаёт draft row внутри списка.
- Secret показывается сразу в draft row и копируется до сохранения URL.
- После сохранения plaintext secret исчезает и не дублируется глобальным alert.
- После rotate secret показывается только внутри строки соответствующего webhook-а.
- UI tests проходят.

## Лог
- 2026-04-11 22:20 — [in_progress] Task opened after product review: global secret alert above the list does not explain which webhook it belongs to and forces the wrong `persist -> reveal` order.
- 2026-04-11 22:55 — [done] Team-level onboarding flow changed to `prepare -> copy -> bind -> save`; row-scoped secret reveal implemented for draft and rotate flows, old global alert path removed.
