# Feature Dossier

Feature: `slot-week-bands`
Updated: `2026-04-10`

## Context
- Problem: недели уже группируются в коде, но визуально почти не читаются в списке слотов, поэтому путь выбора времени выглядит как плоская простыня дней.
- Goal: сделать недели ясно различимыми секциями списка без скрытия контента и без потери главного продуктового сигнала у slot cards.
- Desired user/business outcome: пользователь быстрее локализуется в диапазоне дат и почти сразу переходит к выбору времени, а не к чтению структуры списка.
- Priority: medium
- Primary stakeholder or decision owner: Vanya
- Target date (if relevant): ближайший UI polish slice для public team page
- Success metric or acceptance signal for the business outcome: week boundaries считываются за один взгляд, но слот остаётся самым заметным объектом действия.
- Open questions:
  - нужен ли follow-up по day headers после проверки week bands;
  - нужно ли добавлять более явный relative label для недель дальше второй.
- Risks:
  - легко сделать "красивую карточку недели", которая отвлечёт от выбора времени;
  - sticky header может съесть полезное пространство;
  - новый UI slice может ещё сильнее разрастить `team-page-client.tsx`.
- Edge cases:
  - список с одной неделей не должен выглядеть перегруженно;
  - error banner `slotsStatus` и sticky header не должны конфликтовать;
  - loading skeleton не должен ломать ощущение ритма списка.
- Stack or architecture uncertainty: код живёт в `implementation/*`, а planning source of truth — в repo-root `tasks/*`; для этой фичи нельзя путать UI polish со сменой data contract.
- Recommended next stage: `implement`

## Spec
- Fixed decisions:
  - список слотов остаётся полностью раскрытым и на одном экране;
  - week sections получают compact sticky headers;
  - week accent остаётся умеренным;
  - slot cards сохраняют высший контраст среди интерактивных объектов;
  - day-level IA в текущем slice не меняется.
- Contracts:
  - существующий `groupSlotsByWeek` остаётся каноническим week grouping contract;
  - public copy недели использует короткие однострочные labels без точки;
  - sticky header остаётся структурным элементом списка, а не control layer.
- Acceptance criteria:
  - week boundaries читаются сразу;
  - слот остаётся главным CTA;
  - весь контент виден без переключателей и скрытия;
  - разметка week sections покрыта тестами.
- Non-goals:
  - tabs / accordion / switcher по неделям;
  - redesign day headers;
  - новая бизнес-логика availability.
- Migration or rollout constraints:
  - миграций, API changes и rollout semantics нет;
  - feature ограничена component/style/test слоями.
- Feature-level risks:
  - переусиление недели;
  - sticky overlap;
  - рост host-file без выделенного slice.

## Architecture rules in scope
- Relevant `AP-*`: `AP-021`, `AP-026`, `AP-054`, `AP-068`, `AP-069`
- Relevant `PP-*`: `PP-017`, `PP-018`, `PP-019`, `PP-021`, `PP-025`
- Approved deviations to register or reference:
  - нет

## Plan
- Decomposition:
  - `TEAMCAL-72` — week-band подсветка недели и sticky header для списка слотов.
- Dependency order (human-readable planning view):
  - зафиксировать visual hierarchy и write scope -> реализовать `TEAMCAL-72` -> при необходимости вынести отдельный follow-up по дням.
- Preference for the minimum dependency graph needed for safe execution:
  - один implementation slice без нового control layer и без параллельных задач.
- Ownership boundaries:
  - `TEAMCAL-72` владеет только slots UI hierarchy и test contract.
- File reservations:
  - `implementation/app/_components/team-page/team-page-client.tsx`
  - `implementation/app/_components/team-page/team-page-utils.ts`
  - `implementation/app/_components/team-page/team-page.test.tsx`
  - `implementation/app/styles/styles.css`
- Integration task:
  - `TEAMCAL-72`
- Required implementation task list:
  - `TEAMCAL-72`
- Testing strategy:
  - `npm run test:unit:next-ui`
  - точечные unit/static tests на week section markup и render contract

## Decisions
- `2026-04-10` — продуктовый принцип зафиксирован: один экран без скрытия контента.
- `2026-04-10` — week emphasis должен быть умеренным; неделя помогает навигации, но не становится главным CTA.
- `2026-04-10` — текущий slice не трогает day-level IA; это отдельный follow-up, если потребуется.

## Tracking
- Feature anchor issue: `TEAMCAL-71` — `https://linear.app/meatbags/issue/TEAMCAL-71/feature-anchor-week-bands-dlya-vybora-slotov`
- Required task set:
  - `TEAMCAL-72`
- Child task keys:
  - `TEAMCAL-72`
- Shared packet version: `v1`
- Current owner: `Codex`

## Log
- `2026-04-10 19:13 — Context created after UI/UX design decision to use week bands instead of tabs, accordion or hidden content.`
- `2026-04-10 19:13 — Scope intentionally narrowed to week-level highlighting only; day-level redesign moved out of current slice.`
- `2026-04-10 19:13 — Local packet mirrored to Linear as feature anchor TEAMCAL-71 and implementation task TEAMCAL-72.`
- `2026-04-10 19:13 — Реализация TEAMCAL-72 начата; из-за oversized host-file слот-секция выносится в отдельный sibling slice вместо роста team-page-client.tsx.`
- `2026-04-10 19:28 — Реализация week-band slice собрана; релевантный next-ui gate зелёный, а полный build по-прежнему блокируется внешним type error вне write scope фичи.`
