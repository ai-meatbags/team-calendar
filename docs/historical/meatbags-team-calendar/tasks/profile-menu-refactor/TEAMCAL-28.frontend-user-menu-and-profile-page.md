# TEAMCAL-28 — Frontend user menu and profile page

Статус: done

## Описание
Собрать UI меню пользователя в хедере и страницу профиля `/profile` с изменением имени.

## Scope
- Обновить `Header`:
  - dropdown trigger в правом углу
  - пункты: `Профиль`, `Все команды`, `Создать команду`, `Выйти`
  - под пунктом `Все команды` вывести список существующих команд веткой
  - иконки на всех пунктах
  - desktop hover / mobile click
- Добавить страницу `frontend/src/pages/ProfilePage.jsx`.
- Добавить роут `/profile` в `frontend/src/App.jsx`.
- Добавить/обновить стили для dropdown и profile-page.

## Критерии готовности
- Меню раскрывается на hover в desktop.
- Меню раскрывается по click в mobile.
- Страница профиля сохраняет имя через `PATCH /api/me`.
- После сохранения имя обновляется в UI.
- Список команд показывается в попапе под `Все команды` и открывает `/:shareId` команды.

## Тест кейсы
1. Happy path: пользователь меняет имя на `/profile` и видит успешное обновление.
2. Invalid input: пустое имя блокируется с сообщением об ошибке.
3. Regression: вход/выход и навигация на `/` продолжают работать.

## Зависимости
- [TEAMCAL-26](tasks/profile-menu-refactor/TEAMCAL-26.backend-route-modules-foundation.md)
- [Specs](tasks/profile-menu-refactor/specs.md)

## Лог
- 2026-02-12 23:16 — [todo] Создана задача на frontend меню и профиль.
- 2026-02-12 23:59 — [in_progress] Реализация dropdown меню пользователя и страницы `/profile`.
- 2026-02-12 23:59 — [review] Добавлены `Header` dropdown, `ProfilePage`, роут `/profile` и responsive-стили.
- 2026-02-12 23:59 — [in_progress] Исправлено преждевременное закрытие hover-меню: добавлен delay закрытия `120ms`, сохранены close-on-outside и close-on-escape.
- 2026-02-12 23:59 — [in_progress] Доработан anchoring попапа к аватару (top-right), убраны layout-сдвиги на hover, аватар визуально интегрирован в header попапа без изменения якорной позиции.
- 2026-02-12 23:59 — [in_progress] Добавлен пункт `Создать команду` с иконкой и переходом в create-mode (`/?create=1`); в `HomePage` добавлена обработка query-параметра `create`.
- 2026-02-12 23:59 — [in_progress] Пункт `Мои команды` переименован в `Все команды`; добавлен вложенный список команд в попапе в виде ветки.
- 2026-02-12 23:59 — [in_progress] Добавлена ленивая предзагрузка списка команд после загрузки страницы (`requestIdleCallback` + fallback), убран текст `Загрузка...` из меню.
- 2026-02-12 23:59 — [in_progress] Профиль: оставлен только toast (без статус-строки), форма центрирована и расширена по запросу.
- 2026-02-12 23:59 — [done] Иконки вынесены в отдельные компоненты: `frontend/src/components/icons/ProfileIcon.jsx`, `frontend/src/components/icons/TeamsIcon.jsx`, `frontend/src/components/icons/CreateTeamIcon.jsx`, `frontend/src/components/icons/LogoutIcon.jsx`; `Header.jsx` очищен от встроенных SVG.
- 2026-02-12 23:59 — [done] Финальные UI-правки: размер шрифта имён команд в ветке выровнен с основными пунктами меню; отступы первой строки попапа и положение попапа относительно аватара откалиброваны по требованиям.
