# TEAMCAL-62 — Guest CTA and neutral recovery UI

Статус: done

## Описание
Обновить guest auth-entry surface под one-button UX: `Продолжить с Google`, supporting copy про auto-create semantics и neutral recovery-state без технических auth-терминов.

## Applied rules
- AP-026
- AP-039
- AP-054
- PP-017
- PP-018
- PP-020

## Перед реализацией прочитать
- `implementation/rep.config.json`.
- `tasks/_policies/arch-patterns.md`: `AP-026`, `AP-039`, `AP-054`.
- `tasks/_policies/project-patterns.md`: `PP-017`, `PP-018`, `PP-020`.
- `tasks/auth-entry-clarity/auth-entry-clarity.feature.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.prd.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.specs.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.plan.md`.
- `tasks/auth-entry-clarity/TEAMCAL-59.auth-route-normal-and-hidden-recovery-mode.md`.
- `tasks/auth-entry-clarity/TEAMCAL-60.google-auth-failure-taxonomy-and-current-user-recovery.md`.

## Как применять правила
- `AP-026`: guest/recovery statuses должны иметь явный UI contract, а не строиться из raw backend/internal codes.
- `AP-039`: UI не решает сам, нужен ли recovery mode; он только отображает server-driven neutral state.
- `AP-054`: guest surface должна различать обычный вход и neutral recovery-needed state, не превращаясь в белый экран или техничную ошибку.
- `PP-017`: однофразные CTA/status строки без финальной точки.
- `PP-018`: изменения только в Next/App Router UI surface и acceptance tests.
- `PP-020`: popup success/recovery UX не должен ломать текущую multi-channel auth completion.

## Контекстные файлы
- `implementation/app/_components/header.tsx`
- `implementation/app/_components/home-page-client.tsx`
- `implementation/app/_components/shell-ui.test.tsx`
- optional guest status wiring in related app components

## Зона ответственности
- Владеет только guest/recovery UI surface и copy.
- Не меняет Google error taxonomy, account schema и session invalidation mechanics.

## Scope
- Заменить `Войти через Google` на `Продолжить с Google`.
- Добавить supporting copy про auto-create semantics.
- Если выбран neutral recovery hint, показать его без техничных терминов.
- Обновить UI tests/acceptance contracts.

## Implementation flow
1. Зафиксировать current guest surface texts.
2. Обновить CTA и supporting copy.
3. Подключить neutral recovery status, если он уже стабилен после current-user orchestration.
4. Обновить UI acceptance tests.

## Критерии готовности
- Guest видит один CTA `Продолжить с Google`.
- Supporting copy объясняет auto-create semantics.
- Recovery-needed UI остаётся нейтральным и нетехничным.

## DoD
- В интерфейсе нет отдельных CTA `Регистрация` или `Переподключить Google`.
- Однофразные тексты соответствуют `PP-017`.
- UI tests фиксируют новый copy contract.

## Тест кейсы
1. Guest topbar показывает `Продолжить с Google`.
2. Landing содержит supporting copy про существующий аккаунт или авто-создание.
3. Recovery-needed state не содержит слов `token`, `reauth`, `refresh`.

## Зависимости
- [TEAMCAL-59](tasks/auth-entry-clarity/TEAMCAL-59.auth-route-normal-and-hidden-recovery-mode.md)
- [TEAMCAL-60](tasks/auth-entry-clarity/TEAMCAL-60.google-auth-failure-taxonomy-and-current-user-recovery.md)

## Лог
- 2026-04-10 15:45 — [todo] Задача создана из auth-entry-clarity implementation plan.
- 2026-04-10 16:25 — [todo] Ownership пересобран: задача отвечает только за guest CTA и neutral recovery UI.
- 2026-04-10 18:59 — [in_progress] Обновил CTA/copy и добавил neutral recovery status для гостевой страницы.
- 2026-04-10 19:01 — [testing] Проверки пройдены: npm run test:unit:next-ui.
- 2026-04-10 19:02 — [need_retro] Проверки завершены, готовлю ретро.
- 2026-04-10 19:02 — [done] Ретро выполнено, задача закрыта.
