# Feature Specs — Slot Rules Settings

Статус: draft  
Feature key: `slot-rules-settings`  
Дата: 2026-04-11

## Контекст
Текущий контракт правил слотов размазан по нескольким слоям:
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts` хранит хардкод для `DAYS`, `WORKDAY_START_HOUR`, `WORKDAY_END_HOUR`, `MIN_BOOKING_NOTICE_HOURS`;
- `implementation/app/_components/team-page/team-page-hooks.ts` дублирует те же значения как UI fallback summary;
- `/profile` не владеет этими настройками;
- внутри команды нет персональной настройки rules для конкретного участника.

Продуктовая модель после обсуждения зафиксирована так:
- настройки слотов персональные;
- внутри команды можно переопределить только свои настройки;
- итог для команды вычисляется как агрегат по участникам;
- editable team-wide настройки слотов отсутствуют.

## Цели
- Вынести rules из хардкода в канонический personal settings contract.
- Дать пользователю global defaults в `/profile`.
- Дать пользователю team-scoped override только для себя.
- Показывать в team settings итог пересечения по всем участникам команды.
- Показывать на public team page динамический итог по runtime member set.

## Non-Goals
- Team-wide editable slot rules
- Timezone settings
- Slot duration settings
- Partial reset отдельных полей внутри team override
- Active/inactive membership semantics
- Special MVP-обработка collapsed work window (`start >= end`)

## Architecture rules in scope

### Relevant `AP-*`
- `AP-020` — Clean Architecture границы и composition root
- `AP-021` — тонкие entry points
- `AP-026` — API-контракты и DTO границы
- `AP-054` — устойчивые UI-состояния, доступность и деградация интерфейса

### Relevant `PP-*`
- `PP-018` — Next.js App Router + Drizzle + pg-only runtime
- `PP-019` — запрет пустых catch-блоков
- `PP-021` — oversized host files do not absorb new feature UI
- `PP-023` — App Router changes require honest build and route gate
- `PP-025` — feature plan must fix rule mapping and task authoring contract before implementation

### Как применять
- `AP-020`: системные defaults, per-user effective settings, team aggregate и reset contract живут в domain/application, а route handlers и React UI только потребляют готовые DTO.
- `AP-021` и `AP-026`: profile/team/availability routes не должны дублировать aggregation logic и merge semantics.
- `AP-054`: `/profile`, team settings и public slot summary должны иметь понятные loading/error/empty states без скрытых fallback-магий.
- `PP-021`: profile/team UI нужно разрезать на bounded sibling slices, а не добавлять ещё одну ветвистую form-state систему в host files.
- `PP-023`: route changes и новые settings contracts закрываются только после `npm run build`.

## Fixed Decisions
1. В MVP настраиваются только четыре значения:
   - `days`
   - `workdayStartHour`
   - `workdayEndHour`
   - `minNoticeHours`
2. `Europe/Moscow` остаётся фиксированным timezone в MVP.
3. У пользователя всегда есть personal default settings record.
4. Для новых пользователей defaults создаются при регистрации со значениями текущего хардкода.
5. Для существующих пользователей defaults проставляются миграцией.
6. В команде пользователь может иметь только полный team-scoped personal override для себя.
7. `Сбросить до настроек пользователя` удаляет весь team override целиком.
8. Итог для team settings считается по всем участникам команды.
9. Итог для public team page считается по runtime member set текущей выборки.
10. Aggregation contract:
   - `days = max`
   - `workdayStartHour = max`
   - `workdayEndHour = min`
   - `minNoticeHours = max`

## Системные default-значения
- `days = 14`
- `workdayStartHour = 10`
- `workdayEndHour = 20`
- `minNoticeHours = 12`

## Data Model

### `user_slot_rule_settings`
Новая таблица, одна строка на пользователя:
- `id`
- `user_id` unique
- `days`
- `workday_start_hour`
- `workday_end_hour`
- `min_notice_hours`
- `created_at`
- `updated_at`

Требования:
- все четыре rule-поля `NOT NULL`
- `user_id` unique

### `team_member_slot_rule_overrides`
Новая таблица, одна строка на участника команды при наличии override:
- `id`
- `team_member_id` unique
- `days`
- `workday_start_hour`
- `workday_end_hour`
- `min_notice_hours`
- `created_at`
- `updated_at`

Требования:
- все четыре rule-поля `NOT NULL`
- `team_member_id` unique
- отсутствие строки означает “используй personal defaults пользователя”

### Почему отдельные таблицы лучше
- не засоряют `users` и `team_members` новым bounded context;
- дают чистый lifecycle для defaults и overrides;
- упрощают reset semantics: delete override row;
- лучше согласуются с требованием держать slot rules отдельно.

## Валидация
- `days`: integer, `1..30`
- `workdayStartHour`: integer, `0..23`
- `workdayEndHour`: integer, `1..24`
- `workdayEndHour > workdayStartHour`
- `minNoticeHours`: integer, `1..168`

Невалидный payload получает `400` с явной domain error.

## Domain / Application Contract

### Новый bounded slice
Добавить bounded slice для slot rules, например:
- `implementation/src/domain/slot-rules/*`
- `implementation/src/application/usecases/slot-rules-settings.ts`

### Основные сущности/операции
- `getUserSlotRuleDefaults(userId)`
- `updateUserSlotRuleDefaults(userId, settings)`
- `getTeamMemberSlotRuleSettings(teamMemberId)`
- `updateTeamMemberSlotRuleOverride(teamMemberId, settings)`
- `resetTeamMemberSlotRuleOverride(teamMemberId)`
- `computeSlotRuleAggregate(members[])`
- `resolveEffectiveMemberSlotRules(teamMemberId)`

### Семантика effective settings участника в команде
- если есть строка в `team_member_slot_rule_overrides`, берём её;
- иначе берём `user_slot_rule_settings`.

### Семантика team aggregate
- team settings aggregate считает по всем `teamMembers` команды;
- public availability aggregate считает по тому же набору участников, который реально участвует в расчёте availability после filter/runtime checks.

## API Contract

### GET `/api/me/settings`
Расширить ответ:
```json
{
  "calendarSelectionDefault": {},
  "slotRuleDefaults": {
    "days": 14,
    "workdayStartHour": 10,
    "workdayEndHour": 20,
    "minNoticeHours": 12
  }
}
```

### PATCH `/api/me/settings`
Добавить обновление personal defaults:
```json
{
  "slotRuleDefaults": {
    "days": 21,
    "workdayStartHour": 9,
    "workdayEndHour": 18,
    "minNoticeHours": 24
  }
}
```

Поведение:
- обновляет полную personal defaults запись;
- не смешивается с `PATCH /api/me/calendar`.

### GET `/api/teams/:shareId/settings`
Расширить ответ:
```json
{
  "team": {},
  "calendarSelection": {},
  "mySlotRuleSettings": {
    "source": "override|default",
    "values": {
      "days": 14,
      "workdayStartHour": 10,
      "workdayEndHour": 20,
      "minNoticeHours": 12
    },
    "hasOverride": false
  },
  "teamSlotRuleAggregate": {
    "memberCount": 4,
    "days": 21,
    "workdayStartHour": 11,
    "workdayEndHour": 18,
    "minNoticeHours": 24
  }
}
```

### PATCH `/api/teams/:shareId`
Расширить team settings patch для текущего участника:
```json
{
  "slotRuleOverride": {
    "days": 21,
    "workdayStartHour": 11,
    "workdayEndHour": 18,
    "minNoticeHours": 24
  }
}
```

Поведение:
- PATCH обновляет/создаёт полный override row только для текущего team member;
- не меняет настройки других участников;
- не создаёт team-wide config.

### DELETE `/api/teams/:shareId/settings/slot-rules`
Новый endpoint для reset:
- удаляет override row текущего участника;
- после этого team settings для него снова читаются из personal defaults.

Если проекту удобнее не плодить endpoint, допустим PATCH c явным action-полем, но reset должен оставаться whole-override reset, а не field-level patch.

### GET `/api/teams/:shareId/availability`
Убрать хардкод из handler и возвращать aggregate по runtime member set:
```json
{
  "days": 21,
  "workdayStartHour": 11,
  "workdayEndHour": 18,
  "minNoticeHours": 24
}
```

Важно:
- эти значения должны считаться по тем же участникам, по которым реально строятся слоты;
- member filter обязан менять и `slots`, и settings summary одновременно.

## UI Contract

### Profile page
- Добавить секцию `Мои правила по умолчанию`.
- Поля:
  - окно показа, дней
  - с, час
  - до, час
  - минимум до брони, часов
- CTA: `Сохранить`
- Секция независима от формы имени и не врастает в неё.

### Team settings
- Убрать идею “настроек команды” как редактируемой сущности.
- Добавить секцию `Мои настройки в этой команде`:
  - показывает мои effective settings;
  - позволяет сохранить для меня полный override;
  - позволяет нажать `Сбросить до настроек пользователя`.
- Добавить отдельную read-only секцию `Итог для команды`:
  - считает aggregate по всем участникам команды;
  - показывает `memberCount`;
  - не редактируется.

### Public team page
- Summary `Правила показа` получает значения из availability API;
- summary пересчитывается при смене member filter;
- локальный fallback `14 / 10-20 / 12` удаляется из client hook.

## Migration / Rollout
- Добавить две новые таблицы.
- Написать backfill migration для существующих пользователей:
  - создать `user_slot_rule_settings` со значениями `14/10/20/12`.
- В user creation flow для новых пользователей создавать такую же default record автоматически.
- Для существующих team members override rows не создаются, пока пользователь не изменил настройки в конкретной команде.

## Testing Contract

### Route / use-case tests
- `GET /api/me/settings` возвращает personal defaults из новой таблицы
- `PATCH /api/me/settings` обновляет full defaults record
- `GET /api/teams/:shareId/settings` возвращает:
  - мои effective team settings
  - aggregate по всем участникам команды
- `PATCH /api/teams/:shareId` создаёт/обновляет только мой team override
- reset удаляет override row и возвращает чтение из personal defaults
- `GET /api/teams/:shareId/availability` агрегирует по runtime member set

### Aggregation tests
- `days = max`
- `workdayStartHour = max`
- `workdayEndHour = min`
- `minNoticeHours = max`

### UI tests
- profile page рендерит new defaults section и отправляет full payload
- team settings рендерят:
  - editable section `Мои настройки в этой команде`
  - read-only section `Итог для команды`
  - reset CTA
- public team summary меняется вместе с member filter

### Gates
- `npm run test`
- `npm run test:unit:next-routes`
- `npm run test:unit:next-ui`
- `npm run build`

## File Impact
- `implementation/src/infrastructure/db/schema.ts`
- `implementation/src/infrastructure/db/schema-pg/index.ts`
- `implementation/src/infrastructure/db/schema-common.ts`
- `implementation/drizzle/*`
- новый slice `implementation/src/domain/slot-rules/*`
- новый/расширенный use-case в `implementation/src/application/usecases/*`
- `implementation/app/api/me/settings/*`
- `implementation/app/api/teams/[shareId]/settings/*`
- `implementation/app/api/teams/[shareId]/team-handler.ts`
- новый route для reset override
- `implementation/app/api/teams/[shareId]/availability/get-handler.ts`
- `implementation/app/_components/profile-page-client.tsx`
- новые sibling profile/team settings components
- `implementation/app/_components/team-page/team-page-hooks.ts`
- `implementation/app/_components/team-page/team-page-slots-section.tsx`

## Риски внедрения
- Если team settings aggregate и public page aggregate будут считаться по разным наборам участников без явного различия в назначении, продукт станет труднообъяснимым.
- Если availability route и UI summary будут использовать разные aggregate paths, пользователь увидит ложные правила.
- Если override случайно станет field-level partial patch вместо full record, reset semantics усложнятся и начнут спорить с UX.

## Отложенные follow-ups
- warning state для `start >= end`
- расшифровка вклада отдельных участников в агрегат
- timezone settings
- slot duration settings
