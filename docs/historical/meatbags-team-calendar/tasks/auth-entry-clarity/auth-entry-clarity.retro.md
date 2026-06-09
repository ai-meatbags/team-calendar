# Feature Retro

Feature: `auth-entry-clarity`
Updated: `2026-04-10`

## What Shipped
- Единый entry `Продолжить с Google` с supporting copy про авто-создание аккаунта.
- Normal login без forced-consent, recovery mode по server-side cookie signal.
- Typed Google auth failure taxonomy и current-user recovery lifecycle.
- Team availability защищён от foreign-account logout и возвращает degraded contract.
- Recovery cookie очищается на popup completion.

## What Did Not Ship
- Отдельные signup/login flows и новые onboarding state флаги (изначально out of scope).

## Follow-ups
- None.

## Main Risks And Lessons
- Recovery UX требует тестов на transport contract, иначе легко пропустить regressions.

## Proposed Improvements
- None.

## Async Review State
- `pending`
