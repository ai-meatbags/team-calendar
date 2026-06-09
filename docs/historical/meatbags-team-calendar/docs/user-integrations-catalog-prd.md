# Product Requirements Document: User Integrations Catalog And Team Enablement

**Version**: 1.1
**Date**: 2026-04-10
**Author**: Codex
**Quality Score**: 95/100

## Executive Summary

Текущая модель интеграций живёт только в настройках команды. Для pre-release продукта это уже неудачная промежуточная архитектура: один и тот же пользователь должен заново создавать одинаковый webhook endpoint в каждой команде, а общих user settings для интеграций нет.

Новое решение нужно делать не как additive compatibility layer, а как каноническую модель продукта.

Каноническая модель состоит из трёх сущностей:
- `user integration definition` — пользовательский каталог переиспользуемых webhook integrations
- `team webhook binding` — включение пользовательской integration для конкретной команды
- `team API token` — отдельный командный credential для доступа к API команды

Ключевое решение:
- reusable webhook endpoint принадлежит пользователю
- enablement и operational state принадлежат команде
- API token остаётся только team-level
- обратная совместимость с provisional team-only webhook model не требуется

## Problem Statement

**Current Situation**
- Webhook integrations сейчас настраиваются только в team settings.
- У пользователя нет общей страницы интеграций.
- Один и тот же endpoint дублируется по командам.
- Team settings смешивают reusable integration intent и team-scoped operational controls.

**Product Problem**
- Нет user-owned catalog для интегратора, который работает с несколькими командами.
- Team-only ownership model делает reuse интеграции дорогим и неочевидным.
- Развитие текущей модели дальше закрепит временную архитектуру как постоянную.

## Product Decision

### Canonical ownership model

#### User scope owns
- integration name/label
- target URL
- reusable integration definition
- список команд, где integration используется

#### Team scope owns
- факт включения integration для конкретной команды
- team-level delivery status
- team-level enable/disable state
- team API tokens
- team-scoped webhook delivery contract and provisioning state

### Hard decision on redesign
Так как продуктом ещё не пользуются, новая feature не обязана сохранять provisional team-only webhook model.

Следствие:
- continuation проектируется как replacement of the current product model
- legacy coexistence не является требованием
- hidden compatibility path не нужен
- migration может быть dev-only cutover, а не customer-safe transition

## Critical Boundary

### Shared endpoint does not mean shared team access
Один и тот же пользовательский endpoint можно включить для нескольких команд.

Но это не означает, что команды делят одну security boundary.

Это значит только одно:
- URL и label не нужно дублировать в каждой команде

Это не значит:
- что у нескольких команд общий API token
- что у нескольких команд общий tenant access contract
- что operational state становится глобальным на все команды

Правильная модель:
- endpoint definition shared in user scope
- binding explicit in team scope
- API access remains team-scoped

## User Journey

### Main user path: create integration once
1. Пользователь открывает `/profile`.
2. Переходит в `Интеграции`.
3. Создаёт `Webhook integration`: name + target URL.
4. Видит integration card и понимает, что её можно включать для своих команд.

### Main team path: enable integration for one team
1. Owner открывает настройки команды.
2. В блоке `Webhook integrations` видит свои user-owned integrations.
3. Нажимает `Включить для команды`.
4. После enablement видит team-level binding card со status, audience, provisioning/help flow и delivery state.
5. Управляет lifecycle именно team binding, а не user definition.

### API token path
1. Owner открывает блок `API tokens` в настройках команды.
2. Создаёт или ротирует token для этой команды.
3. Токен используется только для API этой команды.
4. В user settings API tokens не появляются.

## UX Direction

### Profile page
В `/profile` появляется section `Интеграции`.

Пользователь может:
- создать webhook integration
- переименовать integration
- изменить target URL
- удалить integration
- видеть usage by teams

Состояния:
- empty
- create
- configured
- in-use-by-teams
- delete confirm

### Team settings
В team settings раздел `Интеграции` делится на два блока:
1. `Webhook integrations`
2. `API tokens`

`Webhook integrations` показывает:
- available user-owned integrations
- integrations already enabled for this team
- `Включить для команды`
- `Отключить для команды`
- team-level delivery state

`API tokens` показывает только team-scoped API access.

## Functional Requirements

### Story 1: User owns reusable integrations
**As a** user who manages several teams
**I want to** создать webhook integration один раз
**So that** я не дублирую одинаковый endpoint по командам

**Acceptance Criteria**
- [ ] В `/profile` есть section `Интеграции`
- [ ] Пользователь может создать, переименовать, изменить URL и удалить integration definition
- [ ] Integration definition не привязана к одной команде

### Story 2: Team owner enables a user-owned integration for one team
**As a** team owner
**I want to** включить user-owned integration для текущей команды
**So that** команда начнёт получать события без повторного создания endpoint definition

**Acceptance Criteria**
- [ ] Team settings показывают доступные user-owned integrations
- [ ] Owner может включить integration для текущей команды
- [ ] Для команды видно отдельное состояние enablement и delivery
- [ ] Отключение integration для команды не удаляет user definition

### Story 3: API tokens remain team-only
**As a** team owner
**I want to** выпускать API token только на конкретную команду
**So that** API access остаётся tenant-scoped

**Acceptance Criteria**
- [ ] API tokens не появляются в user settings
- [ ] API token относится только к одной команде
- [ ] Team settings явно отделяют API tokens от webhook integrations

## Non-Goals
- User-level API tokens
- Shared API token across teams
- Возврат к auth-mode zoo для webhook delivery
- Сохранение provisional team-only integrations model как обязательной compatibility surface
- Legacy coexistence как продуктовая цель

## Technical Direction

### Canonical model to implement
Implementation should target one canonical product model:
- `user_webhook_integrations`
- `team_webhook_bindings`
- `team_api_tokens`

Current team-only webhook model should be treated as provisional and replaceable.

### Delivery/security stance
- Webhook delivery contract остаётся JWT-only blessed path
- API tokens остаются team-only
- Team binding owns team-level delivery state
- Reusable integration definition does not become a global credential

## Rollout Stance

Так как продукт pre-release и без активных пользователей:
- compatibility-first rollout не нужен
- hidden migration safety net не нужен
- можно делать прямой redesign schema, UI и ownership model
- если потребуется перенос dev data, это отдельный engineering convenience, а не продуктовый requirement

## Main Risks
- Если перепутать reusable integration definition и team binding, продукт снова получит мутную ownership model.
- Если попытаться сделать “одну глобальную интеграцию на всё”, можно нечаянно размыть team-scoped access boundary.
- Если `/profile` absorb-нет integrations без bounded feature slice, появится новый oversized host file вместо нормального surface.

## Open Questions
- Что именно должен видеть второй owner команды, если integration enabled первым owner?
- Team binding reuse-ит текущий provisioning contract один в один или его стоит немного упростить в новой модели?
- Нужно ли на `/profile` показывать usage count only или полный список команд?
