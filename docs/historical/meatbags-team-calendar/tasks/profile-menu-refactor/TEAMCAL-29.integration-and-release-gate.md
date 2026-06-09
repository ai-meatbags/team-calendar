# TEAMCAL-29 — Integration and release gate

Статус: done

## Описание
Провести финальную интеграционную валидацию рефакторинга и закрыть release-gate критерии фичи.

## Scope
- Прогнать unit-тесты.
- Прогнать route coverage gate.
- Прогнать integration smoke.
- Выполнить ручной UX smoke для profile menu.

## Критерии готовности
- `npm run test:unit` — green.
- Route coverage `statements >= 90%` — green.
- `npm run test:integration` — green.
- Подтвержден ручной smoke по меню/профилю.

## Тест кейсы
1. Happy path: end-to-end пользователь меняет имя через `/profile`.
2. Invalid input: ошибка валидации имени и ошибка webhook не ломают UI.
3. Regression: существующие `/api/teams*`, availability и booking не потеряли контракт.

## Зависимости
- [TEAMCAL-27](tasks/profile-menu-refactor/TEAMCAL-27.backend-route-coverage-and-gates.md)
- [TEAMCAL-28](tasks/profile-menu-refactor/TEAMCAL-28.frontend-user-menu-and-profile-page.md)
- [Specs](tasks/profile-menu-refactor/specs.md)

## Лог
- 2026-02-12 23:17 — [todo] Создана финальная задача integration/release gate.
- 2026-02-12 23:59 — [in_progress] Прогнаны обязательные quality gates: `npm run test:unit` и `npm run test:coverage:routes`.
- 2026-02-12 23:59 — [in_progress] Coverage route gate подтвержден: `Statements 94.74%` (>= 90%), `Functions 85.71%`, `Branches 79.13%`, `Lines 94.74%`.
- 2026-02-12 23:59 — [in_progress] Прогнан integration smoke: `npm run test:integration` — green (4/4).
- 2026-02-12 23:59 — [in_progress] Дополнительно подтверждена сборка фронтенда после изменений меню/профиля: `npm run build:client` — green.
- 2026-02-12 23:59 — [done] Ручной UX smoke проведен итеративно по feedback: desktop hover стабильный, mobile click работает, outside click/escape закрывают меню, сохранение имени обновляет шапку, logout не регресснул.
