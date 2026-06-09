# TEAMCAL-63 — Recovery callback reset and regression gate

Статус: done

## Описание
Собрать интеграционный хвост фичи: после успешного recovery callback очистить recovery artifacts, вернуть account в `active` и прогнать полный regression gate для normal mode, hidden recovery mode, protected team flows и one-button UX.

## Applied rules
- AP-021
- AP-023
- AP-026
- AP-039
- AP-040
- AP-054
- PP-018
- PP-019
- PP-020

## Перед реализацией прочитать
- `implementation/rep.config.json`.
- `tasks/_policies/arch-patterns.md`: `AP-021`, `AP-023`, `AP-026`, `AP-039`, `AP-040`, `AP-054`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`, `PP-020`.
- `tasks/auth-entry-clarity/auth-entry-clarity.feature.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.prd.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.specs.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.plan.md`.
- `tasks/auth-entry-clarity/TEAMCAL-59.auth-route-normal-and-hidden-recovery-mode.md`.
- `tasks/auth-entry-clarity/TEAMCAL-60.google-auth-failure-taxonomy-and-current-user-recovery.md`.
- `tasks/auth-entry-clarity/TEAMCAL-61.foreign-account-protection-in-team-flows.md`.
- `tasks/auth-entry-clarity/TEAMCAL-62.guest-cta-and-neutral-recovery-ui.md`.

## Как применять правила
- `AP-021`: callback/reset logic должна оставаться в тонких entry points + application/auth helpers, без смешения с UI.
- `AP-023`: recovery cookie cleanup, account-state reset и callback side effects должны быть явно awaited и диагностируемы.
- `AP-026`: regression gate обязан проверять transport-visible contracts, а не только внутреннее состояние account rows.
- `AP-039` и `AP-040`: успешный recovery должен возвращать к нормальному trusted auth state без обхода серверной boundary.
- `AP-054`: regression gate должен покрывать non-success states и не только happy path normal login.
- `PP-018`, `PP-019`, `PP-020`: Next-only/runtime-safe implementation, без пустых `catch`, с сохранением popup completion multi-channel contract.

## Контекстные файлы
- `implementation/src/infrastructure/auth/auth-options.ts`
- auth callback-related tests
- `implementation/app/api/auth/route.test.ts`
- `implementation/app/_components/shell-ui.test.tsx`
- related me/team route tests

## Зона ответственности
- Интегрирует предыдущие slices и закрывает regression gate.
- Не открывает новый product scope сверх уже утверждённого feature packet.

## Scope
- После successful recovery callback очищать recovery cookie.
- Переводить account `reauth_required -> active`.
- Проверить, что first-run/new-user path не ломается.
- Прогнать и зафиксировать regression gate по auth/team/UI scenarios.

## Implementation flow
1. Подключить cleanup/reset semantics на callback success.
2. Сверить lifecycle account state до и после recovery.
3. Закрыть contract tests по normal/recovery/current-user/foreign-account/UI веткам.
4. Прогнать обязательные repo-native тестовые команды.
5. Зафиксировать testing artifact и residual risks.

## Критерии готовности
- Successful recovery callback возвращает account в `active` и очищает recovery artifacts.
- Regression gate подтверждает one-button UX и hidden recovery semantics.
- Happy path new user и returning user не деградируют.

## DoD
- Интеграционный regression gate закрыт документированно.
- В testing artifact перечислены команды, результаты и residual risks.
- Feature готова к переходу в testing/review packet как интегрированный slice.

## Тест кейсы
1. Successful recovery callback очищает recovery cookie и account recovery-state.
2. New user first-run path сохраняется.
3. Returning user normal login сохраняется без forced consent.
4. Foreign-account/team failure не завершает viewer session.
5. Popup completion остаётся рабочим по `PP-020`.

## Зависимости
- [TEAMCAL-59](tasks/auth-entry-clarity/TEAMCAL-59.auth-route-normal-and-hidden-recovery-mode.md)
- [TEAMCAL-60](tasks/auth-entry-clarity/TEAMCAL-60.google-auth-failure-taxonomy-and-current-user-recovery.md)
- [TEAMCAL-61](tasks/auth-entry-clarity/TEAMCAL-61.foreign-account-protection-in-team-flows.md)
- [TEAMCAL-62](tasks/auth-entry-clarity/TEAMCAL-62.guest-cta-and-neutral-recovery-ui.md)

## Лог
- 2026-04-10 15:45 — [todo] Задача создана из auth-entry-clarity implementation plan.
- 2026-04-10 16:25 — [todo] Ownership пересобран: задача стала integration tail для callback reset и regression gate.
- 2026-04-10 19:03 — [in_progress] Очистил recovery cookie на popup completion, зафиксировал regression coverage.
- 2026-04-10 19:04 — [testing] Проверки пройдены: npm run test:unit:next-routes.
- 2026-04-10 19:05 — [need_retro] Проверки завершены, готовлю ретро.
- 2026-04-10 19:05 — [done] Ретро выполнено, задача закрыта.
