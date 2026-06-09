# TEAMCAL-58 — Auth entry clarity doc sync and implementation gate

Статус: done

## Описание
Синхронизировать PRD, SDD-спеку, feature dossier и implementation plan для `auth-entry-clarity`, чтобы перед кодовой декомпозицией были явно зафиксированы: архитектурные правила в scope, единый feature DoD, hidden recovery mode state machine и требования к будущим implementation-задачам.

## Applied rules
- AP-012
- AP-021
- AP-022
- AP-026
- AP-039
- AP-054
- PP-018
- PP-019
- PP-020

## Перед реализацией прочитать
- `implementation/rep.config.json` и зафиксировать, что кодовая реализация идёт в `implementation/`, а task artifacts остаются в wrapper repo.
- `tasks/_policies/arch-patterns.md`: `AP-012`, `AP-021`, `AP-022`, `AP-026`, `AP-039`, `AP-054`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`, `PP-020`.
- `tasks/auth-entry-clarity/auth-entry-clarity.feature.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.prd.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.specs.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.plan.md`.

## Как применять правила
- `AP-012` и `AP-022`: проверить, что PRD/spec/plan одинаково различают hard auth loss, transient failure и foreign-account failure и не допускают silent fallback после критической ошибки.
- `AP-021`: implementation plan должен оставлять route handlers тонкими и не переносить state machine в transport layer.
- `AP-026`: план и DoD должны явно описывать transport contracts для recovery signal, guest status и logout reaction, а не ссылаться на “как получится в коде”.
- `AP-039`: во всех документах должно быть одинаково зафиксировано, что hard auth loss определяется только на серверной доверенной границе.
- `AP-054` и `PP-020`: UI/degradation требования и popup constraints должны быть учтены в DoD и в task contract, а не оставлены как пожелания.
- `PP-018` и `PP-019`: plan и будущие задачи должны вести реализацию только в Next.js/App Router/Drizzle контуре и не допускать пустых `catch` как якобы безопасного best-effort.

## Контекстные файлы
- [Feature dossier](tasks/auth-entry-clarity/auth-entry-clarity.feature.md)
- [PRD](tasks/auth-entry-clarity/auth-entry-clarity.prd.md)
- [Feature spec](tasks/auth-entry-clarity/auth-entry-clarity.specs.md)
- [Implementation plan](tasks/auth-entry-clarity/auth-entry-clarity.plan.md)

## Scope
- Перечитать релевантные `AP-*` и `PP-*` для auth/recovery сценария.
- Добавить в implementation plan явную карту применения архитектурных и проектных правил по slice-ам.
- Добавить в implementation plan единый feature DoD / release gate.
- Обновить feature dossier и spec так, чтобы они ссылались на тот же набор правил и не спорили с планом.
- Зафиксировать task authoring contract: каждая новая implementation-задача обязана содержать `Applied rules`, `Перед реализацией прочитать`, `Как применять правила`.

## Критерии готовности
- PRD, spec, feature dossier и plan синхронизированы по hidden recovery mode, one-button UX и recovery semantics.
- В implementation plan добавлен явный mapping `AP-*` / `PP-*` к slice-ам.
- В implementation plan добавлен единый feature DoD / release gate.
- В feature dossier и spec отражён тот же набор релевантных правил.
- Создана первая task artifact с явным read/apply contract для дальнейшей декомпозиции.

## DoD
- Документы не содержат смысловых конфликтов по normal mode, hidden recovery mode и forced logout semantics.
- В будущем task packet для этой фичи нельзя создать без явных секций `Applied rules`, `Перед реализацией прочитать`, `Как применять правила`.
- Feature state переведён в `tasks` и ссылается на созданную задачу.

## Тест кейсы
1. Проверить, что `auth-entry-clarity.plan.md` содержит `Архитектурные правила в scope`, `Карта правил по слайсам`, `Task authoring contract`, `Feature DoD / release gate`.
2. Проверить, что `auth-entry-clarity.feature.md` и `auth-entry-clarity.specs.md` используют тот же набор релевантных `AP-*` / `PP-*`.
3. Проверить, что созданная задача явно ссылается на все feature-документы и policy files.

## Зависимости
- нет

## Лог
- 2026-04-10 15:20 — [todo] Задача создана для синхронизации PRD/spec/plan и фиксации implementation gate.
- 2026-04-10 15:20 — [in_progress] Добавлены архитектурный mapping в plan, единый feature DoD и task contract для будущих implementation-задач; feature artifacts синхронизированы с выбранными AP/PP.
- 2026-04-10 15:28 — [testing] Выполнен self-review по артефактам: plan содержит architecture mapping, feature DoD и task authoring contract; feature/spec/task packet используют единый набор AP/PP и ссылки на source-of-truth документы.
- 2026-04-10 15:30 — [need_retro] Зафиксирован process lesson про обязательный architecture-rule mapping и task contract на plan-stage feature; proposal добавлен в `tasks/_inbox/retro-inbox.md`.
- 2026-04-10 15:30 — [done] Docs gate закрыт локально: PRD/spec/plan/feature dossier синхронизированы, первая task artifact создана и future implementation packet contract зафиксирован.
