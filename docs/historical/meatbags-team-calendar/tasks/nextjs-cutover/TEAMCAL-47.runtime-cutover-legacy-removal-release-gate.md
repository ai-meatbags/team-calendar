# TEAMCAL-47 — Финальный cutover runtime, удаление legacy и release gate

Статус: done

## Описание
Переключить проект на единый Next runtime, привести `package.json` к стандартным основным командам, удалить legacy runtime-код/зависимости и закрыть release gate полного переезда.

## Applied rules
- AP-012
- AP-017
- AP-018
- AP-019
- AP-030
- PP-018
- PP-019

## Scope
- `package.json` scripts cleanup (`dev/build/start/test` as primary)
- удаление `app.js`, `server/`, `frontend/`, `dist/`, legacy deps/scripts
- обновление README/release docs
- финальный regression gate и smoke checklist
- подтверждение, что все поддерживаемые маршруты обслуживаются новым стеком

## Критерии готовности
- Production `start` поднимает только `next start`
- В репозитории не осталось runtime-paths на legacy stack
- Документация и release gate соответствуют новому runtime
- Quickstart и release notes больше не предлагают legacy путь

## Тест кейсы
1. `npm run build`, `npm run test`, `npm run db:check:parity` и automated acceptance gate green.
2. Проверка отсутствия legacy runtime scripts/deps/files.
3. Проверка, что все поддерживаемые маршруты обслуживаются новым стеком.

## Зависимости
- [TEAMCAL-44](tasks/nextjs-cutover/TEAMCAL-44.backend-parity-and-next-api-hardening.md)
- [TEAMCAL-45](tasks/nextjs-cutover/TEAMCAL-45.auth-shell-home-profile-app-router.md)
- [TEAMCAL-46](tasks/nextjs-cutover/TEAMCAL-46.team-page-filters-settings-app-router.md)

## Лог
- 2026-03-07 11:28 — [todo] Created from Linear TEAMCAL-47.
- 2026-03-07 15:37 — [in_progress] Старт финального cutover: переключаю `package.json` и docs на Next-only runtime, переношу оставшиеся утилиты с зависимостей на `server/frontend`, затем удаляю legacy inventory (`app.js`, `server/`, `frontend/`) и закрываю release gate.
- 2026-03-07 16:03 — [in_progress] Перевёл package/runtime на финальный контур: `package.json` теперь использует стандартные `dev/build/start/test`, lockfile синхронизирован без legacy deps, `tailwind.config.js` и migration script отвязаны от `frontend/server`, `README.md`, `AGENTS.md`, `RELEASE_CHECKLIST.md` и `project-patterns.md` обновлены под Next-only runtime.
- 2026-03-07 16:17 — [review] Финальный cutover выполнен: удалены `app.js`, `server/`, `frontend/`, `vite.config.js`; release gate зелёный — `npm run test`, `npm run db:check:parity`, `TOKEN_ENC_KEY=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... NEXTAUTH_SECRET=... NEXTAUTH_URL=http://127.0.0.1:3000 npm run build`; production smoke подтверждён через `npm run start` + `curl` (`/api/health`, `/`, `/profile`, `/t/demo-share-id` -> `200`). Legacy runtime scripts/deps отсутствуют, основной runtime — только Next.js.
- 2026-03-07 16:28 — [need_changes] После review добираю route-level guard для `/profile`, фиксирую tested runtime версии явно в `package.json` и уточняю release артефакты: automated acceptance + runtime smoke подтверждены, но browser-only checklist не должен заявляться как уже пройденный без отдельной ручной проверки.
- 2026-03-07 16:35 — [review] Review-правки закрыты: `/profile` теперь защищён server-side redirect (`307 -> /` без сессии), core runtime versions зафиксированы явно в `package.json`, release gate/чеклист разделяют automated acceptance и manual browser smoke. Повторные проверки: `npm run test:unit:next-ui`, `npm run test`, `npm run db:check:parity`, `TOKEN_ENC_KEY=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... NEXTAUTH_SECRET=... NEXTAUTH_URL=http://127.0.0.1:3000 npm run build`, `npm run start` + `curl -I /profile` (`307`) и `/api/health` (`200`).
- 2026-03-07 17:27 — [retro] retro_done=true; rule_decision=update; reason="После полного cutover правило стека должно фиксировать Next-only runtime как единственный допустимый контур без возврата legacy scripts, чтобы следующие задачи не реанимировали переходные пути."; rule_type=code; rule_id=PP-018
- 2026-03-07 17:27 — [done] TEAMCAL-47 закрыта: проект переведён на единый Next runtime, legacy inventory удалён, release gate и task artifacts приведены к финальному состоянию cutover.
