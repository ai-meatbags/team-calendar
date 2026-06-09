# Feature Retro

Feature: `team-events-webhook`
Updated: `2026-04-10`

## What Shipped
- Team-level webhook subscriptions в настройках команды.
- JWT-only blessed path для outbound delivery: `Authorization: Bearer <jwt>`, `HS256`, `shared secret`, `audience`, fixed delivery headers.
- Owner provisioning surface с one-time secret reveal только на create/rotate.
- Onboarding-first team settings UX и docs page `/docs/team-webhooks`.
- Best-effort runtime delivery и regression gate для docs/runtime/UI.

## What Did Not Ship
- User-level integrations catalog.
- Team enablement of user-owned webhooks.
- User settings page для общих интеграций.
- Unified migration path от team-owned webhook definitions к user-owned catalog.

## Follow-ups
- Continuation moved into new feature `user-integrations-catalog`.
- Feature anchor: `TEAMCAL-65`.
- Planning PRD task: `TEAMCAL-66`.

## Main Risks And Lessons
- Team-only ownership был правильным MVP cut, но как continuation он начинает мешать продукту: один и тот же integrator endpoint приходится дублировать по командам, а user settings остаются пустыми с точки зрения интеграций.
- Продолжать развивать user-owned catalog внутри старой feature нельзя: это уже другая ownership model и другой source of truth.
- Shared webhook definition не должен автоматически означать shared team credential. Правильная следующая модель — reusable endpoint в user scope плюс team-scoped binding и team-scoped delivery contract.

## Proposed Improvements
- Новый product cut делать отдельной feature с собственным PRD, а не как append-only продолжение `TEAMCAL-53`.
- В continuation сразу фиксировать разделение `user integration definition` vs `team binding` vs `team API token`, чтобы не смешать три разные security boundary.
- Отдельно выровнять split repo config: `implementation/rep.config.json` указывает на policy paths, которых физически нет в `implementation/`.

## Async Review State
- `pending`
