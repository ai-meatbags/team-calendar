# TEAMCAL-35 — Integration regression + rollout checklist (superseded)

Статус: done  
Resolution: `superseded`

## Почему задача закрыта
Эта задача предполагала финальный regression/rollout gate поверх старой фазовой модели, в которой delivery security и rollout зависели от `TEAMCAL-34`.

После пересборки feature gate изменился:
- regression и rollout теперь завязаны на JWT-only delivery contract;
- docs и rollout notes должны описывать blessed path без `JWKS` и fallback auth modes;
- новый интеграционный gate собран в [TEAMCAL-56](tasks/team-events-webhook/TEAMCAL-56.jwt-delivery-runtime-docs-and-rollout.md).

## Что заменило эту задачу
- [TEAMCAL-56](tasks/team-events-webhook/TEAMCAL-56.jwt-delivery-runtime-docs-and-rollout.md)

## Комментарий
Старый regression gate нельзя просто доисполнить поверх новой архитектуры: он проверяет уже не тот security contract и не тот клиентский путь.

## Лог
- 2026-02-13 02:26 — [todo] Задача создана по фазовой декомпозиции старой спеки.
- 2026-04-10 13:20 — [done/superseded] Задача закрыта как устаревшая после пересборки implementation path.
