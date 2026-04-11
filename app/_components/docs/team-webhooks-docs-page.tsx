import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

const flowSteps = [
  'Создай HTTPS endpoint, который принимает POST requests',
  'Добавь webhook в настройках команды и сразу скопируй shared secret и audience',
  'Проверь bearer JWT с алгоритмом HS256',
  'Проверь X-Teamcal headers и дедупликацию по eventId и deliveryId',
  'Обработай payload и верни 2xx, если событие принято'
] as const;

const headerRows = [
  ['Authorization', 'Bearer JWT, подписанный через HS256'],
  ['X-Teamcal-Event', 'Тип события, сейчас всегда booking.requested'],
  ['X-Teamcal-Event-Id', 'Стабильный id события для бизнес-dedupe'],
  ['X-Teamcal-Delivery-Id', 'Уникальный id конкретной delivery attempt'],
  ['X-Teamcal-Timestamp', 'Unix timestamp выпуска JWT']
] as const;

const claimRows = [
  ['iss', 'teamcal'],
  ['aud', 'audience конкретной подписки'],
  ['sub', 'team:<team_id>'],
  ['jti', 'delivery_id'],
  ['iat / exp', 'короткое окно жизни, TTL 120 секунд'],
  ['evt', 'booking.requested']
] as const;

const backendSnippet = `const token = request.headers.authorization?.replace(/^Bearer\\s+/i, "")
const payload = verifyJwt(token, sharedSecret, { algorithms: ["HS256"], audience })
if (payload.iss !== "teamcal") throw new Error("invalid issuer")
if (payload.sub !== \`team:\${teamId}\`) throw new Error("invalid subject")
if (payload.jti !== request.headers["x-teamcal-delivery-id"]) throw new Error("delivery mismatch")
rememberOnce(payload.jti, 120)
dedupeByEvent(request.body.eventId)`;

const n8nNotes = [
  'Прими запрос через Webhook node',
  'Проверь Authorization header и X-Teamcal-* headers в Code node или Function item',
  'Проверь HS256 JWT через shared secret и audience',
  'Используй eventId для бизнес-idempotency и deliveryId для replay window'
] as const;

function DocsTable({
  title,
  description,
  rows
}: {
  title: string;
  description: string;
  rows: readonly (readonly [string, string])[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.map(([name, value]) => (
          <div className="grid gap-1 rounded-xl border border-slate-900/8 bg-slate-900/[0.03] p-3" key={name}>
            <div className="font-mono text-sm text-slate-900">{name}</div>
            <div className="text-sm text-slate-600">{value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
export function TeamWebhooksDocsPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge>JWT Bearer</Badge>
          <Badge variant="success">HS256</Badge>
          <Badge>TTL 120 секунд</Badge>
        </div>
        <h1 className="font-display text-3xl text-slate-900">Как проверить Team Webhooks</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          У Teamcal один blessed integration flow: webhook URL, shared secret, audience и короткоживущий bearer JWT.
          Никаких JWKS, basic auth, body HMAC или fallback modes в MVP нет.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Быстрый путь подключения</CardTitle>
          <CardDescription>Этого достаточно для n8n, обычного backend-а и агента</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {flowSteps.map((step, index) => (
            <div className="flex gap-3 rounded-xl border border-slate-900/8 bg-white p-3" key={step}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accentSoft font-mono text-xs text-accentStrong">
                {index + 1}
              </span>
              <p className="text-sm text-slate-700">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <DocsTable title="Обязательные headers" description="Каждая delivery attempt отправляет один и тот же набор transport headers" rows={headerRows} />
        <DocsTable title="JWT claims" description="JWT подписывается per-delivery через HS256" rows={claimRows} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Проверка на backend</CardTitle>
            <CardDescription>Сначала проверь JWT, потом дедупликацию и только затем бизнес-обработку</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
              <code>{backendSnippet}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>n8n-first flow</CardTitle>
            <CardDescription>Нужны только URL, shared secret и audience</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {n8nNotes.map((step) => (
              <div className="rounded-xl border border-slate-900/8 bg-slate-900/[0.03] p-3 text-sm text-slate-700" key={step}>
                {step}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/[0.07]">
        <CardHeader>
          <CardTitle>Replay и rollout</CardTitle>
          <CardDescription>Это место, где интеграторы чаще всего ошибаются</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-700">
          <p>Храни использованные `deliveryId` хотя бы на TTL-окно. Для бизнес-idempotency используй `eventId`.</p>
          <p>Старые subscriptions, созданные до JWT cutover, требуют rotate или recreate. Compat mode не поддерживается.</p>
          <p>Если endpoint вернул не-2xx или не прошёл verification, Teamcal обновит last delivery status, но booking flow останется best effort.</p>
        </CardContent>
      </Card>
    </main>
  );
}
