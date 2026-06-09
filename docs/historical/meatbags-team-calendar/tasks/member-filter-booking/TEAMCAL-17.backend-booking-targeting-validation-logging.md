# TEAMCAL-17 — Backend booking targeting + валидации + логи

Статус: done

## Описание
Привязать booking к выбранному фильтру участников и сделать прозрачный логгинг:
- принимать выбранные `member_public_id` от клиента;
- валидировать принадлежность участников команде;
- формировать целевые email строго по выбранному фильтру;
- не отправлять booking, если для выбранных участников не хватает email.

## Scope
- Расширение `POST /api/booking` входным контекстом:
  - `selectionMode` (`all|single`)
  - `selectedMemberPublicIds`
- Валидация:
  - участники принадлежат команде;
  - у всех target есть email.
- Формирование `attendeeEmails` и calendar link только по target-участникам.
- Обновление payload в webhook:
  - `selectedMemberPublicIds`
  - `selectedParticipantEmails`
  - `selectionMode`
- Серверные логи booking-запроса/ответа.
- Обновление backend тестов.

## Критерии готовности
- Booking учитывает выбранный фильтр, а не всегда всю команду.
- При отсутствии email у выбранного target возвращается ошибка валидации.
- Ответы и payload консистентны с выбранным режимом (`all|single`).
- Логи содержат фильтр и состав target без избыточных данных.

## Тест кейсы
1. Booking в режиме `single` отправляет 1 участника.
2. Booking в режиме `all` отправляет всю команду.
3. Если `selectedMemberPublicIds` содержит чужой id => `400`.
4. Если у target нет email => `400`, webhook не вызывается.
5. При webhook non-2xx backend возвращает `502`.
6. Логи содержат `shareId`, `selectionMode`, `selectedMemberPublicIds` (или count), webhook status.

## Зависимости
- TEAMCAL-15

## Лог
- 2026-02-12 12:21 — [todo] Задача заведена в рамках фичи `member-filter-booking`.
- 2026-02-12 12:26 — [todo] Booking targeting обновлен на `selectedMemberPublicIds` вместо внутренних membership id.
- 2026-02-12 21:16 — [review] `POST /api/booking` переведён на `selectionMode` + `selectedMemberPublicIds`, добавлена валидация принадлежности участника команде и обязательности email target-участников, обновлён webhook payload и server logging по booking-контексту; `npm run test:unit`.
- 2026-02-12 23:25 — [done] Задача закрыта после финальной приёмки фичи: backend-targeting/валидации booking работают по контракту `member_public_id`.
