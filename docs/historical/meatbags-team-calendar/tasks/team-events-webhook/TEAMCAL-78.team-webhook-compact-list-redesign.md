# TEAMCAL-78 — Compact team webhook list redesign

Статус: done

## Описание
Пересобрать team-level секцию вебхуков в компактный shadcn-based список строк: один `Card` на секцию, строки без технических деталей, add flow через `Dialog`, destructive actions через `AlertDialog`, one-time secret через inline `Alert`.

## Applied rules
- AP-018
- AP-019
- AP-020
- AP-021
- AP-024
- AP-051
- AP-052
- AP-054
- AP-064
- AP-068
- AP-069
- PP-018
- PP-019
- PP-021
- PP-023

## Перед реализацией прочитать
- Codex skills: `brainstorming`, `build-web-apps:shadcn`, `build-web-apps:react-best-practices`.
- `implementation/rep.config.json`.
- `tasks/_policies/arch-patterns.md`: `AP-018`, `AP-019`, `AP-020`, `AP-021`, `AP-024`, `AP-051`, `AP-052`, `AP-054`, `AP-064`, `AP-068`, `AP-069`.
- `tasks/_policies/project-patterns.md`: `PP-018`, `PP-019`, `PP-021`, `PP-023`.
- `tasks/team-events-webhook/team-events-webhook.feature.md`.
- `implementation/app/_components/team-page/team-settings-webhooks.ts`.
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`.
- `implementation/app/_components/team-page/team-page-utils.ts`.
- `implementation/components/ui/*`.

## Как применять правила
- `AP-018` и `AP-019`: секция режется на маленькие components по бизнес-ролям: `create dialog`, `row`, `empty state`, `provisioning alert`, `url copy`.
- `AP-020` и `AP-021`: data flow остаётся в `team-settings-webhooks.ts`; `Dialog`/`Tooltip`/`AlertDialog` state живёт локально в presentation layer.
- `AP-024`: `Audience` и прочий техмусор не показываются в UI; one-time secret показывается только в inline alert после create/rotate.
- `AP-051`, `AP-052` и `PP-021`: host section остаётся composition root, строка вебхука и overlay-компоненты вынесены в sibling files.
- `AP-054`, `AP-064`, `AP-068`, `AP-069`: loading/empty/error/destructive states должны быть понятны без длинного текста и собраны на shadcn primitives.
- `PP-023`: закрытие только после UI test gate и `npm run build`.

## Контекстные файлы
- `implementation/app/_components/team-page/team-settings-integrations-card.tsx`
- `implementation/app/_components/team-page/team-settings-webhooks.ts`
- `implementation/app/_components/team-page/team-webhook-settings-section.tsx`
- `implementation/app/_components/team-page/team-webhook-row.tsx`
- `implementation/app/_components/team-page/team-webhook-create-dialog.tsx`
- `implementation/app/_components/team-page/team-webhook-provisioning-alert.tsx`
- `implementation/app/_components/team-page/team-webhook-url-copy-button.tsx`
- `implementation/app/_components/team-page/team-page-utils.ts`
- `implementation/app/_components/team-page/team-page.test.tsx`
- `implementation/components/ui/*`

## Зона ответственности
- Только team-level webhook settings UX.
- Не меняет webhook runtime contract.
- Не переносит integrations в `/profile`.
- Не меняет API token model.

## Scope
- Убрать `Audience` из UI.
- Заменить multi-block composition на один `Card` с compact rows.
- Перенести создание webhook в `Dialog`.
- Перенести delete/rotate confirmation в `AlertDialog`.
- Показ нового секрета сделать через inline `Alert`.
- Сделать URL копируемым по клику с `Tooltip`.
- Переименовать `Календари для расчёта` в `Календари`.

## DoD
- В секции один общий `Card`, без отдельных карточек на каждый webhook.
- `Audience` не показывается нигде в UI.
- Create flow идёт через `Dialog`.
- Delete/rotate идут через `AlertDialog`.
- One-time secret показывается только через inline `Alert`.
- UI tests и `npm run build` проходят.

## Лог
- 2026-04-11 20:18 — [in_progress] Follow-up task opened after visual review: previous webhook cleanup still kept too much technical noise and weak list composition.
- 2026-04-11 20:39 — [testing] Section rebuilt into compact `Card + rows + dialogs` layout; `Audience` removed from UI and calendar title shortened.
- 2026-04-11 20:42 — [done] Task closed after UI test gate and production build.
