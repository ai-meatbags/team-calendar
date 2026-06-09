# Project Patterns

Rules version: `2.10.0`  
Updated: `2026-04-10`

## Назначение
Файл хранит только локальные технические правила этого проекта.

`tasks/_policies/arch-patterns.md` и `tasks/_policies/dev-plan.md` считаются upstream-managed и локально не редактируются в рамках задач.

## Формат правила
Для каждого правила:
- `PP-###`
- `Добавлено`
- `Статус` (`active|archived|obsolete`)
- `Приоритет` (`high|medium|low`)
- `Описание`
- `Требование`

Для потенциального переноса в upstream добавлять строку:
- `Upstream: candidate`

## Активные правила

### PP-018 — Application stack: Next.js App Router + Drizzle + pg-only runtime
**Добавлено:** 2026-02-28 23:30  
**Статус:** active  
**Приоритет:** high  
**Тип:** code  
**Описание:** Новая реализация приложения и API выполняется в Next.js App Router с инфраструктурой хранения на Drizzle и единым Postgres-контуром: embedded Postgres по умолчанию для zero-config self-hosted и внешний Postgres через `DATABASE_URL` как override path.
**Требование:**
- Новые API и UI изменения реализуются в `app/*` и `src/*` слоях Next.js.
- Runtime boundary проекта является `Next-only`: запрещено возвращать зависимости на legacy runtime-контуры (`frontend/`, `server/`, `dist/`, `app.js`) в коде, импортах, assets, стилях, scripts и документации.
- DB-доступ для нового контура идёт через `src/infrastructure/db/*` и единый Postgres schema/runtime contract; `sqlite`, dual-schema и dialect selector в проект не возвращаются.
- При отсутствии `DATABASE_URL` приложение и self-hosted шаблон используют embedded Postgres bootstrap по умолчанию.
- При наличии `DATABASE_URL` embedded bootstrap bypass-ится и используется внешний Postgres без специальных feature flags.
- Для Auth.js + Drizzle adapter передавать schema в поддерживаемом формате таблиц (`usersTable/accountsTable/sessionsTable/verificationTokensTable`), без fallback на default table names.
- Поля срока жизни сессий (`sessions.expires`) хранить в date-compatible типе; запрещено хранение срока жизни сессии строкой без явного преобразования в Date на adapter boundary.
- Runtime bootstrap embedded Postgres должен быть вынесен на process boundary или другой явный lifecycle boundary; нельзя размазывать скрытый async startup Postgres по domain/use-case слою.
- Test, migration и operational path должны использовать тот же Postgres-контур; нельзя держать sqlite как скрытый fallback только для tests/scripts.
- `package.json` использует `dev`, `build`, `start`, `test` как основные команды нового контура; legacy runtime scripts не возвращаются.
- Пользовательские runtime-assets размещаются только в `public/*`; глобальные стили импортируются только из `app/*` или другого явно Next-runtime совместимого пути внутри текущего контура.
- Защищённые page-сценарии должны иметь route-level server-side guard/redirect на boundary страницы или layout; client-side redirect сам по себе не считается достаточной защитой доступа.

### PP-019 — Запрет пустых catch-блоков
**Добавлено:** 2026-03-01 00:20  
**Статус:** active  
**Приоритет:** high  
**Описание:** Пустые `catch` скрывают инциденты и усложняют диагностику, поэтому в проекте они запрещены.
**Требование:**
- Нельзя использовать `catch {}` без действий.
- В `catch` должен быть осмысленный обработчик (логирование, преобразование в доменную ошибку, fallback или rethrow), но не no-op.
- Если ошибка ожидаемая и допускается fallback, это должно быть явно задокументировано в сообщении лога; неожидаемые ошибки пробрасываются дальше.

### PP-020 — Popup auth completion must not depend on opener-only state
**Добавлено:** 2026-03-07 19:20  
**Статус:** active  
**Приоритет:** high  
**Тип:** code  
**Описание:** Popup-based OAuth flow теряет надёжность, если completion строится только на `window.opener`, `window.close()` или polling `popup.closed`: после переходов через Google и browser COOP-policy эти сигналы могут стать недоступны или нестабильны.
**Требование:**
- Popup auth completion не должен зависеть только от `window.opener.postMessage(...)`.
- Межоконный success-сигнал обязан иметь same-origin fallback без зависимости от opener, например `BroadcastChannel` и/или `localStorage` event.
- Главная вкладка должна быть способна подтвердить успех логина и обновить auth state даже если `window.opener` потерян после OAuth redirect chain.
- Нельзя полагаться на polling `popup.closed` как на основной механизм завершения auth flow; браузерные COOP/COEP ограничения делают такой polling ненадёжным и шумным.
- Если popup не удаётся закрыть программно, completion page должна оставаться нейтральной и не дублировать основное приложение внутри popup.

### PP-021 — Oversized host files do not absorb new feature UI
**Добавлено:** 2026-04-10  
**Статус:** active  
**Приоритет:** high  
**Тип:** code  
**Описание:** Если feature добавляется в уже раздутый host-файл UI, нельзя продолжать наращивать в нём новый бизнес-сценарий. Host boundary должен остаться местом композиции, а новый сценарий обязан уехать в отдельный sibling slice с маленькими компонентами и понятной бизнес-ролью.
**Требование:**
- Если существующий UI host-файл уже превышает soft limit или содержит несколько независимых ответственностей, новая нетривиальная feature-логика не добавляется в него напрямую, кроме минимального composition wiring.
- Новый UI slice выносится в отдельные sibling-файлы с именами по бизнес-цели, а не по визуальному или техническому признаку.
- Host-файл может импортировать и собирать feature section, но не должен повторно становиться местом для onboarding flow, destructive flow, provisioning flow и другой новой бизнес-ветвистой логики.
- Для UI-задач review должен отдельно проверять, не ухудшила ли реализация размер и когезию существующего host-файла даже если итоговое поведение функционально корректно.

### PP-022 — Architectural pivots must retire stale source-of-truth artifacts
**Добавлено:** 2026-04-10  
**Статус:** active  
**Приоритет:** high  
**Тип:** process  
**Upstream:** candidate  
**Описание:** После архитектурного поворота старые specs, task packets и rollout-документы быстро становятся скрытым конкурирующим source of truth. Если их явно не вывести из активного контура до runtime-изменений, команда начинает одновременно исполнять новый и уже отменённый контракт.
**Требование:**
- Перед реализацией runtime-изменений по новому architectural path все historical artifacts, которые описывают конфликтующий контракт, должны быть явно помечены как `superseded`, `obsolete` или иным однозначным terminal marker.
- Текущий blessed path обязан быть явно назван в актуальном feature dossier/spec, чтобы у команды не оставалось двух "живых" вариантов реализации.
- Review не должен пропускать change set, если старый spec/task/rollout artifact продолжает выглядеть активным и может быть принят за действующий контракт.

### PP-023 — App Router changes require honest build and route gate
**Добавлено:** 2026-04-10  
**Статус:** active  
**Приоритет:** high  
**Тип:** code  
**Upstream:** candidate  
**Описание:** Для Next.js App Router unit-тесты сами по себе не доказывают корректность route surface. Ошибки в export surface, type contracts и nested route discovery регулярно проявляются только на `next build` или слишком поздно на close-out.
**Требование:**
- Любая задача, меняющая `app/**/route.ts`, route handlers, route config или другой App Router runtime boundary, должна включать полный `npm run build` в testing/release gate до закрытия.
- В `app/**/route.ts` разрешены только поддерживаемые Next route exports и минимальный entry-point wiring; helpers, factories и test-only exports выносятся в sibling modules.
- Nested route tests, включая dynamic segment paths, должны либо входить в основной `test:unit:next-routes` gate, либо собираться через другой явно задокументированный и надёжный discovery path; отдельный "случайный" test file вне штатного gate не считается достаточным покрытием.

### PP-024 — Security-sensitive generated migrations require manual cutover review
**Добавлено:** 2026-04-10  
**Статус:** active  
**Приоритет:** high  
**Тип:** code  
**Upstream:** candidate  
**Описание:** `drizzle-kit generate` ускоряет старт миграции, но не является migration truth для security-sensitive schema cuts. На существующих таблицах generated SQL легко маскирует небезопасный `ADD COLUMN ... NOT NULL` без backfill semantics и ломает реальный cutover path.
**Требование:**
- Generated migration SQL рассматривается как draft и подлежит ручной проверке перед merge, если меняются auth, secret, token, ownership или другие security-sensitive поля на существующих таблицах.
- Добавление новых non-null колонок на существующие таблицы без явного staged backfill/cutover plan запрещено, даже если SQL сгенерирован инструментом без ошибок.
- Task/spec/testing artifacts для такой миграции обязаны явно описывать backfill semantics, legacy-row handling и критерий безопасного cutover.

### PP-025 — Feature plan must fix rule mapping and task authoring contract before implementation
**Добавлено:** 2026-04-10  
**Статус:** active  
**Приоритет:** high  
**Тип:** process  
**Upstream:** candidate  
**Описание:** Если feature доходит до стадии `plan` без явного mapping `AP-*`/`PP-*`, feature DoD и task authoring contract, декомпозиция начинает дрейфовать: задачи перечисляют правила формально, забывают нужные артефакты или трактуют один и тот же policy-set по-разному.
**Требование:**
- Для feature, входящей в стадию `plan`, implementation plan обязан содержать architecture-rule mapping по slice-ам, единый feature DoD и task authoring contract.
- Task authoring contract обязан заранее фиксировать обязательные секции implementation-задач: `Applied rules`, `Перед реализацией прочитать`, `Как применять правила`.
- В `Как применять правила` задача должна объяснять применение `AP-*`/`PP-*` к своему write scope, а не просто перечислять номера правил.

### PP-026 — Local+Linear mirror starts only after clean write scopes are stable
**Добавлено:** 2026-04-10  
**Статус:** active  
**Приоритет:** medium  
**Тип:** process  
**Upstream:** candidate  
**Описание:** Слишком ранний sync feature packet в Linear создаёт координационный шум без продуктовой ценности: задачи потом переименовываются, схлопываются и спорят за одни и те же boundaries, хотя локальная декомпозиция ещё не стабилизировалась.
**Требование:**
- В режиме `local+linear` remote mirror создаётся только после того, как локальный task packet стабилизирован по clean write scopes и ownership boundaries.
- Если две задачи делят один application boundary, одну интеграционную ответственность или один integration tail, их нужно схлопнуть локально до создания remote issues.
- Linear не используется как место для "черновой" декомпозиции, которую команда ещё не готова защищать как рабочий implementation packet.

### PP-015 — Frontend stack: React + Vite
**Добавлено:** 2026-02-12 14:30  
**Статус:** obsolete  
**Приоритет:** high  
**Описание:** Фронтенд проекта реализуется как React SPA на Vite с текущей визуальной системой.
**Причина:** superseded by PP-018 (Next.js App Router migration).
**Требование:**
- Новые клиентские изменения должны быть совместимы с действующим React+Vite стеком проекта.

### PP-016 — Availability fallback to primary
**Добавлено:** 2026-02-12 14:30  
**Статус:** active  
**Приоритет:** medium  
**Описание:** В availability допускается доменный fallback на `primary` при пустом выборе календарей.
**Требование:**
- Применять fallback только в availability-контуре.
- Логировать предупреждение без утечки чувствительных данных.

### PP-017 — UI single-sentence punctuation
**Добавлено:** 2026-02-12 23:05  
**Статус:** active  
**Приоритет:** medium  
**Описание:** Однофразные тексты UI-компонентов должны быть без финальной точки для единообразия интерфейса.
**Требование:**
- Для однофразных UI-сообщений (включая toast) не добавлять точку в конце предложения.
- Если сообщение состоит из нескольких предложений, пунктуация по правилам языка сохраняется.

## Архив

### PP-014 — Legacy frontend structure pages/components
**Добавлено:** 2026-02-12 14:30  
**Статус:** obsolete  
**Приоритет:** low  
**Описание:** Историческое правило старой структуры фронтенда.
**Причина:** заменено актуальным стеком React + Vite.

## Как обновлять
1. Повысить `Rules version` при изменении набора правил.
2. Обновить `Updated`.
3. Для нового правила добавить `PP-###` и обязательные поля.
4. Если правило устарело — выставить `obsolete` и указать причину.
