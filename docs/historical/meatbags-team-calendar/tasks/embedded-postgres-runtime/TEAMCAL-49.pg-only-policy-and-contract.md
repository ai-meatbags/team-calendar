# TEAMCAL-49 — PG-only policy and runtime contract

Статус: done

## Описание
Обновить source-of-truth артефакты проекта так, чтобы они явно фиксировали новый курс: `sqlite` больше не поддерживается, embedded Postgres становится дефолтным self-hosted backend, а внешний Postgres подключается через `DATABASE_URL`.

Эта задача считается process-maintenance foundation и должна быть завершена до кодовых изменений в runtime/data layer.

## Applied rules
- AP-012
- AP-018
- AP-027
- PP-018
- PP-019

## Scope
- `tasks/embedded-postgres-runtime/embedded-postgres-runtime.feature.md`
- `tasks/embedded-postgres-runtime/embedded-postgres-runtime.state.json`
- `tasks/_policies/project-patterns.md`
- Исторические db/runtime spec references, которые всё ещё утверждают `sqlite default + postgres optional`

## Критерии готовности
- `PP-018` обновлён под `pg-only` runtime и embedded Postgres default.
- Feature dossier и task decomposition остаются согласованными с обновлённой project policy.
- Источники решений внутри `tasks/*`, которые задают устаревший sqlite-default contract, либо обновлены, либо явно помечены как исторические.

## Тест кейсы
1. Self-review на отсутствие конфликтов между dossier, `project-patterns.md` и историческими spec references.
2. Проверка, что дальнейшие implementation tasks наследуют уже обновлённый contract, а не старую dual-schema модель.

## Зависимости
- Нет

## Лог
- 2026-03-21 00:35 — [todo] Created from feature dossier `embedded-postgres-runtime`.
- 2026-03-21 00:49 — [in_progress] Старт выполнения: обновляю project policy и исторические spec references, чтобы `pg-only + embedded Postgres default` стал новым source of truth до runtime-изменений.
- 2026-03-21 01:04 — [testing] Self-review завершён: project policy, dossier и historical specs согласованы с `pg-only` contract.
- 2026-03-21 01:04 — [need_retro] Зафиксирован урок про обязательную пометку superseded у historical specs при архитектурном повороте.
- 2026-03-21 01:04 — [done] `PP-018` и конфликтующие spec references обновлены; старый sqlite-default contract больше не является source of truth.
