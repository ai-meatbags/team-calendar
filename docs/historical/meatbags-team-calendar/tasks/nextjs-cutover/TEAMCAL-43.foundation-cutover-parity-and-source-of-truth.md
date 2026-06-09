# TEAMCAL-43 — Фундамент cutover: матрица parity и source of truth

Статус: done

## Описание
Зафиксировать полный cutover-план как единственный source of truth для оставшегося переезда на `Next.js`: сверить бизнес-сценарии legacy UI/API, зафиксировать release gate, runtime surface и список legacy-артефактов на удаление.

## Applied rules
- AP-012
- AP-017
- AP-018
- AP-030
- PP-018

## Scope
- Уточнение и стабилизация feature-spec `nextjs-cutover`
- Финальная матрица parity: legacy routes/pages -> Next routes/pages
- Явный release gate для UX/API/runtime cutover
- Актуализация docs/source-of-truth для полной миграции

## Критерии готовности
- Спека и release gate покрывают весь существующий business surface без пропусков
- Нет конкурирующих specs для оставшегося cutover scope
- Явно перечислены legacy runtime files/scripts/deps на удаление
- UX acceptance criteria описывают текущее поведение интерфейса без продуктовых потерь

## Тест кейсы
1. Проверка, что все текущие страницы, auth-flow и API-контракты отражены в спецификации и acceptance criteria.
2. Проверка, что release gate покрывает UI/auth/runtime, а не только DB/API.
3. Проверка, что новая спека является source of truth для оставшегося cutover scope.

## Зависимости
- нет

## Лог
- 2026-03-07 11:28 — [todo] Created from Linear TEAMCAL-43.
- 2026-03-07 11:28 — [in_progress] Старт выполнения: фиксирую source of truth для полного cutover, добираю parity-matrix и расширяю release gate под UX/auth/runtime.
- 2026-03-07 11:28 — [in_progress] Обновлены `tasks/nextjs-cutover/nextjs-cutover.specs.md`, `docs/RELEASE_CHECKLIST.md`, `README.md`: добавлены source-of-truth секция, inventory legacy-артефактов, legacy parity-matrix и runtime/UI/auth release gate.
- 2026-03-07 11:28 — [review] Source of truth для полного cutover зафиксирован; release checklist теперь покрывает UI/auth/runtime, README ссылается на новый cutover-контур. Тесты не запускались: изменения документарные.
- 2026-03-07 11:28 — [retro] retro_done=true; rule_decision=none; reason="Зафиксированные выводы носят feature-specific характер и уже отражены в cutover-спеке и release checklist; нового project-wide правила не требуется."; rule_type=n/a; rule_id=n/a
- 2026-03-07 11:28 — [done] Ретро завершено, задача закрыта: source of truth, parity-matrix и полный release gate для cutover зафиксированы в spec/docs.
