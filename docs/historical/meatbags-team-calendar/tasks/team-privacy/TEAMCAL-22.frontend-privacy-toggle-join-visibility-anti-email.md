# TEAMCAL-22 — Frontend: privacy toggle UX + join visibility + anti-email cleanup

Статус: done

## Описание
Собрать клиентское поведение из [Specs](tasks/team-privacy/team-privacy.specs.md):
- переключатель `Публичная / Приватная` в настройках (owner editable, non-owner read-only);
- корректный рендер join-кнопки по auth + `canJoin`;
- удаление любых fallback/рендера по `member.email`.

## Scope
- UI настройки команды: privacy toggle и read-only состояние для non-owner.
- Логика видимости кнопки `Присоединиться`:
  - незалогиненный: скрыто;
  - logged-in non-member + public: показать;
  - logged-in non-member + private: скрыть.
- Обновление клиентских типов/моделей под поля `privacy`, `canJoin`, `canEditPrivacy`.
- Удаление использования `member.email` в UI (`name/title/alt/key/fallback`).
- Frontend unit-тесты матрицы видимости join и read-only toggle.

## Критерии готовности
- Owner видит editable toggle и может инициировать изменение приватности.
- Non-owner видит read-only toggle без возможности редактирования.
- Незалогиненный пользователь не видит join-кнопку всегда.
- Для private-команды join-кнопка не показывается.
- UI не содержит fallback-рендера с email членов команды.

## Тест кейсы
1. Happy path: owner открывает settings и меняет privacy, UI отображает новое состояние после успешного ответа.
2. Invalid input: non-owner пытается изменить toggle (через UI/hack) и получает отказ без разъезда UI состояния.
3. Regression: публичная страница `/t/:shareId` продолжает отображаться для просмотра при любых значениях `privacy`.

## Зависимости
- [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md)

## Лог
- 2026-02-12 12:57 — [todo] Задача создана как frontend-ветка после foundation [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md).
- 2026-02-12 20:42 — [in_progress] Начал frontend-часть: privacy toggle в settings, матрица видимости join по `canJoin`, удаление email fallback в Team UI.
- 2026-02-12 20:44 — [review] Добавлен privacy toggle в `TeamSettingsModal` (owner editable, non-owner read-only), расширен `team-page-settings` hook (`privacy/canEditPrivacy`), join-кнопка переведена на матрицу `hasUser && !isMember && canJoin`, удалены fallback-рендеры по `member.email` в `TeamMembers` и `SlotCard`.
- 2026-02-12 20:55 — [in_progress] Возврат из review по bugfix UX: при ошибке PATCH в настройках тост был под модалкой и невидим; поднимаю z-index тоста и прокидываю текст backend-ошибки в toast/status.
- 2026-02-12 20:56 — [review] Исправлено отображение ошибки PATCH: `.toast` выше модалки (`z-index: 60`), в `team-page-settings` показывается текст фактической ошибки (`error.message`) в toast и статусе модалки.
- 2026-02-12 20:57 — [done] Frontend-часть принята: toggle/read-only/visibility join соответствуют требованиям, ошибки PATCH корректно отображаются в модалке и toast.
