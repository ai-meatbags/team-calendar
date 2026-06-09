# TEAMCAL-70 — Team API token boundary and integrations settings split

Статус: todo

## Описание
Довести финальную информационную архитектуру настроек команды: webhook integrations и API access должны быть разнесены, а API tokens оставаться только team-scoped surface.

## Applied rules
- AP-018
- AP-019
- AP-020
- AP-021
- AP-026
- AP-039
- AP-040
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
- `tasks/user-integrations-catalog/TEAMCAL-69.team-bindings-settings-and-runtime.md`.
- `implementation/app/_components/team-page/team-page-client.tsx`.
- `implementation/app/_components/team-page/team-page-hooks.ts`.
- `implementation/app/_components/team-page/team-page-state.ts`.
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`.
- `implementation/app/api/teams/[shareId]/settings/*`.
- `implementation/app/api/teams/[shareId]/integrations/webhooks/*`.
- token-related files or controls actually present after `TEAMCAL-69`.

## Как применять правила
- `AP-018` и `AP-019`: задача должна завершиться маленькими, понятными business slices; нельзя лечить путаницу новым giant settings host.
- `AP-020` и `AP-021`: settings composition не должна смешивать webhook enablement и API access semantics в одном неразличимом блоке.
- `AP-026`, `AP-039`, `AP-040` и `AP-041`: API access contract должен остаться явно team-scoped.
- `AP-051`, `AP-052`, `AP-054` и `PP-021`: final team settings IA должна быть собрана из bounded slices, а не ещё одним большим host surface.
- `AP-064`, `AP-068`, `AP-069`: UI states и labels должны ясно отличать integrations от API access.
- `PP-023`: если задача трогает team routes или route-adjacent surface, build gate обязателен.
- Важно: если отдельный API token runtime ещё не существует, задача фиксирует boundary и информационную архитектуру, но не придумывает новый token subsystem без product requirement.
- `PP-018` и `PP-019`: никаких legacy runtime возвратов и пустых catch-блоков.

## Контекстные файлы
- `implementation/app/_components/team-page/team-page-client.tsx`
- `implementation/app/_components/team-page/team-page-hooks.ts`
- `implementation/app/_components/team-page/team-page-state.ts`
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`
- `implementation/app/api/teams/[shareId]/settings/get-handler.ts`
- `implementation/app/api/teams/[shareId]/settings/route.ts`
- `implementation/app/api/teams/[shareId]/integrations/webhooks/*`
- `docs/user-integrations-catalog-prd.md`
- outputs from `TEAMCAL-69`

## Зона ответственности
- Владеет final team settings IA around integrations and API access.
- Не владеет profile catalog.
- Не владеет schema redesign.

## Scope
- Разнести webhook integrations и API access по понятным блокам.
- Зафиксировать team-only boundary для API tokens в UI/API contracts.
- Не пускать API tokens в user settings.
- Не изобретать новый token backend, если в коде на этот момент есть только boundary/IA задача.

## Implementation flow
1. После `TEAMCAL-69` сделать короткий audit: какие token-related controls реально существуют, а какие только подразумеваются в PRD.
2. Выделить в team settings отдельный API access block и отдельный integrations block, не смешивая их контракты, тексты и действия.
3. Если token controls уже существуют, перенести их в dedicated team-only slice; если не существуют, зафиксировать reserved boundary и не выдумывать новый backend в рамках этой задачи.
4. Проверить, что webhook integrations block не несёт API token semantics и что `/profile` не получает token surface.
5. Обновить tests/copy/contracts и прогнать build gate при route changes.

## Критерии готовности
- Team settings ясно разделяют webhook integrations и API access.
- API tokens остаются только командными.
- User settings не получают API token surface.

## DoD
- Boundary зафиксирован и отражён в UI/API surface.
- Задача не придумывает новый global или user-level token path.
- Tests подтверждают separation of concerns.
- `npm run build` проходит, если были route/API changes.

## Тест кейсы
1. Team settings рендерят integrations и API access отдельно.
2. API tokens не появляются в `/profile`.
3. Labels и copy не смешивают webhook delivery и API access.

## Зависимости
- [TEAMCAL-69](tasks/user-integrations-catalog/TEAMCAL-69.team-bindings-settings-and-runtime.md)
