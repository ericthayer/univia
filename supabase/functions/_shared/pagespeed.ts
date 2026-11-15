// A bounded PageSpeed Insights call. Returns the raw lighthouseResult or a
// stable error code. Runtime-neutral (fetch, AbortController, TextDecoder) so
// it is unit-tested under Vitest. run-lighthouse-audit still carries its own
// copy of this logic; move it here when that function is next redeployed.

export type PageSpeedErrorCode =
  | 'pagespeed_timeout'
  | 'pagespeed_rate_limited'
  | 'pagespeed_upstream_error'
  | 'pagespeed_response_too_large'
  | 'pagespeed_runtime_error'
  | 'invalid_pagespeed_response';

export type PageSpeedOutcome =
  | { ok: true; lighthouseResult: Record<string, unknown> }
  | { ok: false; code: PageSpeedErrorCode; status?: number };

export interface PageSpeedRequest {
  url: string;
  apiKey: string;
  strategy: 'mobile' | 'desktop';
  categories: string[];
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
}

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// DOMException is not an Error subclass in every runtime, so check the name.
function isAbort(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError';
}

export function buildPageSpeedUrl(request: Pick<PageSpeedRequest, 'url' | 'apiKey' | 'strategy' | 'categories'>): string {
  const params = new URLSearchParams({ url: request.url, strategy: request.strategy.toUpperCase() });
  for (const category of request.categories) params.append('category', category);
  params.set('key', request.apiKey);
  return `${ENDPOINT}?${params.toString()}`;
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string | null> {
  if (!response.body) {
    const text = await response.text();
    return new TextEncoder().encode(text).byteLength > maxBytes ? null : text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function runPageSpeed(request: PageSpeedRequest): Promise<PageSpeedOutcome> {
  const fetchImpl = request.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? 90_000);

  let response: Response;
  try {
    response = await fetchImpl(buildPageSpeedUrl(request), { signal: controller.signal });
  } catch (error) {
    clearTimeout(timeout);
    const aborted = isAbort(error);
    return { ok: false, code: aborted ? 'pagespeed_timeout' : 'pagespeed_upstream_error' };
  }

  try {
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return {
        ok: false,
        code: response.status === 429 ? 'pagespeed_rate_limited' : 'pagespeed_upstream_error',
        status: response.status,
      };
    }

    const text = await readBoundedText(response, request.maxBytes ?? 5 * 1024 * 1024);
    if (text === null) return { ok: false, code: 'pagespeed_response_too_large' };

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, code: 'invalid_pagespeed_response' };
    }

    const lighthouseResult = isRecord(data) ? data.lighthouseResult : undefined;
    if (!isRecord(lighthouseResult)) return { ok: false, code: 'invalid_pagespeed_response' };
    if (lighthouseResult.runtimeError) return { ok: false, code: 'pagespeed_runtime_error' };
    return { ok: true, lighthouseResult };
  } catch (error) {
    const aborted = isAbort(error);
    return { ok: false, code: aborted ? 'pagespeed_timeout' : 'pagespeed_upstream_error' };
  } finally {
    clearTimeout(timeout);
  }
}
