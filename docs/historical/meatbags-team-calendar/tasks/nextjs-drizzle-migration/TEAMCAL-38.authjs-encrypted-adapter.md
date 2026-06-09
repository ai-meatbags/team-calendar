# TEAMCAL-38 — Auth.js with encrypted Drizzle adapter

Статус: done

## Описание
Подключить Auth.js на Next route handlers и обёртку над DrizzleAdapter для encrypted refresh token с сохранением offline access.

## Applied rules
- AP-010
- AP-012
- AP-016
- AP-017

## Scope
- NextAuth handler в `app/api/auth/[...nextauth]/route.ts`.
- `src/infrastructure/auth/encrypted-drizzle-adapter.ts`.
- `TokenVault` (AES-256-GCM).
- OAuth scopes и callback поведение совместимы с текущей системой.

## Критерии готовности
- Login через Google работает.
- `refresh_token` сохраняется только encrypted.
- При update flow без нового refresh token старое encrypted значение не теряется.

## Тест кейсы
1. Adapter encrypt test: plaintext не пишется в DB.
2. Preserve test: пустой refresh token в update не стирает предыдущее значение.
3. Auth route smoke test: callback success/failure контракты.

## Зависимости
- [TEAMCAL-36](tasks/nextjs-drizzle-migration/TEAMCAL-36.foundation-contracts-and-policy.md)

## Лог
- 2026-02-28 23:21 — [todo] Created from Linear TEAMCAL-38.
- 2026-03-01 01:42 — [in_progress] Старт выполнения: проверяю текущие Auth.js route handlers и encrypted Drizzle adapter, затем закрываю недостающие тест-кейсы по encryption/preserve/smoke.
- 2026-03-01 01:45 — [in_progress] Добавлена тестируемость encrypted adapter через injection base-adapter factory; покрыты кейсы `encrypt plaintext`, `preserve existing refresh_token`, `no double encrypt`.
- 2026-03-01 01:46 — [review] Добавлены auth route smoke tests для `[...nextauth]` (`session` success contract + callback failure redirect), все проверки зелёные: `npm run test:unit:auth`, `npm run test:unit:db`.
- 2026-03-01 01:47 — [retro] retro_done=true; rule_decision=none; reason="Текущие AP/PP правила покрывают найденные риски задачи, дополнительное project-правило не требуется."; rule_type=n/a; rule_id=n/a
- 2026-03-01 01:48 — [done] Ретро завершено и синхронизировано в Linear; задача закрыта после прохождения auth/db unit test suite и проверки контрактов encrypted adapter + NextAuth route smoke.
