# TEAMCAL-72 — Week-band подсветка недели и sticky header для списка слотов

Статус: in_progress

## Описание
Сделать недели в списке слотов визуально считываемыми секциями через мягкий week band и compact sticky header, не меняя day-level IA и не уводя экран в tabs/accordion.

## Applied rules
- AP-021
- AP-026
- AP-054
- AP-068
- AP-069
- PP-017
- PP-018
- PP-019
- PP-021
- PP-025

## Перед реализацией прочитать
- `implementation/rep.config.json` и зафиксировать split-repo reality: код фичи живёт в `implementation/*`, planning source of truth — в `tasks/*`.
- `tasks/_policies/arch-patterns.md`: `AP-021`, `AP-026`, `AP-054`, `AP-068`, `AP-069`.
- `tasks/_policies/project-patterns.md`: `PP-017`, `PP-018`, `PP-019`, `PP-021`, `PP-025`.
- `tasks/slot-week-bands/slot-week-bands.feature.md`.
- `tasks/slot-week-bands/slot-week-bands.prd.md`.
- `tasks/slot-week-bands/slot-week-bands.specs.md`.
- `tasks/slot-week-bands/slot-week-bands.plan.md`.

## Как применять правила
- `AP-021` и `AP-026`: задача не должна тащить новый data-flow, route wiring или API contract ради визуального эффекта; работаем поверх существующего `groupSlotsByWeek`.
- `AP-054` и `AP-069`: sticky week header не должен ломать фокус, кликабельность слотов, states loading/empty/error и общую управляемость с клавиатуры.
- `AP-068`: week band должен опираться на текущую visual system и аккуратные tokens/variants, а не на случайный набор сильных теней, рамок и заливок.
- `PP-021`: если `team-page-client.tsx` требует нетривиальной новой ветки для week header / section wiring, выносим её в sibling slice; host-файл не должен снова стать местом роста всей UI-логики.
- `PP-017`: однофразные week labels остаются без точки.

## Контекстные файлы
- `implementation/app/_components/team-page/team-page-client.tsx`
- `implementation/app/_components/team-page/team-page-utils.ts`
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/styles/styles.css`

## Зона ответственности
- Владеет только visual hierarchy списка слотов на уровне week sections.
- Не меняет day-level IA, availability logic, filters, route contracts или booking flow.
- Не вводит tabs, accordion, collapse и другие формы скрытия контента.

## Scope
- Усилить week section separation в списке слотов.
- Добавить compact sticky header для каждой недели.
- Сохранить slot cards главным визуальным CTA.
- При необходимости вынести новый week-section slice из `team-page-client.tsx`.
- Обновить unit/static tests на render contract week sections.

## Implementation flow
1. Проверить, можно ли ограничиться layout/CSS-изменениями без роста host-file; если нет — вынести `WeekSlots` в sibling-component.
2. Собрать week-band markup contract: sticky header, section surface, spacing rhythm.
3. Настроить умеренный current-week accent, не конкурирующий со слотами.
4. Обновить render tests для week section headings и markup contract.
5. Прогнать UI test gate.

## Критерии готовности
- Недели визуально отделяются друг от друга с первого взгляда.
- Sticky week header компактен и не конкурирует со слотами.
- Весь контент остаётся открытым на одном экране.
- `team-page-client.tsx` не деградирует по когезии, если для этого понадобился sibling slice.
- Тесты фиксируют week-level markup contract.

## DoD
- PRD/spec/plan и implementation не спорят по главному продуктному принципу: экран один, слот — главный CTA.
- В success state границы недель считываются быстро.
- Empty/error/loading states не ломаются.
- Пройден `npm run test:unit:next-ui`.

## Тест кейсы
1. Рендер списка с двумя неделями показывает два week section header-а с диапазонами дат.
2. Текущая неделя визуально отличается, но не сильнее, чем hover/focus слота.
3. Все слоты двух недель доступны без переключения состояния экрана.
4. Empty state `Свободных слотов не найдено` остаётся корректным.
5. Error banner `slotsStatus` не конфликтует со week header hierarchy.

## Зависимости
- нет

## Лог
- 2026-04-10 19:13 — [todo] Задача создана после фиксации week-bands как канонического UI/UX направления для списка слотов.
- 2026-04-10 19:13 — [in_progress] Старт реализации: текущий host-файл team-page-client.tsx уже oversized, поэтому week-section и sticky-header wiring уезжают в отдельный sibling slice по PP-021.
- 2026-04-10 19:27 — [in_progress] SlotsView и week/day/slot section вынесены в sibling-файл `implementation/app/_components/team-page/team-page-slots-section.tsx`; week bands переведены на compact sticky headers, мягкий section surface и усиленный focus/hover у slot cards.
- 2026-04-10 19:28 — [in_progress] `npm run test:unit:next-ui` пройден; полный `npm run build` упёрся в посторонний type error в `implementation/src/application/usecases/get-current-user.ts` (`refreshToken: string | null -> string`), вне write scope этой задачи.
- 2026-04-11 13:55 — [in_progress] По визуальному фидбеку убраны лишний label `Следующая неделя` и card-обёртка sticky header; week header переведён в плоское продолжение week block с нижней разделительной линией. `npm run test:unit:next-ui` пройден повторно.
