# TEAMCAL-34 — Agent setup token + outbound signature + JWKS (superseded)

Статус: done  
Resolution: `superseded`

## Почему задача закрыта
Эта задача была создана под старую security-модель, где Phase 3/4 шли через setup token, асимметричную подпись и `JWKS`.

После пересборки feature под blessed path это направление признано устаревшим для текущего delivery:
- webhook delivery теперь фиксирован на `JWT Bearer` + `HS256` + per-subscription shared secret;
- `JWKS`, `RS256`, `ES256`, `header_secret`, `basic_auth` и auth-mode zoo выведены из текущего scope;
- agent auto-setup перестал быть обязательной частью текущего required implementation path.

## Что заменило эту задачу
- [TEAMCAL-54](tasks/team-events-webhook/TEAMCAL-54.jwt-webhook-contract-and-persistence.md)
- [TEAMCAL-55](tasks/team-events-webhook/TEAMCAL-55.owner-management-and-provisioning-surface.md)
- [TEAMCAL-56](tasks/team-events-webhook/TEAMCAL-56.jwt-delivery-runtime-docs-and-rollout.md)
- [TEAMCAL-57](tasks/team-events-webhook/TEAMCAL-57.team-settings-onboarding-ux.md)

## Комментарий
Если API-based provisioning вернётся как отдельный продуктовый этап, его нужно будет проектировать как отдельную задачу поверх bearer API token surface, без возврата к `JWKS`-ветке как blessed path.

## Лог
- 2026-02-13 02:26 — [todo] Задача создана по фазовой декомпозиции старой спеки.
- 2026-04-10 13:20 — [done/superseded] Задача закрыта как устаревшая после пересборки feature под JWT-only blessed path.
