# TEAMCAL-21 — Backend enforcement: owner-only privacy update + private join guard

Статус: done

## Описание
Реализовать серверные правила доступа из [Specs](tasks/team-privacy/team-privacy.specs.md):
- менять `privacy` может только owner;
- `POST /api/teams/:shareId/join` блокируется для `private`;
- серверные логи flow страницы команды не содержат email членов команды.

## Scope
- `PATCH /api/teams/:shareId`: обработка `privacy` + owner-check (`403` для не-owner).
- `POST /api/teams/:shareId/join`: guard `privacy=private` с `403 { "error": "Team is private." }`.
- Актуализация вычисления `canJoin` для приватной команды.
- Санитизация/маскирование логов по endpoint-ам страницы команды (без member email).
- Backend тесты прав доступа и join guard.

## Критерии готовности
- Любой non-owner PATCH `privacy` получает `403`.
- Owner может менять `public <-> private`.
- Для `private` join всегда отклоняется с фиксированным `403`-ответом.
- Для `public` join работает как до фичи.
- Логи backend flow не содержат email членов команды.

## Тест кейсы
1. Happy path: owner меняет `privacy` через PATCH, новое значение сохраняется и читается в subsequent GET.
2. Invalid input: PATCH с недопустимым `privacy` возвращает ошибку валидации (`400`), состояние не меняется.
3. Regression: `POST /join` для `public` команды работает штатно, а для `private` возвращает `403`.

## Зависимости
- [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md)

## Лог
- 2026-02-12 12:57 — [todo] Задача создана как backend-ветка после foundation [TEAMCAL-20](tasks/team-privacy/TEAMCAL-20.privacy-contract-and-member-sanitization.md).
- 2026-02-12 20:41 — [in_progress] Начал backend enforcement: owner-only update `privacy`, join guard для `private`, очистка лог-контекста от email участников.
- 2026-02-12 20:44 — [review] Реализовано owner-only обновление `privacy` в `PATCH /api/teams/:shareId` (валидация enum + `403` для non-owner), добавлен guard `POST /api/teams/:shareId/join` для private-команды (`403 Team is private.`), очищены availability-логи от member email.
- 2026-02-12 20:50 — [in_progress] Возврат из review по bugfix: NocoDB enum `privacy` использует значения `Public/Private`, добавляю явный mapping API (`public/private`) -> storage (`Public/Private`) и обратно.
- 2026-02-12 20:52 — [review] Исправлена совместимость с NocoDB enum: записи `privacy` теперь сохраняются как `Public/Private` (storage mapping), при этом API-контракт остается `public/private`; обновлены unit-тесты маппинга и PATCH route.
- 2026-02-12 20:57 — [done] Backend enforcement принят: owner-only privacy update, hard-block join для private и storage-mapping под enum NocoDB подтверждены.
