# Product Requirements Document: Team Webhooks JWT Blessed Path

**Version**: 1.0
**Date**: 2026-04-11
**Author**: Codex
**Quality Score**: 94/100

## Executive Summary

Фича пересобирается вокруг одного blessed integration flow: владелец команды подключает webhook через настройки команды, получает один понятный security contract и может без разработчика завести интеграцию в n8n или в обычный backend.

Главное продуктовое изменение: больше нет security-ветвления и неясности вокруг setup-token, JWKS и fallback auth modes. Для outbound webhook delivery используется только короткоживущий JWT Bearer на `HS256` с per-subscription shared secret. Для будущего inbound API используется только bearer API token. Это уменьшает когнитивную нагрузку для интегратора и снимает риск того, что MVP уедет в enterprise-only security zoo вместо рабочего клиентского пути. Дополнительно onboarding flow пересобран под pre-bind provisioning: secret генерируется до сохранения webhook-а и визуально живёт внутри draft row или конкретной строки после rotate.

## Problem Statement

**Current Situation**
- В продукте уже есть email-first и team-level webhook list, но security contract webhook-доставки не стабилизирован.
- В открытых задачах и спецификации смешаны разные направления: owner UI, agent setup, outbound signing, JWKS.
- Для интегратора путь подключения не собран в один сценарий: неясно, что именно нужно получить после ввода URL и как это проверять на стороне приёмника.

**Proposed Solution**
- Закрепить один blessed flow для MVP: URL + shared secret + audience + docs page.
- Добавить JWT-only webhook delivery contract (`Authorization: Bearer <jwt>`, `HS256`, TTL 120 секунд, replay-safe headers).
- Развести security surfaces: webhook auth отдельно, API auth отдельно.
- Пересобрать UX настроек команды так, чтобы owner видел не просто список URL, а onboarding path подключения интеграции.

**Business Impact**
- Owner команды может подключить n8n/CRM/бот без участия разработчика.
- Снижается стоимость интеграции и поддержки: один контракт вместо набора опций.
- Уменьшается риск продуктового дрейфа в сторону сложной security-модели, которую никто не внедрит на стороне клиента.

## Success Metrics

**Primary KPIs**
- Time to first valid webhook integration: owner проходит путь подключения без помощи разработчика.
- Integration success rate: первая доставка проходит после настройки blessed path без ручных обходов security model.
- Support clarity: в документации и UI нет альтернативных auth flows для MVP.

**Validation**
- Прохождение acceptance flow в QA: owner генерирует secret, копирует его, сохраняет webhook URL, настраивает приёмник и получает валидную тестовую доставку.
- Regression gate подтверждает, что booking flow не ломается при неудачной webhook delivery.

## User Personas

### Primary: Team Owner / Ops Integrator
- **Role**: владелец команды или человек, который настраивает интеграции
- **Goals**: быстро подключить n8n, CRM или internal endpoint к booking events
- **Pain Points**: не хочет разбираться в JWKS, public keys, signature modes и compat options
- **Technical Level**: intermediate

### Secondary: AI Agent / Technical Integrator
- **Role**: агент или разработчик, которому дали URL, secret и docs
- **Goals**: быстро настроить receiver и проверить JWT
- **Pain Points**: плохо переносит неоднозначные security contracts и несколько auth-mode
- **Technical Level**: advanced

## User Journey

### Main Client Path: Connect Team Webhook
1. Owner открывает страницу команды и переходит в настройки.
2. В блоке `Вебхуки` нажимает `Добавить вебхук`.
3. В списке появляется draft row, визуально близкая к обычной строке webhook-а.
4. Teamcal сразу показывает one-time secret внутри этой draft row, с явным копированием.
5. Owner копирует secret, вставляет его в receiver и затем вставляет `Webhook URL`.
6. Нажимает `Добавить`, после чего draft привязывается к URL и сохраняется как обычная subscription.
7. После сохранения plaintext secret исчезает и больше не показывается.
8. При rotate secret тоже показывается только внутри строки конкретного webhook-а.
9. Receiver настраивается по одной docs flow `JWT Bearer / HS256`.

## UX Direction

### Information Architecture
- Team settings получает отдельный section `Интеграции и вебхуки`.
- Внутри section есть три слоя:
  - explanatory intro about blessed path
  - subscriptions list
  - create/edit/test actions

### shadcn Component Map
- `Card` для контейнера секции
- `Button` для add/copy/rotate/delete actions
- row-scoped inline secret block для draft и rotate result
- `Input` для URL в draft row
- `Switch` для active/disabled toggle
- `Badge` для delivery status и auth mode badge (`JWT Bearer`, read-only)
- `Separator` между onboarding help и list
- `Skeleton` для loading state
- `Tooltip` для copy affordances

### UX Principles
- Один auth path, без dropdown выбора режима.
- Security details даются в терминах интегратора, а не криптографии ради криптографии.
- В UI нельзя показывать raw secret постоянно; только inside draft row before save и inside the concrete row immediately after rotate.
- last error должен быть полезным, но санитизированным.

## Functional Requirements

### Story 1: Owner provisions and saves a webhook subscription
**As a** team owner  
**I want to** сначала получить secret, а затем привязать его к URL webhook-а  
**So that** я могу без догадок подготовить receiver до сохранения интеграции

**Acceptance Criteria**
- [ ] Нажатие `Добавить вебхук` создаёт draft row внутри списка, а не отдельный верхний alert или dialog
- [ ] Draft row сразу показывает one-time secret с copy affordance
- [ ] Owner может сохранить subscription только после ввода валидного HTTPS webhook URL
- [ ] После сохранения subscription появляется в списке без перезагрузки страницы, а plaintext secret исчезает
- [ ] UI показывает, что auth model fixed: `JWT Bearer`, `HS256`
- [ ] Secret после rotate показывается только внутри строки соответствующего webhook-а

### Story 2: Owner understands how to verify deliveries
**As a** team owner or integrator  
**I want to** видеть один понятный onboarding flow  
**So that** я могу настроить n8n или backend без догадок

**Acceptance Criteria**
- [ ] В UI и docs есть один blessed flow без fallback auth modes
- [ ] Docs описывают required headers, JWT claims, TTL and dedupe
- [ ] n8n-first пример не требует JWKS, public keys or custom HMAC body verification

### Story 3: System delivers authenticated webhook events
**As a** receiver system  
**I want to** проверить подпись и свежесть webhook event  
**So that** я доверяю только подлинным delivery attempts

**Acceptance Criteria**
- [ ] Каждый delivery содержит `Authorization: Bearer <jwt>`
- [ ] JWT uses `HS256` and per-subscription shared secret
- [ ] Headers include event metadata and delivery identifiers
- [ ] Booking endpoint remains best effort and does not fail because of webhook delivery errors

### Story 4: Owner can operate an existing integration
**As a** team owner  
**I want to** видеть состояние и управлять subscription  
**So that** я могу диагностировать или отключить интеграцию без разработчика

**Acceptance Criteria**
- [ ] Owner can disable/enable subscription
- [ ] Owner can rotate secret
- [ ] Owner can delete subscription
- [ ] UI shows `last_delivery_status`, `last_delivery_at`, `last_error`

## Technical Constraints
- Проект остаётся в `Next.js App Router + Drizzle + pg-only runtime`.
- Route handlers должны оставаться thin adapters.
- Webhook auth contract фиксирован и не должен превращаться в configurable auth-mode matrix.
- Security-sensitive values логируются только в redacted form.
- UX описывается через shadcn composition, а не через ad-hoc markup.

## Scope and Priorities

**MVP**
- JWT-only webhook delivery for team subscriptions
- owner onboarding flow in settings
- shared secret + audience contract
- delivery status UI
- docs page for verification and dedupe

**Deferred**
- agent auto-setup
- delivery history table
- retry/outbox
- additional event types
- alternate auth modes

**Priority Order**
1. Contract freeze and persistence model
2. Delivery runtime
3. Owner UX and docs
4. Regression and rollout
