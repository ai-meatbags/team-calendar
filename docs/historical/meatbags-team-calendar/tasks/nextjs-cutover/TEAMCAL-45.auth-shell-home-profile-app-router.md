# TEAMCAL-45 — Перенос auth shell, главной и профиля на App Router

Статус: done

## Описание
Перенести общий shell приложения, auth-entry UX, домашнюю страницу, меню пользователя и профильный сценарий в App Router с parity к текущему интерфейсу.

## Applied rules
- AP-012
- AP-016
- AP-017
- AP-018
- AP-030
- PP-017
- PP-018
- PP-019

## Scope
- `app/layout.tsx` и общие client providers
- `/`
- `/profile`
- topbar / user menu / auth entry / logout flow
- create-team flow и список команд на главной
- parity по login popup, auth-state refresh и меню пользователя

## Критерии готовности
- Неавторизованный и авторизованный сценарии на `/` работают без legacy SPA
- Profile edit работает через Next runtime
- User menu parity сохранён
- Home page сохраняет текущие guest/user/create-team modes и навигацию

## Тест кейсы
1. Smoke по `/` для guest/user/create-team modes.
2. Smoke по `/profile` и сохранению имени.
3. Smoke по user menu, logout и auth-state refresh после логина.

## Зависимости
- [TEAMCAL-43](tasks/nextjs-cutover/TEAMCAL-43.foundation-cutover-parity-and-source-of-truth.md)

## Лог
- 2026-03-07 11:28 — [todo] Created from Linear TEAMCAL-45.
- 2026-03-07 12:41 — [in_progress] Старт выполнения: переношу shell/home/profile с legacy React Router на App Router, сохраняя popup auth, user menu и create-team UX без захода в team page scope.
- 2026-03-07 13:22 — [in_progress] Собрал новый App Router shell: client provider для auth/toast/api, topbar с user menu, home modes для guest/teams/create и профиль с сохранением имени через PATCH /api/me.
- 2026-03-07 13:36 — [in_progress] Закрыл build-несовместимости Next: убрал searchParams из глобального shell, перенес ?create=1 в серверную страницу / и поправил popup-complete route export под контракт App Router.
- 2026-03-07 13:39 — [review] Проверки: `npm run test:unit:next-ui` — green, `npm run test:unit:next-routes` — green, `npx tsc --noEmit --incremental false` — green. `npm run build` компилируется до production шага и дальше блокируется только `ENOSPC` при записи в `.next`.
- 2026-03-07 13:55 — [need_changes] Возврат из review: выношу landing assets и shell styles из legacy frontend-путей и усиливаю acceptance coverage по auth/menu/profile/create-team сценариям.
- 2026-03-07 14:05 — [in_progress] Вынес shell styles в `app/styles/*`, landing assets в `public/*`, перевел layout на локальные Next-runtime пути и убрал прямую зависимость `/` и `/profile` от `frontend/*`.
- 2026-03-07 14:09 — [review] Добавил acceptance helpers/tests для popup auth, logout URL, menu open/close, create-team path и runtime asset/style contract. Проверки: `npm run test:unit:next-ui` — green, `npm run test:unit:next-routes` — green, `npx tsc --noEmit --incremental false` — green. `npm run build` по-прежнему блокируется только `ENOSPC` при записи в `.next`.
- 2026-03-07 14:14 — [retro] retro_done=true; rule_decision=none; reason="Выводы этой задачи относятся к конкретному App Router cutover и уже закреплены в коде, runtime-путях и acceptance тестах; нового project-wide правила не требуется."; rule_type=n/a; rule_id=n/a
- 2026-03-07 14:14 — [done] App Router shell/home/profile доведены до review-ready cutover состояния: runtime больше не зависит от legacy assets/styles, acceptance coverage усилен, зелёные UI/routes/type checks получены; build остаётся заблокирован только нехваткой места на диске.
