# TEAMCAL-32 — Booking email notifications (Phase 1)

Статус: done

## Описание
Реализовать Phase 1 фичи из [Specs](tasks/team-events-webhook/team-events-webhook.specs.md):
- отправка email выбранным участникам при `booking.requested`;
- отправка requester confirmation только для non-member requester;
- перевод webhook доставки в best effort.

## Applied rules
- AP-010
- AP-011
- AP-012
- AP-017
- PP-015
- TEW-TR-01
- TEW-TR-02
- TEW-TR-03
- TEW-TR-04
- TEW-TR-05

## Scope
- Добавить SMTP-канал с `nodemailer`.
- Добавить модуль шаблонов и сервиса email-уведомлений.
- Интегрировать email dispatch в `POST /api/booking`.
- Сделать webhook delivery non-blocking.
- Обновить route tests booking flow под новый контракт.

## Критерии готовности
- Участники получают письмо с деталями и `gcalLink`.
- Non-member requester получает confirmation с текстом: `Команда получит запрос и создаст событие в календаре`.
- Ошибки SMTP/webhook не приводят к `5xx` на валидном booking.
- Route tests покрывают happy path, best-effort поведение и regression.

## Тест кейсы
1. Booking success -> participant emails отправлены.
2. Non-member requester -> confirmation email отправлен.
3. Member requester -> confirmation email не отправлен.
4. SMTP error -> booking response `200`, ошибка залогирована.
5. Missing webhook config -> booking response `200`.
6. Non-2xx webhook -> booking response `200`, warning лог.
7. Email template содержит дату, время, команду, комментарий, `gcalLink`.

## Зависимости
- [TEAMCAL-31](tasks/team-events-webhook/TEAMCAL-31.notifications-feature-framing.md)

## Лог
- 2026-02-13 02:26 — [in_progress] Старт реализации email notifications и best-effort delivery в booking flow.
- 2026-02-13 02:33 — [review] Добавлен модуль `server/src/notifications/email` (templates/service/index), интеграция в `POST /api/booking`, webhook переведен в best-effort, добавлены SMTP env vars и route/template тесты.
- 2026-02-13 02:33 — [done] Проверка: `node --test server/src/booking/routes/*.test.js server/src/notifications/email/*.test.js` (pass 16/16).
- 2026-02-13 02:35 — [done] Расширил покрытие service-тестами email слоя, повторная проверка: `node --test server/src/booking/routes/*.test.js server/src/notifications/email/*.test.js` (pass 18/18).
