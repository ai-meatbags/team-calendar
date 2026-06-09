# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, route handlers, auth routes and client components.
- `src/`: Application, domain, infrastructure and interface layers for the Next runtime.
- `scripts/`: Migration and project utility scripts.
- `public/`: Runtime assets served by Next.js.
- `drizzle/`: Generated migration manifests for the Postgres schema.
- `.env` / `.env.example`: Local configuration and secrets.

## Build, Test, and Development Commands
- `npm run dev`: Run the Next.js app in development mode.
- `npm run build`: Build the production Next.js app.
- `npm run start`: Run the production Next.js server.
- `npm run test`: Run the primary unit/contract test gate.
- `npm run test:unit:auth`: Auth.js/auth-layer tests.
- `npm run test:unit:db`: Drizzle/db tests.
- `npm run test:unit:next-routes`: Next route contract tests.
- `npm run test:unit:next-ui`: App Router UI/state acceptance tests.

## Coding Style & Naming Conventions
- TypeScript is preferred for new Next/runtime code; existing JavaScript may remain in scripts or legacy task artifacts.
- Pure logic lives in `src/domain/*` or `src/shared/*` and should be unit-tested.
- File naming: lowercase with hyphens for new modules (e.g., `db-session-store.ts`).

## Testing Guidelines
- Framework: Node’s built-in test runner (`node --test`).
- Naming: `*.test.ts` / `*.test.tsx` рядом с Next/runtime модулями; JS tests допустимы в scripts-утилитах.
- Keep unit tests deterministic; Postgres-backed checks should use the repo-native embedded/default runtime path or an explicit `DATABASE_URL`.
- Primary gate is `npm run test`; release verification is described in `docs/RELEASE_CHECKLIST.md`.

## Commit & Pull Request Guidelines
- No strict commit convention observed; keep messages short and imperative
  (e.g., “add session store”, “fix slots”).
- PRs should include:
  - Purpose and summary of changes.
  - Test commands run (or reason not run).
  - UI screenshots/GIFs for visual changes.

## Security & Configuration Tips
- Secrets belong in `.env`, never in client bundles.
- OAuth scopes are minimal (free/busy + openid/email).
- Session storage uses the Postgres-backed Auth.js/Drizzle tables.

## Источник правил Task Tracker
- Если запрос пользователя попадает под любой актуальный триггер skill `task-tracker`, агент обязан:
  - строго следовать его процессу, write-gate и ограничениям без локальных переинтерпретаций;
  - использовать актуальный skill `task-tracker`, доступный в текущей среде агента.

## Порядок выбора project config
- Перед чтением `rep.config.json` агент обязан сначала разрешить `target project root`.
- Для `project-tracker` и `task-tracker` каноничен `rep.config.json` именно из `target project root`, а не из git root и не из родительской папки монорепы.
- Если в родительской папке тоже есть `rep.config.json`, его можно использовать только как фоновый workspace-контекст и нельзя использовать для выбора `task_prefix`, `task_sync.mode`, статусов, шаблонов или решения bootstrap vs upgrade в подпроекте.
- Если агент сначала по ошибке прочитал не тот `rep.config.json`, он обязан явно сообщить об этом, отбросить это решение и пересчитать действия от конфига выбранного подпроекта.

## Обязательное применение системного промпта проекта
- `project policy set` проекта состоит из:
  - `rep.config.json`
  - `tasks/_policies/dev-plan.md`
  - `tasks/_policies/arch-patterns.md`
  - `tasks/_policies/project-patterns.md`
  - project-local templates по путям из `rep.config.json`
- Перед началом работы агент обязан загрузить и применить конфигурацию из `rep.config.json` выбранного `target project root`.
- Агент обязан выполнить системные инструкции и правила проекта, определяемые `AGENTS.md` и `project policy set` выбранного `target project root`.
- Если в конфиге/политиках указаны обязательные правила, write-gate или порядок этапов, они имеют приоритет и должны соблюдаться до любых изменений файлов.

## Разделение scope в монорепе
- `target project root` определяется по явному указанию пользователя; если явного пути нет, используется текущая рабочая папка запроса.
- Наличие git root или `rep.config.json` в родительской папке не означает, что задачу нужно автоматически переносить на верхний уровень монорепы.
- Для bootstrap/upgrade проверка `rep.config.json` делается только в `target project root`, который выбрал пользователь или из которого был сделан запрос.

## Правило путей в файлах
- Для любых файлов и артефактов внутри репозитория пути записываются только от git-root.
- Машинозависимые абсолютные пути конкретной машины в файлах проекта запрещены.
- Если нужно сослаться на внешний стандартный путь вне репозитория, используйте только portable-форму вроде `~/.codex/config.toml` или placeholder, а не абсолютный путь конкретной машины.

## Правило маршрутизации реализации
- Если пользователь просит реализовать план (`implement plan`) и доступен скилл `task-tracker`, выполнение должно идти через процесс `task-tracker`.
