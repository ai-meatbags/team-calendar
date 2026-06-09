# TEAMCAL-59 — Auth route normal mode and hidden recovery mode

Статус: done

## Описание
Убрать global forced-consent из normal Google login flow и ввести hidden recovery-mode на том же auth entry через server-side recovery signal, не меняя visible CTA и не ломая popup completion contract.

## Applied rules
- AP-012
- AP-021
- AP-023
- AP-026
- AP-039
- PP-018
- PP-019
- PP-020

## Перед реализацией прочитать
- `implementation/rep.config.json` и зафиксировать boundary: код в `implementation/`, task/state artifacts в wrapper repo.
- `tasks/_policies/arch-patterns.md`: `AP-012`, `AP-021`, `AP-023`, `AP-026`, `AP-039`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`, `PP-020`.
- `tasks/auth-entry-clarity/auth-entry-clarity.feature.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.prd.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.specs.md`.
- `tasks/auth-entry-clarity/auth-entry-clarity.plan.md`.

## Как применять правила
- `AP-012`: normal mode и hidden recovery mode должны иметь явный transport contract; отсутствие recovery signal не маскируется как recovery-поведение.
- `AP-021`: route handlers только читают вход, recovery signal и safe `next`, затем делегируют в auth boundary; бизнес-логика mode switching не размазывается по UI.
- `AP-023`: recovery cookie/read-write и callback-related cleanup нельзя оставлять как floating async side effects.
- `AP-026`: переход normal/recovery mode и safe redirect semantics должны быть зафиксированы контрактными тестами, а не implicit поведением Auth.js.
- `AP-039`: server-side signal является источником истины для recovery-mode; клиент не решает сам, идти ли в повторный consent.
- `PP-018`: изменения остаются в Next.js/Auth.js/App Router контуре.
- `PP-019`: любые `catch` при работе с recovery signal и redirect preparation должны иметь явный смысл.
- `PP-020`: hidden recovery mode не имеет права ломать текущий popup completion bridge и fallback channels.

## Контекстные файлы
- `implementation/src/infrastructure/auth/auth-options.ts`
- `implementation/app/api/auth/google/handler.ts`
- `implementation/app/api/auth/google/route.ts`
- `implementation/app/api/auth/route.test.ts`
- `implementation/app/auth/google/route.ts`
- `implementation/app/auth/popup-complete/route.ts`

## Зона ответственности
- Владеет только auth entry contract и normal/recovery mode routing.
- Не владеет Google error taxonomy, account schema и current-user forced logout semantics.
- Не меняет guest CTA/copy и экранные recovery statuses.

## Scope
- Удалить global `prompt: 'consent'` из normal flow.
- Добавить hidden recovery mode на том же auth entry через server-side signal.
- Сохранить popup + safe `next` semantics.
- Подготовить точки интеграции для очистки recovery artifacts на callback success.

## Implementation flow
1. Зафиксировать текущий normal flow contract и popup completion assumptions.
2. Убрать forced-consent из default provider config.
3. Добавить в auth route чтение hidden recovery signal и переключение в recovery params только при его наличии.
4. Проверить, что safe `next` и popup redirect path не деградируют.
5. Добавить contract tests на normal mode и recovery mode.

## Критерии готовности
- Normal login не форсирует consent по умолчанию.
- Hidden recovery mode включается по server-side signal на том же auth entry.
- Popup completion и safe redirect contract сохраняются.

## DoD
- Для auth route есть тесты на normal mode и recovery mode.
- Нет постоянного отдельного CTA или route для пользователя.
- Никакая часть решения не опирается только на `window.opener`.

## Тест кейсы
1. `GET /api/auth/google` в normal mode не добавляет forced consent.
2. `GET /api/auth/google` в recovery mode включает нужные recovery params.
3. Popup redirect path и `next` сохраняются в обоих режимах.

## Зависимости
- нет

## Лог
- 2026-04-10 15:45 — [todo] Задача создана из auth-entry-clarity implementation plan.
- 2026-04-10 18:20 — [in_progress] Старт реализации: фиксирую текущий auth-entry contract, затем убираю forced-consent из normal flow и добавляю hidden recovery signal routing.
- 2026-04-10 18:45 — [testing] Проверки пройдены: npm run test:unit:auth, npm run test:unit:next-routes.
- 2026-04-10 18:46 — [need_retro] Проверки завершены, готовлю ретро.
- 2026-04-10 18:47 — [done] Ретро выполнено, задача закрыта.
