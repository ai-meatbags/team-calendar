# TEAMCAL-56 — JWT delivery runtime, docs and rollout gate

Статус: done

## Описание
Довести delivery runtime и release-facing artifacts до одного blessed path: per-delivery JWT Bearer, required headers, docs for n8n/backend receivers, regression gate и rollout notes.

## Applied rules
- AP-010
- AP-020
- AP-021
- AP-024
- AP-027
- AP-035
- AP-042
- AP-043
- AP-044
- AP-054
- AP-058
- PP-018
- PP-019
- TEW-TR-01
- TEW-TR-03
- TEW-TR-05
- TEW-TR-07

## Перед реализацией прочитать
- `implementation/rep.config.json` и зафиксировать, что runtime/code work идёт в `implementation/`, а task planning остаётся в wrapper repo.
- `tasks/_policies/arch-patterns.md`: `AP-010`, `AP-020`, `AP-021`, `AP-024`, `AP-027`, `AP-035`, `AP-042`, `AP-043`, `AP-044`, `AP-054`, `AP-058`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`.
- `tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md`.
- `tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md`.
- `tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md`.

## Как применять правила
- `AP-010` и `AP-020`: JWT generation и delivery orchestration живут в application/infrastructure boundary вокруг существующего delivery adapter, а не размазываются по booking route и UI.
- `AP-021`: booking entry point остаётся тонким и best-effort; transport layer не должен сам собирать security contract или владеть retry logic.
- `AP-024` и `PP-019`: delivery failures логировать структурно и без утечки secret/JWT/header values; ошибки не глотать бесследно даже в best-effort path.
- `AP-027` и `AP-042`: issuer, alg, TTL default и signing source должны браться из trusted runtime config/constants и fail-fast ломаться при неконсистентной конфигурации.
- `AP-035`: связать `delivery_id`, `jti` и status semantics так, чтобы повторяемые внешние попытки не размывали idempotency contract.
- `AP-043` и `AP-044`: payload delivery, URL calling и docs examples проектировать безопасно для webhook receiver и outbound integration path.
- `AP-054`: docs entry point и status UI wiring должны поддерживать partial failure/degraded states без развала общего booking UX.
- `AP-058`: если runtime rollout требует safety switch, он должен быть явным short-lived kill switch, а не новым permanent auth mode.
- `PP-018`: runtime/tests/docs wiring делать в Next.js/pg-only контуре `implementation/app/*` и `implementation/src/*`.

## Контекстные файлы
- `implementation/src/infrastructure/notifications/team-webhook-delivery.ts`
- `implementation/app/api/booking/*`
- `implementation/src/domain/team-webhooks.ts`
- `implementation/src/application/usecases/team-webhooks.ts`
- `implementation/app/_components/team-page/*.test*`
- `implementation/app/api/**/*.test.ts`
- [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md)
- [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md)
- [TEAMCAL-57](tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md)

## Зона ответственности
- Владеет runtime delivery contract, docs page content и release-facing verification.
- Не меняет основной UX layout секции `Интеграции и вебхуки`, кроме wiring docs entry point и runtime-facing status fields.
- Не меняет schema/domain beyond what already frozen in `TEAMCAL-54`.

## Scope
- Генерировать per-delivery JWT Bearer на `HS256` с TTL `120 секунд`.
- Добавить required delivery headers и claim mapping.
- Обновить delivery status semantics без retry/outbox.
- Подготовить docs page с blessed verification flow для n8n и обычного backend-а.
- Закрыть regression gate и rollout/cutover notes.

## Implementation flow
1. Прочитать `implementation/rep.config.json`, затем применить указанные выше AP/PP из wrapper policy set до начала изменений в `implementation/`.
2. Принять frozen contract из `TEAMCAL-54`.
3. Подключить JWT generation и header mapping в delivery runtime.
4. Связать `delivery_id`, `jti`, `event_id` и status update semantics.
5. Подготовить docs page с blessed verification flow для n8n и обычного backend-а.
6. Проверить wiring с UI entry point из `TEAMCAL-57`.
7. Закрыть regression gate и rollout notes для cutover old subscriptions.

## Критерии готовности
- Каждый outbound delivery использует JWT-only contract.
- Booking flow остаётся best effort.
- Docs и regression gate покрывают blessed path без fallback modes.
- Rollout notes описывают cutover old subscriptions без compat auth-mode.

## DoD
- Runtime delivery можно проверить тестом на claims, headers и best-effort поведение.
- Docs page достаточна для интегратора без дополнительных устных пояснений про auth contract.
- Rollout notes объясняют, что старые subscriptions требуют cutover, а не fallback.
- Таска не дублирует owner UX decisions из `TEAMCAL-57`.

## Тест кейсы
1. JWT claims соответствуют spec contract.
2. Headers `X-Teamcal-*` присутствуют в каждом delivery.
3. Ошибка одного endpoint-а не ломает delivery другим и не ломает booking response.
4. Docs page даёт один verification flow без JWKS/basic auth/HMAC options.

## Зависимости
- [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md)
- [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md)
- [TEAMCAL-57](tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md)

## Лог
- 2026-04-10 13:15 — [todo] Задача создана как интеграционный runtime/docs/rollout gate для blessed path.
- 2026-04-10 18:20 — [in_progress] Поднят runtime-context: current delivery adapter ещё не подписывает JWT и не выставляет `X-Teamcal-*` headers, docs page в рантайме отсутствует; следующий шаг — собрать канонический delivery contract и затем привязать к нему docs route и UI entry point.
- 2026-04-10 18:28 — [done] Runtime переведён на per-delivery JWT Bearer с `HS256`, docs route `/docs/team-webhooks` добавлен и подключён в settings UI, regression gate расширен tests для docs/runtime и проходит через `npm run test:unit`.
