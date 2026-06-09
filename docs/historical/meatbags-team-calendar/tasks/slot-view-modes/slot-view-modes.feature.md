# Feature Dossier

Feature: `slot-view-modes`
Updated: `2026-04-11`

## Context
- Problem: текущий slot surface поддерживает только list-mode, что хорошо для линейного чтения, но хуже подходит для desktop-сценария, где нужно быстро увидеть всю неделю как матрицу дней.
- Goal: добавить desktop-only second view mode для тех же slot data без изменения booking semantics.
- Desired user/business outcome: пользователь быстрее считывает распределение доступности по дням недели на десктопе, не теряя привычного list-mode и не получая сломанную week-grid в мобильном интерфейсе.
- Priority: medium
- Primary stakeholder or decision owner: Vanya
- Target date (if relevant): после стабилизации текущего slot-week-bands polish
- Success metric or acceptance signal for the business outcome: desktop user понимает toggle как смену способа просмотра и может выбрать слот в week-grid так же надёжно, как в list-mode.
- Open questions:
  - нужен ли future follow-up с remember-last-choice;
  - нужен ли в week-grid отдельный subtle marker у сегодняшнего дня.
- Risks:
  - week-grid может начать конкурировать с list-mode и размыть продуктовую модель;
  - toggle легко сделать похожим на period switcher;
  - slots surface можно снова превратить в oversized host.
- Edge cases:
  - неделя без слотов вообще;
  - отдельные пустые дни внутри недели;
  - desktop->mobile resize, если режим уже был переключён;
  - loading/error state при активном week-grid mode.
- Stack or architecture uncertainty: feature живёт целиком в current Next/React slots UI slice и не требует server contract changes, но требует аккуратного desktop/mobile gating и bounded composition.
- Recommended next stage: `tasks`

## Spec
- Fixed decisions:
  - режимы называются `Список` и `Неделя`;
  - toggle содержит label и mode-icons для обоих режимов;
  - `Список` остаётся дефолтом;
  - `Неделя` доступна только на desktop;
  - неделя рендерится как 7 day-columns;
  - пустые дни не скрываются;
  - slot action contract остаётся прежним.
- Contracts:
  - toggle меняет только presentation mode;
  - mobile не показывает toggle и всегда остаётся в list-mode;
  - week-grid получает day-columns даже для пустых дней через UI-level mapping поверх текущего week grouping contract.
- Acceptance criteria:
  - desktop toggle работает;
  - mobile fallback ясен и стабилен;
  - week-grid показывает 7 day-columns и compact vertical slot stacks;
  - tests фиксируют structure и gating.
- Non-goals:
  - persistence режима;
  - mobile week-grid;
  - API/runtime changes.
- Migration or rollout constraints:
  - миграций и rollout semantics нет;
  - feature ограничена component/style/test слоями.
- Feature-level risks:
  - toggle interpreted as navigation;
  - hidden empty days;
  - component bloat.

## Architecture rules in scope
- Relevant `AP-*`: `AP-021`, `AP-026`, `AP-054`, `AP-055`, `AP-064`, `AP-068`, `AP-069`
- Relevant `PP-*`: `PP-017`, `PP-018`, `PP-019`, `PP-021`, `PP-025`
- Approved deviations to register or reference:
  - нет

## Plan
- Decomposition:
  - `TEAMCAL-74` — desktop-only toggle режимов и week-grid представление слотов.
- Dependency order (human-readable planning view):
  - зафиксировать toggle semantics и mobile fallback -> реализовать `TEAMCAL-74` -> отдельно решать persistence/follow-ups только после обратной связи.
- Preference for the minimum dependency graph needed for safe execution:
  - один implementation slice без split по backend/frontend, так как feature чисто presentation-layer.
- Ownership boundaries:
  - `TEAMCAL-74` владеет только slots view-mode state, composition и tests.
- File reservations:
  - `implementation/app/_components/team-page/team-page-slots-section.tsx`
  - новые sibling files рядом с slots surface
  - `implementation/app/_components/team-page/team-page.test.tsx`
  - `implementation/app/_components/team-page/team-page-acceptance.test.ts`
  - `implementation/app/styles/styles.css`
- Integration task:
  - `TEAMCAL-74`
- Required implementation task list:
  - `TEAMCAL-74`
- Testing strategy:
  - `npm run test:unit:next-ui`
  - build gate при изменении typed boundaries

## Decisions
- `2026-04-11` — это отдельная feature, а не продолжение `slot-week-bands`, потому что появляется второй presentation mode и desktop/mobile gating.
- `2026-04-11` — `Неделя` трактуется как week-grid mode, а не как period navigation.
- `2026-04-11` — mobile не получает этот режим.

## Tracking
- Feature anchor issue: `TEAMCAL-73` — `https://linear.app/meatbags/issue/TEAMCAL-73/feature-anchor-rezhimy-prosmotra-slotov`
- Required task set:
  - `TEAMCAL-74`
- Child task keys:
  - `TEAMCAL-74`
- Shared packet version: `v1`
- Current owner: `Codex`

## Log
- `2026-04-11 14:19 — Context created after product decision to add desktop-only week-grid mode alongside current list-mode.`
- `2026-04-11 14:19 — Scope fixed around presentation toggle only; mobile week-grid and persistence explicitly deferred.`
- `2026-04-11 14:19 — Implementation contract tightened: feature must use frontend/shadcn skills, shadcn-based control primitives and small sibling components instead of giant custom markup.`
- `2026-04-11 14:19 — Local packet mirrored to Linear as feature anchor TEAMCAL-73 and implementation task TEAMCAL-74.`
