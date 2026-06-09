# TEAMCAL-36 — Foundation: contracts, policies, and migration baseline

Статус: done

## Описание
Собрать foundation для миграции: зафиксировать контракты, обновить локальные project rules под Next.js, определить Applied rules и baseline качества перед массовым переносом.

## Applied rules
- AP-010
- AP-012
- AP-016
- AP-017
- PP-015
- PP-016
- PP-017

## Scope
- Обновить policy в `tasks/_policies/project-patterns.md` (supersede `PP-015`).
- Добавить/обновить docs: `BUSINESS_RULES`, `API_CONTRACTS`, `ARCHITECTURE`, `SECURITY`.
- Зафиксировать baseline тестов текущего API.
- Подготовить feature foundation для реализации TEAMCAL-37..40.

## Критерии готовности
- Локальные policy не конфликтуют с Next.js migration.
- Контрактные docs отражают immediate-break payload shape.
- Есть baseline отчёт по route tests перед migration.

## Тест кейсы
1. Проверка policy-файла на активное правило Next.js.
2. Проверка docs на фиксацию контракта без внутренних `id`.
3. Baseline: route tests запускаются и дают воспроизводимый результат.

## Зависимости
- нет

## Лог
- 2026-02-28 23:21 — [todo] Created from Linear TEAMCAL-36.
2026-02-28 23:22 — [in_progress] Старт реализации foundation: policy update, docs contracts, Drizzle\/Auth.js migration bootstrap.
2026-02-28 23:29 — [in_progress] Добавлен Next.js/TypeScript каркас, Drizzle dual-schema (sqlite/pg), db client selector, encrypted Auth.js adapter и базовые Next API route handlers (me/teams/availability/booking) с DB rate limit helper.
2026-02-28 23:31 — [in_progress] Обновлены policy/docs (PP-018, BUSINESS_RULES/API_CONTRACTS/SECURITY/ARCHITECTURE), добавлены migration scripts (NocoDB->SQLite, SQLite->Postgres), обновлены README/.env.example и маршруты /api/me/settings + /api/me/calendar.
2026-02-28 23:39 — [in_progress] Checkpoint перед исчерпанием контекста: создан feature nextjs-drizzle-migration (spec + TEAMCAL-36..40, Linear синхронизирован), добавлены Next/Drizzle/Auth foundation файлы, API route scaffolding, docs и migration scripts; в процессе установка новых npm зависимостей и последующая проверка тестов/паритета.
2026-02-28 23:52 — [review] Foundation реализован: Next build=pass, db:check:parity=pass, legacy route tests=pass (77/77). Готово к ревью и дальнейшему закрытию задач 37-40 по деталям поведения и миграций.
- 2026-03-01 00:59 — [retro] retro_done=true; rule_decision=update; reason="Выявлены повторяемые риски интеграции Auth.js/Drizzle (schema shape и тип поля expires), правило PP-018 усилено для следующих migration задач."; rule_type=code; rule_id=PP-018
- 2026-03-01 01:02 — [done] Ретро завершено, правило PP-018 обновлено и синхронизировано в Linear; задача закрыта.
