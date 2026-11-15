import { describe, expect, it, vi } from 'vitest';
import type { PageSpeedOutcome } from '../_shared/pagespeed';
import { parseClaims, processPage, type PageScanDeps } from './process-page';

const page = { result_id: 'r1', run_id: 'run1', url: 'https://shop.example.com/', attempts: 1 };

function deps(outcome: PageSpeedOutcome, overrides: Partial<PageScanDeps> = {}) {
  const queue = { complete: vi.fn(async () => undefined), fail: vi.fn(async () => undefined) };
  return {
    queue,
    deps: {
      validateUrl: (url: string) => new URL(url),
      resolvesToPublicIps: async () => true,
      runPageSpeed: vi.fn(async () => outcome),
      queue,
      ...overrides,
    } satisfies PageScanDeps,
  };
}

const okResult: PageSpeedOutcome = {
  ok: true,
  lighthouseResult: {
    categories: { accessibility: { score: 0.9, auditRefs: [{ id: 'image-alt', weight: 10 }] } },
    audits: { 'image-alt': { title: 'Alt', score: 0, details: { items: [] } } },
  },
};

describe('processPage', () => {
  it('reports findings for a scanned page', async () => {
    const { deps: d, queue } = deps(okResult);
    expect(await processPage(page, d)).toEqual({ status: 'succeeded', findings: 1 });
    expect(queue.complete).toHaveBeenCalledWith('r1', 90, [expect.objectContaining({ rule_id: 'image-alt' })]);
    expect(queue.fail).not.toHaveBeenCalled();
  });

  it('never scans a URL that fails validation, and does not retry it', async () => {
    const { deps: d, queue } = deps(okResult, { validateUrl: () => null });
    expect(await processPage(page, d)).toEqual({ status: 'failed', code: 'invalid_url', retry: false });
    expect(d.runPageSpeed).not.toHaveBeenCalled();
    expect(queue.fail).toHaveBeenCalledWith('r1', 'invalid_url', false);
  });

  it('never scans a host that resolves to a private address', async () => {
    const { deps: d } = deps(okResult, { resolvesToPublicIps: async () => false });
    expect(await processPage(page, d)).toEqual({ status: 'failed', code: 'target_not_public', retry: false });
    expect(d.runPageSpeed).not.toHaveBeenCalled();
  });

  it('retries provider failures', async () => {
    for (const code of ['pagespeed_timeout', 'pagespeed_rate_limited', 'pagespeed_runtime_error'] as const) {
      const { deps: d, queue } = deps({ ok: false, code });
      expect(await processPage(page, d)).toEqual({ status: 'failed', code, retry: true });
      expect(queue.fail).toHaveBeenCalledWith('r1', code, true);
    }
  });

  it('does not retry a response that is too large', async () => {
    const { deps: d } = deps({ ok: false, code: 'pagespeed_response_too_large' });
    expect(await processPage(page, d)).toEqual({ status: 'failed', code: 'pagespeed_response_too_large', retry: false });
  });

  it('retries a result it cannot read', async () => {
    const { deps: d } = deps({ ok: true, lighthouseResult: { categories: {}, audits: {} } });
    expect(await processPage(page, d)).toEqual({ status: 'failed', code: 'invalid_pagespeed_response', retry: true });
  });
});

describe('parseClaims', () => {
  it('keeps only well-formed rows', () => {
    expect(parseClaims([page, { result_id: 1 }, null])).toEqual([page]);
    expect(parseClaims(null)).toEqual([]);
  });
});
