# TEAMCAL-31 — Feature framing: phased notifications contract (email first)

Статус: done

## Описание
Уточнить и зафиксировать фазовую спецификацию фичи [Specs](tasks/team-events-webhook/team-events-webhook.specs.md):
- Phase 1: email notifications в booking flow;
- следующие фазы: team webhook subscriptions, agent setup token, outbound signature + JWKS.

## Applied rules
- AP-010
- AP-011
- AP-012
- AP-016
- AP-017
- TEW-TR-01
- TEW-TR-02
- TEW-TR-03
- TEW-TR-04
- TEW-TR-05

## Scope
- Обновление feature spec под фазовую реализацию.
- Фиксация release gates и матрицы параллелизации.
- Декомпозиция на 5 задач (TEAMCAL-31..35).

## Критерии готовности
- В [Specs](tasks/team-events-webhook/team-events-webhook.specs.md) зафиксированы фазы, fixed decisions и release gates.
- Создана декомпозиция на [TEAMCAL-32](tasks/team-events-webhook/TEAMCAL-32.booking-email-notifications.md), [TEAMCAL-33](tasks/team-events-webhook/TEAMCAL-33.team-webhook-subscriptions.md), [TEAMCAL-34](tasks/team-events-webhook/TEAMCAL-34.agent-setup-token-and-jwks.md), [TEAMCAL-35](tasks/team-events-webhook/TEAMCAL-35.integration-regression-rollout.md).
- Нет открытых продуктовых ambiguities для старта Phase 1.

## Тест кейсы
1. Проверить, что в `specs.md` есть `Fixed Decisions`, `Parallelization matrix`, `Feature-level Definition of Done`.
2. Проверить, что все ссылки задач в markdown-формате и ведут на файлы внутри `tasks/team-events-webhook`.
3. Проверить, что Phase 1 критерии release отделены от full feature gate.

## Зависимости
- нет

## Лог
- 2026-02-12 23:58 — [todo] Задача создана в рамках фичи [Specs](tasks/team-events-webhook/team-events-webhook.specs.md).
- 2026-02-13 02:25 — [in_progress] Переформатировал фичу в phased roadmap: email first, webhook/auth later.
- 2026-02-13 02:26 — [done] Спека обновлена, декомпозиция расширена до 5 задач, release gates зафиксированы.
