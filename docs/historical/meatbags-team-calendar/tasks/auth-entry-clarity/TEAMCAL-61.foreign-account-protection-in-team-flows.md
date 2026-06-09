# TEAMCAL-61 — Foreign account protection in team flows

Статус: done

## Описание
Защитить team и aggregate flows от ложного forced logout: ошибки Google-доступа другого участника или гостевого контекста не должны завершать сессию текущего viewer-а и не должны запускать current-user recovery lifecycle.

## Applied rules
- AP-012
- AP-026
- AP-032
- AP-039
- AP-040
- AP-054
- PP-018
- PP-019

## Перед реализацией прочитать
- `implementation/rep.config.json`.
- `tasks/_policies/arch-patterns.md`: `AP-012`, `AP-026`, `AP-032`, `AP-039`, `AP-040`, `AP-054`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`.
- `tasks/auth-entry-clarity/auth-entry-clarity.feature.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.prd.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.specs.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.plan.md`.
- `tasks/auth-entry-clarity/TEAMCAL-60.google-auth-failure-taxonomy-and-current-user-recovery.md`.

## Как применять правила
- `AP-012`: foreign-account failures должны останавливаться как доменные team/member ошибки, а не превращаться в forced logout viewer-а.
- `AP-026`: aggregate/team error response должен быть отдельным контрактом и не протекать как current-user recovery-state.
- `AP-032`: query/team-read path не должен внезапно вызывать command side effect по session invalidation viewer-а.
- `AP-039` и `AP-040`: access decision и recovery reaction возможны только при доказанном соответствии actor и broken account; в guest/foreign contexts этого нет.
- `AP-054`: degraded team states должны быть usable и различимы в UI/response contract.
- `PP-018` и `PP-019`: App Router/pg-only boundaries и осмысленная обработка ошибок обязательны.

## Контекстные файлы
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts`
- `implementation/src/application/usecases/team-page.ts`
- team-related tests under `implementation/app/api/teams/*`

## Зона ответственности
- Владеет только защитой team/aggregate flows от ложного recovery/logout поведения.
- Не владеет current-user forced logout path и auth route mode switching.

## Scope
- Явно отделить foreign-account failure от current-user hard auth loss.
- Не допускать session invalidation viewer-а в team flows.
- Нормализовать team/member error contract для degraded Google-access cases.

## Implementation flow
1. Найти team/aggregate flows с Google-dependent поведением.
2. Подключить typed auth failure classifier.
3. Запретить current-user recovery side effects в guest/foreign-account contexts.
4. Добавить contract tests на team availability и related flows.

## Критерии готовности
- Broken account другого участника не приводит к forced logout viewer-а.
- Team flows возвращают domain-specific degraded/error contract.
- Guest/member contexts не смешиваются с current-user recovery lifecycle.

## DoD
- Ни один team query path не инвалидирует viewer session.
- UI/API могут различить degraded team state и recovery-needed current-user state.

## Тест кейсы
1. Availability при broken account другого участника не завершает viewer session.
2. Guest flow при foreign-account failure не получает current-user recovery contract.
3. Team-level error остаётся доменным и санитизированным.

## Зависимости
- [TEAMCAL-60](tasks/auth-entry-clarity/TEAMCAL-60.google-auth-failure-taxonomy-and-current-user-recovery.md)

## Лог
- 2026-04-10 15:45 — [todo] Задача создана из auth-entry-clarity implementation plan.
- 2026-04-10 16:25 — [todo] Ownership пересобран: задача отвечает только за foreign-account/team protection.
- 2026-04-10 18:56 — [in_progress] Добавил team-level degraded contract для Google auth failures.
- 2026-04-10 18:57 — [testing] Проверки пройдены: npm run test:unit:next-routes.
- 2026-04-10 18:58 — [need_retro] Проверки завершены, готовлю ретро.
- 2026-04-10 18:58 — [done] Ретро выполнено, задача закрыта.
