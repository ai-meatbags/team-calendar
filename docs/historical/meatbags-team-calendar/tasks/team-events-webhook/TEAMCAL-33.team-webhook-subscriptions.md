# TEAMCAL-33 — Раздел интеграций и вебхуков для команды (Phase 2)

Статус: done

## Product framing
Владелец команды должен уметь сам подключать внешние системы к событиям бронирования без участия разработчика.

На уровне продукта это не “поле webhook URL в настройках команды”, а отдельный раздел `Интеграции и вебхуки` со списком webhook-ов команды.

## Описание
Реализовать раздел `Интеграции и вебхуки`, в котором owner команды может:
- добавить webhook;
- удалить webhook;
- включать и выключать каждый webhook галочкой в списке;
- видеть понятный текущий статус каждого webhook без истории доставок.

При новом `booking.requested` runtime должен отправлять событие одновременно во все активные webhook-и команды.

Глобальный env webhook перестает быть продуктовой настройкой. Отдельный env-флаг остается только как технический kill switch для runtime-доставки.

## Текущий статус исполнения
- Реализация завершена и прошла локальный verification gate.
- Уже сделано:
  - добавлена team-scoped модель `team_webhook_subscriptions` и migration;
  - добавлены domain contracts для event/status/delivery status и runtime validation `targetUrl`;
  - реализованы owner-only query/command use-case-ы и Next API routes для списка, добавления, toggle и удаления webhook-ов;
  - booking delivery переведен на fan-out во все активные webhook-и команды с обновлением `last_delivery_status`, `last_delivery_at`, `last_error`;
  - добавлен env kill switch для runtime-доставки;
  - в team settings добавлен раздел `Интеграции и вебхуки` со списком, add, toggle, delete и отображением текущего статуса.
- Дополнительно на close-out:
  - исправлен основной route regression gate, чтобы nested webhook route test не выпадал из `test:unit:next-routes`;
  - созданы `TASK.testing.md` и `TASK.retro.md`, а lesson вынесен в `retro-inbox`.
- Задача закрыта со статусом `done`.

## Applied policy rules
### Arch patterns (`tasks/_policies/arch-patterns.md`)
- AP-010 — Модульный монолит + Ports & Adapters
- AP-020 — Clean Architecture границы и composition root
- AP-021 — Тонкие entry points
- AP-024 — Наблюдаемость и защита чувствительных данных
- AP-027 — Конфигурация и окружение (fail-fast)
- AP-032 — Command/Query Separation
- AP-040 — Авторизация на каждом защищенном use-case
- AP-041 — Object-level access и tenant isolation
- AP-043 — Безопасная обработка входа, файлов и webhook-ов
- AP-044 — Безопасные исходящие вызовы и внешние интеграции
- AP-049 — Явная семантика удаления, архивации и историчности
- AP-050 — Справочные данные, статусы и перечисления как управляемые контракты
- AP-058 — Feature flags как управляемая граница rollout
- AP-067 — Drizzle и dotenv как дефолтный baseline для Node.js data/config слоя

### Project patterns (`tasks/_policies/project-patterns.md`)
- PP-018 — Application stack: Next.js App Router + Drizzle + pg-only runtime
- PP-019 — Запрет пустых catch-блоков

## Scope
- Подключить таблицу `team_webhook_subscriptions`.
- Добавить в team settings отдельный раздел `Интеграции и вебхуки`.
- Реализовать owner-only API для списка, добавления, переключения активности и удаления webhook-ов команды.
- Сделать runtime fan-out delivery по всем активным webhook-ам команды для события `booking.requested`.
- Хранить в БД состояние каждого webhook: active/disabled и краткий delivery status без журнала истории.
- Добавить env toggle для полного отключения outbound webhook delivery без redeploy логики.

## Non-goals
- История доставок, delivery log table и retry queue.
- Setup token / agent auto-setup.
- Подписи webhook, JWKS и replay-protection.
- Новые события кроме `booking.requested`.
- Редактирование URL существующего webhook-а inplace; для MVP достаточно delete + add.

## Клиентский путь
1. Owner открывает настройки команды.
2. Переходит в раздел `Интеграции и вебхуки`.
3. Видит список уже добавленных webhook-ов и их статусы.
4. Добавляет новый webhook по URL.
5. Видит новый webhook в списке и может включить или выключить его галочкой.
6. Удаляет webhook, если интеграция больше не нужна.
7. После нового booking все активные webhook-и получают событие одновременно.
8. В интерфейсе по каждому webhook отображается понятный текущий статус: активен/выключен и последний результат доставки.

## UX contract
- В UI нет единого поля `webhook.url` на уровне команды.
- В UI есть список webhook-ов.
- Для каждой записи доступны:
  - `targetUrl`
  - `isActive`
  - `lastDeliveryStatus`
  - `lastDeliveryAt`
  - `lastError`
- История доставок, setup token, подписи и JWKS в scope этой задачи не входят.

## Архитектура
### Data model
- Текущая DB-архитектура подходит под кейс: Postgres + Drizzle + явная схема хорошо поддерживают новую team-scoped таблицу.
- `team_webhook_subscriptions` хранит по одной записи на каждый webhook команды, а не одно поле URL на команду.
- Для MVP таблица должна содержать:
  - `id`
  - `team_id_raw`
  - `event_type` со значением `booking.requested`
  - `target_url`
  - `status` (`active|disabled`)
  - `created_by_user_id_raw`
  - `updated_by_user_id_raw`
  - `created_at`
  - `updated_at`
  - `last_delivery_status` (`never|success|failed`)
  - `last_delivery_at`
  - `last_error`
- Нужен unique constraint на `(team_id_raw, event_type, target_url)`, чтобы не плодить дубликаты одного и того же webhook-а.
- Для MVP удаление webhook трактуется явно:
  - `disable` сохраняет запись и исключает ее из отправки;
  - `delete` делает hard delete записи, потому что история доставок и audit trail пока out of scope.

### DTO / contract decisions
- Канонический `event_type` для этой задачи: только `booking.requested`.
- Канонический `status`: `active | disabled`.
- Канонический `last_delivery_status`: `never | success | failed`.
- Query response списка не возвращает внутренние служебные поля вроде `team_id_raw`, `created_by_user_id_raw`, `updated_by_user_id_raw`.
- Command payloads:
  - add webhook: `{ targetUrl: string }`
  - toggle webhook state: `{ isActive: boolean }`
- UI/read model должен содержать стабильный `id`, чтобы toggle/delete работали без повторной адресации по URL.

### API и use-case boundaries
- Query path:
  - `GET /api/teams/:shareId/integrations/webhooks`
  - возвращает список webhook-ов команды для owner UI.
- Command paths:
  - `POST /api/teams/:shareId/integrations/webhooks` — добавить webhook;
  - `PATCH /api/teams/:shareId/integrations/webhooks/:webhookId` — изменить active/disabled;
  - `DELETE /api/teams/:shareId/integrations/webhooks/:webhookId` — удалить webhook.
- Route handler остается тонким адаптером.
- Авторизация и object-level access проверяются в command/query use-case, а не только в UI.
- Booking route не знает деталей хранения webhook-ов и вызывает отдельный application-level delivery use-case/port.

### Runtime delivery
- `POST /api/booking` после успешной бизнес-валидации и записи сценария запускает best-effort webhook delivery.
- Delivery path читает все `active` webhook-и команды для `booking.requested`.
- Отправка выполняется fan-out-ом на все активные endpoint-ы через `Promise.allSettled` или эквивалент, чтобы сбой одного endpoint-а не блокировал остальные.
- Для каждого webhook обновляется только текущее состояние доставки:
  - `last_delivery_status`
  - `last_delivery_at`
  - `last_error`
- Runtime использует отдельный outbound adapter с timeout и защитой от небезопасных target URL.
- Текущая фича сохраняет best-effort семантику Phase 1 и не вводит persisted outbox/retry boundary в рамках этой задачи.

### Config / env
- Добавить централизованный env-флаг в `src/composition/env.ts`, например `BOOKING_WEBHOOK_DELIVERY_ENABLED`.
- Этот флаг не заменяет бизнес-статус webhook-а в БД и не показывается пользователю.
- Его роль только техническая:
  - быстро отключить outbound delivery во всем runtime;
  - сохранить возможность читать и редактировать список webhook-ов в UI.
- Чтение env по месту внутри delivery-модулей запрещено; runtime получает уже провалидированную конфигурацию через `AppEnv`.

## Expected file slices
- DB/schema/migration:
  - `src/infrastructure/db/schema.ts`
  - `drizzle/*` и сопутствующий migration manifest
- Domain/reference contracts:
  - новый модуль для webhook status/event contracts в `src/domain/*` или `src/shared/*`
- Application/use-cases:
  - отдельный webhook management slice в `src/application/usecases/*`
  - не раздувать несвязной логикой существующий `team-page.ts` без необходимости
- Infrastructure:
  - repository/access layer для team webhook subscriptions
  - outbound delivery adapter/client в `src/infrastructure/notifications/*`
- Interface:
  - `app/api/teams/[shareId]/integrations/webhooks/*`
  - при необходимости wiring booking delivery path в `app/api/booking/*`
- UI:
  - team settings screen / state hooks / acceptance tests в `app/_components/team-page/*`

## Implementation slices
### Slice 1 — Contracts and persistence
- Добавить schema + migration для `team_webhook_subscriptions`.
- Вынести enum/status contracts в явный модуль.
- Добавить repository/read-write helpers для списка webhook-ов команды.

### Slice 2 — Owner management API
- Реализовать query use-case списка webhook-ов команды.
- Реализовать command use-case-ы add / toggle / delete.
- Поднять Next API routes под `integrations/webhooks`.

### Slice 3 — Booking fan-out delivery
- Отвязать delivery от single env webhook source.
- Подключить чтение active webhook-ов команды.
- Добавить fan-out и update текущего delivery status по каждому endpoint-у.

### Slice 4 — Team settings UI
- Добавить section `Интеграции и вебхуки`.
- Показать список, add action, active checkbox и delete action.
- Отобразить текущий статус по каждой записи без history view.

### Slice 5 — Verification gate
- Route contract tests на owner/non-owner и validation.
- Booking integration tests на multi-endpoint fan-out и env kill switch.
- UI acceptance tests на add/toggle/delete и отображение статусов.

### Архитектурные и проектные паттерны: где применять
- `AP-010` + `AP-020`:
  - повторяем существующий repo-паттерн `interface -> application -> infrastructure -> composition root`;
  - новый slice для webhook management строится по тем же границам, что и текущие team settings;
  - ориентир по форме: existing team settings/query-command flow в `app/api/teams/[shareId]/*`, `src/application/usecases/team-page.ts`, `src/composition/server-runtime.ts`.
- `AP-021`:
  - новые route handlers в `app/api/teams/[shareId]/integrations/webhooks/*` остаются тонкими;
  - они делают только parse input, auth/origin checks, вызов use-case и mapping response;
  - прямой работы с Drizzle/fetch внутри route быть не должно.
- `AP-032`:
  - чтение списка webhook-ов оформляется как отдельный query path;
  - add/toggle/delete оформляются как отдельные command use-case-ы;
  - не смешивать read-model списка с командной логикой доставки или изменения статуса.
- `AP-040` + `AP-041`:
  - в каждом query/command use-case делается явная проверка owner access на конкретную команду;
  - недостаточно проверить только наличие сессии или скрыть кнопку в UI.
- `AP-027` + `AP-058` + `AP-067`:
  - env kill switch добавляется в централизованную схему `src/composition/env.ts`;
  - runtime получает уже провалидированный config через existing server runtime/composition path;
  - нельзя читать `process.env` хаотично внутри delivery-модуля или route handler.
- `AP-043`:
  - входной payload add/toggle/delete валидируется явно;
  - нельзя делать mass assignment из request body в DB-модель;
  - `target_url` проходит runtime validation до use-case/update path.
- `AP-044`:
  - outbound delivery реализуется через отдельный infrastructure adapter/client;
  - нельзя делать ad-hoc `fetch` по коду из route handler или UI-layer;
  - для отправки нужны timeout и ограничения доверия к target URL.
- `AP-024` + `PP-019`:
  - ошибки доставки и update-сценариев логируются структурно;
  - пустые `catch` запрещены: если endpoint недоступен, это должно давать осмысленный log/update статуса, а не silent fail.
- `AP-024`:
  - лог delivery не должен содержать сырые секреты, токены и лишние пользовательские данные;
  - если логируется URL, нужен аккуратный контекст без лишнего query/credential leakage.
- `AP-049`:
  - delete и disable описываются как разные жизненные сценарии сущности webhook;
  - read-side должен явно понимать, какие записи считаются активными и какие скрываются после delete.
- `AP-050`:
  - `event_type`, `status`, `last_delivery_status` и допустимые переходы задаются как канонический контракт, а не строками по месту.
- `PP-018`:
  - весь новый код идет только в текущий Next.js/pg-only контур;
  - никаких legacy runtime путей, old server folders или обходных storage path;
  - DB-слой делается через текущий Drizzle schema/client, совместимый с действующим runtime проекта.
- `PP-019`:
  - при delivery/update status нельзя проглатывать ошибки через empty catch;
  - допустим только осмысленный best-effort path: лог + update текущего delivery status + сохранение `200` для booking.

## Шаги реализации
1. Обновить feature spec и зафиксировать продуктовый контракт раздела `Интеграции и вебхуки`.
2. Добавить таблицу `team_webhook_subscriptions` и индексы/unique constraints под список webhook-ов команды.
3. Вынести канонические status/event constants для webhook domain.
4. Добавить query use-case списка webhook-ов команды.
5. Добавить command use-case-ы:
   - add webhook;
   - toggle webhook active state;
   - delete webhook.
6. Добавить Next API routes для query и command путей.
7. Добавить env kill switch в `src/composition/env.ts` и прокинуть его через runtime config.
8. Перевести booking delivery на чтение активных webhook-ов команды и fan-out отправку.
9. Сохранять текущий delivery status по каждому webhook без таблицы истории.
10. Добавить UI section `Интеграции и вебхуки` в team settings, не ломая established team settings flow.
11. Проверить, что реализация соответствует policy set:
   - AP: thin routes, CQRS, owner-only access, centralized env, controlled outbound;
   - PP: Next-only/pg-only runtime и отсутствие пустых catch.
12. Закрыть задачу контрактными route tests и booking integration tests.

## Исполнительские указания
- Не смешивать реализацию owner management и booking delivery в одном oversized модуле.
- Если новый webhook slice не помещается чисто в `team-page.ts`, выделить отдельный use-case модуль вместо наращивания shared god-file.
- UI-изменения не должны тащить business rules в client hooks; сервер остается source of truth для owner access, validation и status transitions.
- Для `targetUrl` нужна явная runtime validation и решение по допустимым схемам/хостам до начала кодинга; нельзя оставлять это на неявное поведение `fetch`.
- Перед стартом реализации исполнитель должен проверить, не конфликтует ли multi-webhook хранение с текущим booking payload и текущими route tests.

## Риски и открытые решения
- `AP-044` риск: user-provided URL открывает SSRF/unsafe outbound surface.
  - Для реализации нужен явный guardrail на допустимые схемы и запрет небезопасных target-ов.
- `AP-049` риск: hard delete упрощает MVP, но убирает след записи.
  - Это допустимо только пока history/audit out of scope; при первом запросе на audit модель удаления придется пересмотреть.
- Delivery semantics:
  - задача сохраняет текущий best-effort runtime;
  - если по пути реализации выяснится, что нужен reliable delivery contract, это уже изменение scope и его нельзя тихо втащить в `TEAMCAL-33`.

## Критерии готовности
- В настройках команды есть раздел `Интеграции и вебхуки` со списком webhook-ов.
- Owner может добавить новый webhook по URL.
- Owner может удалить webhook из списка.
- Owner может включать и выключать каждый webhook галочкой без редактирования URL.
- Owner не может создать дубликат того же URL для того же события в той же команде.
- При booking событие отправляется во все активные webhook-и команды.
- Runtime kill switch через env может отключить все outbound webhook delivery, не ломая UI/API управления webhook-ами.
- В интерфейсе по каждому webhook есть понятный текущий статус без истории доставок.
- Non-owner не может читать или менять webhook settings команды.
- Глобальный `BOOKING_WEBHOOK_URL` не используется как продуктовый источник webhook-настроек команды.
- Реализация проходит через текущие policy boundaries и не добавляет legacy/runtime bypass paths.

## Тест кейсы
1. Owner получает список webhook-ов команды.
2. Non-owner получает `403` на список и на любые изменения.
3. Owner может добавить webhook с валидным URL.
4. Дубликат `(team, event, url)` отклоняется.
5. Owner может выключить webhook, не удаляя запись.
6. Owner может снова включить выключенный webhook.
7. Owner может удалить webhook.
8. Booking отправляет событие во все активные webhook-и команды.
9. Disabled webhook не участвует в fan-out delivery.
10. Ошибка одного endpoint-а не блокирует доставку в остальные endpoint-ы и не ломает `200` на booking.
11. При `BOOKING_WEBHOOK_DELIVERY_ENABLED=false` webhook-и не отправляются, но UI/API списка webhook-ов продолжают работать.
12. После попытки доставки у webhook обновляется `last_delivery_status` и `last_error` по ожидаемому сценарию.
13. UI корректно отображает empty state списка webhook-ов.
14. UI после add/toggle/delete синхронизирует состояние без расхождения с сервером.

## Зависимости
- [TEAMCAL-31](tasks/team-events-webhook/TEAMCAL-31.notifications-feature-framing.md)

## Лог
- 2026-02-13 02:26 — [todo] Задача создана по фазовой декомпозиции [Specs](tasks/team-events-webhook/team-events-webhook.specs.md).
- 2026-04-06 14:00 — [todo] Переформулирована под продуктовый сценарий `Интеграции и вебхуки`: список webhook-ов, add/remove, active checkbox, fan-out delivery и env kill switch.
- 2026-04-06 14:10 — [todo] Уточнено, что задача опирается одновременно на baseline arch-patterns и project-patterns; добавлена привязка правил к существующим слоям и шагам реализации.
- 2026-04-06 14:47 — [in_progress] Реализованы основные срезы `TEAMCAL-33`: schema/migration, owner API, booking fan-out delivery, env kill switch и UI-раздел `Интеграции и вебхуки`; задача переведена на gate `testing`.
- 2026-04-06 14:56 — [testing] Пройдены `test:unit:next-routes`, `test:unit:next-ui` и прямой webhook route gate; по пути исправлено включение nested route test в основной regression script и строковый `COUNT(*)` ассерт.
- 2026-04-06 14:56 — [need_retro] Созданы `TEAMCAL-33.team-webhook-subscriptions.testing.md` и `TEAMCAL-33.team-webhook-subscriptions.retro.md`, lesson про nested App Router route tests отправлен в `tasks/_inbox/retro-inbox.md`.
- 2026-04-06 14:56 — [done] Задача закрыта с `resolution=completed`; owner team settings теперь поддерживает team-level webhook list, add/toggle/delete и booking fan-out delivery.
