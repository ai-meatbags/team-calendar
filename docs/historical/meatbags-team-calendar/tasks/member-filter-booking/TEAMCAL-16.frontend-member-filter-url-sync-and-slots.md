# TEAMCAL-16 — Frontend фильтр участников + URL sync + слоты

Статус: done

## Описание
Реализовать новый UX выбора доступности:
- участники становятся кликабельным фильтром;
- добавляется режим `Все`;
- старый тоггл `Все свободны / Кто-то свободен` удаляется;
- фильтр синхронизируется с URL (`member=<member_public_id>`).

## Scope
- Обновить блок участников на интерактивный выбор.
- Добавить/обновить состояние фильтра в модуле team-page.
- Интегрировать `useSearchParams` для URL sync.
- Использовать `memberPublicId` из team detail как frontend-идентификатор фильтра.
- Вызывать `/availability` с `member` при выборе участника.
- Отрисовывать участников в слотах по текущему фильтру.
- Удалить старый mode toggle из `SlotsView`.
- Обновить frontend unit-тесты.

## Критерии готовности
- Клик по участнику включает фильтр и обновляет URL.
- Клик по `Все` сбрасывает query `member`.
- Открытие deep-link с `member` восстанавливает фильтр.
- Невалидный `member` из URL не ломает UI (fallback в `Все`).
- Старый toggle `all/any` отсутствует.

## Тест кейсы
1. Дефолтный вход `/t/:shareId` => режим `Все`.
2. Клик по участнику => URL `?member=<member_public_id>`, персональные слоты.
3. Клик `Все` => query очищен, командные слоты.
4. Deep-link `/t/:shareId?member=<valid>` => участник выбран автоматически.
5. Deep-link `/t/:shareId?member=<invalid>` => fallback `Все`.
6. Regression: выбор длительности 30/60 минут работает.

## Зависимости
- TEAMCAL-15

## Лог
- 2026-02-12 12:21 — [todo] Задача заведена в рамках фичи `member-filter-booking`.
- 2026-02-12 12:26 — [todo] Frontend URL sync обновлен на `member=<member_public_id>`, источник id: `memberPublicId`.
- 2026-02-12 21:16 — [review] Реализован member-filter UI в блоке участников (`Все` + member chips), синхронизация `member` query через `useSearchParams`, загрузка availability с query `member`, удалён legacy-toggle `all/any` из `SlotsView`; `npm run test:unit`, `npm run build:client`.
- 2026-02-12 22:14 — [in_progress] Доработка после review_feedback: обновить текст тоста копирования ссылки и перестроить расположение controls в блоке `Выбери слот`; учесть обновленный лейбл кнопки `Все участники`.
- 2026-02-12 22:15 — [review] Обновлен toast копирования: `Скопирована ссылка на расписание участника.`; controls (интервал + refresh) перенесены в строку заголовка `Выбери слот` сразу после него с выравниванием по центру; `npm run build:client`.
- 2026-02-12 22:16 — [in_progress] Доработка после review_feedback: заголовок команды + `Поделиться` + шестерёнка в одной строке с вертикальным центрированием, уменьшение размеров кнопок `Поделиться` и шестерёнки.
- 2026-02-12 22:17 — [review] `team-title-row` переведен на вертикальное центрирование и одну строку в desktop, кнопки `Поделиться` и шестерёнка уменьшены (`btn--sm` + compact icon button), на mobile сохранен wrap; `npm run build:client`.
- 2026-02-12 22:18 — [in_progress] Доработка после review_feedback: сделать динамический текст toast копирования ссылки в зависимости от фильтра (участник с именем / вся команда).
- 2026-02-12 22:19 — [review] Toast копирования теперь зависит от фильтра: для single — `Скопирована ссылка на расписание участника {Имя}.`, для all — `Скопирована ссылка на расписание всей команды.`; `npm run build:client`.
- 2026-02-12 22:19 — [in_progress] Доработка после review_feedback: исправить размер кнопки `Поделиться` (специфичность стилей) и восстановить видимость иконки шестерёнки.
- 2026-02-12 22:20 — [review] Повышена специфичность стилей экшенов (`.btn.team-action-*`), кнопка `Поделиться` уменьшена, кнопка шестерёнки сделана компактной с фиксированными размерами и явным `svg` display/stroke; `npm run build:client`.
- 2026-02-12 22:21 — [in_progress] Доработка после review_feedback: увеличить длительность показа toast в 3 раза и увеличить размер шрифта уведомления для читаемости.
- 2026-02-12 22:21 — [review] Toast timeout увеличен до `6000ms` (x3), шрифт toast увеличен до `16px` (+line-height), проверка: `npm run build:client`.
- 2026-02-12 22:24 — [in_progress] Доработка после review_feedback: вернуть кнопки `Поделиться` и шестерёнки к стандартному размеру элементов управления (убрать уменьшенные кастомные размеры).
- 2026-02-12 22:26 — [review] Удалены кастомные classes/стили `team-action-*`; `Поделиться` и шестерёнка снова используют базовые размеры `btn` как остальные элементы управления; `npm run build:client`.
- 2026-02-12 22:26 — [in_progress] Доработка после review_feedback: выровнять `Поделиться`/шестерёнку по размеру с переключателями участников и устранить побочный рост `font-size` в CSS после правки toast.
- 2026-02-12 22:29 — [review] Исправлен побочный рост `font-size` (возвращены базовые размеры `btn--sm`/toggle/settings-summary/user-chip/booking-context), `Поделиться` и шестерёнка сделаны компактными под размер переключателей участников (`team-action-share`/`team-action-gear`); `npm run build:client`.
- 2026-02-12 22:30 — [in_progress] Доработка после review_feedback: блокировать member/interval переключатели во время обновления данных, перенести переключатель интервала перед списком участников, скрыть кнопку refresh в слотах без удаления кода.
- 2026-02-12 22:34 — [review] Переключатель интервала перенесён перед списком участников (в `TeamHeader`), member/interval переключатели блокируются при обновлении (`isSlotsLoading || isMembersLoading`), refresh-кнопка в `SlotsView` скрыта через `slot-controls--hidden` (код сохранён), добавлены disabled-стили для `toggle` и member-buttons; `npm run build:client`.
- 2026-02-12 22:35 — [in_progress] Доработка после review_feedback: объединить `Правила показа:` и условия в один inline-ряд без разрыва на отдельные строки.
- 2026-02-12 22:36 — [review] `Правила показа:` и условия объединены в один inline-ряд (`slot-meta--single-row` + `rules-label--inline`), без разрыва на отдельные строки; `npm run build:client`.
- 2026-02-12 22:41 — [in_progress] Доработка после review_feedback: переключатели интервала перенести в одну строку с фильтрами участников и выровнять их размер с participant chips.
- 2026-02-12 22:42 — [review] Interval chips (`1 час`/`30 мин`) оставлены в общем `member-tags` single-line ряду с участниками; добавлены `overflow-y: hidden` для ряда и единый размер тегов через `min-height: 34px` + `flex: 0 0 auto`, чтобы переключатели и участники были одинаковой высоты; `npm run build:client`.
- 2026-02-12 22:53 — [in_progress] Доработка после review_feedback: вернуть единый toggle контрол длительности (как раньше), но оставить его в одной строке с фильтрами участников.
- 2026-02-12 22:53 — [review] В `TeamMembers` собран общий горизонтальный ряд: единый toggle длительности + member chips в одной строке (`team-members__row`), без разделения на две строки; убран эффект слияния чипов и интервалов; `npm run build:client`.
- 2026-02-12 22:55 — [in_progress] Доработка после review_feedback: обновить визуальный стиль participant chips (white idle, gray hover, active orange без изменений).
- 2026-02-12 22:55 — [review] Обновлены стили member chips: неактивные — белый фон, hover — серый фон без изменения `border-color`, активные оставлены в оранжевом стиле; `npm run build:client`.
- 2026-02-12 23:09 — [in_progress] Реализовать `participants` как единый сегментный `toggle`-контрол в одной строке с `duration`, сохранить `avatar + name`, однострочный скролл и disabled-state при загрузке.
- 2026-02-12 23:09 — [review] `TeamMembers` переведен на второй `toggle` (`team-member-toggle`) с сегментами `Все участники + участники`, активное состояние и `disabled` работают через текущий filter-state; `TeamMembersSkeleton` приведен к новому виду (2 toggle-контрола в одной строке); добавлены стили `team-member-toggle*` и skeleton-сегментов; проверки: `npm run build:client`, `npm run test:unit`.
- 2026-02-12 23:12 — [in_progress] Доработка после review_feedback: уменьшить padding у обоих переключателей (`duration` и `participants`) без изменения логики.
- 2026-02-12 23:12 — [review] Уменьшены внутренние отступы и высота сегментов в обоих контролах (`team-member-controls .toggle`, `team-member-toggle`) и синхронизирован skeleton (`team-toggle-segment--skeleton`); `npm run build:client`.
- 2026-02-12 23:13 — [in_progress] Доработка после review_feedback: зафиксировать компактный размер participant-контрола, который перебивался базовым `.toggle button`.
- 2026-02-12 23:13 — [review] Добавлен приоритетный override `.toggle.team-member-toggle button*` (padding/min-height/font-size + hover/disabled), чтобы участники не были крупнее duration-тоггла; `npm run build:client`.
- 2026-02-12 23:15 — [in_progress] Доработка после review_feedback: сделать иконку команды визуально залитой, когда активен фильтр `Все участники`.
- 2026-02-12 23:15 — [review] Для team-icon добавлен активный модификатор (`member-team-icon.is-active`) и условный class в `TeamMembers`; при выборе всей команды иконка рендерится как filled (accent background + white glyph); `npm run build:client`.
- 2026-02-12 23:16 — [in_progress] Доработка после review_feedback: убрать hover-эффект у заблокированных контролов (`duration` и `participants`), чтобы исключить мигание.
- 2026-02-12 23:16 — [review] В `TeamMembers` добавлен class `is-disabled` на оба toggle-контейнера при `isDisabled=true`, в CSS добавлено правило `.toggle.is-disabled button { pointer-events: none; }` — hover на заблокированных контролах отключен полностью; `npm run build:client`.
- 2026-02-12 23:17 — [in_progress] Доработка после review_feedback: изменить цвет заливки активной иконки команды с оранжевого на серый.
- 2026-02-12 23:17 — [review] В `member-team-icon.is-active` заменена заливка/граница на серый (`var(--muted)`), иконка при выборе всей команды теперь filled-gray; `npm run build:client`.
- 2026-02-12 23:18 — [in_progress] Доработка после review_feedback: уменьшить внутренний отступ между рамкой participant-контрола и его сегментами (padding контейнера, не кнопок).
- 2026-02-12 23:18 — [review] Добавлен приоритетный override `.toggle.team-member-toggle { padding: 1px; gap: 2px; }`, чтобы базовый `.toggle` не перебивал отступы participant-контрола; `npm run build:client`.
- 2026-02-12 23:19 — [in_progress] Доработка после review_feedback: сделать текст активных сегментов интервала и участников черным.
- 2026-02-12 23:19 — [review] Добавлены точечные overrides для активного текста: `.team-member-controls .toggle button.is-active` и `.toggle.team-member-toggle button.is-active` → `color: var(--ink)`; `npm run build:client`.
- 2026-02-12 23:22 — [in_progress] Доработка после review_feedback: выставить внутренний padding капсулы `2px` у обоих контролов.
- 2026-02-12 23:22 — [review] Participant-контрол синхронизирован с duration по внутреннему отступу: `.toggle.team-member-toggle { padding: 2px; }` (duration уже был `2px`); `npm run build:client`.
- 2026-02-12 23:25 — [done] Задача закрыта: UX фильтра участников/интервала доведён до финального состояния по последним правкам, проверки `build/unit` зелёные.
