# TEAMCAL-74 — Desktop-only toggle режимов и week-grid представление слотов

Статус: in_progress

## Описание
Добавить в блок `Выбери слот` desktop-only toggle `Список | Неделя`, где `Неделя` рендерит те же доступные слоты в week-grid: 7 day-columns, compact vertical slots и пустые дни в subdued/grey состоянии.

## Applied rules
- AP-021
- AP-026
- AP-054
- AP-055
- AP-064
- AP-068
- AP-069
- PP-017
- PP-018
- PP-019
- PP-021
- PP-025

## Перед реализацией прочитать
- skills: `build-web-apps:frontend-skill`, `build-web-apps:shadcn`, `build-web-apps:react-best-practices`
- `implementation/rep.config.json` и зафиксировать split-repo reality.
- `tasks/_policies/arch-patterns.md`: `AP-021`, `AP-026`, `AP-054`, `AP-055`, `AP-068`, `AP-069`.
- `tasks/_policies/project-patterns.md`: `PP-017`, `PP-018`, `PP-019`, `PP-021`, `PP-025`.
- `implementation/components.json`.
- `tasks/slot-view-modes/slot-view-modes.feature.md`.
- `tasks/slot-view-modes/slot-view-modes.prd.md`.
- `tasks/slot-view-modes/slot-view-modes.specs.md`.
- `tasks/slot-view-modes/slot-view-modes.plan.md`.
- `implementation/app/_components/team-page/team-page-slots-section.tsx`.
- `implementation/app/_components/team-page/team-page.test.tsx`.
- `implementation/app/_components/team-page/team-page-acceptance.test.ts`.

## Как применять правила
- `AP-021` и `AP-026`: задача не должна менять route/API contract; toggle и week-grid собираются как чистый presentation state поверх текущих slots data.
- `AP-054` и `AP-069`: toggle обязан быть доступным control, list/grid switch не должен ломать states, а mobile fallback должен быть явным и понятным.
- `AP-055`: нельзя просто поддерживать два полноценных тяжёлых interactive tree без необходимости; нужно удержать bounded rendering complexity и не ухудшить hot path блока слотов.
- `AP-064`: toggle и related control primitives нужно строить через shadcn/ui layer проекта; если подходит `ToggleGroup`, он предпочтителен перед самописной кнопочной группой.
- `AP-068`: toggle, day columns, empty-day surface и compact slots должны строиться поверх текущей visual system и без нового ad-hoc design dialect.
- `PP-021`: list-mode и week-grid mode нужно разносить по sibling components/composition helpers, а не собирать обратно в giant `team-page-slots-section.tsx`.
- `PP-017`: тексты toggle и empty-day state должны быть короткими и однозначными, без лишней copy-драмы.

## Контекстные файлы
- `implementation/app/_components/team-page/team-page-slots-section.tsx`
- новые sibling files рядом с slots section
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/app/_components/team-page/team-page-acceptance.test.ts`
- `implementation/app/styles/styles.css`

## Зона ответственности
- Владеет только slots presentation modes и их desktop/mobile gating.
- Не меняет booking flow, availability, filters и server contract.
- Не добавляет persisted preference или mobile week-grid.

## Scope
- Добавить desktop-only toggle режима в правый верхний угол блока слотов через shadcn/ui-based control.
- Сделать toggle с иконками и текстовыми label для обоих режимов.
- Оставить `Список` default mode.
- Добавить `Неделя` mode с 7 day-columns.
- Показать пустые дни в subdued/grey состоянии.
- Сделать compact vertical slot stacks внутри дня.
- Добавить test coverage на toggle, week-grid structure и mobile fallback.

## Implementation flow
1. Прочитать source of truth фичи и project policy set, затем зафиксировать presentation model и desktop/mobile gating.
2. Проверить и, если нужно, добавить shadcn primitive для toggle; не собирать custom div-button group.
3. Разнести toggle, list-mode и week-grid mode по bounded sibling slices по PP-021.
4. Собрать week-grid day model с явным присутствием пустых дней.
5. Подключить toggle с иконками и текстовыми label только к desktop contract.
6. Зафиксировать tests на structure, gating и slot-action parity.

## Критерии готовности
- На desktop доступен toggle `Список | Неделя`.
- Toggle содержит иконки и текстовые label для обоих режимов.
- На mobile toggle отсутствует, list-mode остаётся единственным.
- В week-grid каждая неделя содержит 7 day-columns.
- Пустые дни видны в subdued/grey состоянии.
- Slot click behavior совпадает с текущим list-mode.

## DoD
- Feature packet и implementation не спорят о том, что toggle меняет только presentation mode.
- PRD, specs, plan и task синхронизированы по смыслу: desktop-only view mode, иконки в toggle, 7 day-columns и mobile-only list fallback.
- Slots surface не деградирует в giant component.
- Desktop/mobile contract покрыт тестами.
- Пройдён `npm run test:unit:next-ui`.

## Тест кейсы
1. На desktop рендерится toggle `Список | Неделя`.
2. Переключение в `Неделя` показывает 7 day-columns в каждой неделе.
3. Пустой день остаётся в сетке и визуально отличается от дня со слотами.
4. Клик по compact slot в week-grid открывает тот же booking flow.
5. На mobile toggle не показывается и остаётся list-mode.

## Зависимости
- [TEAMCAL-72](tasks/slot-week-bands/TEAMCAL-72.slot-week-bands-and-sticky-week-headers.md)

## Лог
- 2026-04-11 14:19 — [todo] Задача создана после фиксации отдельной feature для desktop-only week-grid mode.
- 2026-04-11 15:02 — [in_progress] Feature packet синхронизирован перед стартом реализации: в PRD/spec/plan/task явно зафиксированы иконки в toggle, shadcn control primitive и programming steps по SDD.
- 2026-04-11 15:34 — [in_progress] Реализация собрана через bounded sibling slices: shadcn toggle с иконками, desktop viewport gating, list/week mode composition, week-grid columns с явными empty-day states.
- 2026-04-11 15:40 — [in_progress] `npm run test:unit:next-ui` пройден; `npm run build` не дошёл до app compilation из-за embedded Postgres lock (`implementation/data/postgres/postmaster.pid` уже занят живым процессом), вне логики feature slice.
