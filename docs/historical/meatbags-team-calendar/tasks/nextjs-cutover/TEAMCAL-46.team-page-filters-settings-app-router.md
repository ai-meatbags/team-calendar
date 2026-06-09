# TEAMCAL-46 — Перенос страницы команды, фильтров и настроек на App Router

Статус: done

## Описание
Перенести публичную страницу команды, availability UI, booking modal, URL-фильтры и team settings modal в App Router, сохранив текущий UX и бизнес-поведение.

## Applied rules
- AP-012
- AP-016
- AP-017
- AP-018
- AP-030
- PP-016
- PP-017
- PP-018
- PP-019

## Scope
- `/t/:shareId`
- team header / members / share
- duration/member filters и query params
- availability states
- booking modal
- team settings modal, privacy toggle, delete team flow
- parity по owner/member/guest состояниям

## Критерии готовности
- Team page полностью работает через App Router без legacy SPA
- Filters/share/booking/settings parity сохранены
- Owner/member/guest states ведут себя как в legacy
- Team page сохраняет текущие URL-driven состояния и modal UX

## Тест кейсы
1. Smoke по team page для guest/member/owner.
2. Проверки URL filters и share-link parity.
3. Проверки booking modal, settings modal и delete confirm flow.

## Зависимости
- [TEAMCAL-43](tasks/nextjs-cutover/TEAMCAL-43.foundation-cutover-parity-and-source-of-truth.md)
- [TEAMCAL-44](tasks/nextjs-cutover/TEAMCAL-44.backend-parity-and-next-api-hardening.md)

## Лог
- 2026-03-07 11:28 — [todo] Created from Linear TEAMCAL-46.
- 2026-03-07 14:18 — [in_progress] Старт выполнения: переношу `/t/:shareId` на App Router, начиная с карты legacy team page, URL-driven filters и modal flows, чтобы сохранить owner/member/guest parity без зависимости от legacy SPA.
- 2026-03-07 14:34 — [in_progress] Перенес team page в локальный Next-слой `app/_components/team-page/*`: core/availability/booking/settings/actions hooks, duration/member search-param adapters, team header, slots view, booking/settings modals и not-found state без импорта `react-router-dom` или `frontend/*`.
- 2026-03-07 14:38 — [review] Проверки: `npm run test:unit:next-ui` — green, `npm run test:unit:next-routes` — green, `npx tsc --noEmit --incremental false` — green, `TOKEN_ENC_KEY=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... NEXTAUTH_SECRET=... NEXTAUTH_URL=http://localhost:3000 npm run build` — green. `/t/[shareId]` теперь обслуживается App Router page + client team-page surface.
- 2026-03-07 15:02 — [need_changes] После review исправляю source-of-truth и acceptance gaps: выравниваю `join` критерий под реальный legacy UX, убираю дублирование team helpers через общий shared-модуль и добираю сценарные тесты для `join/share/booking/settings/delete`.
- 2026-03-07 15:09 — [review] После правок review закрыты: team helpers теперь общие для legacy и Next через `src/shared/team-ui.js`, `TEAMCAL-46` покрыт новым acceptance suite `team-page-acceptance.test.ts`, а source-of-truth обновлён под реальное legacy поведение `join`. Проверки: `npm run test:unit:next-ui` — green, `node --test frontend/tests/unit/team-utils.test.js` — green, `npm run test:unit:next-routes` — green, `npx tsc --noEmit --incremental false` — green.
- 2026-03-07 15:30 — [retro] retro_done=true; rule_decision=none; reason="Выводы этой задачи feature-specific: parity по team page закреплена в shared helper path, acceptance suite и source-of-truth спеки, отдельное project-wide правило не требуется."; rule_type=n/a; rule_id=n/a
- 2026-03-07 15:30 — [done] TEAMCAL-46 закрыта: `/t/:shareId` работает через App Router с parity по filters/share/booking/settings/delete, а review-замечания закрыты через shared team helpers и сценарные acceptance tests.
