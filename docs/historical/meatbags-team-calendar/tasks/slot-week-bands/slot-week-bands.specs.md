# Feature Specs — Slot List Week Bands

Статус: draft  
Feature key: `slot-week-bands`  
Дата: 2026-04-10

## Контекст
Сейчас список слотов уже группируется по неделям и дням:
- `groupSlotsByWeek` в `implementation/app/_components/team-page/team-page-utils.ts` строит Monday-based week sections;
- `SlotsView` / `WeekSlots` в `implementation/app/_components/team-page/team-page-client.tsx` рендерят week headings;
- `.week-group` в `implementation/app/styles/styles.css` уже существует как контейнер.

Но продуктово это не решает задачу "одним взглядом выбрать слот":
- неделя визуально почти не отделяется от соседней недели;
- пользователь не считывает секции периферийным зрением и вынужден читать список как сплошной поток;
- текущая визуальная сила недели слишком слабая, чтобы быть полезной навигацией, и одновременно слишком карточная, чтобы остаться незаметной.

## Цели
- Сохранить один полностью раскрытый экран списка слотов.
- Сделать недели ясно читаемыми секциями списка без переключений и скрытия контента.
- Сохранить slot cards главным визуальным CTA.
- Улучшить scan path: `неделя -> слот`, не заставляя пользователя изучать дополнительный control layer.

## Non-Goals
- Переключатели недель, табы, аккордеоны, collapse/expand.
- Изменение day-level IA и day header copy.
- Изменение бизнес-логики availability, сортировки слотов или командных фильтров.
- Новый "смарт" ranking слотов.

## Architecture rules in scope

### Relevant `AP-*`
- `AP-021` — тонкие entry points
- `AP-026` — API-контракты и DTO границы
- `AP-054` — устойчивые UI-состояния, доступность и деградация интерфейса
- `AP-068` — дизайн-система как token-driven foundation
- `AP-069` — базовая доступность интерактивных интерфейсов

### Relevant `PP-*`
- `PP-017` — UI single-sentence punctuation
- `PP-018` — Next.js App Router + Drizzle + pg-only runtime
- `PP-019` — запрет пустых catch-блоков
- `PP-021` — oversized host files do not absorb new feature UI
- `PP-025` — feature plan must fix rule mapping and task authoring contract before implementation

### Как применять
- `AP-021` и `AP-026`: week-band визуализация не должна менять route/API contracts и не должна вносить новый data-flow; UI использует уже существующий grouping contract.
- `AP-054` и `AP-069`: sticky week header не должен ломать keyboard flow, focus visibility и читаемость loading/empty/error states.
- `AP-068`: новые week-band стили строятся как осознанный variant поверх текущей visual system, а не как набор случайных hardcoded decorations.
- `PP-021`: если `team-page-client.tsx` уже перегружен, неделя как новый UI slice должна выноситься в sibling-компонент, а не распухать внутри host-файла.
- `PP-017`: однофразные UI-лейблы типа `Эта неделя` и `Следующая неделя` остаются без финальной точки.

## Fixed Decisions
1. Экран слотов остаётся единым, без скрытия любой недели, дня или слота.
2. Week section становится визуально считываемой band-секцией списка, а не тяжёлой карточкой.
3. У каждой недели есть компактный sticky header.
4. Sticky header должен быть умеренным по высоте и не конкурировать со slot cards.
5. Текущая неделя получает более тёплый акцент, но CTA-иерархия остаётся у slot cards.
6. Day-level структура и copy в этом slice не перерабатываются.
7. Визуальное различие недель достигается через surface, spacing, header treatment и section rhythm, а не через скрытие контента.

## Технические ограничения реализации
1. Источник недельной группировки остаётся `groupSlotsByWeek`; новая логика группировки не добавляется.
2. Изменения ограничиваются public team-page UI slice в `implementation/app/_components/team-page/*` и `implementation/app/styles/styles.css`.
3. Sticky behavior должен работать без JavaScript state machine; CSS-first решение предпочтительно.
4. Week header обязан оставаться readable поверх контента при scroll overlap.
5. Slot cards обязаны сохранять самую высокую визуальную контрастность среди интерактивных объектов экрана.

## Product Surface

### Success state
- Пользователь видит открытый список недель.
- Каждая неделя читается как отдельная секция благодаря compact sticky header и более явному rhythm break между секциями.
- Слоты остаются главными кликабельными поверхностями.

### Loading state
- Скелетон не обязан полностью повторять sticky header behavior, но должен сохранять week/day rhythm и не ухудшать scan path.

### Empty state
- Пустое состояние слотов не меняет свою продуктовую роль и не требует новой week-band логики.

### Error/degraded state
- Ошибка в `slotsStatus` продолжает показываться над списком и не должна визуально конфликтовать со sticky week headers.

## UI Contract

### Week band hierarchy
- Week header:
  - sticky внутри скролла страницы;
  - компактный, с небольшим вертикальным размером;
  - содержит relative label (`Эта неделя` / `Следующая неделя`) и диапазон дат.
- Week body:
  - остаётся открытым;
  - получает мягкую подложку/section surface;
  - отделяется от соседней недели заметным vertical gap.

### Visual emphasis rules
- Самый сильный контраст: slot card
- Средний структурный акцент: week header
- Самый мягкий фон: week surface

### Forbidden visual outcomes
- Тяжёлые тени и жирные рамки вокруг недели
- Акцент недели ярче или контрастнее hover/focus слота
- Полноценная карточность, которая заставляет считывать неделю как основной объект действия

## Acceptance Criteria
- На success state границы недель читаются сразу, без чтения day headers подряд.
- Все недели и дни остаются открытыми на одном экране.
- Sticky week header не мешает нажимать на слоты и не перекрывает важный контент слишком высоким блоком.
- Slot cards по-прежнему остаются самыми заметными интерактивными элементами.
- Markup contract для week sections и headers покрыт unit/static render tests.

## File Impact
- `implementation/app/_components/team-page/team-page-client.tsx`
- `implementation/app/_components/team-page/team-page-utils.ts`
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/styles/styles.css`

## Проверки
- `npm run test:unit:next-ui`
- при необходимости точечная проверка `implementation/app/_components/team-page/team-page.test.tsx`
