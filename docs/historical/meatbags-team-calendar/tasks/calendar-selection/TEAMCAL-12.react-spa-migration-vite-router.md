# TEAMCAL-12 — React SPA для всего приложения (Vite + React Router)

Статус: done

## Описание
Перевести весь фронтенд на React SPA, используя Vite и React Router. Дизайн и стили должны остаться полностью прежними, визуально всё выглядит так же, как сейчас. Компоненты собирать на Tailwind, без изменения текущей визуальной системы.

## Технические требования
- Использовать Vite для сборки (npm-пакеты).
- Использовать React Router для клиентской навигации.
- Перенести все страницы в React: auth/landing, teams list, create team, team page, not-found.
- Стили и дизайн должны остаться полностью прежними (классы/визуальный вид не меняем).
- Компоненты собирать на Tailwind (использовать текущие классы и токены).
- Tailwind собирать через Vite/PostCSS, стили хранить в `frontend/src/styles`.
- Статические ассеты хранить в `frontend/public`.
- Интеграция с API сохраняется:
  - `/api/teams`
  - `/api/teams/:shareId`
  - `/api/teams/:shareId/settings`
  - `/api/teams/:shareId` (PATCH)
  - `/api/teams/:shareId/availability`
  - `/api/teams/:shareId/join`
  - `/api/teams/:shareId/delete` (если есть)
  - `/api/me/*` (если используются в профиле)
- Тосты — текущая Tailwind-система, без изменения визуала.
- E2E не нужны.

## Этапы выполнения (по очереди)
1. Внедрить Vite и React Router, подготовить базовый React entry.
2. Перенести layout (header/toast/backdrop) и статику в React, сохранить классы.
3. Перенести landing/auth view.
4. Перенести список команд + создание команды.
5. Перенести страницу команды (заменить текущий React-бандл).
6. Удалить legacy-файлы и роутинг старого фронта, оставить только React Router.
7. Проверить, что стили и визуал соответствуют текущей версии.

## Критерии готовности
- Все страницы работают как React SPA с React Router.
- Визуально дизайн полностью совпадает с текущим.
- Командные функции (слоты, участники, шестерёнка, настройки команды) работают в SPA-режиме.
- Навигация между страницами не перезагружает страницу.

## Тест кейсы
1. Открыть `/` — показывается landing/auth экран с текущим дизайном.
2. Войти через Google — редирект/попап работает, после логина отображается список команд.
3. Открыть `/teams` (или `/`) — список команд без перезагрузки.
4. Создать команду — экран создания работает, после создания открывается `/t/{shareId}`.
5. На `/t/{shareId}` работают слоты, участники, настройки команды.
6. Ошибка API показывает текущий тост, интерфейс не ломается.
7. Навигация “Все команды” возвращает на список без перезагрузки страницы.

## Зависимости
- TEAMCAL-4
- TEAMCAL-8

## Лог
- 2026-02-05 19:31 — [todo] Задача заведена.
- 2026-02-05 19:36 — [todo] Уточнено: React/ReactDOM подключать через npm и сборку.
- 2026-02-05 19:36 — [in_progress] Старт работы по React SPA и build pipeline.
- 2026-02-05 20:11 — [review] Добавлен React build pipeline (esbuild), страница команды перенесена на React SPA, обновлен app.js и index.html, добавлены стили для выбора календарей. Unit-тесты пройдены.
- 2026-02-05 20:15 — [in_progress] Продолжена реализация React-страницы: обновлён React-компонент, index.html и app.js, собран бандл.
- 2026-02-05 20:15 — [review] React SPA финализирована, index.html упрощён под React root, сборка обновлена, unit-тесты пройдены.
- 2026-02-05 20:16 — [in_progress] Исправлена логика имени команды в React, обновлён бандл.
- 2026-02-05 20:16 — [review] Обновлён React-бандл, unit-тесты пройдены.
- 2026-02-05 20:34 — [in_progress] Обновлены требования: перенос всего фронта на React SPA с Vite и React Router при сохранении текущего дизайна. Дальше начну с инфраструктуры (Vite + router), затем последовательно перенесу страницы.
- 2026-02-05 21:01 — [review] Внедрён Vite + React Router, добавлен новый frontend в `frontend/`, перенесены все страницы (landing/teams/create/team/not-found) на React при сохранении текущих классов/дизайна, сервер отдаёт `dist/`, выполнен `npm run build:client`, unit-тесты пройдены.
- 2026-02-05 22:36 — [in_progress] После ревью: на странице команды появился лишний блок шаринга и открывался попап. Убираю блок шаринга и попап, оставляю “Поделиться” как копирование ссылки с тостом.
- 2026-02-05 22:37 — [review] Кнопка “Поделиться” теперь просто копирует ссылку и показывает тост, удалён нижний блок шаринга и модалка. `npm run build:client`, `npm run test:unit`.
- 2026-02-05 22:36 — [in_progress] После ревью: переносим удаление команды под шестерёнку и ограничиваем доступ владельцем. Добавляю флаг canDelete из API настроек, переношу UI в модалку настроек.
- 2026-02-05 22:42 — [review] Удаление команды перенесено в настройки (только owner), добавлен canDelete в `/api/teams/:shareId/settings`, удалён нижний блок. `npm run build:client`, `npm run test:unit`.
- 2026-02-05 22:52 — [in_progress] После ревью: восстановить визуальные элементы слотов (плюс‑иконки, отступы/шрифты, тексты переключателей) и разбить TeamPage на компоненты (скелетон, участники, share‑кнопка, слот, слоты по дням, view слотов).
- 2026-02-05 22:52 — [review] Восстановлены классы/разметка слотов (слоты, иконка плюс, slot‑avatar, тексты переключателей), добавлены компоненты SlotsView/DaySlots/SlotCard/SlotsSkeleton/TeamMembers/ShareButton и вынесены date‑utils. `npm run build:client`, `npm run test:unit`.
- 2026-02-05 23:01 — [review] Сверил разметку со старым `public/index.html`: добавлены классы переключателей (transition/hover), подтверждён текст правил/заголовков/участников. `npm run build:client`, `npm run test:unit`.
- 2026-02-05 23:04 — [review] Перенесены стили и изображения в `frontend/public`, обновлены tailwind-пути и Vite publicDir. Обновлён `AGENTS.md`. `npm run build:client`.
- 2026-02-05 23:08 — [review] Удалён лишний wrapper `.team-page`, чтобы `team-header` и `team-grid` были прямыми детьми `.team-panel` и совпали отступы как в старой разметке. `npm run build:client`, `npm run test:unit`.
- 2026-02-05 23:12 — [review] Серверные файлы перенесены в `server/`, обновлены пути импорта в тестах и командах, скорректирован `server/server.js` на новые пути, обновлены `AGENTS.md` и `README.md`. `npm run test:unit`.
- 2026-02-05 23:15 — [review] Добавлен совместимый root `server.js`, который проксирует запуск на `server/server.js`, чтобы старые команды `node server.js` работали после переноса.
- 2026-02-05 23:18 — [review] Переименован root-эн트рипойнт в `app.js`, обновлены npm-скрипты и `AGENTS.md`.
- 2026-02-05 23:30 — [review] Удалён корневой `public/`, ассеты перенесены в `frontend/public`, `escapeHtml` перенесён в `frontend/src/utils/text.js`, тесты обновлены на импорт из frontend. Убран legacy-фолбэк статики в `server/server.js`. `npm run test:unit`.
- 2026-02-05 23:32 — [review] Фронтовый тест `strings.test.js` перенесён в `frontend/tests/unit`, обновлена команда `test:unit` и импорты. `npm run test:unit`.
- 2026-02-05 23:39 — [review] Tailwind интегрирован через Vite/PostCSS, `styles.css` и `tailwind.css` перенесены в `frontend/src/styles`, удалён legacy build:css, добавлен `postcss.config.js`, обновлены `frontend/index.html` и импорты CSS в `frontend/src/main.jsx`. `npm run build:client`, `npm run test:unit`.
- 2026-02-05 23:51 — [in_progress] Разбиваю TeamPage на модуль: выношу хуки/функции в `frontend/src/modules/team-page`, компоненты в `frontend/src/components/team`, упрощаю страницу.
- 2026-02-05 23:51 — [review] TeamPage декомпозирован: добавлен модуль `team-page` с hooks/utils и index.js, вынесен CalendarSelection в компонент, страница упрощена. `npm run build:client`, `npm run test:unit`.
- 2026-02-05 23:59 — [review] Убрано дублирование запросов: TeamPage больше не дергает `/api/me`, `React.StrictMode` убран для предотвращения двойных эффектов в dev. `npm run build:client`, `npm run test:unit`.
- 2026-02-06 00:01 — [review] Правила показа теперь отображаются всегда: добавлен дефолтный summary в availability-hook и не сбрасываем значения при загрузке. `npm run build:client`, `npm run test:unit`.
- 2026-02-06 00:09 — [in_progress] После ревью: `team-page-hooks.js` слишком общий и путает логику; разнесу хуки/утилиты по файлам модуля и вынесу default summary из хука, чтобы не пересоздавать объект на рендере.
- 2026-02-06 00:12 — [review] Хуки TeamPage разнесены по файлам модуля, utils вынесены в `team-page-selection.utils.js`, default summary вынесен в модульный константный объект. Файл `team-page-hooks.js` удалён.
- 2026-02-06 00:13 — [review] `npm run test:unit`.
- 2026-02-06 00:14 — [done] Задача закрыта по итогам проверки.
