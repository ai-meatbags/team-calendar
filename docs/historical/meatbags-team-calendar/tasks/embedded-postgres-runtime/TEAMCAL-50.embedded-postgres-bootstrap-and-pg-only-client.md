# TEAMCAL-50 — Embedded Postgres bootstrap and pg-only DB client

Статус: done

## Описание
Реализовать единый Postgres runtime: embedded Postgres как default path без `DATABASE_URL`, внешний Postgres как override path, и убрать dual-dialect selector/dual schema из DB-инфраструктуры.

## Applied rules
- AP-010
- AP-012
- AP-018
- AP-020
- AP-021
- AP-027
- AP-033
- PP-018
- PP-019

## Scope
- `src/infrastructure/db/*`
- `src/ports/db.ts`
- `src/infrastructure/auth/*` при необходимости смены db contract
- `package.json`
- `drizzle.config.*`
- env/bootstrap модули, если понадобятся для embedded Postgres lifecycle

## Критерии готовности
- Runtime больше не содержит sqlite branch, sqlite path resolution и sqlite-specific PRAGMA/setup.
- Drizzle schema и migration config сведены к одному Postgres-контурy.
- Без `DATABASE_URL` приложение поднимает embedded Postgres backend с локальным persistent storage.
- С `DATABASE_URL` embedded bootstrap bypass-ится и используется внешний Postgres.

## Тест кейсы
1. Unit tests для resolution логики embedded-vs-external Postgres.
2. DB client tests для pg-only bootstrap и fail-fast ошибок конфигурации.
3. Smoke на то, что Auth.js/data layer используют единый pg schema contract.

## Зависимости
- [TEAMCAL-49](tasks/embedded-postgres-runtime/TEAMCAL-49.pg-only-policy-and-contract.md)

## Лог
- 2026-03-21 00:35 — [todo] Created from feature dossier `embedded-postgres-runtime`.
- 2026-03-21 01:02 — [in_progress] Старт выполнения: ввожу pg-only client, shared runtime defaults и process-boundary wrapper, чтобы embedded Postgres не протекал в domain/use-case слой.
- 2026-03-21 01:04 — [testing] Regression gate пройден: `npm run db:migrate`, `npm run test` и `npm run build` проходят на pg-only runtime.
- 2026-03-21 01:04 — [need_retro] Зафиксирован follow-up на hardening embedded wrapper для конкурентных локальных команд.
- 2026-03-21 01:04 — [done] Data layer и runtime свёрнуты в один Postgres-контур с embedded default и external `DATABASE_URL` override.
