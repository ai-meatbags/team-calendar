# TEAMCAL-14 — Приватность команды + anti-email leakage (legacy container)

Статус: done (superseded)

## Описание
Изначальная одиночная задача декомпозирована в feature-пакет.
Актуальный source of truth:
- [Specs](tasks/team-privacy/team-privacy.specs.md)
- [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md)
- [TEAMCAL-21](tasks/team-privacy/TEAMCAL-21.owner-only-privacy-update-private-join-guard.md)
- [TEAMCAL-22](tasks/team-privacy/TEAMCAL-22.frontend-privacy-toggle-join-visibility-anti-email.md)
- [TEAMCAL-23](tasks/team-privacy/TEAMCAL-23.team-privacy-backfill-migration.md)
- [TEAMCAL-24](tasks/team-privacy/TEAMCAL-24.integration-regression-security-checklist.md)

## Reason
Требования не отменены, а перенесены в feature-first структуру: одна спека + набор атомарных задач.

## Scope
- Историческая карточка-указатель.
- Реализация и уточнения требований ведутся только в feature-файлах.

## Критерии готовности
- Все новые изменения по данной инициативе фиксируются в [Specs](tasks/team-privacy/team-privacy.specs.md) и задачах [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md)-[TEAMCAL-24](tasks/team-privacy/TEAMCAL-24.integration-regression-security-checklist.md).
- В `TEAMCAL-14` не добавляются новые продуктовые требования.

## Тест кейсы
1. Открыть [Specs](tasks/team-privacy/team-privacy.specs.md) и убедиться, что в нем есть `Fixed Decisions`, `Parallelization matrix` и feature DoD.
2. Проверить, что декомпозиция на задачи доступна по ссылкам [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md)-[TEAMCAL-24](tasks/team-privacy/TEAMCAL-24.integration-regression-security-checklist.md).
3. Проверить, что в этой карточке нет новых противоречащих требований.

## Зависимости
- нет

## Лог
- 2026-02-12 11:53 — [todo] Задача создана как одиночная фича в `tasks/`.
- 2026-02-12 12:55 — [blocked] Задача superseded: требования и исполнение перенесены в [Specs](tasks/team-privacy/team-privacy.specs.md) и задачи [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md)-[TEAMCAL-24](tasks/team-privacy/TEAMCAL-24.integration-regression-security-checklist.md).
- 2026-02-12 13:03 — [done] Финальный статус выставлен в `done`: как legacy-контейнер закрыта, исполнение идет через [Specs](tasks/team-privacy/team-privacy.specs.md) и [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md)-[TEAMCAL-24](tasks/team-privacy/TEAMCAL-24.integration-regression-security-checklist.md).
