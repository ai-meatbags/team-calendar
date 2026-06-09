# TEAMCAL-66 — PRD and scope freeze for user integrations catalog

Статус: done

## Описание
Собрать PRD и заморозить каноническую product model для следующего feature cut: user-owned integrations catalog в `/profile`, team enablement of user webhooks в настройках команды и сохранение team-only API tokens.

## Applied rules
- AP-010
- AP-020
- AP-021
- AP-026
- AP-032
- AP-039
- AP-040
- AP-041
- AP-042
- AP-043
- AP-049
- AP-050
- AP-051
- AP-052
- AP-054
- AP-064
- AP-068
- AP-069
- PP-018
- PP-019
- PP-021
- PP-022
- PP-025
- PP-026

## Перед реализацией прочитать
- `implementation/rep.config.json` и зафиксировать split repo reality: implementation code lives in `implementation/`, planning source of truth stays in wrapper `tasks/` and `docs/`.
- `tasks/_policies/arch-patterns.md`: `AP-010`, `AP-020`, `AP-021`, `AP-026`, `AP-032`, `AP-039`, `AP-040`, `AP-041`, `AP-042`, `AP-043`, `AP-049`, `AP-050`, `AP-051`, `AP-052`, `AP-054`, `AP-064`, `AP-068`, `AP-069`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`, `PP-021`, `PP-022`, `PP-025`, `PP-026`.
- `docs/team-events-webhook-jwt-prd.md`.
- `tasks/team-events-webhook/team-events-webhook.feature.md`.
- `implementation/app/(pages)/profile/page.tsx`.
- `implementation/app/_components/profile-page-client.tsx`.
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`.

## Как применять правила
- `AP-010`, `AP-020` и `AP-032`: continuation должна заранее разделить bounded contexts `user integration definition`, `team webhook binding`, `team API token`; нельзя проектировать одну “универсальную интеграцию” на все случаи.
- `AP-021` и `PP-021`: новая product model должна вести к отдельному profile feature slice и отдельному team binding slice, а не к ещё более толстым host-файлам `profile-page-client.tsx` и team settings host.
- `AP-026`, `AP-039`, `AP-040` и `AP-041`: PRD обязан явно развести ownership, auth и authorization semantics между user scope и team scope.
- `AP-042` и `AP-043`: reuse endpoint-а нельзя путать с reuse credential-а; shared endpoint не должен превращаться в shared team access.
- `AP-049` и `AP-050`: в модели должны быть явные lifecycle states для user definition, team binding и team API token, а не implicit deletion semantics.
- `AP-051`, `AP-052`, `AP-054`, `AP-064`, `AP-068`, `AP-069`: PRD должен заранее зафиксировать отдельные UX surfaces для `/profile` и team settings и не смешивать reusable catalog с team operational controls.
- `PP-022`, `PP-025` и `PP-026`: continuation оформляется новой feature, а не append-only patch к `team-events-webhook`; сначала freeze PRD и ownership model, потом implementation decomposition.

## Контекстные файлы
- `docs/team-events-webhook-jwt-prd.md`
- `tasks/team-events-webhook/team-events-webhook.feature.md`
- `tasks/team-events-webhook/team-events-webhook.specs.md`
- `implementation/app/(pages)/profile/page.tsx`
- `implementation/app/_components/profile-page-client.tsx`
- `implementation/app/api/me/settings/route.ts`
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`
- `implementation/app/_components/team-page/team-page-hooks.ts`

## Зона ответственности
- Владеет только продуктовой моделью continuation и PRD.
- Не владеет кодовой реализацией user catalog, team bindings или schema cut.
- Не меняет shipped webhook runtime contract и не открывает новый auth mode.

## Scope
- Проверить, что текущий shipped path по интеграциям действительно team-only.
- Зафиксировать, почему continuation должна стать отдельной feature, а не ещё одной task внутри `team-events-webhook`.
- Описать user-owned integrations page и team-level enablement model.
- Зафиксировать, что API tokens остаются team-only.
- Зафиксировать, что pre-release состояние позволяет прямой redesign без product-level backward compatibility.

## Implementation flow
1. Поднять текущий shipped context: team-level webhooks, `/profile`, current team settings integrations UX.
2. Зафиксировать product boundary: что принадлежит пользователю, что принадлежит команде.
3. Выбрать канонический continuation path: shared endpoint definition in user scope, explicit team enablement in team scope, team-only API tokens.
4. Описать UX для profile integrations и team settings enablement.
5. Зафиксировать hard decision: текущая provisional team-only model не требует compatibility preservation.
6. Создать новый feature dossier и PRD как source of truth для следующей декомпозиции.

## Критерии готовности
- Новый product cut оформлен как отдельная feature, а не append-only continuation старой.
- PRD явно разделяет user webhook catalog, team webhook binding и team API token.
- Зафиксировано, что API tokens не переходят в user scope.
- Зафиксировано, что pre-release state разрешает прямой redesign текущей provisional model.

## DoD
- Существует PRD, на который можно опираться при decomposition implementation tasks.
- В continuation нет двусмысленности по ownership model и security boundary.
- User-level integrations и team-level API tokens не смешаны ни в product copy, ни в модели ответственности.
- В feature dossier зафиксирован canonical redesign, а не compatibility-first continuation.

## Тест кейсы
1. PRD отвечает, где живут webhook definitions, где живут team bindings и где живут API tokens.
2. PRD описывает client path для `/profile` и team settings отдельно.
3. PRD фиксирует, что current team-only flow был provisional, а не обязательным compatibility baseline.
4. PRD запрещает смешивать shared endpoint и shared team access.

## Зависимости
- [TEAMCAL-53](tasks/team-events-webhook/team-events-webhook.feature.md)

## Лог
- 2026-04-10 18:40 — [todo] Planning task created for continuation after closing team-level webhooks feature.
- 2026-04-10 18:47 — [in_progress] Reviewed shipped context: current integrations live in team settings, `/profile` has no integrations section and current webhook contract is team-scoped.
- 2026-04-10 18:55 — [done] PRD written for `user-integrations-catalog`; continuation frozen around user-owned endpoint catalog, explicit team enablement and team-only API tokens.
- 2026-04-10 19:05 — [done] Planning artifacts rewritten after product clarification: no active users, so continuation is a canonical redesign rather than additive compatibility path.
