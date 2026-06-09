# Implementation Plan — Slot View Modes

Дата: 2026-04-11  
Feature key: `slot-view-modes`

## Цель плана
Добавить второй desktop-only presentation mode для блока `Выбери слот`, не ломая текущий list-mode и не превращая slots surface в новый oversized host.

## Принципы
- Toggle меняет только presentation layer.
- `Список` остаётся дефолтным режимом и мобильным fallback.
- `Неделя` — desktop-only week-grid mode, а не другая period navigation.
- Toggle использует и текст, и иконки, чтобы семантически читаться как switch представления.
- Пустые дни остаются видимыми, потому что неделя должна читаться как полная структура.
- Slot click semantics и booking flow не отличаются между режимами.

## Архитектурные правила в scope

### Применяемые `AP-*`
- `AP-021` — тонкие entry points
- `AP-026` — API-контракты и DTO границы
- `AP-054` — устойчивые UI-состояния, доступность и деградация интерфейса
- `AP-055` — frontend performance: caching, lazy loading и hot paths
- `AP-064` — shadcn/ui как базовый слой дизайн-системы
- `AP-068` — дизайн-система как token-driven foundation
- `AP-069` — базовая доступность интерактивных интерфейсов

### Применяемые `PP-*`
- `PP-017` — UI single-sentence punctuation
- `PP-018` — Next.js App Router + Drizzle + pg-only runtime
- `PP-019` — запрет пустых catch-блоков
- `PP-021` — oversized host files do not absorb new feature UI
- `PP-025` — feature plan must fix rule mapping and task authoring contract before implementation

## Как применять правила в этой фиче
- `AP-021` и `AP-026`: не вводить новый query/route contract ради toggle; week-grid питается от текущего slots data и UI-level mapping.
- `AP-054` и `AP-069`: desktop/mobile behavior должен быть явным и понятным; toggle обязан иметь доступный control contract, а empty-day state не должен выглядеть сломанным.
- `AP-055`: не рендерить тяжёлый дубль interactive tree без необходимости; режимы должны переключаться через bounded slice и не плодить needless DOM/logic duplication на hot path слотов.
- `AP-064`: toggle и связанные control primitives проектируются через shadcn/ui layer проекта; если нужный primitive не установлен, implementation обязан сначала проверить docs/registry и добавить его осознанно, а не собирать кастомный control с нуля.
- `AP-068`: toggle, day columns, empty-day visuals и compact slots должны использовать существующий token/style layer, а не новую несогласованную визуальную систему.
- `PP-021`: week-grid mode, toggle wiring и list/grid composition нужно выделить в sibling modules рядом с slots section, не распухая обратно в `team-page-client.tsx` или один giant `team-page-slots-section.tsx`.
- `PP-017`: UI copy toggle и пустых состояний должна оставаться короткой и однозначной.

## Карта правил по slice-ам
- Slice 1 / `TEAMCAL-74`: `AP-054`, `AP-055`, `AP-068`, `AP-069`, `PP-017`, `PP-018`, `PP-021`

## Task authoring contract
- Каждая implementation-задача по этой фиче обязана содержать секции:
  - `Applied rules`
  - `Перед реализацией прочитать`
  - `Как применять правила`
- В `Перед реализацией прочитать` обязательно перечислять:
  - skills: `build-web-apps:frontend-skill`, `build-web-apps:shadcn`, `build-web-apps:react-best-practices`
  - `implementation/rep.config.json`
  - `tasks/_policies/arch-patterns.md` с точными `AP-*`
  - `tasks/_policies/project-patterns.md` с точными `PP-*`
  - `tasks/slot-view-modes/slot-view-modes.feature.md`
  - `tasks/slot-view-modes/slot-view-modes.prd.md`
  - `tasks/slot-view-modes/slot-view-modes.specs.md`
  - `tasks/slot-view-modes/slot-view-modes.plan.md`
  - `implementation/components.json`
  - текущий slots UI slice в `implementation/app/_components/team-page/*`
- В `Как применять правила` задача должна объяснять применение правил к своему write scope, а не просто перечислять номера.

## Feature DoD / release gate
- PRD, specs и plan не спорят по сути режима: это view toggle, а не смена периода.
- На desktop доступны оба режима.
- Toggle рендерится с иконками и текстовыми label, а не как безымянный icon-only control.
- На mobile нет week-grid режима и toggle не показывается.
- Week-grid отображает 7 day-columns, включая пустые дни.
- Slot action contract одинаков в list-mode и week-mode.
- Slots surface не деградирует в giant component.
- Обязательные UI checks проходят.

## Decomposition
- `TEAMCAL-74` — desktop-only toggle режимов и week-grid представление слотов

## Dependency order
- Сначала реализовать и проверить `TEAMCAL-74`; persistence режима и другие follow-ups допустимы только после стабилизации desktop/mobile contract.

## Ownership boundaries
- `TEAMCAL-74`: slots presentation mode state, list/grid composition, week-grid day columns, desktop/mobile gating, tests

## File reservations
- `implementation/app/_components/team-page/team-page-slots-section.tsx`
- новые sibling files в `implementation/app/_components/team-page/`
- `implementation/components/ui/*` если implementation добавляет или адаптирует shadcn primitives
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/_components/team-page/team-page-acceptance.test.ts`
- `implementation/app/styles/styles.css`

## Integration task
- `TEAMCAL-74`

## Required implementation task list
- `TEAMCAL-74`

## Testing strategy
- unit/static tests на toggle markup и week-grid structure
- acceptance test на desktop/mobile gating, если в проекте уже есть подобный contract
- если добавляются shadcn primitives, implementation обязан сначала проверить `npx shadcn@latest info --json` и docs для выбранных компонентов, чтобы не заводить несовместимую композицию
- `npm run test:unit:next-ui`
- `npm run build` при изменении typed component boundaries или responsive gating helpers

## Риски внедрения
- Самый опасный product-баг: toggle будет выглядеть как период-фильтр, а не как смена представления.
- Самый опасный UX-баг: пустые дни исчезнут или будут выглядеть как ошибка.
- Самый опасный engineering-баг: week-grid mode снова раздует текущий slots surface до giant component.
- Самый опасный performance-баг: оба режима будут рендериться полностью и одновременно без пользы.

## Что сознательно не делаем сейчас
- mobile week-grid
- persisted preference режима
- URL sync для режима
- новый ranking слотов

## Programming steps for `TEAMCAL-74`
1. Проверить source of truth: `slot-view-modes.prd.md`, `slot-view-modes.specs.md`, `slot-view-modes.feature.md`, `slot-view-modes.plan.md`, `TEAMCAL-74.desktop-toggle-and-week-grid-slot-view.md`, `implementation/rep.config.json`, `implementation/components.json`, `tasks/_policies/arch-patterns.md`, `tasks/_policies/project-patterns.md`.
2. Установить или адаптировать нужный shadcn primitive для toggle, не изобретая кастомную div-button группу.
3. Выделить presentation state и desktop gating в bounded slots slice, не раздувая `team-page-client.tsx`.
4. Разнести list-mode, week-grid mode и toggle в sibling components с маленьким write scope.
5. Собрать presentation model для week-grid с явным добавлением пустых дней до 7 day-columns.
6. Подключить toggle с иконками и текстовыми label так, чтобы он менял только presentation mode.
7. Обновить styles/tokens для compact day columns и subdued empty-day state без конкуренции со slot CTA.
8. Зафиксировать tests на toggle markup, desktop/mobile gating, week-grid structure и slot-action parity.
9. Прогнать `npm run test:unit:next-ui`; `npm run build` запускать только если изменены typed boundaries или responsive helpers.
