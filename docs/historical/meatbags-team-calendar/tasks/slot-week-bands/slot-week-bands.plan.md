# Implementation Plan — Slot Week Bands

Дата: 2026-04-10  
Feature key: `slot-week-bands`

## Цель плана
Сделать week sections визуально считываемыми без продуктового ухода в tabs/accordion и без потери главного CTA-сигнала у slot cards.

## Принципы
- Один экран, без скрытия недель, дней и слотов.
- Неделя помогает навигации, но не становится главным объектом внимания.
- Sticky header компактный и поддерживает scan path, а не создаёт ещё один control layer.
- Решение опирается на уже существующий week grouping contract, а не на новую data-логику.

## Архитектурные правила в scope

### Применяемые `AP-*`
- `AP-021` — тонкие entry points
- `AP-026` — API-контракты и DTO границы
- `AP-054` — устойчивые UI-состояния, доступность и деградация интерфейса
- `AP-068` — дизайн-система как token-driven foundation
- `AP-069` — базовая доступность интерактивных интерфейсов

### Применяемые `PP-*`
- `PP-017` — UI single-sentence punctuation
- `PP-018` — Next.js App Router + Drizzle + pg-only runtime
- `PP-019` — запрет пустых catch-блоков
- `PP-021` — oversized host files do not absorb new feature UI
- `PP-025` — feature plan must fix rule mapping and task authoring contract before implementation

## Как применять правила в этой фиче
- `AP-021` и `AP-026`: не трогаем route/data contracts ради визуального паттерна; изменения остаются в component/style/test слоях.
- `AP-054` и `AP-069`: sticky header не должен ухудшить states, доступность и кликабельность слотов.
- `AP-068`: visual treatment недели оформляется как системный variant, а не как хаотичный набор разовых CSS-значений.
- `PP-021`: если week-band логика требует заметной разметочной ветки, её нужно вынести в sibling slice рядом с `SlotsView`, а не продолжать распухать `team-page-client.tsx`.
- `PP-017`: UI copy в band-header остаётся короткой и без финальной точки.

## Карта правил по slice-ам
- Slice 1 / `TEAMCAL-72`: `AP-054`, `AP-068`, `AP-069`, `PP-017`, `PP-018`, `PP-021`

## Task authoring contract
- Каждая implementation-задача по этой фиче обязана содержать секции:
  - `Applied rules`
  - `Перед реализацией прочитать`
  - `Как применять правила`
- В `Перед реализацией прочитать` обязательно перечислять:
  - `implementation/rep.config.json`
  - `tasks/_policies/arch-patterns.md` с точными `AP-*`
  - `tasks/_policies/project-patterns.md` с точными `PP-*`
  - `tasks/slot-week-bands/slot-week-bands.feature.md`
  - `tasks/slot-week-bands/slot-week-bands.prd.md`
  - `tasks/slot-week-bands/slot-week-bands.specs.md`
  - `tasks/slot-week-bands/slot-week-bands.plan.md`
- В `Как применять правила` задача должна объяснять применение правил к своему write scope, а не просто перечислять номера.

## Feature DoD / release gate
- PRD, specs и plan не спорят о ключевом продуктовом принципе: экран один, контент не скрывается, слот остаётся главным CTA.
- Week sections читаются быстро и явно, но не доминируют над slot cards.
- Sticky week header не ломает list usability и не ухудшает доступность.
- Изменения не раздувают `team-page-client.tsx` без необходимости.
- Обязательные проверки по UI проходят.

## Decomposition
- `TEAMCAL-72` — week-band подсветка недели и sticky header для списка слотов

## Dependency order
- Сначала реализовать и проверить `TEAMCAL-72`; отдельная day-level переработка, если понадобится, будет follow-up, а не частью текущего slice.

## Ownership boundaries
- `TEAMCAL-72`: только team-page slots UI slice, visual hierarchy, sticky week header, static render tests

## File reservations
- `implementation/app/_components/team-page/team-page-client.tsx`
- `implementation/app/_components/team-page/team-page-utils.ts`
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/styles/styles.css`

## Integration task
- `TEAMCAL-72`

## Required implementation task list
- `TEAMCAL-72`

## Testing strategy
- Проверить render contract для week sections и sticky header markup в unit/static tests.
- Прогнать `npm run test:unit:next-ui`.
- Если разметка вынесена в новый sibling-component, добавить покрытие на него без визуального переусложнения snapshot-ами.

## Риски внедрения
- Самый опасный UX-баг: сделать неделю настолько заметной, что слоты потеряют первичность.
- Самый опасный engineering-баг: добавить feature прямо в oversized host-file и получить ещё менее управляемый UI slice.
- Самый опасный visual-баг: сделать sticky header слишком высоким или непрозрачным и перекрыть контент.

## Что сознательно не делаем сейчас
- Переключение недель
- Day-level redesign
- Изменение availability/filters/runtime
