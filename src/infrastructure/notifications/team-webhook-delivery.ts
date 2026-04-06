import { assertValidTeamWebhookTargetUrl } from '@/domain/team-webhooks';

type DeliverWebhookParams = {
  targetUrl: string;
  payload: unknown;
  nodeEnv: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type DeliverWebhookResult = {
  ok: boolean;
  statusCode?: number;
  errorMessage?: string;
};

export function maskTeamWebhookUrl(targetUrl: string) {
  try {
    const url = new URL(targetUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return targetUrl;
  }
}

export async function deliverTeamWebhookRequest(params: DeliverWebhookParams): Promise<DeliverWebhookResult> {
  const targetUrl = assertValidTeamWebhookTargetUrl(params.targetUrl, params.nodeEnv);
  const fetchImpl = params.fetchImpl || fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs ?? 5000);

  try {
    const response = await fetchImpl(targetUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(params.payload),
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.status,
        errorMessage: `HTTP ${response.status}`
      };
    }

    return {
      ok: true,
      statusCode: response.status
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        errorMessage: 'Request timed out'
      };
    }

    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : String(error || 'unknown error')
    };
  } finally {
    clearTimeout(timer);
  }
}
