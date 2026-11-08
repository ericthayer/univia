import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { resolvesToPublicIps, validateAuditUrl } from '../_shared/audit-validation.ts';
import { createRequestId } from '../_shared/http.ts';
import { runPageSpeed } from '../_shared/pagespeed.ts';
import { getSupabaseKey } from '../_shared/supabase-keys.ts';
import { parseClaims, processPage, type QueueReporter } from './process-page.ts';
import { isAuthorizedWorkerCall } from './worker-auth.ts';

// Called every minute by pg_cron (public.kick_scan_worker) while pages wait.
// Claims a few pages at a time and stops claiming after CLAIM_WINDOW_MS, so a
// call ends within CLAIM_WINDOW_MS + PAGESPEED_TIMEOUT_MS, under the platform's
// 150-second limit. Unfinished pages are picked up by the next call.
const CLAIM_WINDOW_MS = 40_000;
const PAGESPEED_TIMEOUT_MS = 90_000;
const PAGES_PER_CLAIM = 2;

function json(body: Record<string, unknown>, status: number, requestId: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Request-ID': requestId },
  });
}

Deno.serve(async (req: Request) => {
  const requestId = createRequestId();

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, requestId);
  }

  if (!isAuthorizedWorkerCall(Deno.env.get('SCAN_WORKER_SECRET'), req.headers.get('x-scan-worker-secret'))) {
    console.warn({ event: 'scan_worker_rejected', requestId, reason: 'bad_secret' });
    return json({ error: 'Unauthorized' }, 401, requestId);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = getSupabaseKey('SUPABASE_SECRET_KEYS');
  const apiKey = Deno.env.get('PAGESPEED_API_KEY')?.trim();
  if (!supabaseUrl || !serviceKey || !apiKey) {
    console.error({ event: 'scan_worker_configuration_error', requestId });
    return json({ error: 'Scan worker unavailable' }, 503, requestId);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const queue: QueueReporter = {
    async complete(resultId, accessibilityScore, findings) {
      const { error } = await supabase.rpc('complete_scan_page', {
        p_result_id: resultId,
        p_accessibility_score: accessibilityScore,
        p_findings: findings,
      });
      if (error) throw new Error('queue_complete_failed');
    },
    async fail(resultId, errorCode, retry) {
      const { error } = await supabase.rpc('fail_scan_page', {
        p_result_id: resultId,
        p_error_code: errorCode,
        p_retry: retry,
      });
      if (error) throw new Error('queue_fail_failed');
    },
  };

  const startedAt = Date.now();
  let processed = 0;
  let failed = 0;

  while (Date.now() - startedAt < CLAIM_WINDOW_MS) {
    const { data, error } = await supabase.rpc('claim_scan_pages', { p_limit: PAGES_PER_CLAIM });
    if (error) {
      console.error({ event: 'scan_claim_failed', requestId });
      return json({ error: 'Queue unavailable' }, 503, requestId);
    }

    const claims = parseClaims(data);
    if (claims.length === 0) break;

    const outcomes = await Promise.allSettled(claims.map((page) => processPage(page, {
      validateUrl: (url) => validateAuditUrl(url),
      resolvesToPublicIps,
      runPageSpeed: (url) => runPageSpeed({
        url,
        apiKey,
        strategy: 'mobile',
        categories: ['ACCESSIBILITY'],
        timeoutMs: PAGESPEED_TIMEOUT_MS,
      }),
      queue,
    })));

    outcomes.forEach((outcome, index) => {
      processed += 1;
      if (outcome.status === 'rejected') {
        // Could not report back. The row stays running and is retried once
        // it goes stale (claim_scan_pages, 4 minutes).
        failed += 1;
        console.error({ event: 'scan_page_unreported', requestId, resultId: claims[index].result_id });
      } else if (outcome.value.status === 'failed') {
        failed += 1;
        console.warn({
          event: 'scan_page_failed',
          requestId,
          resultId: claims[index].result_id,
          errorCode: outcome.value.code,
          retry: outcome.value.retry,
        });
      }
    });
  }

  console.info({ event: 'scan_worker_done', requestId, processed, failed, ms: Date.now() - startedAt });
  return json({ processed, failed }, 200, requestId);
});
