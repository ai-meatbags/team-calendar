# TEAMCAL-30 — Booking auth-email source + popup email visibility + attendee dedup

Статус: done

## Описание
Изменить booking flow как единый контракт frontend + backend:
- гость вводит email вручную;
- залогиненный пользователь не вводит email в popup;
- backend для auth-запроса берет requester email только из `req.session.userEmail`;
- email участников и requester нормализуются и дедуплицируются в payload.

## Applied rules
- AP-012
- AP-013
- AP-016
- AP-017
- PP-015
- PP-017
- Feature constraints из [Specs](tasks/member-filter-booking/member-filter-booking.specs.md), секция `Технические ограничения реализации` (п.1, п.2, п.5, п.8)

## Scope
- Передать `currentUser` в booking hook на Team page.
- Обновить booking hook:
  - вычислять `isLoggedIn`;
  - выбирать источник requester email (auth: `currentUser.email`, guest: поле формы);
  - fail-fast на пустом auth email.
- Обновить booking modal:
  - скрывать поле email для auth;
  - сохранять guest email flow без регресса.
- Обновить backend `/api/booking`:
  - auth source: `req.session.userEmail`;
  - guest source: `req.body.email`;
  - `400` при auth без session email;
  - нормализация и dedup `selectedParticipantEmails`/`attendeeEmails`;
  - `payload.email` заполнять итоговым requester email.
- Расширить route-тесты booking по новым auth/guest и dedup кейсам.

## Критерии готовности
1. У auth-пользователя в popup отсутствует поле email.
2. У guest-пользователя поле email присутствует и обязательно.
3. Backend для auth игнорирует `body.email` и использует `session.userEmail`.
4. Для auth без `session.userEmail` backend возвращает `400`.
5. `attendeeEmails` не содержит дублей при пересечении requester/participants.
6. Route-тесты и unit-тесты проходят.

## Тест кейсы
1. Guest happy-path с ручным email.
2. Auth happy-path без email input.
3. Auth + missing session email -> `400`.
4. Auth + `body.email != session.email` -> используется session email.
5. Duplicate suppression: requester совпадает с target-участником.
6. Duplicate suppression: регистр/пробелы не приводят к дублям.
7. Регрессия: webhook `502` и success `200` сохраняют прежнее поведение.

## Зависимости
- [TEAMCAL-17](tasks/member-filter-booking/TEAMCAL-17.backend-booking-targeting-validation-logging.md) (`done`)
- [TEAMCAL-18](tasks/member-filter-booking/TEAMCAL-18.booking-popup-readonly-success-error-state.md) (`done`)

## Лог
- 2026-02-13 02:11 — [todo] Задача заведена: auth-email source + UI скрытие email + attendee dedup.
- 2026-02-13 02:11 — [in_progress] Начата реализация: обновление specs, task-артефакта и контрактов frontend/backend.
- 2026-02-13 02:14 — [in_progress] Реализован auth/guest flow для requester email: frontend скрывает email поле для auth, backend использует `session.userEmail` для auth и `body.email` для guest, добавлен fail-fast `400` для auth без session email.
- 2026-02-13 02:14 — [in_progress] Усилена дедупликация email в booking payload, добавлены route-тесты на auth source, guest-валидацию и dedup по пересечению/нормализации email.
- 2026-02-13 02:15 — [review] Прогнаны проверки: `npm run test:routes`, `npm run test:unit`, `npm run build:client`; все проверки green.
- 2026-02-13 02:22 — [done] Задача принята пользователем и закрыта без дополнительных изменений.
