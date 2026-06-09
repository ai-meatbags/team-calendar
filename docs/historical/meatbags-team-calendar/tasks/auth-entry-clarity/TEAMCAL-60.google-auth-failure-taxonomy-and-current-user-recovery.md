# TEAMCAL-60 — Google auth failure taxonomy and current-user recovery

Статус: done

## Описание
Ввести machine-readable классификацию Google auth failures, account-level recovery state и current-user recovery orchestration в одном слайсе, чтобы hard auth loss сразу приводил к правильному server-side lifecycle без размазывания boundary между двумя задачами.

## Applied rules
- AP-012
- AP-022
- AP-026
- AP-032
- AP-039
- PP-018
- PP-019

## Перед реализацией прочитать
- `implementation/rep.config.json`.
- `tasks/_policies/arch-patterns.md`: `AP-012`, `AP-022`, `AP-026`, `AP-032`, `AP-039`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`.
- `tasks/auth-entry-clarity/auth-entry-clarity.feature.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.prd.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.specs.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.plan.md`.
- `tasks/auth-entry-clarity/TEAMCAL-59.auth-route-normal-and-hidden-recovery-mode.md`.

## Как применять правила
- `AP-012` и `AP-022`: ошибки Google должны быть типизированы по ответственности: hard auth loss, transient external failure, unexpected.
- `AP-023`: account-state update, recovery-cookie creation и session invalidation выполняются как наблюдаемый sequence без floating async side effects.
- `AP-026`: storage model recovery-state и transport-visible error codes не должны протекать наружу как raw Google error payload.
- `AP-032`: state mutation account recovery-status оформляется как command boundary, а чистое чтение account/auth status остаётся query concern.
- `AP-039` и `AP-040`: forced logout допустим только в проверенном current-user context и только когда доказан hard auth loss именно его Google account.
- `PP-018`: schema/migrations и infra changes идут только через Drizzle/pg-only contour.
- `PP-019`: запрещены безликие `catch` с превращением всех Google ошибок в один `Calendar sync failed`.

## Контекстные файлы
- `implementation/src/infrastructure/google/freebusy.ts`
- `implementation/src/infrastructure/google/calendar-list.ts`
- `implementation/src/application/errors.ts`
- `implementation/src/application/usecases/get-current-user.ts`
- `implementation/app/api/me/*`
- `implementation/app/api/me/settings/*`
- `implementation/app/api/me/calendar/*`
- `implementation/src/infrastructure/db/schema.ts`
- `implementation/src/infrastructure/db/schema-pg/index.ts`
- `implementation/drizzle/*`

## Зона ответственности
- Владеет error taxonomy, schema contract и current-user hard auth loss orchestration.
- Не владеет auth route mode switching, foreign-account protection и UI copy.

## Scope
- Выделить typed Google auth failure classifier.
- Добавить account-level recovery fields/state.
- Подготовить migration и backward-compatible чтение account rows.
- Нормализовать codes для hard auth loss vs transient failure.
- В current-user flows на hard auth loss выполнять:
  - account state update в `reauth_required`
  - session invalidation
  - short-lived recovery signal creation
- На transient failure сохранять session и отдавать нейтральный contract без техничных слов.

## Implementation flow
1. Аудировать текущие Google call sites и места, где ошибки схлопываются.
2. Выделить ограниченный набор app/domain error codes.
3. Добавить account-level recovery fields в schema и migration.
4. Обновить infra helpers, чтобы они возвращали typed auth failures.
5. Подключить classifier в current-user flows и добавить command path для account state update + logout preparation.
6. Добавить tests на classification, state transition и current-user orchestration contract.

## Критерии готовности
- Система различает hard auth loss и transient failure machine-readable образом.
- Account schema хранит `active | reauth_required` и служебные timestamps/reason.
- Current-user hard auth loss переводит следующий вход в hidden recovery mode.
- Raw Google failures не протекают напрямую в верхние слои.

## DoD
- Для recovery-state существует pg migration.
- Нет единого общего fallback-а `Calendar sync failed` для auth-specific кейсов.
- Session инвалидируется только на hard auth loss current user.
- Следующие задачи могут опираться на стабильный recovery-state contract.

## Тест кейсы
1. Missing refresh token классифицируется как hard auth loss.
2. Auth-specific Google refresh failure классифицируется как hard auth loss.
3. Timeout/5xx/rate limit классифицируются как transient failure.
4. Current-user flow на hard auth loss помечает account и инвалидирует session.
5. Current-user flow на transient failure не инвалидирует session.

## Зависимости
- [TEAMCAL-59](tasks/auth-entry-clarity/TEAMCAL-59.auth-route-normal-and-hidden-recovery-mode.md)

## Лог
- 2026-04-10 15:45 — [todo] Задача создана из auth-entry-clarity implementation plan.
- 2026-04-10 16:25 — [todo] Scope расширен: current-user orchestration объединён с taxonomy и recovery-state ради чистой boundary.
- 2026-04-10 18:50 — [in_progress] Внёс taxonomy, recovery cookie/session cleanup, account auth_status и current-user recovery orchestration.
- 2026-04-10 18:53 — [testing] Проверки пройдены: npm run test:unit:auth, npm run test:unit:db, npm run test:unit:next-routes.
- 2026-04-10 18:54 — [need_retro] Проверки завершены, готовлю ретро.
- 2026-04-10 18:55 — [done] Ретро выполнено, задача закрыта.
- 2026-04-11 13:47 — [need_changes] Пойман реальный кейс: token refresh network failure не классифицировался как transient.
- 2026-04-11 13:48 — [in_progress] Добавил классификацию request-to-token failures как transient.
- 2026-04-11 13:49 — [testing] Проверки пройдены: npm run test:unit:auth.
- 2026-04-11 13:49 — [done] Фикс добавлен, задача закрыта повторно.
