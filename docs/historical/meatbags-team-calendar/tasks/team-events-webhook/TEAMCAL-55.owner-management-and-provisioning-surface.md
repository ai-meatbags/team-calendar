# TEAMCAL-55 — Owner management and secret provisioning surface

Статус: done

## Описание
Пересобрать command/query surface для owner management вокруг JWT-only модели: create/list/disable/delete/rotate secret без смешения с future agent setup.

## Applied rules
- AP-010
- AP-020
- AP-021
- AP-032
- AP-040
- AP-041
- AP-042
- AP-043
- AP-049
- AP-050
- PP-018
- PP-019
- TEW-TR-01
- TEW-TR-02
- TEW-TR-05

## Перед реализацией прочитать
- `implementation/rep.config.json` и зафиксировать boundary: код в `implementation/`, task/state artefacts в wrapper repo.
- `tasks/_policies/arch-patterns.md`: `AP-010`, `AP-020`, `AP-021`, `AP-032`, `AP-040`, `AP-041`, `AP-042`, `AP-043`, `AP-049`, `AP-050`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`.
- `tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md`.
- `tasks/team-events-webhook/team-events-webhook.feature.md`.

## Как применять правила
- `AP-010` и `AP-020`: owner provisioning flow собирать через use-case слой; routes только валидируют вход, достают auth context и делегируют в commands/queries.
- `AP-021` и `AP-032`: явно разделить list/read path и create/disable/delete/rotate command path; не смешивать read DTO и mutation side effects в одном handler-контракте.
- `AP-040` и `AP-041`: на каждом protected use-case проверять owner access и team scoping на серверной границе, а не через UI assumptions.
- `AP-042` и `AP-043`: secret reveal одноразовый, последующие reads без plaintext secret; входные URL и action payload валидируются как недоверенные.
- `AP-049` и `AP-050`: delete, disable и rotate должны иметь разные lifecycle semantics и явные status transitions, а не один размытый destructive path.
- `PP-018`: новые API surface и tests располагать только в Next.js App Router / `implementation/src/*`, без возвращения legacy endpoints или старых runtime surface.
- `PP-019`: любые best-effort или cleanup paths логируют и типизируют ошибки, а не молча проглатывают их.

## Контекстные файлы
- `implementation/src/application/usecases/team-webhooks.ts`
- `implementation/app/api/teams/[shareId]/integrations/webhooks/*`
- `implementation/src/domain/team-webhooks.ts`
- `implementation/src/infrastructure/db/schema.ts`
- `implementation/src/infrastructure/notifications/team-webhook-delivery.ts`
- [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md)
- [Feature dossier](tasks/team-events-webhook/team-events-webhook.feature.md)

## Зона ответственности
- Владеет application/use-case и route surface для owner management.
- Не владеет team settings visual UX и onboarding copy.
- Не владеет delivery runtime и docs page content, кроме contract fields, которые API должен вернуть UI.

## Scope
- Обновить query/command use-case-ы subscriptions.
- Обновить owner API routes для create/list/disable/delete.
- Добавить generate/reveal/rotate semantics для shared secret и audience.
- Явно отделить current owner provisioning flow от future API token surface.
- Стабилизировать response contract для settings UI.

## Implementation flow
1. Прочитать `implementation/rep.config.json`, затем применить указанные выше AP/PP из wrapper policy set до начала изменений в `implementation/`.
2. Уточнить read/write contracts после `TEAMCAL-54`.
3. Разделить list/create/disable/delete/rotate на явные query/command сценарии.
4. Добавить генерацию `audience` и one-time secret reveal semantics в command path.
5. Зафиксировать, какие поля UI получает сразу после create и после subsequent reads.
6. Проверить owner-only access и object-level authorization на каждом use-case.
7. Проверить destructive semantics: delete vs disable vs rotate.

## Критерии готовности
- Owner может создать subscription и получить provisioning data по blessed path.
- Owner может disable/delete/rotate subscription без выбора auth mode.
- Query/command surface не смешивает webhook secret и будущий API token.
- Contract tests покрывают owner/non-owner access и destructive actions.

## DoD
- После create UI получает всё нужное для следующего шага onboarding без дополнительных скрытых API calls.
- Subsequent read contract не утечёт plaintext secret.
- Rotate flow меняет secret lifecycle данные, не меняя identity subscription.
- Задача не залезает в UI layout/components и не тянет в себя docs page.

## Тест кейсы
1. Owner создаёт subscription и получает audience + one-time secret reveal flow.
2. Non-owner не может читать или менять subscriptions.
3. Rotate secret обновляет lifecycle metadata и не ломает subscription identity.
4. Delete/disable semantics соответствуют product contract.

## Зависимости
- [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md)

## Лог
- 2026-04-10 13:15 — [todo] Задача создана после пересборки provisioning path для owner management.
- 2026-04-10 17:43 — [in_progress] Начата реализация owner provisioning contract: audience, one-time secret reveal на create/rotate, stable read surface без plaintext secret.
- 2026-04-10 17:48 — [testing] Route, booking и team-page helper checks пройдены; provisioning contract стабилизирован через list/create/rotate semantics.
- 2026-04-10 17:50 — [done] Созданы testing/retro artifacts, feature/spec/PRD синхронизированы с решением "secret only on create/rotate", задача закрыта как completed.
