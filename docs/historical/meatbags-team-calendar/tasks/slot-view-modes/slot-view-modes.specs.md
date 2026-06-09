# Feature Specs — Slot View Modes

Статус: draft  
Feature key: `slot-view-modes`  
Дата: 2026-04-11

## Контекст
Текущий slot surface уже поддерживает:
- list-mode с week/day hierarchy;
- общий slot booking flow;
- team/member filters и settings summary;
- bounded slots UI slice в `implementation/app/_components/team-page/team-page-slots-section.tsx`.

Этого недостаточно для desktop scanning-сценария, где пользователь хочет оценить всю неделю как матрицу дней, а не читать дни последовательно сверху вниз.

При этом новый режим не должен:
- ломать текущий list-mode;
- менять data contract;
- существовать на мобильном, где 7 day-columns сделают UI тесным и хуже по продуктовой задаче выбора слота.

## Цели
- Добавить второй desktop-only режим просмотра слотов: `Неделя`.
- Сохранить list-mode как дефолтный и канонический fallback.
- Показать в новом режиме полную структуру недели: 7 day-columns, включая пустые дни.
- Сохранить один и тот же slot action contract в обоих режимах.

## Non-Goals
- Persisted user preference по режиму.
- Новый mobile layout для week-grid mode.
- Изменение availability API или slot grouping semantics.
- Редизайн всего блока `Выбери слот` вне toggle и новой grid-view.

## Architecture rules in scope

### Relevant `AP-*`
- `AP-021` — тонкие entry points
- `AP-026` — API-контракты и DTO границы
- `AP-054` — устойчивые UI-состояния, доступность и деградация интерфейса
- `AP-055` — frontend performance: caching, lazy loading и hot paths
- `AP-064` — shadcn/ui как базовый слой дизайн-системы
- `AP-068` — дизайн-система как token-driven foundation
- `AP-069` — базовая доступность интерактивных интерфейсов

### Relevant `PP-*`
- `PP-017` — UI single-sentence punctuation
- `PP-018` — Next.js App Router + Drizzle + pg-only runtime
- `PP-019` — запрет пустых catch-блоков
- `PP-021` — oversized host files do not absorb new feature UI
- `PP-025` — feature plan must fix rule mapping and task authoring contract before implementation

### Как применять
- `AP-021` и `AP-026`: toggle режима не должен вносить новый route/API contract; это локальный presentation state поверх существующего slot grouping.
- `AP-054` и `AP-069`: оба режима должны быть управляемы, иметь понятные interactive states, а mobile fallback должен быть явным, а не случайным CSS-collapsed результатом.
- `AP-055`: week-grid не должен рендерить лишний тяжёлый дубль DOM на hot path без причины; режимы нужно собирать так, чтобы desktop toggle не ухудшал responsiveness и не создавал needless render complexity.
- `AP-064`: toggle и базовые control primitives нужно собирать на project-owned shadcn/ui layer, а не на самописном control-widget из div/span.
- `AP-068`: toggle и week-grid используют существующий visual system/token discipline, а не вводят новый ad-hoc widget language.
- `PP-021`: новый режим должен жить в отдельном sibling slice рядом с текущим slots surface, а не распухать внутри одного host component.
- `PP-017`: toggle copy и day-state copy остаются короткими, однострочными и без финальной точки.

## Fixed Decisions
1. Новый режим называется и мыслится как второй `view mode`, а не как другой период календаря.
2. Toggle copy: `Список | Неделя`.
3. У каждого toggle item есть иконка, соответствующая режиму.
4. `Список` остаётся режимом по умолчанию.
5. `Неделя` доступна только на desktop.
6. На mobile toggle не показывается и интерфейс остаётся в list-mode.
7. В week-grid одна неделя рендерится как 7 day-columns.
8. День без слотов остаётся в сетке, но показывается в сером subdued state.
9. Внутри дня слоты рендерятся компактно и вертикально сверху вниз.
10. Slot button semantics, click behavior и booking flow одинаковы в обоих режимах.

## Технические ограничения реализации
1. Основой группировки остаётся существующий week/day contract; нельзя вводить второй competing source of truth для дней недели.
2. New mode state живёт в slots UI slice и не требует server persistence.
3. Desktop/mobile behavior должен определяться устойчиво и тестируемо, а не через случайные CSS side-effects.
4. Если для week-grid нужен другой day-shape DTO внутри UI, он собирается в presentation-layer, а не меняет domain contract.
5. Пустой день должен быть рендеримым даже при отсутствии slots array items для этой даты.

## Product Surface

### List mode
- Текущий режим со week/day sections.
- Остаётся дефолтом и fallback-режимом.

### Week mode
- Desktop-only.
- Каждая неделя — отдельная horizontal week-grid.
- Неделя содержит 7 day-columns с понятными day headers.
- Day column без слотов остаётся в сетке и выглядит subdued/grey.
- Slot buttons компактнее текущих, но сохраняют click semantics.

### Mobile behavior
- Toggle отсутствует.
- Всегда используется list-mode.

### Loading / empty / error
- Loading state должен оставаться понятным в активном режиме.
- Empty state `Свободных слотов не найдено` не дублируется в двух вариантах сразу.
- Error banner `slotsStatus` остаётся единым и независимым от выбранного режима.

## UI Contract

### Toggle placement
- Toggle находится в правом верхнем углу блока `Выбери слот`.
- Toggle визуально вторичен относительно slot CTA, но достаточно заметен как control view-mode.
- Toggle проектируется через shadcn/ui primitives. Базовая рекомендация: `ToggleGroup`/`ToggleGroupItem`; если компонент ещё не установлен, это отдельно фиксируется в implementation slice.
- У каждого item есть иконка и label; icon-only toggle запрещён, потому что он сильнее рискует выглядеть как визуальный шум или неочевидный filter control.

### Week-grid hierarchy
- Сначала week header
- Ниже 7 day-columns
- Внутри колонки: day header -> compact vertical list of slots / empty-day state

### Empty day contract
- День без слотов:
  - остаётся на месте в сетке;
  - имеет subdued/grey surface;
  - не выглядит disabled-control, потому что это не action, а information state.

### Forbidden outcomes
- Toggle, который выглядит как period switcher
- Week-grid на mobile
- Скрытие пустых дней
- Дублирование full interactive DOM двух режимов, если один режим реально не используется

## Acceptance Criteria
- На desktop пользователь может переключаться между `Список` и `Неделя`.
- Toggle содержит иконки и текстовые label для обоих режимов.
- На mobile toggle не показывается, list-mode остаётся единственным режимом.
- Week-grid показывает 7 day-columns на каждую неделю, включая пустые дни.
- Slot buttons в week-grid компактны, вертикальны и кликабельны.
- Пустой день отображается серым, но не исчезает.
- Render contract и desktop/mobile gating покрыты тестами.

## File Impact
- `implementation/app/_components/team-page/team-page-slots-section.tsx`
- новые sibling files рядом с slots section при необходимости
- `implementation/components/ui/*` при установке или адаптации нужных shadcn primitives
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/_components/team-page/team-page-acceptance.test.ts`
- `implementation/app/styles/styles.css`

## Проверки
- `npm run test:unit:next-ui`
- при необходимости `npm run build`, если implementation затрагивает typed component contracts или responsive gating helpers
