// Scans one claimed page and reports the outcome to the queue. Dependencies
// are passed in so the decision logic is unit-tested without Deno or network.

import type { PageSpeedErrorCode, PageSpeedOutcome } from '../_shared/pagespeed.ts';
import { extractPageScan, type ScanFinding } from './findings.ts';

export interface ClaimedPage {
  result_id: string;
  run_id: string;
  url: string;
  attempts: number;
}

export interface QueueReporter {
  complete(resultId: string, accessibilityScore: number, findings: ScanFinding[]): Promise<void>;
  fail(resultId: string, errorCode: string, retry: boolean): Promise<void>;
}

export interface PageScanDeps {
  validateUrl(url: string): URL | null;
  resolvesToPublicIps(hostname: string): Promise<boolean>;
  runPageSpeed(url: string): Promise<PageSpeedOutcome>;
  queue: QueueReporter;
}

export type PageOutcome =
  | { status: 'succeeded'; findings: number }
  | { status: 'failed'; code: string; retry: boolean };

// A page that the provider could not load is retried: it may be a transient
// outage. A URL we refuse to scan never is.
const RETRYABLE: ReadonlySet<PageSpeedErrorCode> = new Set([
  'pagespeed_timeout',
  'pagespeed_rate_limited',
  'pagespeed_upstream_error',
  'pagespeed_runtime_error',
  'invalid_pagespeed_response',
]);

export async function processPage(page: ClaimedPage, deps: PageScanDeps): Promise<PageOutcome> {
  const fail = async (code: string, retry: boolean): Promise<PageOutcome> => {
    await deps.queue.fail(page.result_id, code, retry);
    return { status: 'failed', code, retry };
  };

  const url = deps.validateUrl(page.url);
  if (!url) return fail('invalid_url', false);
  if (!await deps.resolvesToPublicIps(url.hostname)) return fail('target_not_public', false);

  const outcome = await deps.runPageSpeed(url.toString());
  if (!outcome.ok) return fail(outcome.code, RETRYABLE.has(outcome.code));

  const scan = extractPageScan(outcome.lighthouseResult);
  if (!scan) return fail('invalid_pagespeed_response', true);

  await deps.queue.complete(page.result_id, scan.accessibility_score, scan.findings);
  return { status: 'succeeded', findings: scan.findings.length };
}

export function parseClaims(value: unknown): ClaimedPage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is ClaimedPage =>
    typeof row === 'object' && row !== null &&
    typeof (row as ClaimedPage).result_id === 'string' &&
    typeof (row as ClaimedPage).run_id === 'string' &&
    typeof (row as ClaimedPage).url === 'string' &&
    typeof (row as ClaimedPage).attempts === 'number'
  );
}
