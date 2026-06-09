# TEAMCAL-25 — URL фильтр длительности через useDurationFilter

Статус: done

## Описание
Вынести URL-логику фильтров из TeamPage в модульные хуки и добавить каноничный фильтр длительности:
- `duration` всегда хранится в query (`30|60`);
- невалидное/пустое значение канонизируется в `60` через `replace`;
- логика `member` и `duration` изолируется в отдельных хуках.

## Scope
- Добавить URL utils для parse/normalize/patch.
- Добавить `useDurationFilter`.
- Добавить `useMemberFilter`.
- Упростить `TeamPage` до композиции хуков.
- Передавать `duration` в availability-хук извне.
- Добавить unit-тесты URL-utils.

## Критерии готовности
- `TeamPage` не содержит парсинг/cleanup URL фильтров.
- Длительность читается из URL и всегда канонична (`30|60`).
- Невалидный `duration` заменяется на `60` с `replace`.
- `member` и `duration` не затирают друг друга при обновлении query.
- Пройдены `npm run test:unit` и `npm run build:client`.

## Зависимости
- нет

## Лог
- 2026-02-12 22:59 — [in_progress] Старт TEAMCAL-25: создание task card, подготовка URL-utils и хуков `useDurationFilter`/`useMemberFilter` с упрощением TeamPage.
- 2026-02-12 23:02 — [in_progress] Добавлены `team-page-url-filters.utils.js`, хуки `useDurationFilter` и `useMemberFilter`; обновлены экспорты module index, `TeamPage` упрощен до композиции фильтров, `useTeamPageAvailability` переведен на внешний `duration`.
- 2026-02-12 23:02 — [review] Добавлены unit-тесты `frontend/tests/unit/team-page-url-filters.test.js`; проверки пройдены: `npm run test:unit`, `npm run build:client`.
- 2026-02-12 23:05 — [in_progress] Возврат из review по запросу: обновлены тексты share-toast с учетом выбранной длительности встречи (`30 минут`/`1 час`).
- 2026-02-12 23:05 — [review] Проверка после правки toast: `npm run build:client` успешно.
- 2026-02-12 23:05 — [in_progress] Возврат из review по `review_feedback`: правило пунктуации UI-текстов (без точки в однофразных сообщениях) + правка toast-текстов.
- 2026-02-12 23:12 — [review] Добавлен `PP-017` в `project-patterns` (UI single-sentence punctuation), удалены конечные точки в однофразных toast-текстах, проверка: `npm run build:client` успешно.
- 2026-02-12 23:22 — [done] Задача закрыта: URL-фильтр длительности и вынос URL-логики в хуки завершены, правило пунктуации UI-текстов применено, toast-тексты приведены к новому стандарту.
