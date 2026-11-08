import { describe, expect, it, vi } from 'vitest';
import { buildPageSpeedUrl, runPageSpeed } from './pagespeed';

const base = { url: 'https://shop.example.com/a?b=1', apiKey: 'k', strategy: 'mobile' as const, categories: ['ACCESSIBILITY'] };

function respond(body: string, status = 200) {
  return vi.fn(async () => new Response(body, { status })) as unknown as typeof fetch;
}

describe('buildPageSpeedUrl', () => {
  it('encodes the target and asks only for the listed categories', () => {
    const url = new URL(buildPageSpeedUrl(base));
    expect(url.searchParams.get('url')).toBe('https://shop.example.com/a?b=1');
    expect(url.searchParams.get('strategy')).toBe('MOBILE');
    expect(url.searchParams.getAll('category')).toEqual(['ACCESSIBILITY']);
  });
});

describe('runPageSpeed', () => {
  it('returns the Lighthouse result', async () => {
    const outcome = await runPageSpeed({ ...base, fetchImpl: respond(JSON.stringify({ lighthouseResult: { audits: {} } })) });
    expect(outcome).toEqual({ ok: true, lighthouseResult: { audits: {} } });
  });

  it('classifies provider failures', async () => {
    expect(await runPageSpeed({ ...base, fetchImpl: respond('{}', 429) })).toMatchObject({ ok: false, code: 'pagespeed_rate_limited' });
    expect(await runPageSpeed({ ...base, fetchImpl: respond('{}', 500) })).toMatchObject({ ok: false, code: 'pagespeed_upstream_error' });
    expect(await runPageSpeed({ ...base, fetchImpl: respond('not json') })).toEqual({ ok: false, code: 'invalid_pagespeed_response' });
    expect(await runPageSpeed({ ...base, fetchImpl: respond(JSON.stringify({ lighthouseResult: { runtimeError: { code: 'NO_FCP' } } })) }))
      .toEqual({ ok: false, code: 'pagespeed_runtime_error' });
    expect(await runPageSpeed({ ...base, maxBytes: 10, fetchImpl: respond(JSON.stringify({ lighthouseResult: { audits: {} } })) }))
      .toEqual({ ok: false, code: 'pagespeed_response_too_large' });
  });

  it('times out', async () => {
    const hang = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })) as unknown as typeof fetch;
    expect(await runPageSpeed({ ...base, timeoutMs: 5, fetchImpl: hang })).toEqual({ ok: false, code: 'pagespeed_timeout' });
  });
});
